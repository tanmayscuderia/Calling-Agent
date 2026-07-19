import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { ParsedWhatsAppMessage } from '../whatsapp/types';
import { config } from '../config';
import { getAccountStatus } from '../whatsapp/whatsappService';
import { BaileysWhatsAppAdapter } from '../whatsapp/baileysClient';
import { handleIncomingMessage } from '../whatsapp/whatsappService';
import { waManager } from '../whatsapp/connectionManager';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../db/supabase';

/**
 * Get the active WhatsApp adapter for an org.
 * Priority:
 *   1. Check waManager for a running adapter for this org
 *   2. Fall back to legacy local singleton (single-account prototype)
 */
async function getAdapter(orgId: string): Promise<BaileysWhatsAppAdapter | null> {
  // Check connection manager first
  const managed = waManager.getAdapterForOrg(orgId);
  if (managed) return managed;

  // Fall back to local singleton (only for default org)
  if (orgId === config.defaultOrgId) return localAdapter;
  return null;
}

// Legacy local singleton for backward compat (default org only)
let localAdapter: BaileysWhatsAppAdapter | null = null;
function getLocalAdapter(): BaileysWhatsAppAdapter {
  if (!localAdapter) {
    localAdapter = new BaileysWhatsAppAdapter(config.defaultOrgId);
    localAdapter.on('message', (parsed) => {
      handleIncomingMessage(
        parsed,
        (chatId, text) => localAdapter!.sendMessage(chatId, text),
        {
          sendMediaFn: (chatId, opts) => localAdapter!.sendMedia(chatId, opts),
        }
      ).catch((e) =>
        logger.error({ e }, 'handleIncomingMessage failed')
      );
    });
  }
  return localAdapter;
}

