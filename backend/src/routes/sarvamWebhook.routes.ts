/**
 * Sarvam webhook route (TOLERANT — 2026-08-30).
 *
 * POST /webhooks/sarvam/:secret
 *
 * Flow: verify secret → log raw body to file → NORMALIZE payload →
 *       insert raw event (audit) → enqueue process_call_result job → 200.
 *
 * Why tolerant: on 2026-08-30 the dashboard's on_end tool delivered EMPTY
 * bodies (Content-Length: 0) on every call → the old strict check returned
 * 400 → Sarvam retried → 11x 400s, zero rows in sarvam_webhook_events.
 * Retrying a config problem can never succeed, so now:
 *   - Body problems (empty / missing ids / unknown shape) are AUDITED and
 *     acked with 200 + a processing_error note — never 400.
 *   - Field aliases accepted: attempt_id|call_id|interaction_id,
 *     status|disposition|outcome|call_status (camelCase too).
 *   - Flat variable bodies accepted: variables / output_variables /
 *     final_agent_variables objects, or flat lead keys (customer_name, city,
 *     location, configuration, budget_min, budget_max, purpose, timeline,
 *     budget, phone) hoisted into final_agent_variables.
 *   - Every POST (headers masked + body) is appended to
 *     backend/logs/sarvam-webhooks.log for forensics.
 * Only a wrong URL secret still returns 403 (that IS the auth).
 *
 * Plan: docs/SARVAM_CALLING_PLAN.md (Phase S4)
 */

import { FastifyInstance } from 'fastify';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { SarvamWebhookPayload } from '../sarvam/callResultService';

// ── Raw forensics log (same pattern as sarvamTools.routes.logToolCall) ──

function logWebhookRaw(entry: Record<string, unknown>) {
  try {
    const dir = join(process.cwd(), 'logs');
    mkdirSync(dir, { recursive: true });
    appendFileSync(
      join(dir, 'sarvam-webhooks.log'),
      JSON.stringify({ t: new Date().toISOString(), ...entry }) + '\n'
    );
  } catch {
    // logging must never break the webhook
  }
}

function maskHeaders(headers: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers ?? {})) {
    const s = String(v);
    out[k] = ['x-tool-secret', 'x-api-key', 'authorization'].includes(k)
      ? `${s.slice(0, 10)}…(len ${s.length})`
      : v;
  }
  return out;
}

// ── Payload normalization ──

/** Flat keys hoisted from the body top level into final_agent_variables. */
const FLAT_VARIABLE_KEYS = new Set([
  'customer_name', 'city', 'location', 'configuration',
  'budget_min', 'budget_max', 'budget', 'purpose', 'timeline', 'phone',
  'caller_phone', // Sarvam "caller_phone" chip (on_end Body template)
]);

/**
 * Parse a raw `call_transcript` STRING (the "Call transcript" chip emits
 * plain text, not the [{role,en_text}] array of interaction_transcript)
 * into turn rows. Recognizes "AI:"/"Agent:" and "User:"/"Customer:" line
 * prefixes; unlabelled lines are appended to the previous turn.
 */
function parseTranscriptString(raw: string): Array<{ role: string; en_text: string }> {
  const rows: Array<{ role: string; en_text: string }> = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(AI|Agent|Bot|User|Customer|Human)\s*[:：]\s*(.*)$/i);
    if (m) {
      const role = /^(ai|agent|bot)$/i.test(m[1]) ? 'ai' : 'user';
      rows.push({ role, en_text: m[2] });
    } else if (rows.length > 0) {
      rows[rows.length - 1].en_text += ` ${trimmed}`;
    } else {
      rows.push({ role: 'user', en_text: trimmed });
    }
  }
  return rows;
}

