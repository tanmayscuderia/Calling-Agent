import { BaileysWhatsAppAdapter, WhatsAppChat } from './baileysClient';
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';
import { enqueueIncomingMessage } from './whatsappService';
import { ParsedWhatsAppMessage } from './types';

/**
 * WhatsApp Connection Manager — manages N concurrent Baileys connections.
 *
 * Each whatsapp_accounts row in DB = one live connection.
 * On server boot, auto-starts all accounts with status='connected'.
 * Incoming messages are routed to the correct org pipeline.
 *
 * Memory: ~30-50MB per connection. 20 connections ≈ 1GB.
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
      const { data: accounts, error } = await sb.from('whatsapp_accounts')
        .select('id, org_id, label, session_dir, phone_number')
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
    const adapter = this.adapters.get(accountId);
    if (!adapter) throw new Error(`WhatsApp account ${accountId} is not connected`);
    await adapter.sendMessage(chatId, text);
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