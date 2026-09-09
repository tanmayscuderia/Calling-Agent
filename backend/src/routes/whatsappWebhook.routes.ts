/**
 * Meta WhatsApp Cloud API webhook receiver.
 *
 *   GET  /webhooks/whatsapp   — hub.challenge subscription handshake
 *   POST /webhooks/whatsapp   — signed event delivery (messages + statuses)
 *
 * This is the inbound path for whatsapp_accounts rows with provider
 * 'meta_cloud_api'. Events are parsed into the SAME normalized shape the
 * Baileys parser produces (ParsedWhatsAppMessage) and fed into the same
 * enqueueIncomingMessage() pipeline — leads, conversations, dedup, the
 * job queue, and the AI agent are provider-agnostic.
 *
 * Security model (ported from wacrm):
 *   - GET: hub.verify_token must match a stored account verify token
 *     (decrypted) or the META_WEBHOOK_VERIFY_TOKEN env fallback.
 *   - POST: x-hub-signature-256 HMAC-SHA256 over the RAW body, keyed
 *     with META_APP_SECRET, verified in constant time. Missing secret
 *     or bad signature → 401 (fail-closed).
 *   - After signature OK, ALWAYS return 200 quickly — Meta retries on
 *     non-200 for ~24h and a processing error can never be fixed by a
 *     retry. Per-entry failures are logged, not surfaced.
 *
 * Raw-body note: Fastify's default JSON parser would hand us a parsed
 * object and re-serialization would break the HMAC. We register a
 * plugin-scoped parser that keeps the body as a raw string (same
 * encapsulation trick as sarvamWebhook.routes.ts).
 */

import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';
import { verifyMetaWebhookSignature } from '../utils/metaWebhookSignature';
import { decrypt } from '../utils/metaEncryption';
import { parseMetaWebhookPayload } from '../whatsapp/metaWebhookParser';
import { enqueueIncomingMessage } from '../whatsapp/whatsappService';

/** Load all meta_cloud_api account rows (id, org, secrets). */
async function loadMetaAccounts() {
  const { data, error } = await supabaseAdmin()
    .from('whatsapp_accounts')
    .select('id, org_id, phone_number_id, status, config')
    .eq('provider', 'meta_cloud_api');
  if (error) throw error;
  return data ?? [];
}

/** Find the account row that owns a webhook entry (by phone_number_id). */
async function resolveAccountByPhoneNumberId(phoneNumberId: string) {
  if (!phoneNumberId) return null;
  const { data, error } = await supabaseAdmin()
    .from('whatsapp_accounts')
    .select('id, org_id, status')
    .eq('provider', 'meta_cloud_api')
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle();
  if (error) {
    logger.error({ err: error.message, phoneNumberId }, '[meta-webhook] account lookup failed');
    return null;
  }
  return data;
}

/** Mirror a Meta status event onto the stored outbound message row. */
async function handleStatusEvent(accountId: string, status: any): Promise<void> {
  const wamid = String(status?.id ?? '');
  if (!wamid) return;

  const { data: row } = await supabaseAdmin()
    .from('customer_messages')
    .select('id, metadata, sent_at')
    .eq('external_message_id', wamid)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return; // e.g. statuses for messages sent outside this CRM

  const tsIso = status.timestamp
    ? new Date(Number(status.timestamp) * 1000).toISOString()
    : new Date().toISOString();

  const patch: Record<string, any> = {};
  if (status.status === 'sent' && !row.sent_at) patch.sent_at = tsIso;
  const prevMeta = (row.metadata ?? {}) as Record<string, any>;
  const meta: Record<string, any> = {
    ...prevMeta,
    wa_status: status.status,
    account_id: accountId,
  };
  if (status.status === 'sent') meta.sent_at = meta.sent_at ?? tsIso;
  if (status.status === 'delivered') meta.delivered_at = tsIso;
  if (status.status === 'read') meta.read_at = tsIso;
  if (status.status === 'failed') {
    meta.failed_at = tsIso;
    if (status.errors?.length) {
      meta.failure = {
        code: status.errors[0].code,
        title: status.errors[0].title,
        details: status.errors[0].error_data?.details ?? status.errors[0].message,
      };
    }
  }
  patch.metadata = meta;

  const { error } = await supabaseAdmin()
    .from('customer_messages')
    .update(patch)
    .eq('id', row.id);
  if (error) {
    logger.error({ err: error.message, wamid }, '[meta-webhook] status mirror failed');
  }
}

