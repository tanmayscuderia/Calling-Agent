import { FastifyInstance } from 'fastify';
import { listConversations, getConversation, listMessages, insertMessage, updateConversation } from '../crm/conversationService';
import { config } from '../config';

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
    const conversation = await updateConversation(orgId(req), id, req.body as any);
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