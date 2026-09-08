/** ONE-TIME repair: sessions backfilled before the stableAnonPhone fix got
 *  garbage normalized phones (+220537-style). Re-derives the deterministic
 *  phone from each session's interaction_id and patches the lead. */
import { supabaseAdmin } from '../src/db/supabase';
import { stableAnonPhone } from '../src/sarvam/callResultService';

(async () => {
  const sb = supabaseAdmin();
  const { data: sessions, error } = await sb
    .from('call_sessions')
    .select('id, lead_id, from_number, metadata, created_at')
    .gte('created_at', '2026-09-06T00:00:00Z')
    .eq('direction', 'inbound');
  if (error) throw error;
  console.log(`sessions to repair: ${sessions?.length ?? 0}`);
  for (const s of sessions ?? []) {
    const meta: any = s.metadata ?? {};
    const interactionId = String(meta.interaction_id ?? '').trim();
    if (!interactionId || !s.lead_id) { console.log('  skip (no interaction/lead):', s.id); continue; }
    const correctPhone = '+' + stableAnonPhone(interactionId.replaceAll('/', '_'));
    if (s.from_number === correctPhone) { console.log('  ok:', s.from_number); continue; }
    const { error: upErr } = await sb
      .from('crm_leads')
      .update({ phone: correctPhone, whatsapp_number: correctPhone })
      .eq('id', s.lead_id);
    if (upErr) { console.error('  PATCH failed:', upErr.message); continue; }
    await sb.from('call_sessions').update({ from_number: correctPhone }).eq('id', s.id);
    console.log(`  fixed: ${s.from_number} -> ${correctPhone} (${interactionId})`);
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
