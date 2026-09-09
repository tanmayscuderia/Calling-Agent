/**
 * One-time CRM cleanup for the pre-LID-fix era:
 *
 *   A) DELETE junk leads — source_detail is 'status@broadcast' or '*@newsletter'
 *      (status updates / followed channels are not people). Their
 *      conversations + messages go too (messages CASCADE on conversation).
 *
 *   B) MERGE same-phone duplicate leads — keep the OLDEST lead per phone,
 *      reassign conversations + messages + call_sessions to it, delete dupes.
 *      (Race condition pre-fix created e.g. 5 leads for one LID chat.)
 *
 *   C) NULL absurd phones (> 16 digits — anonymous-caller garbage).
 *
 * Idempotent. Usage: npx tsx scripts/cleanup-junk-leads.ts
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
  }
  const sb = createClient(url, key);

  let junkLeadsDeleted = 0;
  let dupesMerged = 0;
  let garbagePhonesNulled = 0;

  // ── A) Delete status/newsletter junk leads ─────────────────────────
  const { data: junk, error: junkErr } = await sb
    .from('crm_leads')
    .select('id, full_name, source_detail')
    .or('source_detail.eq.status@broadcast,source_detail.ilike.*@newsletter');
  if (junkErr) {
    console.error('junk query failed:', junkErr.message);
    process.exit(1);
  }
  console.log(`A) Junk leads to delete (status/newsletter): ${(junk ?? []).length}`);
  for (const lead of junk ?? []) {
    // conversations of this lead → delete their messages → delete conversations → delete lead
    const { data: convs } = await sb
      .from('customer_conversations')
      .select('id')
      .eq('lead_id', lead.id);
    const convIds = (convs ?? []).map((c: any) => c.id);
    for (const convId of convIds) {
      await sb.from('customer_messages').delete().eq('conversation_id', convId);
    }
    if (convIds.length > 0) {
      await sb.from('customer_conversations').delete().in('id', convIds);
    }
    const { error: delErr } = await sb.from('crm_leads').delete().eq('id', lead.id);
    if (delErr) {
      console.warn(`  skip ${lead.id} (${lead.full_name ?? '?'}): ${delErr.message}`);
    } else {
      junkLeadsDeleted++;
    }
  }
  console.log(`   deleted: ${junkLeadsDeleted}`);

  // ── B) Merge same-phone duplicate leads (keep oldest) ──────────────
  const { data: all, error: allErr } = await sb
    .from('crm_leads')
    .select('id, phone, whatsapp_number, full_name, created_at')
    .not('phone', 'is', null)
    .neq('phone', '')
    .order('created_at', { ascending: true });
  if (allErr) {
    console.error('leads query failed:', allErr.message);
    process.exit(1);
  }

  const groups = new Map<string, any[]>();
  for (const lead of all ?? []) {
    const norm = String(lead.phone).replace(/[^\d]/g, '');
    if (!norm) continue;
    if (!groups.has(norm)) groups.set(norm, []);
    groups.get(norm)!.push(lead);
  }

  console.log(`B) Same-phone duplicate groups: ${[...groups.values()].filter((g) => g.length > 1).length}`);
  for (const [phone, group] of groups) {
    if (group.length < 2) continue;
    const keeper = group[0]; // oldest (sorted by created_at)
    const dupes = group.slice(1);
    console.log(`   ${phone}: keeping ${keeper.id} (${keeper.created_at?.slice(0, 10)}), merging ${dupes.length} dupe(s)`);
    for (const dupe of dupes) {
      // Preserve history: reassign everything to the keeper
      await sb.from('customer_conversations').update({ lead_id: keeper.id }).eq('lead_id', dupe.id);
      await sb.from('customer_messages').update({ lead_id: keeper.id }).eq('lead_id', dupe.id);
      await sb.from('call_sessions').update({ lead_id: keeper.id }).eq('lead_id', dupe.id);
      await sb.from('ai_agent_runs').update({ lead_id: keeper.id }).eq('lead_id', dupe.id);
      const { error: delErr } = await sb.from('crm_leads').delete().eq('id', dupe.id);
      if (delErr) {
        console.warn(`   dupe delete failed (${dupe.id}): ${delErr.message}`);
      } else {
        dupesMerged++;
      }
    }
  }
  console.log(`   dupes merged: ${dupesMerged}`);

  // ── C) Null absurd phones (> 16 digits — anonymous-caller garbage) ─
  const { data: longs } = await sb
    .from('crm_leads')
    .select('id, phone')
    .not('phone', 'is', null)
    .neq('phone', '');
  for (const lead of longs ?? []) {
    if (String(lead.phone).replace(/[^\d]/g, '').length > 15) {
      await sb.from('crm_leads').update({ phone: null, whatsapp_number: null }).eq('id', lead.id);
      garbagePhonesNulled++;
      console.log(`   nulled ${String(lead.phone).slice(0, 20)}… (${lead.id})`);
    }
  }
  console.log(`C) garbage phones nulled: ${garbagePhonesNulled}`);

  console.log(`\nDone. junk deleted: ${junkLeadsDeleted}, dupes merged: ${dupesMerged}, garbage phones nulled: ${garbagePhonesNulled}`);
}

main();