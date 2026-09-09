/**
 * Meta Cloud API account management routes — the "official WhatsApp
 * Business API" half of the dual-provider onboarding.
 *
 *   POST /api/whatsapp/meta/connect             — connect a number (verify → encrypt → store)
 *   GET  /api/whatsapp/meta/accounts            — list this org's meta accounts
 *   POST /api/whatsapp/meta/verify-registration — diagnostic: is the WABA subscribed to our app?
 *   POST /api/whatsapp/meta/disconnect          — disconnect a meta account
 *   GET  /api/whatsapp/meta/webhook-info        — webhook URL + setup instructions for the dashboard
 *
 * Connect flow (mirrors wacrm's onboarding, adapted to Fastify):
 *   1. verifyPhoneNumber      — proves the Phone Number ID + token work
 *   2. registerPhoneNumber    — claims inbound webhooks for THIS app (needs 2FA PIN)
 *   3. subscribeWabaToApp     — subscribes the WABA (idempotent)
 *   4. Encrypt token/verify-token/PIN (AES-256-GCM) and insert the
 *      whatsapp_accounts row with provider='meta_cloud_api'
 *
 * The companion Baileys flow (QR scan) already lives in
 * routes/whatsapp.routes.ts — an org can use either or both.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';
import { encrypt, decrypt } from '../utils/metaEncryption';
import {
  verifyPhoneNumber,
  registerPhoneNumber,
  subscribeWabaToApp,
  getSubscribedApps,
} from '../whatsapp/metaApi';
import { waManager } from '../whatsapp/connectionManager';

const connectSchema = z.object({
  phoneNumberId: z.string().min(1),
  wabaId: z.string().min(1).optional(),
  accessToken: z.string().min(10),
  verifyToken: z.string().min(8).optional(),
  /** 6-digit 2FA PIN (Meta WhatsApp Manager → Two-step verification). */
  pin: z.string().regex(/^\d{6}$/).optional(),
  label: z.string().min(1).max(100).optional(),
});