function pickString(body: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = body[k];
    if (typeof v === 'string') {
      const t = v.trim();
      // Empty or unresolved Body-template placeholder (the picker has no
      // "status" chip, so {{status}} can interpolate to its own literal) —
      // treat as absent so status inference / attempt-id fallback kick in.
      if (t === '' || /^\{\{.*\}\}$/.test(t)) continue;
      return t;
    }
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

/**
 * Normalize whatever Sarvam sent into our canonical SarvamWebhookPayload.
 * Returns null when the body carries no usable attempt identity at all
 * (empty body / unrecognized shape) — caller audits it without enqueueing.
 * Exported for unit tests.
 */
export function normalizeSarvamPayload(
  raw: unknown
): { payload: SarvamWebhookPayload; notes: string[] } | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const notes: string[] = [];

  // Identity: attempt_id | call_id | interaction_id (+ camelCase variants)
  const attemptId = pickString(body, [
    'attempt_id', 'attemptId', 'call_id', 'callId', 'interaction_id', 'interactionId',
  ]);
  // Status: status | disposition | outcome | call_status (+ camelCase variant)
  const status = pickString(body, [
    'status', 'disposition', 'outcome', 'call_status', 'callStatus',
  ]);
  if (!attemptId && !status) return null; // nothing usable to correlate

  // Variables: prefer the canonical field, else a named container, else hoist
  // flat lead keys from the body top level (dashboard Body templates are often
  // configured as flat chips).
  let variables: Record<string, unknown> | undefined;
  const container = body.final_agent_variables ?? body.variables ?? body.output_variables;
  if (container && typeof container === 'object' && !Array.isArray(container)) {
    variables = container as Record<string, unknown>;
  }
  const flat: Record<string, unknown> = {};
  for (const k of FLAT_VARIABLE_KEYS) {
    const v = body[k];
    if (v === undefined || v === null || v === '') continue;
    // Unresolved Body-template placeholders (dashboard "Send" test fires the
    // raw template; an unset output var can interpolate to its own name) —
    // never patch "{{city}}" into a lead.
    if (typeof v === 'string' && /^\{\{.*\}\}$/.test(v.trim())) continue;
    flat[k] = v;
  }
  if (Object.keys(flat).length > 0) {
    variables = { ...(variables ?? {}), ...flat };
    notes.push('flat variables hoisted into final_agent_variables');
  }
  if (!body.attempt_id) notes.push(`attempt_id aliased from ${attemptId ? 'call/interaction id field' : 'generated'}`);
  if (!body.status) notes.push('status aliased from disposition/outcome field');

  // Transcript: prefer the canonical interaction_transcript array; fall back
  // to the raw call_transcript STRING (Sarvam "Call transcript" chip) parsed
  // into turn rows.
  let transcript = (body.interaction_transcript as SarvamWebhookPayload['interaction_transcript']) ?? null;
  if (!transcript && typeof body.call_transcript === 'string' && body.call_transcript.trim()) {
    transcript = parseTranscriptString(body.call_transcript);
    notes.push('call_transcript string parsed into interaction_transcript turns');
  }

  // Status inference: dashboard Body templates often omit a status chip
  // (Sarvam exposes no "status" chip in the on_end editor). When the body
  // carries evidence a real conversation happened — non-zero duration or a
  // non-empty transcript — treat it as connected instead of the safe
  // 'unknown' (which mapStatus turns into 'failed' and kills the summary).
  let effectiveStatus = status;
  if (!effectiveStatus) {
    const durationNum = typeof body.duration === 'number' ? body.duration : Number(body.duration);
    const hasCall = (Number.isFinite(durationNum) && durationNum > 0) ||
      (transcript && transcript.length > 0);
    effectiveStatus = hasCall ? 'connected' : 'unknown';
    if (hasCall) notes.push('status inferred as connected (duration/transcript present, no status chip)');
  }

  // Duration: Body templates mark fields "Text", so Sarvam may interpolate
  // the number as a STRING ("94") — coerce numeric strings, else undefined
  // (finalizeCall falls back to computing from started_at).
  let duration: number | undefined;
  if (typeof body.duration === 'number') duration = body.duration;
  else if (typeof body.duration === 'string' && body.duration.trim() !== '') {
    const n = Number(body.duration.trim());
    if (Number.isFinite(n)) duration = n;
  }

  return {
    notes,
    payload: {
      attempt_id: attemptId ?? `unknown-${Date.now()}`,
      status: (effectiveStatus ?? 'unknown').toLowerCase() as SarvamWebhookPayload['status'],
      channel_info: (body.channel_info as SarvamWebhookPayload['channel_info']) ?? undefined,
      duration,
      interaction_id: (typeof body.interaction_id === 'string' ? body.interaction_id : null) ?? null,
      failure_reason: typeof body.failure_reason === 'string' ? body.failure_reason : null,
      final_agent_variables: variables ?? null,
      webhook_config: (body.webhook_config as SarvamWebhookPayload['webhook_config']) ?? null,
      interaction_transcript: transcript,
    },
  };
}

