import { FastifyInstance } from 'fastify';
import { listLeads, getLead, updateLead, createLead, getLeadMessages, getLeadCalls, getLeadMatches, createFollowup, listFollowups } from '../crm/leadService';
import { config } from '../config';

function orgId(req: any): string {
  return (req.query as any).orgId || config.defaultOrgId;
}

export async function leadsRoutes(app: FastifyInstance) {
  app.post('/api/leads', async (req) => {
    const lead = await createLead(orgId(req), req.body as any);
    return { lead };
  });

  app.get('/api/leads', async (req) => {
    const q = req.query as any;
    const leads = await listLeads(orgId(req), { status: q.status, temperature: q.temperature, limit: q.limit ? Number(q.limit) : undefined });
    return { leads };
  });

  app.get('/api/leads/:id', async (req) => {
    const { id } = req.params as any;
    const lead = await getLead(orgId(req), id);
    if (!lead) return { error: 'not found' };
    return { lead };
  });

  app.patch('/api/leads/:id', async (req) => {
    const { id } = req.params as any;
    const lead = await updateLead(orgId(req), id, req.body as any);
    return { lead };
  });

  app.get('/api/leads/:id/messages', async (req) => {
    const { id } = req.params as any;
    const messages = await getLeadMessages(orgId(req), id);
    return { messages };
  });

  app.get('/api/leads/:id/calls', async (req) => {
    const { id } = req.params as any;
    const calls = await getLeadCalls(orgId(req), id);
    return { calls };
  });

  app.get('/api/leads/:id/matches', async (req) => {
    const { id } = req.params as any;
    const matches = await getLeadMatches(orgId(req), id);
    return { matches };
  });

  app.post('/api/leads/:id/followups', async (req) => {
    const { id } = req.params as any;
    const followup = await createFollowup(orgId(req), id, req.body as any);
    return { followup };
  });

  app.get('/api/followups', async (req) => {
    const q = req.query as any;
    const followups = await listFollowups(orgId(req), { status: q.status, limit: q.limit ? Number(q.limit) : undefined });
    return { followups };
  });
}
