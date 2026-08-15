import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { getLead, updateLead, createFollowup } from '../crm/leadService';
import { generateAgentReply, summarizeCall, openingLine, CallTurn } from '../ai/callAgent';
import { createOutboundCall, isSarvamConfigured, buildWebhookUrl } from '../sarvam/sarvamClient';
import { normalizePhone } from '../utils/phone';
import { logger } from '../utils/logger';

function orgId(req: any): string {
  return (req.query as any).orgId || config.defaultOrgId;
}

async function getTurns(callSessionId: string): Promise<CallTurn[]> {
  const { data } = await supabaseAdmin()
    .from('call_session_turns')
    .select('speaker, text, sequence_index')
    .eq('call_session_id', callSessionId)
    .order('sequence_index', { ascending: true });
  return (data ?? []).map((t) => ({ speaker: t.speaker, text: t.text }));
}

async function addTurn(callSessionId: string, orgId: string, speaker: 'agent' | 'customer' | 'system', text: string): Promise<void> {
  const { data: last } = await supabaseAdmin()
    .from('call_session_turns')
    .select('sequence_index')
    .eq('call_session_id', callSessionId)
    .order('sequence_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const seq = (last?.sequence_index ?? -1) + 1;
  await supabaseAdmin().from('call_session_turns').insert({
    org_id: orgId,
    call_session_id: callSessionId,
    speaker,
    text,
    sequence_index: seq,
  });
}

export async function callsRoutes(app: FastifyInstance) {
  // Start a browser demo call for a lead
  app.post('/api/calls/start-demo', async (req, reply) => {
    const { leadId } = req.body as any;
    const oid = orgId(req);
    if (!leadId) return reply.code(400).send({ error: 'leadId required' });

    const lead = await getLead(oid, leadId);
    if (!lead) return reply.code(404).send({ error: 'lead not found' });

    const { data: call, error } = await supabaseAdmin()
      .from('call_sessions')
      .insert({
        org_id: oid,
        lead_id: leadId,
        provider: 'browser_demo',
        direction: 'outbound',
        status: 'in_progress',
        from_number: 'demo',
        to_number: lead.phone ?? null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) return reply.code(500).send({ error: error.message });

    // Insert opening agent turn
    const opening = await openingLine(oid);
    await addTurn(call.id, oid, 'agent', opening);

    return { callSessionId: call.id, openingLine: opening };
  });

  // Process a customer turn and get agent reply
  app.post('/api/calls/:id/turn', async (req, reply) => {
    const { id } = req.params as any;
    const { speaker, text } = req.body as any;
    const oid = orgId(req);

    if (!text) return reply.code(400).send({ error: 'text required' });

    // Save customer turn
    await addTurn(id, oid, (speaker as any) || 'customer', text);

    const turns = await getTurns(id);
    const { data: call } = await supabaseAdmin()
      .from('call_sessions')
      .select('lead_id')
      .eq('id', id)
      .maybeSingle();
    const lead = call?.lead_id ? await getLead(oid, call.lead_id) : null;

    // Generate agent reply
    const result = await generateAgentReply(lead ?? {}, turns, oid);
    await addTurn(id, oid, 'agent', result.reply);

    return { agentReply: result.reply, callSessionId: id, model: result.model, latencyMs: result.latencyMs };
  });

  // End the call — generate summary
  app.post('/api/calls/:id/end', async (req, reply) => {
    const { id } = req.params as any;
    const oid = orgId(req);

    const turns = await getTurns(id);
    const summary = await summarizeCall(turns, oid);

    const transcript = turns.map((t) => `${t.speaker === 'agent' ? 'Agent' : 'Customer'}: ${t.text}`).join('\n');

    const { data: call } = await supabaseAdmin()
      .from('call_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        transcript,
        summary: summary.data?.summary ?? null,
        outcome: summary.data?.outcome ?? null,
      })
      .eq('id', id)
      .select()
      .single();

    // Update lead with outcome
    if (call?.lead_id && summary.data) {
      const leadPatch: Record<string, any> = {};
      if (summary.data.lead_temperature) leadPatch.temperature = summary.data.lead_temperature;
      if (summary.data.updated_preferences) {
        Object.assign(leadPatch, summary.data.updated_preferences);
      }
      if (Object.keys(leadPatch).length) {
        await updateLead(oid, call.lead_id, leadPatch).catch(() => {});
      }
      // Create follow-up if requested
      if (summary.data.outcome === 'callback_requested' || summary.data.outcome === 'site_visit_requested') {
        await createFollowup(oid, call.lead_id, {
          type: summary.data.outcome === 'site_visit_requested' ? 'site_visit' : 'call',
          title: summary.data.outcome === 'site_visit_requested' ? 'Site visit requested' : 'Callback requested',
          notes: summary.data?.summary ?? '',
          scheduled_at: summary.data?.next_follow_up_at ?? null,
          status: 'pending',
        }).catch(() => {});
      }
    }

    return { callSessionId: id, summary: summary.data };
  });

  // Start a REAL outbound call via Sarvam Voice Agents
  // Plan: docs/SARVAM_CALLING_PLAN.md (Phase S3)
  app.post('/api/calls/start-real', async (req, reply) => {
    const { leadId } = req.body as any;
    const oid = orgId(req);
    if (!leadId) return reply.code(400).send({ error: 'leadId required' });

    // 1. Config guard — clean 503 when Sarvam isn't set up
    if (!isSarvamConfigured()) {
      return reply.code(503).send({
        error: 'Sarvam not configured. Set SARVAM_API_KEY, SARVAM_ORG_ID, SARVAM_WORKSPACE_ID, SARVAM_APP_ID (+ optionally telephony vars) in .env',
      });
    }

    // 2. Load lead + validate phone (E.164 required by Sarvam)
    const lead = await getLead(oid, leadId);
    if (!lead) return reply.code(404).send({ error: 'lead not found' });

    const phone = lead.phone ? normalizePhone(lead.phone) : null;
    if (!phone || !/^\+?[1-9]\d{7,14}$/.test(phone)) {
      return reply.code(400).send({ error: 'lead has no valid phone number', leadPhone: lead.phone });
    }

    // 3. Create the call_session row FIRST (status 'ringing') — if Sarvam
    //    accepts we patch in attempt_id; if it fails we mark the row failed.
    const { data: call, error: insertErr } = await supabaseAdmin()
      .from('call_sessions')
      .insert({
        org_id: oid,
        lead_id: leadId,
        provider: 'sarvam',
        direction: 'outbound',
        status: 'ringing',
        to_number: phone,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (insertErr) return reply.code(500).send({ error: insertErr.message });

    // 4. Trigger the call via Sarvam Instant Outbound
    const result = await createOutboundCall({
      userPhoneNumber: phone,
      webhookUrl: buildWebhookUrl(),
      metadata: { orgId: oid, callSessionId: call.id, leadId },
    });

    if (!result) {
      // Sarvam call creation failed — mark failed, keep the row for audit
      await supabaseAdmin()
        .from('call_sessions')
        .update({
          status: 'failed',
          ended_at: new Date().toISOString(),
          outcome: 'failed',
          summary: 'Sarvam API call creation failed (see backend logs)',
        })
        .eq('id', call.id);
      return reply.code(502).send({ error: 'Sarvam call creation failed — check backend logs', callSessionId: call.id });
    }

    // 5. Patch attempt_id for webhook correlation (indexed unique)
    const { error: patchErr } = await supabaseAdmin()
      .from('call_sessions')
      .update({ external_call_id: result.attempt_id })
      .eq('id', call.id);
    if (patchErr) {
      logger.error({ callSessionId: call.id, attemptId: result.attempt_id, err: patchErr.message }, '[Sarvam] Failed to store attempt_id');
      // Non-fatal: webhook correlation falls back to metadata orgId lookup.
    }

    logger.info({ callSessionId: call.id, attemptId: result.attempt_id }, '[Sarvam] Real call started');
    return { callSessionId: call.id, attemptId: result.attempt_id };
  });

  // Get call details
  app.get('/api/calls/:id', async (req) => {
    const { id } = req.params as any;
    const oid = orgId(req);
    const { data: call } = await supabaseAdmin()
      .from('call_sessions')
      .select('*, turns:call_session_turns(*)')
      .eq('org_id', oid)
      .eq('id', id)
      .maybeSingle();
    return { call };
  });
}