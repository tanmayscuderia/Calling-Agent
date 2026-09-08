/**
 * Hydration: sessions whose lead is an anonymous/test placeholder get their
 * REAL caller phone (from the analytics interactions API, user_contact) —
 * a proper lead is found-or-created by that phone and the session is
 * re-pointed to it. Orphaned anon leads (no remaining sessions) are deleted.
 *
 * Usage: npx tsx scripts/hydrate-session-phones.ts --days 8
 */
import { supabaseAdmin } from '../src/db/supabase';
import { listInteractions } from '../src/sarvam/sarvamClient';
import { findOrCreateLead } from '../src/crm/leadService';
import { config } from '../src/config';

(async () => {
  const daysIdx = process.argv.indexOf('--days');
  const days = Number(daysIdx !== -1 ? process.argv[daysIdx + 1] : '8') || 8;
  const orgId = config.sarvam.defaultOrgId;
  if (!orgId) { console.error('SARVAM_DEFAULT_ORG_ID missing'); process.exit(1); }
  const sb = supabaseAdmin();

  // 1. Sessions with placeholder (anon) leads
  const { data: sessions, error } = await sb
    .from('call_sessions')
    .select('id, lead_id, from_number, metadata, created_at')
    .eq('direction', 'inbound').like('from_number', '+77*')
    .gte('created_at', new Date(Date.now() - days * 24 * 3600 * 1000).toISOString());
  if (error) throw error;
  const targets = (sessions ?? []).filter((s: any) => String(s.from_number ?? '').startsWith('+77'));
  console.log(`sessions to hydrate: ${targets.length}`);
  if (targets.length === 0) process.exit(0);

  // 2. interaction_id → real phone from the interactions API
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 3600 * 1000);
  const page = await listInteractions({
    startDatetime: start.toISOString(),
    endDatetime: now.toISOString(),
    limit: 100,
    sortBy: 'start_datetime',
    sortOrder: 'desc',
    filterConditions: [{ id: '1', field: 'channel_direction', operator: 'equals', value: 'inbound' }],
  });
  const contactByInteraction = new Map<string, string>();
  for (const it of ((page?.items ?? []) as any[])) {
    const raw = String(it.user_contact ?? '').trim();
    if (raw) contactByInteraction.set(String(it.interaction_id ?? '').replace(/\//g, '_'), raw);
  }
  console.log(`interactions with raw user_contact: ${contactByInteraction.size}`);

  // 3. Re-point each session to a real-phone lead
  let hydrated = 0, noContact = 0;
  const touchedAnonLeads = new Set<string>();
  for (const s of targets) {
    const meta: any = s.metadata ?? {};
    const iid = String(meta.interaction_id ?? '');
    const realPhone = contactByInteraction.get(iid.replace(/\//g, "_"));
    if (!realPhone) { noContact++; console.log('  - no raw contact for', iid); continue; }
    const lead = await findOrCreateLead({
      orgId,
      phone: realPhone,
      source: 'inbound_call',
      source_detail: 'Sarvam inbound deployment',
    });
    await sb.from('call_sessions').update({ lead_id: lead.id, from_number: realPhone }).eq('id', s.id);
    touchedAnonLeads.add(String(s.lead_id));
    hydrated++;
    console.log(`  + session ${s.id.slice(0, 8)} -> real lead ${lead.id.slice(0, 8)} (${realPhone})`);
  }

  // 4. Delete anon leads that no longer have any sessions
  let deleted = 0;
  for (const leadId of touchedAnonLeads) {
    const { count } = await sb.from('call_sessions').select('id', { count: 'exact', head: true }).eq('lead_id', leadId);
    if ((count ?? 0) === 0) {
      await sb.from('crm_leads').delete().eq('id', leadId);
      deleted++;
      console.log('  - deleted orphan anon lead', String(leadId).slice(0, 8));
    }
  }
  console.log(`Done. hydrated=${hydrated} noContact=${noContact} anonLeadsDeleted=${deleted}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
