/**
 * Sarvam webhook route.
 *
 * POST /webhooks/sarvam/:secret
 *
 * Flow: verify secret → validate payload → insert raw event (audit) →
 *       enqueue process_call_result job → 200 immediately.
 *
 * The webhook ALWAYS returns 200 for valid-shaped requests so Sarvam
 * doesn't retry; the queue handles processing with its own retries.
 * A malformed body returns 400 so Sarvam's retries stop hitting us.
 *
 * Plan: docs/SARVAM_CALLING_PLAN.md (Phase S4)
 */

import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { SarvamWebhookPayload } from '../sarvam/callResultService';

export async function sarvamWebhookRoutes(app: FastifyInstance) {
  /**
   * Sarvam Instant Outbound result webhook.
   * Secret lives in the path (unguessable URL = auth).
   */
  app.post('/webhooks/sarvam/:secret', async (req, reply) => {
    const { secret } = req.params as { secret: string };

    if (secret !== config.sarvam.webhookSecret) {
      logger.warn({ ip: req.ip }, '[Sarvam] Webhook rejected: bad secret');
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const p = req.body as SarvamWebhookPayload;
    if (!p || typeof p.attempt_id !== 'string' || typeof p.status !== 'string') {
      logger.warn({ body: p }, '[Sarvam] Webhook rejected: malformed payload');
      return reply.code(400).send({ error: 'Invalid payload' });
    }

    // 1. Persist raw event BEFORE anything else — audit trail for debugging
    const { data: event, error: insertErr } = await supabaseAdmin()
      .from('sarvam_webhook_events')
      .insert({
        attempt_id: p.attempt_id,
        interaction_id: p.interaction_id ?? null,
        payload: p,
      })
      .select('id')
      .single();

    if (insertErr || !event) {
      // DB failure: log loudly, still 200 (retrying won't help if DB is down;
      // payload is in logs for manual replay)
      logger.error({ err: insertErr?.message, attemptId: p.attempt_id }, '[Sarvam] Failed to persist webhook event — acking anyway');
      return reply.code(200).send({ ok: true });
    }

    // 2. Resolve org: outbound calls echo orgId via webhook_config.metadata.
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