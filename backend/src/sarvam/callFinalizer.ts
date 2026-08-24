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
import { getLead, updateLead, createFollowup } from '../crm/leadService';
import { summarizeCall, CallTurn } from '../ai/callAgent';
import { getAgentConfig } from '../ai/agentConfigService';
import type { AgentConfig } from '../ai/agentTypes';
import { sanitizeAgentVariables } from './callResultService';
import { logger } from '../utils/logger';

// ── Transcript-extraction whitelisting (mirrors baseAgent.computeLeadUpdates) ──

/** qualifying-field keys that map 1:1 onto real crm_leads columns */
const DIRECT_LEAD_COLUMNS = new Set([
  'budget_min',
  'budget_max',
  'configuration',
  'purpose',
  'timeline',
  'possession_preference',
]);

/** qualifying-field key → differently-named crm_leads column */
const FIELD_TO_COLUMN: Record<string, string> = {
  city: 'preferred_city',
  sector: 'preferred_sector',
  location: 'preferred_location',
};

/**
 * Normalize LLM-extracted `updated_preferences` (from buildCallSummaryPrompt)
 * into a safe crm_leads patch — exactly the mapping WhatsApp's
 * computeLeadUpdates() applies:
 * - keys not in the org's qualifying_fields are dropped (junk/hallucinated)
 * - city/sector/location map to preferred_* columns
 * - known direct columns pass through; everything else lands in metadata
 * - numbers coerced, enums validated, bad values dropped
 */
export function normalizeCallPreferences(
  prefs: Record<string, any> | null | undefined,
  cfg: AgentConfig
): Record<string, any> {
  const patch: Record<string, any> = {};
  if (!prefs || typeof prefs !== 'object') return patch;

  for (const f of cfg.qualifying_fields) {
    let val = prefs[f.key];
    if (val == null || val === '') continue;

    if (f.type === 'number') {
      const n = Number(val);
      if (isNaN(n)) continue;
      val = n;
    } else if (f.type === 'enum') {
      const opts = f.options ?? [];
      val = String(val).trim();
      if (!val) continue;
      if (opts.length && !opts.includes(val)) continue;
    } else if (f.type === 'boolean') {
      val = Boolean(val);
    } else {
      val = String(val).trim();
      if (!val) continue;
    }

    const col = FIELD_TO_COLUMN[f.key] ?? (DIRECT_LEAD_COLUMNS.has(f.key) ? f.key : null);
    if (col) {
      patch[col] = val;
    } else {
      if (!patch.metadata) patch.metadata = {};
      patch.metadata[f.key] = val;
    }
  }
  return patch;
}

/** "rajesh kumar" → "Rajesh Kumar" — display-friendly fallback names */
function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

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

    // Transcript extraction — whitelisted against the org's qualifying_fields
    // (the SAME schema WhatsApp's buildExtractionPrompt uses), so a call fills
    // the same lead fields a WhatsApp conversation would.
    let cfg: AgentConfig | null = null;
    try {
      cfg = await getAgentConfig(orgId);
    } catch (e) {
      logger.warn(
        { callSessionId, err: (e as Error)?.message },
        '[CallFinalizer] agent config unavailable — raw preferences passthrough'
      );
    }
    const extracted = cfg
      ? normalizeCallPreferences(summaryData.updated_preferences, cfg)
      : { ...(summaryData.updated_preferences ?? {}) };

    // caller_name → full_name, but ONLY when the lead has no name yet
    // (never overwrite good CRM data with a transcribed guess). Also merge
    // metadata with whatever the lead already has (jsonb is replaced, not merged).
    const wantsName = typeof summaryData.caller_name === 'string' && !!summaryData.caller_name.trim();
    if (wantsName || extracted.metadata) {
      const lead = await getLead(orgId, leadId).catch(() => null);
      if (lead) {
        if (wantsName && !lead.full_name) {
          leadPatch.full_name = titleCase(summaryData.caller_name.trim());
        }
        if (extracted.metadata) {
          extracted.metadata = { ...(lead.metadata ?? {}), ...extracted.metadata };
        }
      }
    }

    // Provider agent variables (Sarvam dashboard output variables): alias-mapped
    // and whitelisted to real crm_leads columns so a bad variable can never
    // break the whole lead update. Applied BEFORE transcript extraction so the
    // config-whitelisted extraction wins on key conflicts.
    Object.assign(leadPatch, sanitizeAgentVariables(agentVariables));
    Object.assign(leadPatch, extracted);
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