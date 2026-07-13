import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { llm } from '../ai/llmClient';
import { respondToMessage } from '../ai/baseAgent';
import { supabaseAdmin } from '../db/supabase';

function orgId(req: any): string {
  return (req.query as any).orgId || config.defaultOrgId;
}

export async function aiRoutes(app: FastifyInstance) {
  // Check LLM config
  app.get('/api/ai/status', async () => {
    return {
      provider: config.llm.provider,
      model: llm.activeModel,
      configured: llm.isConfigured(),
    };
  });

  // Manual simulate: test the agent with text without WhatsApp
  app.post('/api/ai/simulate', async (req, reply) => {
    const { text, leadId, history } = req.body as any;
    const oid = orgId(req);
    if (!text) return reply.code(400).send({ error: 'text required' });

    const lead = leadId
      ? await supabaseAdmin().from('crm_leads').select('*').eq('org_id', oid).eq('id', leadId).maybeSingle().then((r) => r.data)
      : { full_name: null, preferred_city: null, preferred_sector: null, configuration: null, budget_min: null, budget_max: null, preferred_location: null, possession_preference: null };

    // Accept conversation history from the frontend (Playground) so the agent has full context.
    // Each item: { role: 'user' | 'assistant', text: string }
    const recentMessages: { direction: string; body: string }[] = Array.isArray(history)
      ? history
          .filter((h: any) => h && h.text && h.text.trim())
          .slice(-12)
          .map((h: any) => ({
            direction: h.role === 'user' ? 'inbound' : 'outbound',
            body: h.text,
          }))
      : [];

    const result = await respondToMessage({
      orgId: oid,
      lead: lead ?? {},
      conversation: {},
      inboundText: text,
      recentMessages,
    });

    return { reply: result.reply, extractedData: result.extractedData, matchedProperties: result.matchedProperties, leadUpdates: result.leadUpdates };
  });
}