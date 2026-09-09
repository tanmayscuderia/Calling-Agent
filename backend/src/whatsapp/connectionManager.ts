import { BaileysWhatsAppAdapter, WhatsAppChat } from './baileysClient';
import {
  MetaCloudWhatsAppAdapter,
  META_PROVIDER,
} from './metaCloudClient';
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';
import { enqueueIncomingMessage } from './whatsappService';
import { ParsedWhatsAppMessage, MessagingAdapter } from './types';

/**
 * WhatsApp Connection Manager — manages N concurrent WhatsApp connections.
 *
 * Provider-aware (dual-provider architecture):
 *   - baileys rows       → one live BaileysWhatsAppAdapter per account,
 *                          held in memory (stateful socket, ~30-50MB each).
 *   - meta_cloud_api rows → NO in-memory object is required. Inbound
 *                          arrives via the signed webhook route; replies
 *                          are sent by constructing a stateless
 *                          MetaCloudWhatsAppAdapter on demand
 *                          (see resolveAdapter).
 *
 * On server boot, auto-starts all connected BAILEYS accounts.
 * Incoming messages are routed to the correct org pipeline regardless
 * of provider.
 */
class WhatsAppConnectionManager {
  private adapters: Map<string, BaileysWhatsAppAdapter> = new Map(); // accountId → adapter
  private booted = false;

