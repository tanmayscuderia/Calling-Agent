import { FastifyInstance } from 'fastify';
import { listLeads, getLead, updateLead, createLead, getLeadMessages, getLeadCalls, getLeadMatches, createFollowup, listFollowups, getLeadFollowups } from '../crm/leadService';
import { config } from '../config';
import { leadCreateSchema, leadUpdateSchema, followupCreateSchema, parseBody } from '../validation/schemas';

function orgId(req: any): string {
  return (req.query as any).orgId || config.defaultOrgId;
}

export async function leadsRoutes(app: FastifyInstance) {
  app.post('/api/leads', async (req, reply) => {
    const parsed = parseBody(leadCreateSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const lead = await createLead(orgId(req), parsed.data);
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

  app.patch('/api/leads/:id', async (req, reply) => {
    const { id } = req.params as any;
    const parsed = parseBody(leadUpdateSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const lead = await updateLead(orgId(req), id, parsed.data);
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

  app.get('/api/leads/:id/followups', async (req) => {
    const { id } = req.params as any;
    const followups = await getLeadFollowups(orgId(req), id);
    return { followups };
  });

  app.post('/api/leads/:id/followups', async (req, reply) => {
    const { id } = req.params as any;
    const parsed = parseBody(followupCreateSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const followup = await createFollowup(orgId(req), id, parsed.data);
    return { followup };
  });

  app.get('/api/followups', async (req) => {
    const q = req.query as any;
    const followups = await listFollowups(orgId(req), { status: q.status, limit: q.limit ? Number(q.limit) : undefined });
    return { followups };
  });
}
