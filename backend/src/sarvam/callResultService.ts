/**
 * Sarvam call result processing.
 *
 * Webhook payload → call_sessions update + transcript turns + LLM summary
 * + lead enrichment + follow-up creation. Idempotent via the
 * (org_id, external_call_id) unique index + completed-status check.
 *
 * Runs inside the job queue (job_type: 'process_call_result').
 * Plan: docs/SARVAM_CALLING_PLAN.md (Phase S4)
 */

import { supabaseAdmin } from '../db/supabase';
import { updateLead, createFollowup } from '../crm/leadService';
import { summarizeCall, CallTurn } from '../ai/callAgent';
import { logger } from '../utils/logger';

export interface SarvamWebhookPayload {
  attempt_id: string;
  status: 'connected' | 'no_answer' | 'busy' | 'failed';
  channel_info?: {
    channel_type?: string;
    channel_provider?: string;
    agent_phone_number?: string;
  };
  duration?: number | null;
  interaction_id?: string | null;
  failure_reason?: string | null;
  final_agent_variables?: Record<string, unknown> | null;
  webhook_config?: {
    url?: string;
    metadata?: Record<string, unknown> | null;
  } | null;
  interaction_transcript?: Array<{ role: string; en_text: string }> | null;
}

export interface CallResultJobPayload {
  webhookEventId: string;
  payload: SarvamWebhookPayload;
}

/** Map Sarvam status → our call_sessions.status */
function mapStatus(sarvamStatus: string): string {
  switch (sarvamStatus) {
    case 'connected': return 'completed';
    case 'no_answer': return 'no_answer';
    case 'busy': return 'busy';
    case 'failed': return 'failed';
    default: return 'failed';
  }
}

/** Map webhook failure_reason → outcome for non-connected calls */
function nonConnectedOutcome(status: string): string {
  switch (status) {
    case 'no_answer': return 'no_answer';
    case 'busy': return 'busy';
    case 'failed': return 'failed';
    default: return 'failed';
  }
}

