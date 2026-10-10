import { FastifyInstance } from 'fastify';
import { listLeads, getLead, updateLead, createLead, getLeadMessages, getLeadCalls, getLeadMatches, createFollowup, listFollowups, updateFollowup, getFollowupAnalytics, getLeadFollowups } from '../crm/leadService';
import { config } from '../config';
import { leadCreateSchema, leadUpdateSchema, followupCreateSchema, followupUpdateSchema, followupQuerySchema, parseBody } from '../validation/schemas';
import { z } from 'zod';

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
    const leads = await listLeads(orgId(req), { status: q.status, temperature: q.temperature, limit: q.limit ? Number(q.limit) : undefined, search: q.search });
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

  // ── Tasks panel (upgraded follow-ups) ──

  app.get('/api/followups', async (req) => {
    const q = followupQuerySchema.parse((req.query as any) ?? {});
    const followups = await listFollowups(orgId(req), {
      status: q.status,
      limit: q.limit ? Number(q.limit) : undefined,
      assigneeId: q.assigneeId,
      leadId: q.leadId,
      type: q.type,
      source: q.source,
      priority: q.priority,
      dueFrom: q.dueFrom,
      dueTo: q.dueTo,
      search: q.search,
    });
    return { followups };
  });

  // Standalone task creation (lead picked in the modal rather than from a lead page)
  app.post('/api/followups', async (req, reply) => {
    const parsed = parseBody(followupCreateSchema.extend({ leadId: z.string().uuid() }), req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const { leadId, ...data } = parsed.data as any;
    const followup = await createFollowup(orgId(req), leadId, data);
    return { followup };
  });

  app.patch('/api/followups/:id', async (req, reply) => {
    const { id } = req.params as any;
    const parsed = parseBody(followupUpdateSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const followup = await updateFollowup(orgId(req), id, parsed.data);
    return { followup };
  });

  app.get('/api/followups/analytics', async (req) => {
    const analytics = await getFollowupAnalytics(orgId(req));
    return { ok: true, analytics };
  });
}
