/**
 * Meta Cloud API adapter — the stateless counterpart to
 * BaileysWhatsAppAdapter. Implements the same MessagingAdapter
 * interface, so the queue worker, job handlers, and the AI pipeline
 * never need to know which provider owns an account.
 *
 * Differences from the Baileys adapter (by design):
 *   - No socket, no QR, no session dir. "start()" is credential
 *     verification: verifyPhoneNumber → registerPhoneNumber (needs the
 *     6-digit 2FA PIN) → subscribeWabaToApp. Cheap and idempotent, so
 *     adapters are constructed on demand instead of held in memory.
 *   - Inbound messages do NOT flow through this object — Meta POSTs
 *     them to routes/whatsappWebhook.routes.ts, which feeds them into
 *     the same enqueueIncomingMessage() pipeline.
 *   - Secrets live encrypted in whatsapp_accounts.config (AES-256-GCM,
 *     utils/metaEncryption). Plaintext tokens only ever exist in RAM.
 *
 * Sending: chatIds arrive as Baileys-style JIDs (canonical form used by
 * conversations.external_chat_id — see metaWebhookParser). They are
 * converted back to raw digits for the Graph API call, so the rest of
 * the codebase never branches on provider.
 */
import { EventEmitter } from 'events';
import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import { decrypt } from '../utils/metaEncryption';
import {
  verifyPhoneNumber,
  registerPhoneNumber,
  subscribeWabaToApp,
  sendTextMessage,
  sendMediaMessage,
  sendLocationMessage,
  markMessageRead,
  type MediaKind,
} from './metaApi';
import type { MessagingAdapter } from './types';

export const META_PROVIDER = 'meta_cloud_api' as const;

/** Stored (encrypted) shape of whatsapp_accounts.config for meta accounts. */
export interface MetaAccountSecrets {
  /** Encrypted permanent access token (system user token). */
  accessToken: string;
  /** Encrypted webhook verify token (hub.verify_token echo). */
  verifyToken?: string;
  /** Encrypted 6-digit 2FA PIN for /register. */
  pin?: string;
  /** Verified display phone from Meta (e.g. "+919999999999"). */
  displayPhone?: string;
}

/** Plaintext view, produced by decryptAccountSecrets(). */
export interface MetaAccountCredentials {
  phoneNumberId: string;
  wabaId?: string;
  accessToken: string;
  verifyToken?: string;
  pin?: string;
  displayPhone?: string;
}

/** Convert any chatId form (JID, wa.me link, digits, +digits) to raw digits. */
export function chatIdToDigits(chatId: string): string {
  const digits = String(chatId ?? '')
    .split('@')[0] // strip @s.whatsapp.net / @g.us
    .split(':')[0] // strip Baileys device suffix (9199…:12)
    .replace(/[^\d]/g, '');
  return digits;
}

/** Decrypt the stored secrets of a meta account row. Throws on bad key/ciphertext. */
export function decryptAccountSecrets(row: {
  provider: string;
  config?: Record<string, any> | null;
}): MetaAccountCredentials {
  if (row.provider !== META_PROVIDER) {
    throw new Error(`Account is provider '${row.provider}', not '${META_PROVIDER}'`);
  }
  const cfg = (row.config ?? {}) as Record<string, any>;
  const phoneNumberId = String(cfg.phoneNumberId ?? '');
  if (!phoneNumberId) {
    throw new Error('Meta account row is missing phoneNumberId in config');
  }
  if (!cfg.accessToken) {
    throw new Error('Meta account row is missing an encrypted accessToken');
  }
  return {
    phoneNumberId,
    wabaId: cfg.wabaId ? String(cfg.wabaId) : undefined,
    accessToken: decrypt(String(cfg.accessToken)),
    verifyToken: cfg.verifyToken ? decrypt(String(cfg.verifyToken)) : undefined,
    pin: cfg.pin ? decrypt(String(cfg.pin)) : undefined,
    displayPhone: cfg.displayPhone ? String(cfg.displayPhone) : undefined,
  };
}

export class MetaCloudWhatsAppAdapter extends EventEmitter implements MessagingAdapter {
  readonly provider = META_PROVIDER;

  private accountId: string;
  private orgId: string;
  private creds: MetaAccountCredentials;
  private status: string = 'disconnected';
  private lastWebhookAt: string | null = null;
  private lastError: string | null = null;

  constructor(accountId: string, orgId: string, creds: MetaAccountCredentials) {
    super();
    this.accountId = accountId;
    this.orgId = orgId;
    this.creds = creds;
    this.status = 'connected';
  }

  /** Build an adapter from a whatsapp_accounts row (decrypts secrets). */
  static fromAccountRow(row: {
    id: string;
    org_id: string;
    provider: string;
    config?: Record<string, any> | null;
  }): MetaCloudWhatsAppAdapter {
    const creds = decryptAccountSecrets(row);
    return new MetaCloudWhatsAppAdapter(row.id, row.org_id, creds);
  }