export async function processCallResultJob(orgId: string, job: CallResultJobPayload): Promise<void> {
  const p = job.payload;
  const sb = supabaseAdmin();

  // 1. Correlate: find our call_session by external_call_id = attempt_id.
  //    (metadata echoes orgId/callSessionId too, but attempt_id is the
  //    documented guaranteed field — and it's indexed.)
  const { data: call, error: callErr } = await sb
    .from('call_sessions')
    .select('id, lead_id, status')
    .eq('org_id', orgId)
    .eq('external_call_id', p.attempt_id)
    .maybeSingle();

  if (callErr) throw new Error(`Lookup call_session failed: ${callErr.message}`);
  if (!call) {
    // Unknown attempt (test webhook / stale). Mark event processed, log, done.
    logger.warn({ attemptId: p.attempt_id, orgId }, '[Sarvam] Webhook for unknown attempt_id — skipping');
    await sb.from('sarvam_webhook_events').update({ processed_at: new Date().toISOString() }).eq('id', job.webhookEventId);
    return;
  }

  // 2. Idempotency: if this call already reached a terminal state, skip.
  //    Sarvam retries webhooks on non-200; duplicate transcripts must not be written.
  if (call.status !== 'in_progress' && call.status !== 'initiated') {
    logger.info({ callSessionId: call.id, status: call.status }, '[Sarvam] Duplicate webhook — call already terminal, skipping');
    await sb.from('sarvam_webhook_events').update({ processed_at: new Date().toISOString() }).eq('id', job.webhookEventId);
    return;
  }

  // 3. Build transcript from webhook (analytics fallback if missing — LLM summary
  //    needs text to be useful, and empty transcripts break the summary prompt).
  let transcriptRows: Array<{ role: string; text: string }> =
    (p.interaction_transcript ?? [])
      .filter((t) => t && typeof t.en_text === 'string')
      .map((t) => ({ role: t.role, text: t.en_text }));

  // 4. Persist turns, transcript text, metadata — all in one update path.
  const newStatus = mapStatus(p.status);
  const transcriptText = transcriptRows
    .map((t) => `${t.role === 'agent' ? 'Agent' : 'Customer'}: ${t.text}`)
    .join('\n');

  // 5. LLM summary for connected calls with a real transcript
  let summaryData: any = null;
  if (p.status === 'connected' && transcriptRows.length > 0) {
    const turns: CallTurn[] = transcriptRows.map((t) => ({
      speaker: t.role === 'agent' ? 'agent' : 'customer',
      text: t.text,
    }));
    try {
      const summary = await summarizeCall(turns, orgId);
      summaryData = summary.data;
    } catch (err: any) {
      // Summary failure must not lose the call record — store raw, no summary.
      logger.error({ callSessionId: call.id, err: err?.message }, '[Sarvam] summarizeCall failed — storing call without summary');
    }
  }

  // 6. Update call_sessions
  const patch: Record<string, any> = {
    status: newStatus,
    ended_at: new Date().toISOString(),
    interaction_id: p.interaction_id ?? null,
    summary: summaryData?.summary ?? (p.failure_reason ? `Call failed: ${p.failure_reason}` : null),
    outcome: summaryData?.outcome ?? (p.status === 'connected' ? null : nonConnectedOutcome(p.status)),
  };
  if (transcriptText) patch.transcript = transcriptText;
  if (p.duration != null) patch.duration_sec = Math.round(p.duration);
  if (p.channel_info?.agent_phone_number) patch.from_number = p.channel_info.agent_phone_number;
  if (p.failure_reason) patch.failure_reason = p.failure_reason;
  if (summaryData?.lead_temperature) patch.lead_temperature = summaryData.lead_temperature;

  const { error: updateErr } = await sb.from('call_sessions').update(patch).eq('id', call.id);
  if (updateErr) throw new Error(`Update call_session failed: ${updateErr.message}`);

  // 7. Save individual turns for the transcript viewer
  if (transcriptRows.length > 0) {
    const { data: last } = await sb
      .from('call_session_turns')
      .select('sequence_index')
      .eq('call_session_id', call.id)
      .order('sequence_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    let seq = (last?.sequence_index ?? -1) + 1;
    const rows = transcriptRows.map((t) => ({
      org_id: orgId,
      call_session_id: call.id,
      speaker: t.role === 'agent' ? 'agent' : 'customer',
      text: t.text,
      sequence_index: seq++,
    }));
    const { error: turnsErr } = await sb.from('call_session_turns').insert(rows);
    if (turnsErr) logger.error({ callSessionId: call.id, err: turnsErr.message }, '[Sarvam] Failed to save turns');
  }

  // 8. Lead enrichment + follow-ups (connected calls only)
  if (call.lead_id && summaryData) {
    const leadPatch: Record<string, any> = {};
    if (summaryData.lead_temperature) leadPatch.temperature = summaryData.lead_temperature;
    if (summaryData.updated_preferences) Object.assign(leadPatch, summaryData.updated_preferences);
    // Sarvam agent variables may carry structured extraction (e.g. budget, location)
    if (p.final_agent_variables && typeof p.final_agent_variables === 'object') {
      Object.assign(leadPatch, p.final_agent_variables);
    }
    if (Object.keys(leadPatch).length) {
      await updateLead(orgId, call.lead_id, leadPatch).catch(() => {});
    }

    if (summaryData.outcome === 'callback_requested' || summaryData.outcome === 'site_visit_requested' || summaryData.outcome === 'booking_requested') {
      await createFollowup(orgId, call.lead_id, {
        type: summaryData.outcome === 'site_visit_requested' ? 'site_visit' : 'call',
        title: summaryData.outcome === 'site_visit_requested' ? 'Site visit requested' : 'Callback requested',
        notes: summaryData?.summary ?? '',
        scheduled_at: summaryData?.next_follow_up_at ?? null,
        status: 'pending',
      }).catch(() => {});
    }
  }

  // 9. Mark webhook event processed
  await sb.from('sarvam_webhook_events').update({ processed_at: new Date().toISOString() }).eq('id', job.webhookEventId);

  logger.info({ callSessionId: call.id, sarvamStatus: p.status, newStatus }, '[Sarvam] Call result processed');
}