export async function whatsappMetaRoutes(app: FastifyInstance) {
  /**
   * Connect a Meta Cloud API number to this org.
   * Meta errors are surfaced VERBATIM (they're actionable: wrong PIN,
   * token expired, number on another app…).
   */
  app.post('/api/whatsapp/meta/connect', async (req, reply) => {
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const memberId = (req as any).getMemberId?.();

    const parsedBody = connectSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        ok: false,
        error: 'Invalid request body',
        details: parsedBody.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    const { phoneNumberId, wabaId, accessToken, verifyToken, pin, label } = parsedBody.data;

    if (!config.meta.encryptionKey) {
      return reply.code(400).send({
        ok: false,
        error:
          'ENCRYPTION_KEY is not configured on this server. Meta access tokens are never stored in plaintext — ' +
          'set ENCRYPTION_KEY (64 hex chars) and restart.',
      });
    }

    // One Meta phone number can only be claimed by one account row.
    const { data: existing } = await supabaseAdmin()
      .from('whatsapp_accounts')
      .select('id, org_id')
      .eq('provider', 'meta_cloud_api')
      .eq('phone_number_id', phoneNumberId)
      .maybeSingle();
    if (existing) {
      return reply.code(409).send({
        ok: false,
        error:
          existing.org_id === orgId
            ? 'This phone number is already connected to your org.'
            : 'This phone number is already connected by another organization.',
      });
    }

    // 1) Verify credentials against Meta BEFORE writing anything.
    let displayPhone: string | undefined;
    try {
      const info = await verifyPhoneNumber({ phoneNumberId, accessToken });
      displayPhone = info.display_phone_number
        ? `+${String(info.display_phone_number).replace(/[^\d]/g, '')}`
        : undefined;
    } catch (err: any) {
      return reply.code(400).send({
        ok: false,
        error: `Meta rejected the Phone Number ID / access token: ${err?.message ?? err}`,
      });
    }

    // 2) Register the number for THIS app's webhook (needs the 2FA PIN).
    if (pin) {
      try {
        const reg = await registerPhoneNumber({ phoneNumberId, accessToken, pin });
        if (reg.alreadyRegistered) {
          logger.info({ orgId, phoneNumberId }, '[meta] number already registered — continuing');
        }
      } catch (err: any) {
        return reply.code(400).send({
          ok: false,
          error: `Meta registration failed: ${err?.message ?? err}`,
          hint: 'The 6-digit PIN comes from Meta WhatsApp Manager → Two-step verification. Without /register, inbound events may route to another app.',
        });
      }
    }

    // 3) Subscribe the WABA to this app (idempotent).
    if (wabaId) {
      try {
        await subscribeWabaToApp({ wabaId, accessToken });
      } catch (err: any) {
        return reply.code(400).send({
          ok: false,
          error: `WABA subscription failed: ${err?.message ?? err}`,
        });
      }
    }

    // 4) Persist — tokens/verify-token/PIN encrypted at rest.
    try {
      const accountId = await waManager.createMetaAccount(
        orgId,
        label ?? `Meta ${displayPhone ?? phoneNumberId}`,
        {
          phoneNumberId,
          wabaId,
          encryptedAccessToken: encrypt(accessToken),
          encryptedVerifyToken: verifyToken ? encrypt(verifyToken) : undefined,
          encryptedPin: pin ? encrypt(pin) : undefined,
          displayPhone,
        },
        memberId
      );
      logger.info({ orgId, accountId, phoneNumberId }, '[meta] Cloud API account connected');
      return {
        ok: true,
        accountId,
        provider: 'meta_cloud_api',
        phone: displayPhone ?? null,
        message:
          'Meta Cloud API connected. Set the webhook URL in Meta App Dashboard → WhatsApp → Configuration, then inbound messages will flow.',
      };
    } catch (err: any) {
      return reply.code(500).send({ ok: false, error: err?.message ?? 'Failed to store account' });
    }
  });

  /** List this org's Meta accounts (secrets redacted). */
  app.get('/api/whatsapp/meta/accounts', async (req) => {
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const { data } = await supabaseAdmin()
      .from('whatsapp_accounts')
      .select('id, label, phone_number, status, phone_number_id, waba_id, last_connected_at, last_error, created_at')
      .eq('org_id', orgId)
      .eq('provider', 'meta_cloud_api')
      .order('created_at', { ascending: true });
    return { ok: true, accounts: data ?? [] };
  });

  /**
   * Diagnostic — confirm our app appears in the WABA's subscribed apps.
   * This is the "why am I not receiving webhooks?" button.
   */
  app.post('/api/whatsapp/meta/verify-registration', async (req, reply) => {
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const { accountId } = (req.body ?? {}) as { accountId?: string };
    if (!accountId) return reply.code(400).send({ ok: false, error: 'accountId is required' });

    const { data: row } = await supabaseAdmin()
      .from('whatsapp_accounts')
      .select('id, org_id, provider, waba_id, config')
      .eq('org_id', orgId)
      .eq('id', accountId)
      .maybeSingle();
    if (!row) return reply.code(404).send({ ok: false, error: 'Account not found' });
    if (row.provider !== 'meta_cloud_api') {
      return reply.code(400).send({ ok: false, error: 'Account is not a Meta Cloud API account' });
    }

    const cfg = (row.config ?? {}) as Record<string, any>;
    const wabaId = row.waba_id ?? (cfg.wabaId ? String(cfg.wabaId) : '');
    if (!wabaId) {
      return reply.code(400).send({
        ok: false,
        error: 'No WABA ID stored for this account — re-connect with the wabaId field to enable this check.',
      });
    }
    try {
      const apps = await getSubscribedApps({ wabaId, accessToken: decrypt(String(cfg.accessToken)) });
      return { ok: true, subscribedApps: apps };
    } catch (err: any) {
      return reply.code(400).send({ ok: false, error: err?.message ?? 'Meta API error' });
    }
  });

  /** Disconnect a Meta account (webhook stops being processed for it). */
  app.post('/api/whatsapp/meta/disconnect', async (req, reply) => {
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const { accountId } = (req.body ?? {}) as { accountId?: string };
    if (!accountId) return reply.code(400).send({ ok: false, error: 'accountId is required' });

    const { error } = await supabaseAdmin()
      .from('whatsapp_accounts')
      .update({ status: 'disconnected' })
      .eq('org_id', orgId)
      .eq('id', accountId)
      .eq('provider', 'meta_cloud_api');
    if (error) return reply.code(500).send({ ok: false, error: error.message });
    return { ok: true };
  });

  /** Everything the dashboard needs to walk an operator through setup. */
  app.get('/api/whatsapp/meta/webhook-info', async (req) => {
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const { data: accounts } = await supabaseAdmin()
      .from('whatsapp_accounts')
      .select('id, label, phone_number, status, phone_number_id')
      .eq('org_id', orgId)
      .eq('provider', 'meta_cloud_api')
      .order('created_at', { ascending: true });

    const configured = Boolean(config.meta.appSecret);
    return {
      ok: true,
      webhookUrl: `${config.sarvam.publicUrl}/webhooks/whatsapp`,
      signatureVerification: configured
        ? 'enabled (META_APP_SECRET set)'
        : 'DISABLED — set META_APP_SECRET; all webhook POSTs are rejected until then',
      accounts: accounts ?? [],
      instructions: [
        'Meta App Dashboard → WhatsApp → Configuration',
        'Callback URL: the webhookUrl above',
        'Verify token: the exact string you entered when connecting (or META_WEBHOOK_VERIFY_TOKEN)',
        'Webhook fields: subscribe to "messages"',
        'Messages flow in signed; replies go out via the Graph API automatically.',
      ],
    };
  });
}