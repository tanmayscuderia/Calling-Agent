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
import { finalizeCall } from './callFinalizer';
import { listAttempts, type AttemptRecord } from './sarvamClient';
import { findOrCreateLead } from '../crm/leadService';
import { normalizePhone } from '../utils/phone';
import { config } from '../config';
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

/**
 * Whitelist of crm_leads columns that agent variables are allowed to patch.
 * Anything outside this list is dropped (Supabase rejects whole updates on
 * unknown columns, so an unsanitized merge loses ALL fields, not just one).
 */
const LEAD_PATCHABLE_COLUMNS = new Set([
  'full_name', 'phone', 'whatsapp_number', 'email',
  'preferred_location', 'preferred_city', 'preferred_sector',
  'configuration', 'budget_min', 'budget_max',
  'purpose', 'timeline', 'possession_preference', 'notes',
]);

/** Common variable names → actual crm_leads column */
const VARIABLE_ALIASES: Record<string, string> = {
  customer_name: 'full_name',
  name: 'full_name',
  lead_temperature: 'temperature',
  city: 'preferred_city',
  location: 'preferred_location',
  budget: 'budget_max',
};

/**
 * Sanitize Sarvam `final_agent_variables` into a safe crm_leads patch:
 * alias-map known names, whitelist-check against real columns, coerce
 * numeric strings for budget fields, skip null/empty values.
 * Exported for unit tests.
 */
export function sanitizeAgentVariables(
  vars: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!vars || typeof vars !== 'object') return out;
  for (const [rawKey, rawVal] of Object.entries(vars)) {
    if (rawVal == null || rawVal === '') continue;
    const key = VARIABLE_ALIASES[rawKey] ?? rawKey;
    if (!LEAD_PATCHABLE_COLUMNS.has(key)) continue;
    let val: unknown = rawVal;
    if ((key === 'budget_min' || key === 'budget_max') && typeof rawVal === 'string') {
      const n = Number(rawVal.replace(/[₹,\scrl]/gi, '')); // best-effort numeric parse
      if (!Number.isFinite(n)) continue;
      val = n;
    }
    out[key] = val;
  }
  return out;
}

/**
 * Suggest Sarvam dashboard output variables for an org's qualifying fields:
 * returns only keys that survive sanitization (real crm_leads columns after
 * aliasing). Used by GET /api/agent/config/call-prompt so the copy-paste list
 * is always industry-correct.
 */
export function suggestOutputVariables(
  fields: Array<{ key: string; type: string }>,
): string[] {
  const keys = new Set<string>();
  for (const f of fields ?? []) {
    const mapped = VARIABLE_ALIASES[f.key] ?? f.key;
    if (LEAD_PATCHABLE_COLUMNS.has(mapped)) keys.add(mapped);
  }
  return [...keys];
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
    // Inbound? Dashboard-configured inbound deployments deliver to this
    // webhook WITHOUT our metadata (no pre-created call_session, no orgId
    // echo). The webhook payload has no caller number either — resolve
    // identity from the analytics attempts API, then create + finalize.
    if (config.sarvam.inboundNumber) {
      const inbound = await tryResolveInbound(orgId, job.webhookEventId, p);
      if (inbound) return; // handled + event acked inside
    }
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
  const transcriptRows =
    (p.interaction_transcript ?? [])
      .filter((t) => t && typeof t.en_text === 'string')
      .map((t) => ({ role: t.role, text: t.en_text }));

  // 4-8. Shared finalization pipeline — identical to the browser-demo path:
  //      summary → call_sessions patch → turns → lead enrichment → follow-ups.
  //      Provider-specific bits (interaction_id, from_number, failure_reason)
  //      ride along via extraPatch.
  const newStatus = mapStatus(p.status);
  const extraPatch: Record<string, unknown> = { interaction_id: p.interaction_id ?? null };
  if (p.channel_info?.agent_phone_number) extraPatch.from_number = p.channel_info.agent_phone_number;
  if (p.failure_reason) extraPatch.failure_reason = p.failure_reason;

  await finalizeCall({
    orgId,
    callSessionId: call.id,
    leadId: call.lead_id,
    status: newStatus,
    transcriptRows,
    durationSec: p.duration ?? null,
    agentVariables: p.final_agent_variables,
    fallbackSummary: p.failure_reason ? `Call failed: ${p.failure_reason}` : null,
    fallbackOutcome: p.status === 'connected' ? null : nonConnectedOutcome(p.status),
    extraPatch,
    persistTurns: true,
  });

  // 9. Mark webhook event processed
  await sb.from('sarvam_webhook_events').update({ processed_at: new Date().toISOString() }).eq('id', job.webhookEventId);

  logger.info({ callSessionId: call.id, sarvamStatus: p.status, newStatus }, '[Sarvam] Call result processed');
}

// ── Inbound calls (Phase S5 — CRM parity with WhatsApp inbound) ────────

export type InboundIngestResult = 'processed' | 'duplicate' | 'no_caller';

/**
 * Look up a webhook attempt in the analytics API. Returns true when the
 * attempt was inbound and fully handled (session created + finalized +
 * event acked). Returns false for outbound attempts / lookup failures so
 * the caller falls through to the normal skip path.
 */