export async function whatsappRoutes(app: FastifyInstance) {
  app.post('/api/whatsapp/start', async (req, reply) => {
    try {
      const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;

      // Try multi-instance manager first
      let adapter = waManager.getAdapterForOrg(orgId);
      if (!adapter) {
        // Legacy mode: use local singleton
        adapter = getLocalAdapter();
      }

      adapter.start().catch((e) => logger.error({ e }, 'start failed'));
      return { ok: true, message: 'WhatsApp bridge starting. Scan QR in the dashboard.' };
    } catch (e: any) {
      return reply.code(500).send({ error: e?.message });
    }
  });

  app.get('/api/whatsapp/status', async (req) => {
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;

    // Check both managed adapters and local singleton
    const managed = waManager.getAdapterForOrg(orgId);
    const ad = managed
      ? await managed.getStatus()
      : localAdapter
      ? await localAdapter.getStatus()
      : { provider: 'baileys', status: 'disconnected' };

    const account = await getAccountStatus(orgId);
    const cfg = {
      autoReply: config.whatsapp.autoReply,
      ignoreGroups: config.whatsapp.ignoreGroups,
      allowedNumbers: config.whatsapp.allowedNumbers,
      businessName: config.whatsapp.businessName,
    };
    return { adapter: ad, account, config: cfg };
  });

  app.get('/api/whatsapp/chats', async (req) => {
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    let adapter = await getAdapter(orgId);
    if (!adapter && orgId === config.defaultOrgId) {
      adapter = getLocalAdapter();
    }
    if (!adapter) return { chats: [] };
    return { chats: adapter.getChats() };
  });

  app.post('/api/whatsapp/chats/bulk-toggle', async (req, reply) => {
    const { chatIds, monitored } = req.body as any;
    if (!Array.isArray(chatIds) || typeof monitored !== 'boolean') {
      return reply.code(400).send({ error: 'chatIds (array) and monitored (boolean) required' });
    }
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const adapter = await getAdapter(orgId);
    if (!adapter) return reply.code(400).send({ error: 'WhatsApp not started' });
    const result = adapter.bulkToggleMonitor(chatIds, monitored);

    const { error: dbErr } = await supabaseAdmin()
      .from('customer_conversations')
      .update({ ai_enabled: monitored })
      .eq('org_id', orgId)
      .eq('channel', 'whatsapp')
      .in('external_chat_id', chatIds);

    if (dbErr) {
      logger.warn({ dbErr, count: chatIds.length, monitored }, '[bulk-toggle] DB sync failed');
    } else {
      logger.info({ count: chatIds.length, monitored }, '[bulk-toggle] DB ai_enabled synced');
    }

    return { ok: true, ...result };
  });

  app.post('/api/whatsapp/chats/:chatId/toggle', async (req, reply) => {
    const { chatId } = req.params as any;
    if (!chatId) return reply.code(400).send({ error: 'chatId required' });
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const adapter = await getAdapter(orgId);
    if (!adapter) return reply.code(400).send({ error: 'WhatsApp not started' });
    const monitored = adapter.toggleChatMonitor(chatId);

    const { error: dbErr } = await supabaseAdmin()
      .from('customer_conversations')
      .update({ ai_enabled: monitored })
      .eq('org_id', orgId)
      .eq('channel', 'whatsapp')
      .eq('external_chat_id', chatId);

    if (dbErr) {
      logger.warn({ dbErr, chatId, monitored }, '[toggle] DB sync failed');
    } else {
      logger.info({ chatId, monitored }, '[toggle] DB ai_enabled synced');
    }

    return { chatId, monitored };
  });

  app.post('/api/whatsapp/stop', async (req) => {
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const adapter = await getAdapter(orgId);
    if (adapter) {
      await adapter.stop();
    }
    return { ok: true };
  });

  /**
   * Force-resync contacts and chats from WhatsApp.
   * Re-fetches groups and requests a fresh history sync.
   * Use this when the chat list looks empty or incomplete.
   */
  app.post('/api/whatsapp/resync-contacts', async (req, reply) => {
    try {
      const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
      const adapter = await getAdapter(orgId);
      if (!adapter) return reply.code(400).send({ error: 'WhatsApp not started' });
      const result = await adapter.resyncContacts();
      return result;
    } catch (e: any) {
      return reply.code(500).send({ error: e?.message });
    }
  });

  app.post('/api/whatsapp/relink', async (req, reply) => {
    try {
      const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
      const adapter = await getAdapter(orgId);
      if (!adapter) return reply.code(400).send({ error: 'WhatsApp not started' });
      adapter.relink().catch((e) => logger.error({ e }, 'relink failed'));
      return { ok: true, message: 'Re-linking: old session cleared, generating new QR code.' };
    } catch (e: any) {
      return reply.code(500).send({ error: e?.message });
    }
  });

  /**
   * SIMULATOR: Inject an inbound message into the AI pipeline as if a customer sent it.
   * Creates a lead, runs the AI agent, saves conversation, and optionally delivers
   * the AI reply to a real WhatsApp chatId (your phone) via Baileys.
   */
  app.post('/api/whatsapp/simulate', async (req, reply) => {
    const { text, phone, deliverToChatId } = req.body as any;
    if (!text || typeof text !== 'string') {
      return reply.code(400).send({ error: 'text (string) required' });
    }

    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const customerPhone = phone?.trim() || '919999999999';
    const chatId = `${customerPhone}@s.whatsapp.net`;

    logger.info({ text, customerPhone, deliverToChatId, orgId }, 'SIMULATOR: injecting inbound message');

    const parsed: ParsedWhatsAppMessage = {
      externalMessageId: `sim_${randomUUID()}`,
      chatId,
      senderId: customerPhone,
      senderPhone: customerPhone,
      isGroup: false,
      text,
      messageType: 'text',
      raw: { simulated: true, source: 'dashboard_simulator' },
      receivedAt: new Date().toISOString(),
    };

    const activeAdapter = await getAdapter(orgId);
    const sendFn = activeAdapter
      ? (cid: string, msg: string) => activeAdapter.sendMessage(cid, msg)
      : async (_cid: string, _msg: string) => {
          logger.warn('WhatsApp adapter not connected; reply not delivered');
        };

    try {
      const result = await handleIncomingMessage(parsed, sendFn, {
        deliverToChatId: deliverToChatId || undefined,
        skipDelivery: !deliverToChatId,
        orgId,
      });
      return {
        ok: true,
        reply: result.reply,
        quickReplies: result.quickReplies,
        leadId: result.leadId,
        conversationId: result.conversationId,
        delivered: !!deliverToChatId,
        customerPhone,
      };
    } catch (e: any) {
      logger.error({ e }, 'SIMULATOR: handleIncomingMessage failed');
      return reply.code(500).send({ error: e?.message });
    }
  });

  app.post('/api/whatsapp/send', async (req, reply) => {
    const { chatId, text } = req.body as any;
    if (!chatId || !text) return reply.code(400).send({ error: 'chatId and text required' });
    try {
      const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
      const adapter = await getAdapter(orgId);
      if (!adapter) return reply.code(400).send({ error: 'WhatsApp not connected' });
      await adapter.sendMessage(chatId, text);
      return { ok: true };
    } catch (e: any) {
      return reply.code(500).send({ error: e?.message });
    }
  });

  /**
   * DIAGNOSTIC: Check conversation state by phone number.
   * Helps debug why a number isn't getting replies.
   * Usage: GET /api/whatsapp/debug/919028163126
   */
  app.get('/api/whatsapp/debug/:phone', async (req, reply) => {
    const { phone } = req.params as any;
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const chatId = `${cleanPhone}@s.whatsapp.net`;

    // Lead lookup
    const { data: lead } = await supabaseAdmin()
      .from('crm_leads')
      .select('*')
      .eq('org_id', orgId)
      .or(`phone.eq.+${cleanPhone},whatsapp_number.eq.+${cleanPhone}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Conversation lookup
    const { data: conversation } = await supabaseAdmin()
      .from('customer_conversations')
      .select('*')
      .eq('org_id', orgId)
      .eq('channel', 'whatsapp')
      .eq('external_chat_id', chatId)
      .maybeSingle();

    // Recent messages
    let recentMessages: any[] = [];
    if (conversation) {
      const { data: msgs } = await supabaseAdmin()
        .from('customer_messages')
        .select('id, direction, body, ai_generated, sent_at, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(5);
      recentMessages = msgs || [];
    }

    // Jobs for this conversation
    let stuckJobs: any[] = [];
    if (conversation) {
      const { data: jobs } = await supabaseAdmin()
        .from('job_queue')
        .select('id, job_type, status, attempts, error, created_at, next_retry_at')
        .eq('org_id', orgId)
        .eq('payload->>conversationId', conversation.id)
        .order('created_at', { ascending: false })
        .limit(5);
      stuckJobs = jobs || [];
    }

    // Diagnosis
    const diagnosis: string[] = [];
    if (!conversation) {
      diagnosis.push('No conversation found. The number may never have messaged, or phone format is wrong.');
    } else {
      if (conversation.status === 'blocked') diagnosis.push('Conversation is BLOCKED.');
      if (!conversation.ai_enabled) diagnosis.push('AI is DISABLED (ai_enabled=false). Enable it to resume replies.');
      if (conversation.human_handoff) diagnosis.push('human_handoff=true (should be auto-cleared on next message).');
      if (conversation.status === 'pending_human') diagnosis.push('status=pending_human (should be auto-cleared on next message).');

      const lastOutbound = recentMessages.find((m) => m.direction === 'outbound');
      if (!lastOutbound) diagnosis.push('No outbound messages ever sent. Bot may have never replied.');
    }

    if (stuckJobs.some((j) => j.status === 'processing')) {
      diagnosis.push('Jobs stuck in "processing" state. Worker may have crashed. Restart backend or /api/system/queue/recover.');
    }
    if (stuckJobs.some((j) => j.status === 'failed')) {
      diagnosis.push('Some jobs FAILED. Check error field.');
    }

    if (diagnosis.length === 0) {
      diagnosis.push('Everything looks normal. Check backend logs for LLM errors.');
    }

    return {
      phone: cleanPhone,
      chatId,
      lead,
      conversation: conversation
        ? {
            id: conversation.id,
            status: conversation.status,
            ai_enabled: conversation.ai_enabled,
            human_handoff: conversation.human_handoff,
            last_message_at: conversation.last_message_at,
            last_inbound_at: conversation.last_inbound_at,
            last_outbound_at: conversation.last_outbound_at,
          }
        : null,
      recentMessages,
      stuckJobs,
      diagnosis,
    };
  });

  /**
   * DIAGNOSTIC: Force-unblock a conversation by phone number.
   * Clears human_handoff, sets status=open, re-enables AI.
   * Usage: POST /api/whatsapp/debug/:phone/unblock
   */
  app.post('/api/whatsapp/debug/:phone/unblock', async (req, reply) => {
    const { phone } = req.params as any;
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const chatId = `${cleanPhone}@s.whatsapp.net`;

    const { data, error } = await supabaseAdmin()
      .from('customer_conversations')
      .update({
        ai_enabled: true,
        human_handoff: false,
        status: 'open',
      })
      .eq('org_id', orgId)
      .eq('channel', 'whatsapp')
      .eq('external_chat_id', chatId)
      .select('id, status, ai_enabled, human_handoff');

    if (error) return reply.code(500).send({ error: error.message });
    if (!data || data.length === 0) {
      return reply.code(404).send({ error: 'No conversation found for this phone number.' });
    }

    logger.info({ phone: cleanPhone, chatId, updated: data[0] }, '[Debug] Conversation force-unblocked');
    return {
      ok: true,
      conversation: data[0],
      message: 'Conversation unblocked. Next message from this number will get an AI reply.',
    };
  });
}