  /**
   * Credential verification pass: verify the number, register it for
   * this app's webhook (needs the 2FA PIN), and subscribe the WABA.
   * All three steps are idempotent / no-ops when already done.
   */
  async start(): Promise<void> {
    try {
      const info = await verifyPhoneNumber({
        phoneNumberId: this.creds.phoneNumberId,
        accessToken: this.creds.accessToken,
      });
      this.creds.displayPhone = info.display_phone_number
        ? `+${String(info.display_phone_number).replace(/[^\d]/g, '')}`
        : this.creds.displayPhone;

      if (this.creds.pin) {
        const reg = await registerPhoneNumber({
          phoneNumberId: this.creds.phoneNumberId,
          accessToken: this.creds.accessToken,
          pin: this.creds.pin,
        });
        if (reg.alreadyRegistered) {
          logger.info({ accountId: this.accountId }, '[Meta] Number already registered to this app');
        }
      } else {
        logger.warn(
          { accountId: this.accountId },
          '[Meta] No 2FA PIN stored — skipping /register. Inbound webhooks may route to another app.'
        );
      }

      if (this.creds.wabaId) {
        await subscribeWabaToApp({
          wabaId: this.creds.wabaId,
          accessToken: this.creds.accessToken,
        });
      }

      this.status = 'connected';
      this.lastError = null;
      await this.persistStatus('connected');
      this.emit('connected', this.creds.displayPhone ?? this.creds.phoneNumberId);
    } catch (err: any) {
      this.status = 'error';
      this.lastError = err?.message ?? String(err);
      await this.persistStatus('error', this.lastError ?? undefined).catch(() => {});
      throw err;
    }
  }

  async stop(): Promise<void> {
    this.status = 'disconnected';
    await this.persistStatus('disconnected').catch(() => {});
  }

  /** Send a free-form text reply. chatId may be a JID or raw digits. */
  async sendMessage(chatId: string, text: string): Promise<void> {
    const to = chatIdToDigits(chatId);
    if (!to) throw new Error(`Cannot derive recipient digits from chatId '${chatId}'`);
    await sendTextMessage({
      phoneNumberId: this.creds.phoneNumberId,
      accessToken: this.creds.accessToken,
      to,
      text,
    });
  }

  /** Send media by PUBLIC link (Cloud API has no buffer upload here). */
  async sendMedia(
    chatId: string,
    opts: { url?: string; buffer?: Buffer; fileName?: string; caption?: string; mimeType?: string }
  ): Promise<void> {
    const to = chatIdToDigits(chatId);
    if (!opts.url) {
      throw new Error(
        'Meta Cloud API sendMedia requires a public URL (opts.url). Buffer uploads need the resumable-media API — not wired yet.'
      );
    }
    const kind = this.kindFromMime(opts.mimeType);
    await sendMediaMessage({
      phoneNumberId: this.creds.phoneNumberId,
      accessToken: this.creds.accessToken,
      to,
      kind,
      link: opts.url,
      caption: opts.caption,
      fileName: opts.fileName,
    });
  }

  async sendLocation(
    chatId: string,
    opts: { latitude: number; longitude: number; name?: string; address?: string }
  ): Promise<void> {
    const to = chatIdToDigits(chatId);
    await sendLocationMessage({
      phoneNumberId: this.creds.phoneNumberId,
      accessToken: this.creds.accessToken,
      to,
      latitude: opts.latitude,
      longitude: opts.longitude,
      name: opts.name,
      address: opts.address,
    });
  }

  /** Blue-tick an inbound message (best-effort, never throws). */
  async markInboundRead(wamid: string): Promise<void> {
    try {
      await markMessageRead({
        phoneNumberId: this.creds.phoneNumberId,
        accessToken: this.creds.accessToken,
        messageId: wamid,
      });
    } catch (err: any) {
      logger.warn({ err: err?.message, accountId: this.accountId }, '[Meta] markMessageRead failed (non-fatal)');
    }
  }

  /** Record the latest webhook ping (status heartbeat for the dashboard). */
  touchWebhook(): void {
    this.lastWebhookAt = new Date().toISOString();
  }

  async getStatus(): Promise<{
    status: string;
    provider: typeof META_PROVIDER;
    orgId: string;
    accountId: string;
    phoneNumberId: string;
    wabaId: string | null;
    displayPhone: string | null;
    lastWebhookAt: string | null;
    lastError: string | null;
  }> {
    return {
      status: this.status,
      provider: META_PROVIDER,
      orgId: this.orgId,
      accountId: this.accountId,
      phoneNumberId: this.creds.phoneNumberId,
      wabaId: this.creds.wabaId ?? null,
      displayPhone: this.creds.displayPhone ?? null,
      lastWebhookAt: this.lastWebhookAt,
      lastError: this.lastError,
    };
  }

  /** Cheap status without IO (parity with BaileysWhatsAppAdapter.getStatusSync). */
  getStatusSync(): { status: string; provider: string; orgId: string; accountId: string } {
    return { status: this.status, provider: META_PROVIDER, orgId: this.orgId, accountId: this.accountId };
  }

  private kindFromMime(mime?: string): MediaKind {
    const m = (mime ?? '').toLowerCase();
    if (m.startsWith('image/')) return 'image';
    if (m.startsWith('video/')) return 'video';
    if (m.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private async persistStatus(status: string, lastError?: string): Promise<void> {
    const patch: Record<string, any> = { status };
    if (status === 'connected') patch.last_connected_at = new Date().toISOString();
    if (lastError) patch.last_error = lastError;
    if (this.creds.displayPhone) {
      patch.phone_number = this.creds.displayPhone;
      patch.metadata = { connectedPhone: this.creds.displayPhone };
    }
    try {
      await supabaseAdmin()
        .from('whatsapp_accounts')
        .update(patch)
        .eq('org_id', this.orgId)
        .eq('id', this.accountId);
    } catch (err: any) {
      logger.warn({ err: err?.message, accountId: this.accountId }, '[Meta] failed to persist account status');
    }
  }
}