  /**
   * Boot all connected WhatsApp accounts on server start.
   * Called once from server.ts.
   */
  async bootAll(): Promise<void> {
    if (this.booted) return;
    this.booted = true;

    try {
      const sb = supabaseAdmin();
      // Only BAILEYS accounts need booting — meta_cloud_api accounts are
      // stateless (webhook-driven) and require no in-process connection.
      const { data: accounts, error } = await sb.from('whatsapp_accounts')
        .select('id, org_id, label, session_dir, phone_number')
        .eq('provider', 'baileys')
        .eq('status', 'connected')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!accounts || accounts.length === 0) {
        logger.info('[WA-Manager] No connected WhatsApp accounts to boot');
        return;
      }

      logger.info({ count: accounts.length }, '[WA-Manager] Booting connected WhatsApp accounts...');

      // Boot sequentially to avoid hammering the DB / filesystem
      for (const account of accounts) {
        try {
          await this.startAccount(account.id, account.org_id, account.session_dir);
        } catch (err) {
          logger.error({ err, accountId: account.id, label: account.label }, '[WA-Manager] Failed to boot account');
        }
      }

      logger.info({ active: this.adapters.size }, '[WA-Manager] Boot complete');
    } catch (err) {
      logger.error({ err }, '[WA-Manager] bootAll failed');
    }
  }

  /**
   * Start a specific WhatsApp account connection.
   */
  async startAccount(accountId: string, orgId: string, sessionDir?: string): Promise<BaileysWhatsAppAdapter> {
    // Already running?
    const existing = this.adapters.get(accountId);
    if (existing) return existing;

    const dir = sessionDir || this.getAccountSessionDir(accountId);
    const adapter = new BaileysWhatsAppAdapter(orgId, dir);

    // Wire incoming messages to the org's async AI pipeline
    // Uses enqueueIncomingMessage (fast path) so Baileys never blocks on AI processing.
    // The queue worker handles: AI agent → save → send reply
    adapter.on('message', (parsed: ParsedWhatsAppMessage) => {
      enqueueIncomingMessage(parsed, orgId, accountId).catch((err) => {
        logger.error({ err, orgId, accountId, chatId: parsed.chatId }, '[WA-Manager] Enqueue failed');
      });
    });

    adapter.on('connected', (phone: string) => {
      logger.info({ accountId, orgId, phone }, '[WA-Manager] Account connected');
    });

    this.adapters.set(accountId, adapter);

    // Start asynchronously (QR generation takes time)
    adapter.start().catch((err) => {
      logger.error({ err, accountId }, '[WA-Manager] Adapter start failed');
      this.adapters.delete(accountId);
    });

    return adapter;
  }

  /**
   * Stop a specific account.
   */
  async stopAccount(accountId: string): Promise<void> {
    const adapter = this.adapters.get(accountId);
    if (!adapter) return;
    await adapter.stop();
    this.adapters.delete(accountId);
    logger.info({ accountId }, '[WA-Manager] Account stopped');
  }

  /**
   * Get adapter for a specific account.
   */
  getAdapter(accountId: string): BaileysWhatsAppAdapter | null {
    return this.adapters.get(accountId) || null;
  }

  /**
   * Get the FIRST adapter for an org (backward compat for single-account routes).
   */
  getAdapterForOrg(orgId: string): BaileysWhatsAppAdapter | null {
    // Fast path: check if any adapter's orgId matches
    // We store orgId on the adapter via constructor, but we need a lookup map.
    // For now, query DB for the org's connected account.
    for (const [, adapter] of this.adapters) {
      const status = adapter.getStatusSync();
      if (status.orgId === orgId) return adapter;
    }
    return null;
  }

  /**
   * Get status of a specific account.
   */
  async getStatus(accountId: string): Promise<any> {
    const adapter = this.adapters.get(accountId);
    if (!adapter) return { status: 'disconnected', provider: 'baileys' };
    return adapter.getStatus();
  }

  /**
   * Get status of all accounts for an org.
   */
  async getStatusForOrg(orgId: string): Promise<any[]> {
    const sb = supabaseAdmin();
    const { data: accounts } = await sb.from('whatsapp_accounts')
      .select('id, label, phone_number, status, provider, owned_by_member_id, last_connected_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (!accounts) return [];

    // Enrich with live adapter status
    return accounts.map((acc: any) => {
      const adapter = this.adapters.get(acc.id);
      return {
        ...acc,
        live: adapter ? adapter.getStatusSync() : null,
      };
    });
  }

  /**
   * Create a new WhatsApp account record + start it.
   */
  async createAccount(orgId: string, label: string, ownedByMemberId?: string): Promise<string> {
    const sb = supabaseAdmin();
    const sessionId = crypto.randomUUID();
    const sessionDir = `${config.whatsapp.sessionDir}/${sessionId}`;

    const { data, error } = await sb.from('whatsapp_accounts')
      .insert({
        org_id: orgId,
        label,
        provider: 'baileys',
        status: 'disconnected',
        session_dir: sessionDir,
        owned_by_member_id: ownedByMemberId || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Start the adapter
    await this.startAccount(data.id, orgId, sessionDir);
    return data.id;
  }

  /**
   * Send a message through a specific account.
   */
  async sendMessage(accountId: string, chatId: string, text: string): Promise<void> {
    const adapter = await this.resolveAdapter(accountId);
    if (!adapter) throw new Error(`WhatsApp account ${accountId} is not connected`);
    await adapter.sendMessage(chatId, text);
  }

  /**
   * Provider-aware adapter resolution — the single lookup the queue
   * worker and routes should use.
   *
   *   1. baileys: live adapter from the in-memory map
   *   2. meta_cloud_api: stateless MetaCloudWhatsAppAdapter constructed
   *      from the account row (decrypts secrets; cheap — no IO to Meta)
   *   3. anything else / disconnected → null
   */
  async resolveAdapter(accountId: string): Promise<MessagingAdapter | null> {
    // 1) Live Baileys socket?
    const live = this.adapters.get(accountId);
    if (live) return live;

    // 2) Stateless Meta account?
    try {
      const { data: row } = await supabaseAdmin()
        .from('whatsapp_accounts')
        .select('id, org_id, provider, status, config')
        .eq('id', accountId)
        .maybeSingle();
      if (!row) return null;
      if (row.provider === META_PROVIDER) {
        if (row.status !== 'connected') return null;
        return MetaCloudWhatsAppAdapter.fromAccountRow(row);
      }
      // Baileys row without a live adapter → genuinely disconnected.
      return null;
    } catch (err: any) {
      logger.error({ err: err?.message, accountId }, '[WA-Manager] resolveAdapter failed');
      return null;
    }
  }

  /**
   * Look up the connected account for an org and return a provider-
   * aware adapter (meta accounts work even with no in-memory state).
   */
  async resolveAdapterForOrg(orgId: string): Promise<MessagingAdapter | null> {
    // Live Baileys socket for this org?
    const live = this.getAdapterForOrg(orgId);
    if (live) return live;

    // Newest connected account of any provider.
    try {
      const { data: row } = await supabaseAdmin()
        .from('whatsapp_accounts')
        .select('id, org_id, provider, status, config')
        .eq('org_id', orgId)
        .eq('status', 'connected')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!row) return null;
      if (row.provider === META_PROVIDER) {
        return MetaCloudWhatsAppAdapter.fromAccountRow(row);
      }
      return null;
    } catch (err: any) {
      logger.error({ err: err?.message, orgId }, '[WA-Manager] resolveAdapterForOrg failed');
      return null;
    }
  }

  /**
   * Unified AI-toggle sync (Phase 4): when a conversation's ai_enabled
   * flips from ANY surface, keep the Baileys monitor set in sync so the
   * WhatsApp page and Conversations page always show one state per number.
   */
  async setChatMonitorState(orgId: string, chatId: string, monitored: boolean): Promise<void> {
    for (const [, adapter] of this.adapters) {
      const status = adapter.getStatusSync?.();
      if (status?.orgId !== orgId) continue;
      if (typeof (adapter as any).setChatMonitored === 'function') {
        (adapter as any).setChatMonitored(chatId, monitored);
      }
    }
  }

  /**
   * Create a Meta Cloud API account row (credentials already verified
   * and encrypted by the caller — routes/whatsappMeta.routes.ts) and
   * return its id. Unlike createAccount, nothing is booted: Meta
   * accounts are webhook-driven.
   */
  async createMetaAccount(
    orgId: string,
    label: string,
    creds: {
      phoneNumberId: string;
      wabaId?: string;
      /** ENCRYPTED accessToken (utils/metaEncryption.encrypt). */
      encryptedAccessToken: string;
      /** ENCRYPTED webhook verify token. */
      encryptedVerifyToken?: string;
      /** ENCRYPTED 6-digit 2FA PIN. */
      encryptedPin?: string;
      displayPhone?: string;
    },
    ownedByMemberId?: string
  ): Promise<string> {
    const sb = supabaseAdmin();
    const configJson: Record<string, any> = {
      phoneNumberId: creds.phoneNumberId,
      accessToken: creds.encryptedAccessToken,
      displayPhone: creds.displayPhone,
    };
    if (creds.wabaId) configJson.wabaId = creds.wabaId;
    if (creds.encryptedVerifyToken) configJson.verifyToken = creds.encryptedVerifyToken;
    if (creds.encryptedPin) configJson.pin = creds.encryptedPin;

    const { data, error } = await sb.from('whatsapp_accounts')
      .insert({
        org_id: orgId,
        label,
        provider: META_PROVIDER,
        status: 'connected',
        phone_number_id: creds.phoneNumberId,
        waba_id: creds.wabaId ?? null,
        phone_number: creds.displayPhone ?? null,
        config: configJson,
        metadata: creds.displayPhone ? { connectedPhone: creds.displayPhone } : {},
        owned_by_member_id: ownedByMemberId || null,
      })
      .select('id')
      .single();

    if (error) throw error;
    logger.info({ accountId: data.id, orgId, phoneNumberId: creds.phoneNumberId }, '[WA-Manager] Meta Cloud API account created');
    return data.id;
  }

  /**
   * Get chats for a specific account.
   */
  getChats(accountId: string): WhatsAppChat[] {
    const adapter = this.adapters.get(accountId);
    if (!adapter) return [];
    return adapter.getChats();
  }

  /**
   * Toggle chat monitoring for a specific account.
   */
  toggleChatMonitor(accountId: string, chatId: string): boolean | null {
    const adapter = this.adapters.get(accountId);
    if (!adapter) return null;
    return adapter.toggleChatMonitor(chatId);
  }

  /**
   * Total number of active connections.
   */
  size(): number {
    return this.adapters.size;
  }

  /**
   * Compute per-account session directory.
   */
  private getAccountSessionDir(accountId: string): string {
    return `${config.whatsapp.sessionDir}/${accountId}`;
  }
}

// Singleton
export const waManager = new WhatsAppConnectionManager();