export async function sarvamWebhookRoutes(app: FastifyInstance) {
  // Fastify's default JSON parser rejects `Content-Type: application/json`
  // with an EMPTY body (FST_ERR_CTP_EMPTY_JSON_BODY → 400) — exactly what the
  // misconfigured on_end tool sent on 2026-08-30, before our route code could
  // run. Scope a lenient parser to this plugin: empty bodies become {} and
  // reach the route's audit path instead of a framework-level 400.
  app.addContentTypeParser(
    ['application/json', 'text/json'],
    { parseAs: 'string' },
    (_req, body: unknown, done: (err: Error | null, result?: unknown) => void) => {
      if (body === undefined || body === null || String(body).trim() === '') {
        return done(null, {});
      }
      try {
        done(null, JSON.parse(String(body)));
      } catch (err) {
        done(err as Error);
      }
    }
  );

  /**
   * Sarvam Instant Outbound result webhook.
   * Secret lives in the path (unguessable URL = auth).
   */
  app.post('/webhooks/sarvam/:secret', async (req, reply) => {
    const { secret } = req.params as { secret: string };

    if (secret !== config.sarvam.webhookSecret) {
      logger.warn({ ip: req.ip }, '[Sarvam] Webhook rejected: bad secret');
      logWebhookRaw({ kind: 'rejected-bad-secret', ip: req.ip, headers: maskHeaders(req.headers as Record<string, unknown>) });
      return reply.code(403).send({ error: 'Forbidden' });
    }

    // 0. Raw forensics — file log BEFORE any validation, so even empty bodies
    //    are captured (Content-Length: 0 was invisible in the old flow).
    const body = req.body as unknown;
    logWebhookRaw({
      kind: 'received',
      ip: req.ip,
      headers: maskHeaders(req.headers as Record<string, unknown>),
      body: body ?? null,
    });

    // 1. Normalize (aliases + flat variables). Unusable body → audit + 200,
    //    NO 400 (Sarvam retries 400s forever on a config problem it can't fix).
    const norm = normalizeSarvamPayload(body);
    if (!norm) {
      logger.warn({ ip: req.ip, hasBody: !!body }, '[Sarvam] Webhook with empty/unrecognized body — auditing, not enqueueing');
      try {
        await supabaseAdmin().from('sarvam_webhook_events').insert({
          attempt_id: `unusable-${Date.now()}`,
          interaction_id: null,
          payload: (body ?? {}) as Record<string, unknown>,
          processing_error:
            'empty or unrecognized body — dashboard on_end tool likely has no Body template configured',
        });
      } catch {
        // audit best-effort; always ack
      }
      return reply.code(200).send({ ok: true, warning: 'empty or unrecognized body accepted (audited)' });
    }
    const p = norm.payload;

    // 2. Persist raw event BEFORE anything else — audit trail for debugging
    const { data: event, error: insertErr } = await supabaseAdmin()
      .from('sarvam_webhook_events')
      .insert({
        attempt_id: p.attempt_id,
        interaction_id: p.interaction_id ?? null,
        payload: p as unknown as Record<string, unknown>,
      })
      .select('id')
      .single();

    if (insertErr || !event) {
      // DB failure: log loudly, still 200 (retrying won't help if DB is down;
      // payload is in logs for manual replay)
      logger.error({ err: insertErr?.message, attemptId: p.attempt_id }, '[Sarvam] Failed to persist webhook event — acking anyway');
      return reply.code(200).send({ ok: true });
    }

    if (norm.notes.length > 0) {
      await supabaseAdmin()
        .from('sarvam_webhook_events')
        .update({ processing_error: `normalized: ${norm.notes.join('; ')}` })
        .eq('id', event.id);
    }

    // 3. Resolve org: outbound calls echo orgId via webhook_config.metadata.
    //    Dashboard-configured INBOUND deployments can't set metadata — fall
    //    back to SARVAM_DEFAULT_ORG_ID (the job's unknown-attempt branch
    //    then resolves the caller via the analytics API).
    const metaOrgId = p.webhook_config?.metadata?.orgId;
    const orgId =
      typeof metaOrgId === 'string'
        ? metaOrgId
        : config.sarvam.inboundNumber && config.sarvam.defaultOrgId
          ? config.sarvam.defaultOrgId
          : null;

    if (!orgId) {
      // No org correlation — mark processed with error note, ack 200.
      logger.warn({ attemptId: p.attempt_id }, '[Sarvam] Webhook without orgId metadata — cannot route, storing raw only');
      await supabaseAdmin()
        .from('sarvam_webhook_events')
        .update({ processing_error: 'missing orgId in webhook metadata' })
        .eq('id', event.id);
      return reply.code(200).send({ ok: true });
    }

    // 3. Enqueue processing job (queue retries on failure)
    const { error: jobErr } = await supabaseAdmin().from('job_queue').insert({
      org_id: orgId,
      job_type: 'process_call_result',
      payload: { webhookEventId: event.id, payload: p },
      status: 'pending',
      priority: 6,
      scheduled_at: new Date().toISOString(),
    });

    if (jobErr) {
      logger.error({ err: jobErr.message, attemptId: p.attempt_id }, '[Sarvam] Failed to enqueue process_call_result job');
      await supabaseAdmin()
        .from('sarvam_webhook_events')
        .update({ processing_error: `enqueue failed: ${jobErr.message}` })
        .eq('id', event.id);
      return reply.code(200).send({ ok: true });
    }

    logger.info({ attemptId: p.attempt_id, status: p.status, eventId: event.id }, '[Sarvam] Webhook accepted, job enqueued');
    return reply.code(200).send({ ok: true });
  });
}