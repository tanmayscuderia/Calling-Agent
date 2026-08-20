/**
 * Shared call finalization — the single post-call pipeline used by ALL call
 * providers (browser demo `/api/calls/:id/end`, queue `generate_summary` job,
 * and the Sarvam webhook `process_call_result` job).
 *
 * Responsibilities:
 *   1. Build transcript text from turns
 *   2. LLM summary (DeepSeek) for connected calls with real transcript
 *   3. Patch call_sessions (status, summary, outcome, duration, transcript)
 *   4. Persist transcript turns for the viewer (Sarvam path)
 *   5. Lead enrichment (temperature, updated_preferences, sanitized vars)
 *   6. Follow-up creation for actionable outcomes
 *
 * Extracted from triplicated logic in jobHandler.processSummaryJob,
 * calls.routes `/end`, and callResultService.processCallResultJob so the
 * sanitizer + follow-up rules can never drift between providers again.
 */

import { supabaseAdmin } from '../db/supabase';
import { updateLead, createFollowup } from '../crm/leadService';
import { summarizeCall, CallTurn } from '../ai/callAgent';
import { sanitizeAgentVariables } from './callResultService';
import { logger } from '../utils/logger';

export interface TranscriptRow {
  /** Speaker key — `role` (Sarvam webhook) or `speaker` (our call_session_turns) */
  role?: string;
  speaker?: string;
  text: string;
}

/** Read the speaker name from either key shape. */
function speakerOf(t: TranscriptRow): string {
  return (t.role ?? t.speaker ?? 'customer') as string;
}

/** Normalize webhook-style rows to CallTurn[] for the summarizer. */
export function toCallTurns(rows: TranscriptRow[]): CallTurn[] {
  return rows
    .filter((t) => t && typeof t.text === 'string')
    .map((t) => ({
      speaker: speakerOf(t) === 'agent' ? ('agent' as const) : ('customer' as const),
      text: t.text,
    }));
}

/** Render transcript text exactly like the legacy paths did. */
export function renderTranscriptText(rows: TranscriptRow[]): string {
  return rows.map((t) => `${speakerOf(t) === 'agent' ? 'Agent' : 'Customer'}: ${t.text}`).join('\n');
}

export interface FinalizeCallOptions {
  orgId: string;
  callSessionId: string;
  leadId: string | null | undefined;
  /** Terminal status to write ('completed' | 'no_answer' | 'busy' | 'failed') */
  status: string;
  /** Transcript rows in chronological order (already persisted for demo path) */
  transcriptRows: TranscriptRow[];
  /** Provider-reported duration in seconds (Sarvam); computed if null */
  durationSec?: number | null;
  /** started_at of the session, used to compute duration when not reported */
  startedAt?: string | null;
  /** Sarvam final_agent_variables — sanitized before lead patch */
  agentVariables?: Record<string, unknown> | null;
  /** Fallback summary when no LLM summary was produced (e.g. failure_reason) */
  fallbackSummary?: string | null;
  /** Fallback outcome for non-connected calls */
  fallbackOutcome?: string | null;
  /** Extra call_sessions columns (interaction_id, from_number, …) */
  extraPatch?: Record<string, unknown>;
  /** Persist transcriptRows into call_session_turns (Sarvam path) */
  persistTurns?: boolean;
}

/**
 * The single shared finalization pipeline. Never throws for enrichment
 * failures — the call record update is the only hard requirement.
 */
