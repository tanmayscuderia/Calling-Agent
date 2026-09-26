import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import { config } from '../config';
import { findOrCreateLead, updateLead, computeStatus } from '../crm/leadService';
import {
  findOrCreateConversation,
  insertMessage,
  recentMessagesForAgent,
  updateConversation,
} from '../crm/conversationService';
import { respondToMessage } from '../ai/baseAgent';
import { getAgentConfig } from '../ai/agentConfigService';
import { llm } from '../ai/llmClient';
import { resolveAccountId } from '../whatsapp/whatsappService';
import { waManager } from '../whatsapp/connectionManager';
import { classifyWithReferee } from '../whatsapp/spamGuard';
import { checkAccountDailyLimit, recordAccountActivity, recordTokenUsage } from '../auth/rateLimiter';

// ============================================================
// Job Handlers — executed by the queue worker
// ============================================================

export interface MessageJobPayload {
  orgId: string;
  leadId: string;
  conversationId: string;
  messageId?: string;
  inboundText: string;
  chatId: string;
  senderPhone: string | null;
  externalMessageId?: string;
  /** Stage 1 spam heuristics tripped at enqueue → run the Stage 2 referee before replying. */
  needsAbuseCheck?: boolean;
  spamSignals?: string[];
}

export interface SendReplyJobPayload {
  orgId: string;
  accountId: string;
  chatId: string;
  text: string;
}

