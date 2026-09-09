import { FastifyInstance } from 'fastify';
import { listConversations, getConversation, listMessages, insertMessage, updateConversation } from '../crm/conversationService';
import { config } from '../config';
import { logger } from '../utils/logger';
import { waManager } from '../whatsapp/connectionManager';

function orgId(req: any): string {
  return (req.query as any).orgId || config.defaultOrgId;
}

export async function conversationsRoutes(app: FastifyInstance) {
  app.get('/api/conversations', async (req) => {
    const conversations = await listConversations(orgId(req));
    return { conversations };
  });

  app.get('/api/conversations/:id', async (req) => {
    const { id } = req.params as any;
    const conversation = await getConversation(orgId(req), id);
    if (!conversation) return { error: 'not found' };
    const messages = await listMessages(orgId(req), id);
    return { conversation, messages };
  });

  app.patch('/api/conversations/:id', async (req) => {
    const { id } = req.params as any;
    const body = (req.body ?? {}) as any;
    const conversation = await updateConversation(orgId(req), id, body) as any;
    // ── Unified AI-toggle sync (Phase 4) ──
    // ai_enabled flipped from the Conversations page → mirror it into the
    // Baileys bridge monitor set so the WhatsApp page shows the same state.
    if (conversation?.external_chat_id && typeof body.ai_enabled === 'boolean') {
      await waManager
        .setChatMonitorState(orgId(req), conversation.external_chat_id, body.ai_enabled)
        .catch((e) => logger.warn({ e: e?.message, chatId: conversation.external_chat_id }, '[conv-toggle] bridge sync failed'));
    }
    return { conversation };
  });

  app.post('/api/conversations/:id/send', async (req) => {
    const { id } = req.params as any;
    const body = (req.body as any)?.text ?? '';
    const conversation = await getConversation(orgId(req), id);
    const msg = await insertMessage({
      orgId: orgId(req),
      conversationId: id,
      leadId: conversation?.lead_id ?? null,
      direction: 'outbound',
      body,
      aiGenerated: false,
    });
    return { message: msg };
  });

  app.post('/api/conversations/:id/handoff', async (req) => {
    const { id } = req.params as any;
    const body = req.body as any;
    const conversation = await updateConversation(orgId(req), id, {
      human_handoff: body?.humanHandoff ?? true,
      ai_enabled: body?.aiEnabled ?? false,
      status: body?.humanHandoff ? 'pending_human' : 'open',
    });
    return { conversation };
  });
}