export async function whatsappWebhookRoutes(app: FastifyInstance) {
  // Plugin-scoped parser: keep the body as a RAW STRING so the HMAC is
  // computed over the exact bytes Meta signed. (Encapsulation means this
  // does not affect any other route.)
  app.addContentTypeParser(
    ['application/json', 'text/json'],
    { parseAs: 'string' },
    (_req, body: unknown, done: (err: Error | null, result?: unknown) => void) => {
      done(null, String(body ?? ''));
    }
  );

  /**
   * Subscription handshake. Meta hits this once when you configure the
   * webhook URL in the App Dashboard, echoing hub.verify_token.
   */
  app.get('/webhooks/whatsapp', async (req, reply) => {
    const q = req.query as Record<string, any>;
    const mode = q['hub.mode'];
    const token = q['hub.verify_token'];
    const challenge = q['hub.challenge'];

    if (mode !== 'subscribe' || !token || !challenge) {
      return reply.code(400).send({ error: 'Bad verification request' });
    }

    // 1) Global fallback token (single-number convenience).
    if (config.meta.webhookVerifyToken && token === config.meta.webhookVerifyToken) {
      return reply.type('text/plain').send(String(challenge));
    }

    // 2) Per-account verify tokens (stored encrypted).
    try {
      const accounts = await loadMetaAccounts();
      for (const acc of accounts) {
        const cfg = (acc.config ?? {}) as Record<string, any>;
        if (!cfg.verifyToken) continue;
        try {
          if (decrypt(String(cfg.verifyToken)) === token) {
            return reply.type('text/plain').send(String(challenge));
          }
        } catch {
          // Undecryptable row (key rotation?) — keep checking others.
        }
      }
    } catch (err: any) {
      logger.error({ err: err?.message }, '[meta-webhook] verify lookup failed');
    }

    return reply.code(403).send({ error: 'Verification token mismatch' });
  });

  /** Signed event delivery. */
  app.post('/webhooks/whatsapp', async (req, reply) => {
    const rawBody = String(req.body ?? '');
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    // Fail-closed: without META_APP_SECRET every request is rejected.
    if (!verifyMetaWebhookSignature(rawBody, signature)) {
      logger.warn('[meta-webhook] rejected request with invalid signature');
      return reply.code(401).send({ error: 'Invalid signature' });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      // Signature was valid but the body isn't JSON — nothing to process.
      return reply.code(400).send({ error: 'Invalid JSON' });
    }

    const entries = parseMetaWebhookPayload(body);
    if (entries.length === 0) {
      // Not a whatsapp_business_account payload (or nothing actionable).
      // Ack anyway — Meta must never see retry storms for junk.
      return { ok: true, processed: 0 };
    }

    let processedMessages = 0;
    let processedStatuses = 0;

    for (const entry of entries) {
      const account = await resolveAccountByPhoneNumberId(entry.phoneNumberId);

      // Statuses: mirror delivery milestones onto stored rows.
      for (const status of entry.statuses) {
        try {
          await handleStatusEvent(account?.id ?? 'unknown', status);
          processedStatuses += 1;
        } catch (err: any) {
          logger.error({ err: err?.message, wamid: status?.id }, '[meta-webhook] status handler failed');
        }
      }

      if (!account) {
        // The webhook is app-wide: Meta also delivers events for phone
        // numbers this install doesn't own. Ack and move on.
        logger.info(
          { phoneNumberId: entry.phoneNumberId, messages: entry.messages.length },
          '[meta-webhook] no matching account — skipping messages'
        );
        continue;
      }

      for (const parsed of entry.messages) {
        try {
          await enqueueIncomingMessage(parsed, account.org_id, account.id);
          processedMessages += 1;
        } catch (err: any) {
          logger.error(
            { err: err?.message, orgId: account.org_id, chatId: parsed.chatId },
            '[meta-webhook] enqueue failed'
          );
        }
      }
    }

    return { ok: true, messages: processedMessages, statuses: processedStatuses };
  });
}