async function tryResolveInbound(
  orgId: string,
  webhookEventId: string,
  p: SarvamWebhookPayload
): Promise<boolean> {
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const page = await listAttempts({
      startDatetime: start.toISOString(),
      endDatetime: now.toISOString(),
      limit: 5,
      filterConditions: [
        { id: '1', field: 'attempt_id', operator: 'equals', value: p.attempt_id },
      ],
    });
    const att = page?.items?.[0];
    if (!att) return false;
    if ((att.channel_direction ?? '').toLowerCase() !== 'inbound') return false;

    // ingestInboundAttempt acks the event (by id) for every outcome —
    // processed, duplicate, and no_caller alike.
    await ingestInboundAttempt(orgId, att, { webhookEventId, payload: p });
    return true;
  } catch (err: any) {
    logger.error({ attemptId: p.attempt_id, err: err?.message }, '[Sarvam] Inbound resolve failed — falling back to skip');
    return false;
  }
}

/**
 * Ingest one inbound attempt (webhook path AND poller path).
 * Caller identity: `user_identifier` → find-or-create lead by phone
 * (exactly like WhatsApp inbound). Dedupe: unique (org_id, external_call_id).
 */
export async function ingestInboundAttempt(
  orgId: string,
  att: Pick<AttemptRecord, 'attempt_id' | 'user_identifier' | 'interaction_id' | 'connectivity_status' | 'duration_in_seconds' | 'start_datetime' | 'agent_variables' | 'failure_reason' | 'audio_url'>,
  opts: { webhookEventId?: string; payload?: SarvamWebhookPayload } = {}
): Promise<InboundIngestResult> {
  const sb = supabaseAdmin();
  const ackEvent = async () => {
    if (!opts.webhookEventId) return;
    await sb
      .from('sarvam_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', opts.webhookEventId);
  };

  // 0. Dedupe: unique index on (org_id, external_call_id)
  const { data: existing } = await sb
    .from('call_sessions')
    .select('id')
    .eq('org_id', orgId)
    .eq('external_call_id', att.attempt_id)
    .maybeSingle();
  if (existing) {
    logger.info({ attemptId: att.attempt_id }, '[Sarvam] Inbound attempt already ingested — skipping');
    await ackEvent();
    return 'duplicate';
  }

  // 1. Caller identity → lead (WhatsApp-inbound parity)
  const callerPhone = att.user_identifier ? normalizePhone(String(att.user_identifier)) : '';
  if (!callerPhone) {
    logger.warn({ attemptId: att.attempt_id }, '[Sarvam] Inbound attempt without user_identifier — cannot attribute');
    await ackEvent();
    return 'no_caller';
  }

  const lead = await findOrCreateLead({
    orgId,
    phone: callerPhone,
    source: 'inbound_call',
    source_detail: 'Sarvam inbound deployment',
  }).catch((err) => {
    logger.error({ err: err?.message, attemptId: att.attempt_id }, '[Sarvam] findOrCreateLead failed for inbound caller');
    return null;
  });

  // 2. Create the inbound session. Unique-violation on insert = another
  //    worker/webhook got there first → duplicate, ack and stop.
  const { data: session, error: sessionErr } = await sb
    .from('call_sessions')
    .insert({
      org_id: orgId,
      lead_id: lead?.id ?? null,
      provider: 'sarvam',
      direction: 'inbound',
      external_call_id: att.attempt_id,
      status: 'in_progress',
      from_number: callerPhone,
      to_number: config.sarvam.inboundNumber || null,
      started_at: att.start_datetime ?? null,
      metadata: { inbound: true, attempt_id: att.attempt_id },
    })
    .select('id, lead_id')
    .single();
  if (sessionErr || !session) {
    logger.warn(
      { err: sessionErr?.message, attemptId: att.attempt_id },
      '[Sarvam] Inbound session create failed (likely duplicate delivery) — acking'
    );
    await ackEvent();
    return 'duplicate';
  }

  // 3. Shared finalization. Transcript from the webhook payload when
  //    available (webhook path); the poller path passes none and the
  //    analytics fetch below fills the gap.
  const sarvamStatus = opts.payload?.status ?? att.connectivity_status ?? 'connected';
  const transcriptRows = (opts.payload?.interaction_transcript ?? [])
    .filter((t) => t && typeof t.en_text === 'string')
    .map((t) => ({ role: t.role, text: t.en_text }));

  const extraPatch: Record<string, unknown> = { interaction_id: att.interaction_id ?? opts.payload?.interaction_id ?? null };
  if (att.failure_reason || opts.payload?.failure_reason) {
    extraPatch.failure_reason = att.failure_reason ?? opts.payload?.failure_reason;
  }
  if (att.audio_url) extraPatch.recording_url = att.audio_url;

  await finalizeCall({
    orgId,
    callSessionId: session.id,
    leadId: session.lead_id ?? lead?.id ?? null,
    status: mapStatus(sarvamStatus),
    transcriptRows,
    durationSec: opts.payload?.duration ?? att.duration_in_seconds ?? null,
    agentVariables: opts.payload?.final_agent_variables ?? att.agent_variables ?? null,
    fallbackSummary:
      att.failure_reason || opts.payload?.failure_reason
        ? `Call failed: ${att.failure_reason ?? opts.payload?.failure_reason}`
        : sarvamStatus === 'connected'
          ? 'Inbound call to AI agent'
          : null,
    fallbackOutcome: sarvamStatus === 'connected' ? null : nonConnectedOutcome(sarvamStatus),
    extraPatch,
    persistTurns: true,
  });

  await ackEvent();
  logger.info(
    { callSessionId: session.id, caller: callerPhone, status: mapStatus(sarvamStatus) },
    '[Sarvam] Inbound call processed'
  );
  return 'processed';
}
