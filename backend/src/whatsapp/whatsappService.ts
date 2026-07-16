import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ParsedWhatsAppMessage } from './types';
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

/**
 * Deduplication check — Baileys replays messages on reconnect.
 * Returns true if this external_message_id was already processed.
 */
async function isDuplicateMessage(orgId: string, externalMessageId?: string): Promise<boolean> {
  if (!externalMessageId) return false;
  try {
    const { data } = await supabaseAdmin()
      .from('customer_messages')
      .select('id')
      .eq('org_id', orgId)
      .eq('external_message_id', externalMessageId)
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

/** Resolve (create if missing) the default WhatsApp account row for an org. */
export async function resolveAccountId(orgId: string): Promise<string> {
  const sb = supabaseAdmin();
  const { data: existing } = await sb
    .from('whatsapp_accounts')
    .select('id')
    .eq('org_id', orgId)
    .eq('provider', config.whatsapp.provider)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await sb
    .from('whatsapp_accounts')
    .insert({
      org_id: orgId,
      label: 'Default WhatsApp',
      provider: config.whatsapp.provider,
      status: 'disconnected',
      config: {
        autoReply: config.whatsapp.autoReply,
        ignoreGroups: config.whatsapp.ignoreGroups,
        allowedNumbers: config.whatsapp.allowedNumbers,
      },
    })
    .select()
    .single();
  if (error) throw error;
  return created.id;
}

export async function setAccountStatus(
  orgId: string,
  accountId: string,
  status: string,
  extra: Record<string, any> = {}
): Promise<void> {
  const patch: Record<string, any> = { status };
  if (status === 'connected') patch.last_connected_at = new Date().toISOString();
  if (extra.phone) {
    patch.phone_number = extra.phone;
    patch.metadata = { connectedPhone: extra.phone };
  }
  try {
    await supabaseAdmin()
      .from('whatsapp_accounts')
      .update(patch)
      .eq('org_id', orgId)
      .eq('id', accountId);
  } catch (err) {
    logger.warn({ err }, 'failed to update whatsapp account status');
  }
}

export async function getAccountStatus(orgId: string) {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('whatsapp_accounts')
    .select('*')
    .eq('org_id', orgId)
    .eq('provider', config.whatsapp.provider)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Core inbound message handler — wired to the Baileys adapter.
 * Implements the full brief flow:
 * 1. resolve org
 * 2. find/create account
 * 3. find/create lead by phone
 * 4. find/create conversation
 * 5. save inbound message
 * 6. skip if AI disabled / human handoff / blocked
 * 7. call agent
 * 8. save AI run
 * 9. save outbound message
 * 10. send reply via adapter
 * 11. update lead + conversation
 */
export interface HandleMessageOptions {
  /** If set, AI reply is delivered to this chatId instead of parsed.chatId (used by simulator). */
  deliverToChatId?: string;
  /** Skip actual WhatsApp delivery (return reply in response instead). */
  skipDelivery?: boolean;
  /** Optional media send function for brochures/images */
  sendMediaFn?: (chatId: string, opts: { url?: string; buffer?: Buffer; fileName?: string; caption?: string; mimeType?: string }) => Promise<void>;
  /** Optional location send function for sending map pins */
  sendLocationFn?: (chatId: string, opts: { latitude: number; longitude: number; name?: string; address?: string }) => Promise<void>;
}

export async function handleIncomingMessage(
  parsed: ParsedWhatsAppMessage,
  sendMessageFn: (chatId: string, text: string) => Promise<void>,
  options?: HandleMessageOptions & { orgId?: string; accountId?: string }
): Promise<{ reply: string; leadId: string; conversationId: string; quickReplies?: string[] }> {
  const orgId = options?.orgId ?? config.defaultOrgId;
  const accountId = options?.accountId ?? (await resolveAccountId(orgId));

  // 3) lead
  const lead = await findOrCreateLead({
    orgId,
    phone: parsed.senderPhone,
    whatsappNumber: parsed.senderPhone,
    full_name: parsed.senderName ?? undefined,
    source: 'whatsapp',
    source_detail: parsed.chatId,
  });

  // Backfill name if lead was created earlier without one
  if (parsed.senderName && !lead.full_name) {
    await updateLead(orgId, lead.id, { full_name: parsed.senderName }).catch(() => {});
    lead.full_name = parsed.senderName;
  }

  // 4) conversation
  const conversation = await findOrCreateConversation({
    orgId,
    channel: 'whatsapp',
    externalChatId: parsed.chatId,
    leadId: lead.id,
    customerPhone: parsed.senderPhone,
    whatsappAccountId: accountId,
  });

  // 5) inbound message (with deduplication — Baileys replays on reconnect)
  if (await isDuplicateMessage(orgId, parsed.externalMessageId)) {
    logger.info({ externalMessageId: parsed.externalMessageId, chatId: parsed.chatId }, 'Duplicate message detected, skipping (sync path)');
    return { reply: "", leadId: lead.id, conversationId: conversation.id };
  }

  await insertMessage({
    orgId,
    conversationId: conversation.id,
    leadId: lead.id,
    direction: 'inbound',
    body: parsed.text || (parsed.messageType !== 'text' ? `[${parsed.messageType}]` : ''),
    senderPhone: parsed.senderPhone,
    externalMessageId: parsed.externalMessageId,
    messageType: parsed.messageType,
    mediaUrl: parsed.mediaUrl ?? null,
    mediaMimeType: parsed.mediaMimeType ?? null,
    rawPayload: parsed.raw,
  });

  // 6) guards
  if (!config.whatsapp.autoReply) {
    logger.info({ chatId: parsed.chatId }, 'Auto-reply disabled; skipping AI');
    return { reply: "", leadId: lead.id, conversationId: conversation.id };
  }
  if (conversation.status === 'blocked') {
    logger.info({ chatId: parsed.chatId }, 'Conversation blocked; skipping AI');
    return { reply: "", leadId: lead.id, conversationId: conversation.id };
  }
  // AI replies ALWAYS — even if human_handoff or pending_human.
  // The only way to silence AI is to manually toggle ai_enabled=false
  // via the CRM dashboard.
  if (!conversation.ai_enabled) {
    logger.info({ chatId: parsed.chatId }, 'AI manually disabled for this conversation; skipping');
    return { reply: "", leadId: lead.id, conversationId: conversation.id };
  }
  // If human_handoff was active, clear it — customer is back and AI is responding.
  if (conversation.human_handoff) {
    logger.info({ chatId: parsed.chatId }, 'Clearing stale human_handoff — AI resuming');
    await updateConversation(orgId, conversation.id, {
      human_handoff: false,
      status: 'open',
    }).catch(() => {});
  }

  // recent history
  const recent = await recentMessagesForAgent(orgId, conversation.id, 8);

  // 7) agent
  const result = await respondToMessage({
    orgId,
    lead,
    conversation,
    inboundText: parsed.text,
    recentMessages: recent,
  });

  // 8) save AI run
  const agentType = await getAgentType(orgId);
  const { data: aiRun } = await supabaseAdmin()
    .from('ai_agent_runs')
    .insert({
      org_id: orgId,
      conversation_id: conversation.id,
      lead_id: lead.id,
      agent_type: agentType,
      model: result.model,
      input_text: parsed.text,
      output_text: result.reply,
      extracted_intent: result.extractedIntent,
      extracted_data: result.extractedData as any,
      tool_calls: result.matchedProperties as any,
      decision: result.shouldHandoff ? 'handoff' : 'auto_reply',
      confidence: result.matchedProperties[0]?.score ?? null,
      latency_ms: result.latencyMs,
      metadata: { source: 'whatsapp' },
    })
    .select()
    .single();

  // 9) outbound message
  await insertMessage({
    orgId,
    conversationId: conversation.id,
    leadId: lead.id,
    direction: 'outbound',
    body: result.reply,
    aiGenerated: true,
    aiModel: llm.activeModel,
    rawPayload: { ai_run_id: aiRun?.id },
  });

  // 10) send reply — use deliverToChatId override if provided (simulator mode)
  const targetChatId = options?.deliverToChatId ?? parsed.chatId;
  if (!options?.skipDelivery) {
    try {
      await sendMessageFn(targetChatId, result.reply);

      // Send brochure/media attachment if AI generated one
      if (result.mediaToSend && options?.sendMediaFn) {
        try {
          await options.sendMediaFn(targetChatId, {
            url: result.mediaToSend.url,
            fileName: result.mediaToSend.fileName,
            caption: result.mediaToSend.caption,
            mimeType: result.mediaToSend.mimeType,
          });
          logger.info({ chatId: targetChatId, fileName: result.mediaToSend.fileName }, '📎 Brochure sent via WhatsApp');
        } catch (err) {
          logger.error({ err, chatId: targetChatId }, 'Failed to send brochure media');
        }
      }

      // ── LOCATION PIN ──
      // Send a map pin for the top matched property if it has coordinates.
      // Only send if the customer asked about location or the match is strong.
      if (options?.sendLocationFn && result.matchedProperties.length > 0) {
        const topMatch = result.matchedProperties[0];
        const lat = topMatch.details?.latitude;
        const lng = topMatch.details?.longitude;
        if (lat != null && lng != null && typeof lat === 'number' && typeof lng === 'number') {
          try {
            await options.sendLocationFn(targetChatId, {
              latitude: lat,
              longitude: lng,
              name: topMatch.label ?? undefined,
              address: topMatch.sublabel ?? undefined,
            });
            logger.info(
              { chatId: targetChatId, lat, lng, label: topMatch.label },
              '📍 Location pin sent for matched property'
            );
          } catch (err) {
            logger.warn({ err, chatId: targetChatId }, 'Failed to send location pin (non-critical)');
          }
        }
      }
    } catch (err) {
      logger.error({ err, chatId: targetChatId }, 'Failed to send WhatsApp reply');
    }
  }

  // 11a) lead updates + status progression
  const newStatus = computeStatus(lead, result.extractedData);
  const leadPatch: Record<string, any> = { ...result.leadUpdates };
  if (newStatus) leadPatch.status = newStatus;
  if (result.extractedData.lead_temperature) {
    leadPatch.temperature = result.extractedData.lead_temperature;
  }
  leadPatch.last_contacted_at = new Date().toISOString();
  await updateLead(orgId, lead.id, leadPatch).catch((e) =>
    logger.error({ e }, 'lead update after AI failed')
  );

  // 11b) property matches
  if (result.matchedProperties.length) {
    const rows = result.matchedProperties.map((m) => ({
      org_id: orgId,
      lead_id: lead.id,
      project_id: m.details?.projectId ?? null,
      unit_id: m.id ?? null,
      match_score: m.score,
      reason: m.reason,
      shown_to_customer: true,
      metadata: { label: m.label, sublabel: m.sublabel, priceRange: m.priceRange },
    }));
    await supabaseAdmin().from('crm_lead_property_matches').insert(rows);
  }

  // 11c) conversation summary + handoff
  // NOTE: We no longer disable AI on handoff — the AI keeps replying.
  // human_handoff is just a flag for the dashboard to show "human attention needed".
  // Only ai_enabled=false (set manually via CRM) stops the bot.
  if (result.shouldHandoff) {
    await updateConversation(orgId, conversation.id, {
      human_handoff: true,
      status: 'pending_human',
      summary: `Customer requested human agent: ${result.reply}`,
    });
  }

  return { reply: result.reply, leadId: lead.id, conversationId: conversation.id, quickReplies: result.quickReplies };
}

/** Resolve the agent_type string from the org's config (for AI run logging). */
async function getAgentType(orgId: string): Promise<string> {
  try {
    const cfg = await getAgentConfig(orgId);
    return cfg.industry ? `${cfg.industry}_whatsapp` : 'real_estate_whatsapp';
  } catch {
    return 'real_estate_whatsapp';
  }
}

/**
 * ASYNC FAST PATH — used by production Baileys connections.
 *
 * Does the fast part (save inbound) then enqueues AI processing.
 * Returns immediately so Baileys event loop never blocks.
 *
 * The queue worker picks up the job and runs:
 *   AI agent -> save AI run -> save outbound -> enqueue send
 *
 * Use this for real WhatsApp connections. For the simulator
 * (which needs an immediate reply), use handleIncomingMessage instead.
 */
export async function enqueueIncomingMessage(
  parsed: ParsedWhatsAppMessage,
  orgId?: string,
  accountId?: string
): Promise<{ leadId: string; conversationId: string; enqueued: boolean; reason?: string }> {
  const resolvedOrgId = orgId ?? config.defaultOrgId;
  const resolvedAccountId = accountId ?? (await resolveAccountId(resolvedOrgId));

  // 1) find/create lead
  const lead = await findOrCreateLead({
    orgId: resolvedOrgId,
    phone: parsed.senderPhone,
    whatsappNumber: parsed.senderPhone,
    full_name: parsed.senderName ?? undefined,
    source: 'whatsapp',
    source_detail: parsed.chatId,
  });

  // Backfill name if lead was created earlier without one
  if (parsed.senderName && !lead.full_name) {
    await updateLead(resolvedOrgId, lead.id, { full_name: parsed.senderName }).catch(() => {});
    lead.full_name = parsed.senderName;
  }

  // 2) find/create conversation
  const conversation = await findOrCreateConversation({
    orgId: resolvedOrgId,
    channel: 'whatsapp',
    externalChatId: parsed.chatId,
    leadId: lead.id,
    customerPhone: parsed.senderPhone,
    whatsappAccountId: resolvedAccountId,
  });

  // 3) save inbound message (with deduplication)
  if (await isDuplicateMessage(resolvedOrgId, parsed.externalMessageId)) {
    logger.info({ externalMessageId: parsed.externalMessageId, chatId: parsed.chatId }, 'Duplicate message detected, skipping (async path)');
    return { leadId: lead.id, conversationId: conversation.id, enqueued: false, reason: 'duplicate_message' };
  }

  await insertMessage({
    orgId: resolvedOrgId,
    conversationId: conversation.id,
    leadId: lead.id,
    direction: 'inbound',
    body: parsed.text || (parsed.messageType !== 'text' ? `[${parsed.messageType}]` : ''),
    senderPhone: parsed.senderPhone,
    externalMessageId: parsed.externalMessageId,
    messageType: parsed.messageType,
    mediaUrl: parsed.mediaUrl ?? null,
    mediaMimeType: parsed.mediaMimeType ?? null,
    rawPayload: parsed.raw,
  });

  // 4) guards -- don't even enqueue if AI shouldn't respond
  if (!config.whatsapp.autoReply) {
    return { leadId: lead.id, conversationId: conversation.id, enqueued: false, reason: 'auto_reply_disabled' };
  }
  if (conversation.status === 'blocked') {
    return { leadId: lead.id, conversationId: conversation.id, enqueued: false, reason: 'blocked' };
  }
  // AI replies ALWAYS — even if pending_human or human_handoff was set.
  // Only manual ai_enabled=false stops the bot.
  if (!conversation.ai_enabled) {
    return { leadId: lead.id, conversationId: conversation.id, enqueued: false, reason: 'ai_disabled' };
  }
  // Clear stale handoff — AI is resuming
  if (conversation.human_handoff) {
    await updateConversation(resolvedOrgId, conversation.id, {
      human_handoff: false,
      status: 'open',
    }).catch(() => {});
  }

  // 5) enqueue processing job
  // NOTE: locked_by / locked_until are set by the dequeue_job() RPC, not here.
  const { error } = await supabaseAdmin().from('job_queue').insert({
    org_id: resolvedOrgId,
    job_type: 'process_message',
    payload: {
      orgId: resolvedOrgId,
      leadId: lead.id,
      conversationId: conversation.id,
      inboundText: parsed.text,
      chatId: parsed.chatId,
      senderPhone: parsed.senderPhone,
      externalMessageId: parsed.externalMessageId,
    },
    status: 'pending',
    priority: 5,
    scheduled_at: new Date().toISOString(),
  });

  if (error) {
    logger.error({ err: error, chatId: parsed.chatId }, 'Failed to enqueue message processing');
    return { leadId: lead.id, conversationId: conversation.id, enqueued: false, reason: 'enqueue_error' };
  }

  logger.info(
    { leadId: lead.id, conversationId: conversation.id, chatId: parsed.chatId },
    'Message enqueued for async processing'
  );
  return { leadId: lead.id, conversationId: conversation.id, enqueued: true };
}
