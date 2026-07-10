import { supabaseAdmin } from '../db/supabase';

export async function findOrCreateConversation(params: {
  orgId: string;
  channel?: string;
  externalChatId: string;
  leadId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  whatsappAccountId?: string | null;
}) {
  const {
    orgId,
    channel = 'whatsapp',
    externalChatId,
    leadId = null,
    customerName = null,
    customerPhone = null,
    whatsappAccountId = null,
  } = params;

  const sb = supabaseAdmin();

  const { data: existing } = await sb
    .from('customer_conversations')
    .select('*')
    .eq('org_id', orgId)
    .eq('channel', channel)
    .eq('external_chat_id', externalChatId)
    .maybeSingle();

  if (existing) {
    // attach lead if now known
    if (leadId && !existing.lead_id) {
      const { data: upd } = await sb
        .from('customer_conversations')
        .update({ lead_id: leadId, customer_name: customerName ?? existing.customer_name, customer_phone: customerPhone ?? existing.customer_phone })
        .eq('id', existing.id)
        .select()
        .single();
      return upd ?? existing;
    }
    return existing;
  }

  const { data: created, error } = await sb
    .from('customer_conversations')
    .insert({
      org_id: orgId,
      channel,
      external_chat_id: externalChatId,
      lead_id: leadId,
      customer_name: customerName,
      customer_phone: customerPhone,
      whatsapp_account_id: whatsappAccountId,
      status: 'open',
      ai_enabled: true,
      human_handoff: false,
    })
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function getConversation(orgId: string, id: string) {
  const { data, error } = await supabaseAdmin()
    .from('customer_conversations')
    .select('*, lead:crm_leads(*)')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listConversations(orgId: string, limit = 50) {
  const { data, error } = await supabaseAdmin()
    .from('customer_conversations')
    .select('*, lead:crm_leads(id, full_name, phone, temperature, status)')
    .eq('org_id', orgId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function listMessages(orgId: string, conversationId: string, limit = 200) {
  const { data, error } = await supabaseAdmin()
    .from('customer_messages')
    .select('*')
    .eq('org_id', orgId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function insertMessage(input: {
  orgId: string;
  conversationId: string;
  leadId?: string | null;
  direction: 'inbound' | 'outbound';
  body: string;
  senderPhone?: string | null;
  externalMessageId?: string | null;
  aiGenerated?: boolean;
  aiModel?: string | null;
  rawPayload?: any;
  messageType?: string;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
}) {
  const { data, error } = await supabaseAdmin()
    .from('customer_messages')
    .insert({
      org_id: input.orgId,
      conversation_id: input.conversationId,
      lead_id: input.leadId ?? null,
      direction: input.direction,
      message_type: input.messageType ?? 'text',
      body: input.body,
      sender_phone: input.senderPhone ?? null,
      external_message_id: input.externalMessageId ?? null,
      ai_generated: input.aiGenerated ?? false,
      ai_model: input.aiModel ?? null,
      media_url: input.mediaUrl ?? null,
      media_mime_type: input.mediaMimeType ?? null,
      raw_payload: input.rawPayload ?? {},
      received_at: input.direction === 'inbound' ? new Date().toISOString() : null,
      sent_at: input.direction === 'outbound' ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;

  // bump conversation timestamps
  const patch: Record<string, any> = {
    last_message_at: new Date().toISOString(),
  };
  if (input.direction === 'inbound') patch.last_inbound_at = new Date().toISOString();
  if (input.direction === 'outbound') patch.last_outbound_at = new Date().toISOString();
  await supabaseAdmin().from('customer_conversations').update(patch).eq('id', input.conversationId);

  return data;
}

export async function updateConversation(orgId: string, id: string, patch: Record<string, any>) {
  const { data, error } = await supabaseAdmin()
    .from('customer_conversations')
    .update(patch)
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recentMessagesForAgent(orgId: string, conversationId: string, limit = 8) {
  const { data, error } = await supabaseAdmin()
    .from('customer_messages')
    .select('direction, body, created_at')
    .eq('org_id', orgId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  // reverse to chronological
  return (data ?? []).reverse();
}