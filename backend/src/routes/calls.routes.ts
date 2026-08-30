import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../db/supabase';
import { getOrgIdFromRequest } from '../auth/authMiddleware';
import { checkCallAllowed, recordCall } from '../auth/rateLimiter';
import { getLead } from '../crm/leadService';
import { generateAgentReply, openingLine, CallTurn } from '../ai/callAgent';
import { createOutboundCall, isSarvamConfigured, buildWebhookUrl } from '../sarvam/sarvamClient';
import {
  isWithinCallingHours,
  isDncListed,
  addToDnc,
  removeFromDnc,
  listDnc,
} from '../sarvam/callingGuards';
import { finalizeCall } from '../sarvam/callFinalizer';
import { normalizePhone } from '../utils/phone';
import { config } from '../config';
import { logger } from '../utils/logger';
import { startCallSchema, dncAddSchema, parseBody } from '../validation/schemas';

function orgId(req: any): string {
  return getOrgIdFromRequest(req);
}

async function getTurns(callSessionId: string): Promise<CallTurn[]> {
  const { data } = await supabaseAdmin()
    .from('call_session_turns')
    .select('speaker, text, sequence_index')
    .eq('call_session_id', callSessionId)
    .order('sequence_index', { ascending: true });
  return (data ?? []).map((t) => ({ speaker: t.speaker, text: t.text }));
}

async function addTurn(callSessionId: string, oid: string, speaker: 'agent' | 'customer' | 'system', text: string): Promise<void> {
  const { data: last } = await supabaseAdmin()
    .from('call_session_turns')
    .select('sequence_index')
    .eq('call_session_id', callSessionId)
    .order('sequence_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const seq = (last?.sequence_index ?? -1) + 1;
  await supabaseAdmin().from('call_session_turns').insert({
    org_id: oid,
    call_session_id: callSessionId,
    speaker,
    text,
    sequence_index: seq,
  });
}

export async function callsRoutes(app: FastifyInstance) {
  // List call sessions for the org (newest first) — paginated
  // ?limit (1–500, default 100) & ?offset — response carries `total` for the UI
  app.get('/api/calls', async (req) => {
    const oid = orgId(req);
    const q = req.query as any;
    const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const sb = supabaseAdmin();
    const [{ count }, { data, error }] = await Promise.all([
      sb.from('call_sessions').select('id', { count: 'exact', head: true }).eq('org_id', oid),
      sb.from('call_sessions')
        .select('*, turns:call_session_turns(*), lead:crm_leads(id, full_name, phone)')
        .eq('org_id', oid)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
    ]);
    if (error) return { calls: [], total: 0, limit, offset, error: error.message };
    // PostgREST returns an array for FK joins — normalize to the object the UI expects
    const calls = (data ?? []).map((c: any) => ({
      ...c,
      lead: Array.isArray(c.lead) ? c.lead[0] : c.lead,
      turns: [...(c.turns ?? [])].sort((a: any, b: any) => a.sequence_index - b.sequence_index),
    }));
    return { calls, total: count ?? 0, limit, offset };
  });

  // Start a browser demo call for a lead
  app.post('/api/calls/start-demo', async (req, reply) => {
    const parsed = parseBody(startCallSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const { leadId } = parsed.data;
    const oid = orgId(req);

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

  // End the call — generate summary via the shared finalizer
  // (same pipeline as the Sarvam webhook path: summary, lead enrichment,
  // follow-ups — so enrichment rules can never drift between providers)
  app.post('/api/calls/:id/end', async (req, reply) => {
    const { id } = req.params as any;
    const oid = orgId(req);

    const { data: call, error: callErr } = await supabaseAdmin()
      .from('call_sessions')
      .select('id, lead_id, started_at')
      .eq('org_id', oid)
      .eq('id', id)
      .maybeSingle();
    if (callErr || !call) return reply.code(404).send({ error: 'call session not found' });

    const turns = await getTurns(id);
    const { summaryData } = await finalizeCall({
      orgId: oid,
      callSessionId: id,
      leadId: call.lead_id,
      status: 'completed',
      transcriptRows: turns,
      startedAt: call.started_at,
      persistTurns: false, // demo turns are persisted live per-turn
    });

    return { callSessionId: id, summary: summaryData };
  });

  // Start a REAL outbound call via Sarvam Voice Agents
  // Plan: docs/SARVAM_CALLING_PLAN.md (Phase S3)
  app.post('/api/calls/start-real', async (req, reply) => {
    const parsed = parseBody(startCallSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const { leadId } = parsed.data;
    const oid = orgId(req);

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

    // 2.5 Calling-safety guards — run BEFORE any Sarvam dispatch.
    //     Real PSTN calls cost money and are hour-regulated; these three
    //     guards were documented in the README but not enforced until
    //     2026-08-30 (see callingGuards.ts).
    if (config.sarvam.callingHoursEnforced) {
      const hours = isWithinCallingHours();
      if (!hours.allowed) {
        return reply.code(403).send({
          error: `Outside calling hours (IST ${config.sarvam.callingHoursStart}:00–${config.sarvam.callingHoursEnd}:00; current IST hour ${hours.istHour}). Set SARVAM_ENFORCE_CALLING_HOURS=false to override for testing.`,
          code: 'CALLING_HOURS',
        });
      }
    }
    const callAllow = await checkCallAllowed(oid);
    if (!callAllow.allowed) {
      return reply.code(429).send({ error: callAllow.reason ?? 'Call not allowed', code: 'DAILY_LIMIT' });
    }
    if (await isDncListed(oid, phone)) {
      return reply.code(403).send({ error: 'This phone number is on the Do-Not-Call list', code: 'DNC' });
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
    // Count the call against the org's daily limits (usage counters + dashboard)
    recordCall(oid);
    return { callSessionId: call.id, attemptId: result.attempt_id };
  });

  // ── Do-Not-Call registry management ──────────────────────────────
  // List entries
  app.get('/api/calls/dnc', async (req) => {
    try {
      return { dnc: await listDnc(orgId(req)) };
    } catch (err: any) {
      return { dnc: [], error: err?.message ?? 'DNC list unavailable (migration applied?)' };
    }
  });

  // Add a number ({ phone, reason? }) — validated + normalized before storing
  app.post('/api/calls/dnc', async (req, reply) => {
    const parsed = parseBody(dncAddSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const { phone, reason } = parsed.data;
    const normalized = normalizePhone(phone);
    try {
      await addToDnc(orgId(req), normalized, reason);
      return { ok: true, phone: normalized };
    } catch (err: any) {
      return reply.code(500).send({ error: err?.message ?? 'Failed to add to DNC' });
    }
  });

  // Remove a number
  app.delete('/api/calls/dnc/:phone', async (req, reply) => {
    const { phone } = req.params as any;
    const normalized = normalizePhone(decodeURIComponent(phone));
    if (!normalized) return reply.code(400).send({ error: 'invalid phone' });
    try {
      await removeFromDnc(orgId(req), normalized);
      return { ok: true, phone: normalized };
    } catch (err: any) {
      return reply.code(500).send({ error: err?.message ?? 'Failed to remove from DNC' });
    }
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