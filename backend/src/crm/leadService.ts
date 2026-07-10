import { supabaseAdmin } from '../db/supabase';
import { normalizePhone } from '../utils/phone';
import { normalizeEmail } from '../utils/email';
import { logger } from '../utils/logger';

export interface LeadInput {
  orgId: string;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  full_name?: string | null;
  source?: string;
  source_detail?: string | null;
}

/**
 * Find or create a lead by email, phone, or WhatsApp number.
 * Deduplication priority: email → whatsapp_number → phone.
 * If found by one identifier but another is new, backfills it.
 */
export async function findOrCreateLead(input: LeadInput) {
  const { orgId } = input;
  const phone = input.phone ? normalizePhone(input.phone) : null;
  const wa = input.whatsappNumber ? normalizePhone(input.whatsappNumber) : null;
  const email = input.email ? normalizeEmail(input.email) : null;

  const sb = supabaseAdmin();

  // 1) Try email first (most reliable unique identifier)
  if (email) {
    const { data } = await sb
      .from('crm_leads')
      .select('*')
      .eq('org_id', orgId)
      .eq('email', email)
      .maybeSingle();
    if (data) {
      // Backfill phone/whatsapp if missing
      const updates: Record<string, any> = {};
      if (phone && !data.phone) updates.phone = phone;
      if (wa && !data.whatsapp_number) updates.whatsapp_number = wa;
      if (Object.keys(updates).length > 0) {
        await sb.from('crm_leads').update(updates).eq('id', data.id);
        Object.assign(data, updates);
      }
      return data;
    }
  }

  // 2) Try whatsapp number
  if (wa) {
    const { data } = await sb
      .from('crm_leads')
      .select('*')
      .eq('org_id', orgId)
      .or(`whatsapp_number.eq.${wa},phone.eq.${wa}`)
      .maybeSingle();
    if (data) {
      // Backfill email if missing
      if (email && !data.email) {
        await sb.from('crm_leads').update({ email }).eq('id', data.id);
        data.email = email;
      }
      return data;
    }
  }

  // 3) Try phone
  if (phone) {
    const { data } = await sb
      .from('crm_leads')
      .select('*')
      .eq('org_id', orgId)
      .or(`phone.eq.${phone},whatsapp_number.eq.${phone}`)
      .maybeSingle();
    if (data) {
      // Backfill email if missing
      if (email && !data.email) {
        await sb.from('crm_leads').update({ email }).eq('id', data.id);
        data.email = email;
      }
      return data;
    }
  }

  // 4) Create new lead with all available identifiers
  const { data: created, error } = await sb
    .from('crm_leads')
    .insert({
      org_id: orgId,
      phone: phone ?? wa,
      whatsapp_number: wa ?? phone,
      email: email ?? null,
      source: input.source ?? 'whatsapp',
      status: 'new',
      temperature: 'unknown',
      full_name: input.full_name ?? null,
      source_detail: input.source_detail ?? null,
    })
    .select()
    .single();
  if (error) {
    logger.error({ error }, 'lead create failed');
    throw error;
  }
  return created;
}

export async function getLead(orgId: string, id: string) {
  const { data, error } = await supabaseAdmin()
    .from('crm_leads')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listLeads(orgId: string, opts: { status?: string; temperature?: string; limit?: number } = {}) {
  let q = supabaseAdmin()
    .from('crm_leads')
    .select('*')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.temperature) q = q.eq('temperature', opts.temperature);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createLead(orgId: string, input: Record<string, any>) {
  const phone = input.phone ? normalizePhone(input.phone) : null;
  const wa = input.whatsapp_number ? normalizePhone(input.whatsapp_number) : null;
  const { data, error } = await supabaseAdmin()
    .from('crm_leads')
    .insert({
      org_id: orgId,
      phone: phone ?? wa,
      whatsapp_number: wa ?? phone,
      full_name: input.full_name ?? null,
      email: input.email ?? null,
      source: input.source ?? 'manual',
      status: input.status ?? 'new',
      temperature: input.temperature ?? 'unknown',
      preferred_city: input.preferred_city ?? null,
      preferred_sector: input.preferred_sector ?? null,
      configuration: input.configuration ?? null,
      budget_min: input.budget_min ?? null,
      budget_max: input.budget_max ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLead(orgId: string, id: string, patch: Record<string, any>) {
  const { data, error } = await supabaseAdmin()
    .from('crm_leads')
    .update({ ...patch, last_contacted_at: patch.last_contacted_at ?? new Date().toISOString() })
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getLeadMessages(orgId: string, leadId: string, limit = 100) {
  const { data, error } = await supabaseAdmin()
    .from('customer_messages')
    .select('*')
    .eq('org_id', orgId)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getLeadCalls(orgId: string, leadId: string) {
  const { data, error } = await supabaseAdmin()
    .from('call_sessions')
    .select('*, turns:call_session_turns(*)')
    .eq('org_id', orgId)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getLeadMatches(orgId: string, leadId: string) {
  const { data, error } = await supabaseAdmin()
    .from('crm_lead_property_matches')
    .select('*, project:real_estate_projects(*), unit:real_estate_units(*)')
    .eq('org_id', orgId)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createFollowup(orgId: string, leadId: string, input: Record<string, any>) {
  const { data, error } = await supabaseAdmin()
    .from('lead_followups')
    .insert({ ...input, org_id: orgId, lead_id: leadId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listFollowups(orgId: string, opts: { status?: string; limit?: number } = {}) {
  let q = supabaseAdmin()
    .from('lead_followups')
    .select('*, lead:crm_leads(id, full_name, phone, temperature, status)')
    .eq('org_id', orgId)
    .order('scheduled_at', { ascending: true, nullsFirst: false });
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

/**
 * Compute lead status progression per brief:
 * new → contacted when first reply sent
 * contacted → qualified when budget + location + configuration known
 * qualified → site_visit_scheduled when customer agrees to visit
 */
export function computeStatus(lead: any, extracted: any): string | null {
  const current = lead.status;
  const hasBudget = extracted.budget_min != null || extracted.budget_max != null;
  const hasLocation = extracted.city || extracted.sector || extracted.location;
  const hasConfig = extracted.configuration;
  const wantsVisit =
    extracted.intent === 'site_visit' || /visit|site visit|callback|call me/i.test(extracted.intent ?? '');

  if (wantsVisit && current !== 'won' && current !== 'site_visit_scheduled') {
    return 'site_visit_scheduled';
  }
  if (hasBudget && hasLocation && hasConfig && (current === 'new' || current === 'contacted')) {
    return 'qualified';
  }
  if (current === 'new') {
    return 'contacted';
  }
  return null;
}