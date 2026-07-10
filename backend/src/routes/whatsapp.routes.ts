import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { ParsedWhatsAppMessage } from '../whatsapp/types';
import { config } from '../config';
import { getAccountStatus } from '../whatsapp/whatsappService';
import { BaileysWhatsAppAdapter } from '../whatsapp/baileysClient';
import { handleIncomingMessage } from '../whatsapp/whatsappService';
import { waManager } from '../whatsapp/connectionManager';
import { logger } from '../utils/logger';

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
    // FIX: Eagerly init adapter so chats load from disk even before WhatsApp reconnects.
    // getAdapter() checks managed + local singleton; if both null, fall through to getLocalAdapter()
    // which constructs the adapter (loading chat-store.json from disk in the constructor).
    let adapter = await getAdapter(orgId);
    if (!adapter && orgId === config.defaultOrgId) {
      adapter = getLocalAdapter(); // constructor calls loadFromDisk() — restores all chats
    }
    if (!adapter) return { chats: [] };
    return { chats: adapter.getChats() };
  });

  // IMPORTANT: bulk-toggle must be registered BEFORE :chatId/toggle,
  // otherwise Fastify matches "bulk-toggle" as the :chatId param.
  app.post('/api/whatsapp/chats/bulk-toggle', async (req, reply) => {
    const { chatIds, monitored } = req.body as any;
    if (!Array.isArray(chatIds) || typeof monitored !== 'boolean') {
      return reply.code(400).send({ error: 'chatIds (array) and monitored (boolean) required' });
    }
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const adapter = await getAdapter(orgId);
    if (!adapter) return reply.code(400).send({ error: 'WhatsApp not started' });
    const result = adapter.bulkToggleMonitor(chatIds, monitored);
    return { ok: true, ...result };
  });

  app.post('/api/whatsapp/chats/:chatId/toggle', async (req, reply) => {
    const { chatId } = req.params as any;
    if (!chatId) return reply.code(400).send({ error: 'chatId required' });
    const orgId = (req as any).getOrgId?.() ?? config.defaultOrgId;
    const adapter = await getAdapter(orgId);
    if (!adapter) return reply.code(400).send({ error: 'WhatsApp not started' });
    const monitored = adapter.toggleChatMonitor(chatId);
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
   *
   * Body: { text: string, phone?: string, deliverToChatId?: string }
   *
   * - phone: fake customer phone (default: 919999999999)
   * - deliverToChatId: your real WhatsApp JID to receive the reply (e.g. 917895387978@s.whatsapp.net)
   * - text: the customer message
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
}