export interface SendLocationJobPayload {
  orgId: string;
  accountId: string;
  chatId: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SummaryJobPayload {
  orgId: string;
  callSessionId: string;
}

/**
 * Process a WhatsApp message through the AI agent.
 * This is the async replacement for the sync processing that used to
 * happen inside handleIncomingMessage.
 *
 * Flow: load context → AI agent → save AI run → save outbound → enqueue send
 */
export async function processMessageJob(orgId: string, payload: MessageJobPayload): Promise<void> {
  const { conversationId, leadId, inboundText, chatId, senderPhone } = payload;

  // 1. Load lead + recent messages
  const { data: lead } = await supabaseAdmin()
    .from('crm_leads')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', leadId)
    .maybeSingle();

  if (!lead) {
    logger.warn({ leadId, orgId }, '[Queue] Lead not found for process_message job');
    return;
  }

  // 2. Check conversation guards (AI might have been disabled since enqueue)
  const { data: conversation } = await supabaseAdmin()
    .from('customer_conversations')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', conversationId)
    .maybeSingle();

  if (!conversation) {
    logger.warn({ conversationId, orgId }, '[Queue] Conversation not found');
    return;
  }

  // ── BUG FIX ──
  // Previously this checked `human_handoff` and would SILENTLY DROP messages
  // for any conversation that had handoff active. But the enqueue path
  // (whatsappService.enqueueIncomingMessage) is supposed to CLEAR handoff
  // when a new customer message arrives — meaning the AI should resume.
  // The race condition: if the DB update hadn't committed yet (or failed
  // silently due to .catch(() => {})), the worker re-loaded the conversation
  // with human_handoff still true → message dropped → customer never got a reply.
  //
  // Now: Only `ai_enabled=false` (manual dashboard toggle) and `status='blocked'`
  // permanently stop the bot. human_handoff is just a flag for the dashboard.
  // We also defensively clear handoff here to be 100% sure.
  if (!conversation.ai_enabled || conversation.status === 'blocked') {
    logger.info(
      { conversationId, aiEnabled: conversation.ai_enabled, status: conversation.status },
      '[Queue] AI disabled or conversation blocked — skipping processing'
    );
    return;
  }

  // Defensively clear any stale human_handoff right before processing.
  // This guarantees the bot replies even if the enqueue-path update raced.
  if (conversation.human_handoff) {
    logger.info({ conversationId }, '[Queue] Clearing stale human_handoff before AI processing');
    await supabaseAdmin()
      .from('customer_conversations')
      .update({ human_handoff: false, status: 'open' })
      .eq('id', conversationId)
      .eq('org_id', orgId);
  }

  // 2b. Per-number daily gate (Phase 3) — the conversation carries the
  // whatsapp_account_id, so a number's volume is bounded even when the org
  // runs several numbers. Fails open when the counters table is missing.
  const accountId: string | null = (conversation as any).whatsapp_account_id ?? null;
  const accountCheck = await checkAccountDailyLimit(orgId, accountId);
  if (!accountCheck.allowed) {
    logger.warn({ orgId, accountId, reason: accountCheck.reason }, '[Queue] Per-number limit hit — flagging pending_human');
    await updateConversation(orgId, conversationId, { human_handoff: true, status: 'pending_human' });
    return;
  }

  // 2c. Load ALL unanswered inbound messages since the last AI reply.
  // This is what makes reply BATCHING work: rapid follow-up questions
  // coalesce (enqueue skips stacking jobs; the ~6s window passes; this
  // job answers everything in one combined reply).
  const unanswered = await loadUnansweredInbounds(orgId, conversationId);
  const effectiveInbound =
    unanswered.length > 0
      ? unanswered.map((m) => m.body).filter(Boolean).join('\n')
      : inboundText;

  // 2d. Stage 2 spam referee (DeepSeek) — ONLY when Stage 1 heuristics
  // tripped at enqueue. Genuine → reply normally. Spam/abuse → AI goes
  // silent (pending_human) and the verdict is stored for the dashboard.
  // Fail-open: referee errors never mute a real lead.
  if (payload.needsAbuseCheck) {
    const refereeTexts =
      unanswered.length > 0 ? unanswered.map((m) => m.body) : [inboundText];
    const verdict = await classifyWithReferee(refereeTexts.filter(Boolean));
    const prevMeta = (conversation.metadata ?? {}) as Record<string, any>;
    const abuseMeta = {
      label: verdict.label,
      confidence: verdict.confidence,
      signals: payload.spamSignals ?? [],
      checked_at: new Date().toISOString(),
    };
    await supabaseAdmin()
      .from('customer_conversations')
      .update({ metadata: { ...prevMeta, abuse: abuseMeta } })
      .eq('org_id', orgId)
      .eq('id', conversationId);

    if (verdict.label !== 'genuine' && verdict.confidence >= 0.6) {
      logger.warn(
        { conversationId, verdict: verdict.label, confidence: verdict.confidence },
        '[Queue] Spam referee: non-genuine — silencing AI for this conversation'
      );
      await updateConversation(orgId, conversationId, { human_handoff: true, status: 'pending_human' });
      return;
    }
    logger.info({ conversationId, verdict: verdict.label }, '[Queue] Spam referee: genuine — proceeding');
  }

  // 3. Load recent message history for context
  const recent = await recentMessagesForAgent(orgId, conversationId, 8);

  // 4. Call AI agent
  const result = await respondToMessage({
    orgId,
    lead,
    conversation,
    inboundText: effectiveInbound,
    recentMessages: recent,
  });

  // 5. Save AI run
  let agentType = 'real_estate_whatsapp';
  try {
    const cfg = await getAgentConfig(orgId);
    if (cfg.industry) agentType = `${cfg.industry}_whatsapp`;
  } catch { /* fall back to default */ }

  const { data: aiRun } = await supabaseAdmin()
    .from('ai_agent_runs')
    .insert({
      org_id: orgId,
      conversation_id: conversationId,
      lead_id: leadId,
      agent_type: agentType,
      model: result.model,
      input_text: effectiveInbound,
      output_text: result.reply,
      extracted_intent: result.extractedIntent,
      extracted_data: result.extractedData as any,
      tool_calls: result.matchedProperties as any,
      decision: result.shouldHandoff ? 'handoff' : 'auto_reply',
      confidence: result.matchedProperties[0]?.score ?? null,
      latency_ms: result.latencyMs,
      tokens_in: (result as any).tokensIn ?? 0,
      tokens_out: (result as any).tokensOut ?? 0,
      cost_usd: (result as any).costUsd ?? 0,
    })
    .select()
    .single();

  // Org-level daily usage rollup (KV counters + org_usage_daily via RPC)
  recordTokenUsage(orgId, (result as any).tokensIn ?? 0, (result as any).tokensOut ?? 0, (result as any).costUsd ?? 0).catch(() => {});

  // 6. Save outbound message
  await insertMessage({
    orgId,
    conversationId,
    leadId,
    direction: 'outbound',
    body: result.reply,
    aiGenerated: true,
    aiModel: llm.activeModel,
    rawPayload: { ai_run_id: aiRun?.id },
  });

  // 7. Enqueue the actual WhatsApp send (decouples LLM from network)
  // Per-number AI reply counter (fire-and-forget) — accountId from 2b.
  if (accountId) {
    recordAccountActivity(orgId, accountId, { ai_replies: 1 }).catch(() => {});
  }
  const sendAccountId: string = accountId ?? (await resolveAccountId(orgId));
  await supabaseAdmin().from('job_queue').insert({
    org_id: orgId,
    job_type: 'send_reply',
    payload: {
      orgId,
      accountId: sendAccountId,
      chatId,
      text: result.reply,
    } satisfies SendReplyJobPayload,
    status: 'pending',
    priority: 8, // replies are higher priority than processing
    scheduled_at: new Date().toISOString(),
  });

  // 7b. Enqueue a location pin if the top matched property has coordinates
  if (result.matchedProperties.length > 0) {
    const topMatch = result.matchedProperties[0];
    const lat = topMatch.details?.latitude;
    const lng = topMatch.details?.longitude;
    if (lat != null && lng != null && typeof lat === 'number' && typeof lng === 'number') {
      await supabaseAdmin().from('job_queue').insert({
        org_id: orgId,
        job_type: 'send_location',
        payload: {
          orgId,
          accountId: sendAccountId,
          chatId,
          latitude: lat,
          longitude: lng,
          name: topMatch.label ?? undefined,
          address: topMatch.sublabel ?? undefined,
        } satisfies SendLocationJobPayload,
        status: 'pending',
        priority: 7,
        scheduled_at: new Date().toISOString(),
      });
      logger.info({ chatId, lat, lng }, '[Queue] Location pin job enqueued');
    }
  }

  // 8. Update lead
  const newStatus = computeStatus(lead, result.extractedData);
  const leadPatch: Record<string, any> = { ...result.leadUpdates };
  if (newStatus) leadPatch.status = newStatus;
  if (result.extractedData.lead_temperature) {
    leadPatch.temperature = result.extractedData.lead_temperature;
  }
  leadPatch.last_contacted_at = new Date().toISOString();
  await updateLead(orgId, leadId, leadPatch).catch((e) =>
    logger.error({ e }, '[Queue] Lead update after AI failed')
  );

  // 9. Save property matches (GenericAgentResult shape: id, details.projectId)
  if (result.matchedProperties.length) {
    const rows = result.matchedProperties.map((m: any) => ({
      org_id: orgId,
      lead_id: leadId,
      project_id: m.details?.projectId ?? null,
      unit_id: m.id ?? null,
      match_score: m.score,
      reason: m.reason,
      shown_to_customer: true,
      metadata: { label: m.label, sublabel: m.sublabel, priceRange: m.priceRange },
    }));
    await supabaseAdmin().from('crm_lead_property_matches').insert(rows);
  }

  // 10. Handoff if needed
  // NOTE: We intentionally do NOT set ai_enabled=false here.
  // Setting ai_enabled=false permanently kills the bot for that number —
  // even after the human jumps in, the bot would never reply again.
  // Instead, human_handoff=true is enough to pause AI replies, and the
  // enqueue path in whatsappService.ts automatically clears it when the
  // customer sends a NEW message (giving the human the last word).
  if (result.shouldHandoff) {
    await updateConversation(orgId, conversationId, {
      human_handoff: true,
      status: 'pending_human',
      summary: `AI handed off: ${result.reply}`,
    });
    logger.info({ conversationId }, '[Queue] Human handoff requested — bot paused until next customer message');
  }
}

/**
 * Load ALL inbound messages since the last outbound (AI/human) reply —
 * the batching primitive. The trigger message's payload only knows about
 * ONE text; this returns everything the customer asked in the burst so
 * the AI answers it all in one reply.
 */
async function loadUnansweredInbounds(
  orgId: string,
  conversationId: string
): Promise<{ body: string; created_at: string }[]> {
  const sb = supabaseAdmin();
  const { data: lastOut } = await sb
    .from('customer_messages')
    .select('created_at')
    .eq('org_id', orgId)
    .eq('conversation_id', conversationId)
    .eq('direction', 'outbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let query = sb
    .from('customer_messages')
    .select('body, created_at')
    .eq('conversation_id', conversationId)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(8);
  if (lastOut?.created_at) query = query.gt('created_at', lastOut.created_at);

  const { data } = await query;
  return ((data ?? []) as any[]).reverse();
}

/**
 * Send a WhatsApp reply via the active Baileys connection.
 */
export async function processSendReplyJob(orgId: string, payload: SendReplyJobPayload): Promise<void> {
  const { accountId, chatId, text } = payload;

  // Provider-aware lookup: live Baileys socket OR stateless Meta adapter.
  const adapter = await waManager.resolveAdapter(accountId);
  if (!adapter) {
    throw new Error(`WhatsApp account ${accountId} is not connected (adapter not found)`);
  }
  const provider = adapter.provider ?? 'baileys';

  // ── 24-hour customer service window (Meta Cloud API only) ──
  // Free-form replies are only allowed within 24h of the customer's last
  // message. Outside the window Meta rejects the send with error 131047;
  // Baileys has no such restriction. Instead of burning a queue retry on
  // a guaranteed-failure send, hand the conversation to a human and let
  // the dashboard show it as pending.
  if (provider === 'meta_cloud_api') {
    const withinWindow = await isWithinServiceWindow(orgId, chatId);
    if (!withinWindow) {
      logger.warn(
        { orgId, accountId, chatId },
        '[Queue] Outside Meta 24h service window — flagging pending_human instead of sending'
      );
      await supabaseAdmin()
        .from('customer_conversations')
        .update({ status: 'pending_human', human_handoff: true })
        .eq('org_id', orgId)
        .eq('channel', 'whatsapp')
        .eq('external_chat_id', chatId);
      return;
    }
  }

  try {
    await adapter.sendMessage(chatId, text);

    // Mark the most recent outbound AI message for this chat as sent
    await supabaseAdmin()
      .from('customer_messages')
      .update({
        sent_at: new Date().toISOString(),
        metadata: { sent: true, sent_via: provider, account_id: accountId },
      })
      .eq('org_id', orgId)
      .eq('direction', 'outbound')
      .eq('ai_generated', true)
      .eq('body', text)
      .is('sent_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    logger.info({ accountId, chatId, provider, textLength: text.length }, '[Queue] Reply sent via WhatsApp');
    // Per-number outbound counter (fire-and-forget)
    if (accountId) {
      recordAccountActivity(orgId, accountId, { outbound: 1 }).catch(() => {});
    }
  } catch (err: any) {
    logger.error({ err, accountId, chatId, provider }, '[Queue] Failed to send WhatsApp reply');
    throw err; // let the queue retry
  }
}

/**
 * Meta 24-hour customer service window check: has this customer messaged
 * us in the last 24 hours? Free-form (non-template) sends are only
 * permitted inside the window.
 *
 * Uses the conversation's `last_inbound_at` (maintained by the message
 * pipeline). A missing conversation or timestamp counts as OUTSIDE —
 * the safe direction (a human gets flagged rather than an illegal send
 * being attempted).
 */
async function isWithinServiceWindow(orgId: string, chatId: string): Promise<boolean> {
  const { data: conversation } = await supabaseAdmin()
    .from('customer_conversations')
    .select('id, last_inbound_at')
    .eq('org_id', orgId)
    .eq('channel', 'whatsapp')
    .eq('external_chat_id', chatId)
    .maybeSingle();

  if (!conversation?.last_inbound_at) return false;
  const lastInbound = new Date(conversation.last_inbound_at).getTime();
  if (Number.isNaN(lastInbound)) return false;
  return Date.now() - lastInbound < 24 * 60 * 60 * 1000;
}

/**
 * Send a location pin via WhatsApp.
 */
export async function processSendLocationJob(orgId: string, payload: SendLocationJobPayload): Promise<void> {
  const { accountId, chatId, latitude, longitude, name, address } = payload;

  // Provider-aware lookup (Baileys socket or stateless Meta adapter).
  const adapter = await waManager.resolveAdapter(accountId);
  if (!adapter) {
    throw new Error(`WhatsApp account ${accountId} is not connected (adapter not found)`);
  }

  if (typeof adapter.sendLocation !== 'function') {
    logger.warn({ accountId, chatId }, '[Queue] Adapter does not support sendLocation — skipping');
    return;
  }

  try {
    await adapter.sendLocation(chatId, { latitude, longitude, name, address });
    logger.info({ accountId, chatId, lat: latitude, lng: longitude }, '[Queue] Location pin sent via WhatsApp');
  } catch (err: any) {
    logger.error({ err, accountId, chatId }, '[Queue] Failed to send location pin');
    throw err;
  }
}

/**
 * Generate a call summary (for async post-call processing).
 * Delegates to the shared callFinalizer — same pipeline as the Sarvam
 * webhook path and the demo /end route (summary, lead enrichment,
 * follow-ups), so enrichment rules can never drift between providers.
 */
export async function processSummaryJob(orgId: string, payload: SummaryJobPayload): Promise<void> {
  const { callSessionId } = payload;

  const { data: callSession } = await supabaseAdmin()
    .from('call_sessions')
    .select('id, lead_id, started_at')
    .eq('org_id', orgId)
    .eq('id', callSessionId)
    .maybeSingle();

  if (!callSession) {
    logger.warn({ callSessionId }, '[Queue] Call session not found for summary job');
    return;
  }

  // Load turns for the call session
  const { data: turns } = await supabaseAdmin()
    .from('call_session_turns')
    .select('speaker, text')
    .eq('call_session_id', callSessionId)
    .order('sequence_index', { ascending: true });

  const { finalizeCall } = await import('../sarvam/callFinalizer');
  await finalizeCall({
    orgId,
    callSessionId,
    leadId: callSession.lead_id,
    status: 'completed',
    transcriptRows: turns || [],
    startedAt: callSession.started_at,
    // Turns were persisted live during the demo — no re-insert needed.
    persistTurns: false,
  });
}
