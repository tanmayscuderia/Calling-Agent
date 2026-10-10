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

  // 3.5) No stable identifier (privacy LID chats: xxx@lid) — reuse the
  // lead already tied to THIS chat via source_detail, so every message
  // doesn't spawn a brand-new anonymous lead. The real phone gets
  // backfilled onto this lead once contact sync resolves it.
  if (input.source_detail) {
    const { data } = await sb
      .from('crm_leads')
      .select('*')
      .eq('org_id', orgId)
      .eq('source_detail', input.source_detail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      // Backfill phone/whatsapp if the LID just resolved to a real number
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

export async function listLeads(orgId: string, opts: { status?: string; temperature?: string; limit?: number; search?: string } = {}) {
  let q = supabaseAdmin()
    .from('crm_leads')
    .select('*, assigned_member:organization_members!assigned_to(id, full_name, role, title)')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.temperature) q = q.eq('temperature', opts.temperature);
  if (opts.search) q = q.or(`full_name.ilike.%${opts.search}%,phone.ilike.%${opts.search}%,whatsapp_number.ilike.%${opts.search}%`);
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

export async function listFollowups(
  orgId: string,
  opts: {
    status?: string;
    limit?: number;
    assigneeId?: string;
    leadId?: string;
    type?: string;
    source?: string;
    priority?: string;
    /** ISO date — tasks due on/after this day */
    dueFrom?: string;
    /** ISO date — tasks due on/before this day */
    dueTo?: string;
    /** substring match on title/notes */
    search?: string;
  } = {}
) {
  let q = supabaseAdmin()
    .from('lead_followups')
    .select('*, lead:crm_leads(id, full_name, phone, temperature, status), assignee:organization_members!assigned_to(id, full_name, role, title)')
    .eq('org_id', orgId)
    .order('scheduled_at', { ascending: true, nullsFirst: false });
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.assigneeId) q = q.eq('assigned_to', opts.assigneeId);
  if (opts.leadId) q = q.eq('lead_id', opts.leadId);
  if (opts.type) q = q.eq('type', opts.type);
  if (opts.source) q = q.eq('source', opts.source);
  if (opts.priority) q = q.eq('priority', opts.priority);
  if (opts.dueFrom) q = q.gte('scheduled_at', opts.dueFrom);
  if (opts.dueTo) q = q.lte('scheduled_at', opts.dueTo);
  if (opts.search) q = q.or(`title.ilike.%${opts.search}%,notes.ilike.%${opts.search}%`);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function updateFollowup(orgId: string, id: string, patch: Record<string, any>) {
  const { data, error } = await supabaseAdmin()
    .from('lead_followups')
    .update(patch)
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get followups for a specific lead, with assignee info.
 */
export async function getLeadFollowups(orgId: string, leadId: string) {
  const { data, error } = await supabaseAdmin()
    .from('lead_followups')
    .select('*, assignee:organization_members!assigned_to(id, full_name, role, title)')
    .eq('org_id', orgId)
    .eq('lead_id', leadId)
    .order('scheduled_at', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export interface FollowupAnalytics {
  totals: { open: number; completed: number; missed: number; cancelled: number; overdue: number; dueToday: number };
  completionRatePct: number;
  avgHoursToComplete: number | null;
  bySource: Array<{ source: string; open: number; total: number }>;
  byType: Array<{ type: string; open: number; total: number }>;
  byAssignee: Array<{ assigneeId: string | null; name: string; open: number; completed: number }>;
  trend30d: Array<{ date: string; created: number; completed: number }>;
}

/**
 * Aggregate task analytics for the Tasks panel analytics strip.
 * One pass over the org's last-90-days followups (small table); shaped
 * server-side so the frontend renders without computing.
 */
export async function getFollowupAnalytics(orgId: string): Promise<FollowupAnalytics> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin()
    .from('lead_followups')
    .select('status, type, source, assigned_to, scheduled_at, created_at, completed_at, assignee:organization_members!assigned_to(full_name)')
    .eq('org_id', orgId)
    .gte('created_at', since);
  if (error) throw error;
  const rows = (data ?? []) as any[];

  const now = Date.now();
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const totals = { open: 0, completed: 0, missed: 0, cancelled: 0, overdue: 0, dueToday: 0 };
  let completedWithTime = 0, hoursSum = 0;
  const bySource = new Map<string, { open: number; total: number }>();
  const byType = new Map<string, { open: number; total: number }>();
  const byAssignee = new Map<string, { assigneeId: string | null; name: string; open: number; completed: number }>();
  const trend = new Map<string, { created: number; completed: number }>();

  for (const r of rows) {
    const status = String(r.status);
    if (status in totals) (totals as any)[status]++;
    const sched = r.scheduled_at ? new Date(r.scheduled_at).getTime() : null;
    if (status === 'pending' && sched && sched < now) totals.overdue++;
    if (status === 'pending' && sched && sched <= todayEnd.getTime()) totals.dueToday++;
    if (status === 'completed' && r.completed_at) {
      const h = (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / 3_600_000;
      if (h >= 0 && h < 24 * 365) { hoursSum += h; completedWithTime++; }
    }
    const srcKey = String(r.source ?? 'manual');
    const src = bySource.get(srcKey) ?? { open: 0, total: 0 };
    if (status === 'pending') src.open++;
    src.total++;
    bySource.set(srcKey, src);
    const typeKey = String(r.type ?? 'other');
    const typ = byType.get(typeKey) ?? { open: 0, total: 0 };
    if (status === 'pending') typ.open++;
    typ.total++;
    byType.set(typeKey, typ);
    const aKey = r.assigned_to ?? 'unassigned';
    const asg = byAssignee.get(aKey) ?? {
      assigneeId: r.assigned_to ?? null,
      name: (Array.isArray(r.assignee) ? r.assignee[0]?.full_name : r.assignee?.full_name) ?? 'Unassigned',
      open: 0, completed: 0,
    };
    if (status === 'pending' || status === 'missed') asg.open++;
    if (status === 'completed') asg.completed++;
    byAssignee.set(aKey, asg);
    const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
    const cDay = dayKey(r.created_at);
    const cT = trend.get(cDay) ?? { created: 0, completed: 0 };
    cT.created++;
    trend.set(cDay, cT);
    if (r.completed_at) {
      const dDay = dayKey(r.completed_at);
      const dT = trend.get(dDay) ?? { created: 0, completed: 0 };
      dT.completed++;
      trend.set(dDay, dT);
    }
  }

  const terminal = totals.completed + totals.missed + totals.cancelled;
  const bySourceArr = [...bySource.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.total - a.total);
  const byTypeArr = [...byType.entries()].map(([type, v]) => ({ type, ...v })).sort((a, b) => b.total - a.total);
  const byAssigneeArr = [...byAssignee.values()].sort((a, b) => (b.open + b.completed) - (a.open + a.completed));
  const trend30d: Array<{ date: string; created: number; completed: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const t = trend.get(d);
    trend30d.push({ date: d, created: t?.created ?? 0, completed: t?.completed ?? 0 });
  }

  return {
    totals,
    completionRatePct: terminal + totals.open > 0 ? Math.round((totals.completed / (terminal + totals.open)) * 100) : 0,
    avgHoursToComplete: completedWithTime > 0 ? Math.round((hoursSum / completedWithTime) * 10) / 10 : null,
    bySource: bySourceArr,
    byType: byTypeArr,
    byAssignee: byAssigneeArr,
    trend30d,
  };
}

export interface AutoTaskRule {
  outcome: string;
  type: string;
  title: string;
  priority?: string;
  due_offset_hours?: number;
}

/**
 * Pure: pick the first matching auto-task rule for an AI outcome and build the
 * task payload. Exported for unit tests. Returns null when no rule matches.
 */
export function mapAutoTask(
  outcome: string | null | undefined,
  rules: AutoTaskRule[] | null | undefined,
  leadName: string | null | undefined,
  callSessionId?: string | null
): { type: string; title: string; priority: string; due_offset_hours: number; call_session_id?: string | null } | null {
  if (!outcome || !Array.isArray(rules)) return null;
  const rule = rules.find((r) => r && r.outcome === outcome);
  if (!rule) return null;
  const name = (leadName ?? '').trim() || 'the customer';
  return {
    type: rule.type || 'other',
    title: String(rule.title || 'Follow up {lead}').replace(/\{lead\}/g, name),
    priority: rule.priority || 'medium',
    due_offset_hours: Number.isFinite(rule.due_offset_hours) ? Number(rule.due_offset_hours) : 24,
    call_session_id: callSessionId ?? null,
  };
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