export async function finalizeCall(opts: FinalizeCallOptions): Promise<{
  summaryData: any | null;
  updated: boolean;
}> {
  const {
    orgId,
    callSessionId,
    leadId,
    status,
    transcriptRows,
    durationSec,
    startedAt,
    agentVariables,
    fallbackSummary,
    fallbackOutcome,
    extraPatch,
    persistTurns,
  } = opts;

  const sb = supabaseAdmin();

  // 1. LLM summary — only when the call connected AND there is real text.
  //    Failures are non-fatal: the call record survives without a summary.
  let summaryData: any = null;
  const turns = toCallTurns(transcriptRows);
  if (status === 'completed' && turns.length > 0) {
    try {
      const summary = await summarizeCall(turns, orgId);
      summaryData = summary.data;
    } catch (err: any) {
      logger.error(
        { callSessionId, err: err?.message },
        '[CallFinalizer] summarizeCall failed — storing call without summary'
      );
    }
  }

  // 2. Patch call_sessions — the one hard requirement of this function.
  const computedDuration =
    durationSec != null
      ? Math.round(durationSec)
      : startedAt
        ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
        : null;

  const patch: Record<string, any> = {
    status,
    ended_at: new Date().toISOString(),
    summary: summaryData?.summary ?? fallbackSummary ?? null,
    outcome: summaryData?.outcome ?? (status === 'completed' ? null : fallbackOutcome),
  };
  const transcriptText = renderTranscriptText(transcriptRows);
  if (transcriptText) patch.transcript = transcriptText;
  if (computedDuration != null) patch.duration_sec = computedDuration;
  if (summaryData?.lead_temperature) patch.lead_temperature = summaryData.lead_temperature;
  Object.assign(patch, extraPatch ?? {});

  const { error: updateErr } = await sb.from('call_sessions').update(patch).eq('id', callSessionId);
  if (updateErr) throw new Error(`Update call_session failed: ${updateErr.message}`);

  // 3. Persist transcript turns for the viewer (Sarvam delivers them in the
  //    webhook; the demo path persists turns live as they happen).
  if (persistTurns && transcriptRows.length > 0) {
    const { data: last } = await sb
      .from('call_session_turns')
      .select('sequence_index')
      .eq('call_session_id', callSessionId)
      .order('sequence_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    let seq = (last?.sequence_index ?? -1) + 1;
    const rows = transcriptRows.map((t) => ({
      org_id: orgId,
      call_session_id: callSessionId,
      speaker: speakerOf(t) === 'agent' ? 'agent' : 'customer',
      text: t.text,
      sequence_index: seq++,
    }));
    const { error: turnsErr } = await sb.from('call_session_turns').insert(rows);
    if (turnsErr) {
      logger.error({ callSessionId, err: turnsErr.message }, '[CallFinalizer] Failed to save turns');
    }
  }

  // 4. Lead enrichment + follow-ups (connected calls with a summary only).
  if (leadId && summaryData) {
    const leadPatch: Record<string, any> = {};
    if (summaryData.lead_temperature) leadPatch.temperature = summaryData.lead_temperature;
    if (summaryData.updated_preferences) Object.assign(leadPatch, summaryData.updated_preferences);
    // Provider agent variables (Sarvam dashboard output variables): alias-mapped
    // and whitelisted to real crm_leads columns so a bad variable can never
    // break the whole lead update.
    Object.assign(leadPatch, sanitizeAgentVariables(agentVariables));
    if (Object.keys(leadPatch).length) {
      await updateLead(orgId, leadId, leadPatch).catch((e) => {
        logger.warn({ callSessionId, err: e?.message }, '[CallFinalizer] leadPatch update failed');
      });
    }

    if (
      summaryData.outcome === 'callback_requested' ||
      summaryData.outcome === 'site_visit_requested' ||
      summaryData.outcome === 'booking_requested'
    ) {
      await createFollowup(orgId, leadId, {
        type: summaryData.outcome === 'site_visit_requested' ? 'site_visit' : 'call',
        title: summaryData.outcome === 'site_visit_requested' ? 'Site visit requested' : 'Callback requested',
        notes: summaryData?.summary ?? '',
        scheduled_at: summaryData?.next_follow_up_at ?? null,
        status: 'pending',
      }).catch(() => {});
    }
  }

  logger.info({ callSessionId, status, hadSummary: !!summaryData }, '[CallFinalizer] Call finalized');
  return { summaryData, updated: true };
}