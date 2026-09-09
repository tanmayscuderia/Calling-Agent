/**
 * One-time cleanup: null out "phone numbers" that were actually WhatsApp
 * privacy LIDs (xxx@lid), channel JIDs (@newsletter) or status broadcasts
 * stored before the LID fix (jidToPhone domain guard + contactPhones map).
 *
 * - customer_conversations.customer_phone → NULL for junk chats
 * - crm_leads.phone/whatsapp_number → NULL **only** when they exactly match
 *   the junk value (a real phone from a call or another channel is kept)
 * - customer_messages.sender_phone → NULL for those conversations
 *
 * Idempotent — safe to re-run. Real phones are backfilled automatically
 * going forward once contact sync resolves the LID (contactPhones map).
 *
 * Usage: npx tsx scripts/fix-lid-phones.ts
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

  // 1) Junk conversations: LID chats, channels, status broadcasts
  const { data: convs, error } = await sb
    .from('customer_conversations')
    .select('id, lead_id, external_chat_id, customer_phone')
    .or('external_chat_id.ilike.*@lid,external_chat_id.ilike.*@newsletter,external_chat_id.eq.status@broadcast');

  if (error) {
    console.error('query failed:', error.message);
    process.exit(1);
  }
  console.log(`Found ${(convs ?? []).length} junk conversations (LID / newsletter / status)`);
  if (!convs || convs.length === 0) return;

  let convFixed = 0;
  let msgFixed = 0;
  let leadFixed = 0;
  const leadIds = new Set<string>();

  for (const conv of convs) {
    // 2) Null the conversation's fake phone
    if (conv.customer_phone) {
      const { error: e } = await sb
        .from('customer_conversations')
        .update({ customer_phone: null })
        .eq('id', conv.id);
      if (!e) convFixed++;
      else console.warn('conv update failed:', e.message);
    }

    // 3) Null fake phones on its messages
    if (conv.customer_phone) {
      const { error: e } = await sb
        .from('customer_messages')
        .update({ sender_phone: null })
        .eq('conversation_id', conv.id)
        .eq('sender_phone', conv.customer_phone);
      if (e) console.warn('msg update failed:', e.message);
      else msgFixed++;
    }

    // 4) Null the lead's phone ONLY if it exactly equals the junk value
    if (conv.lead_id) leadIds.add(conv.lead_id);
  }

  for (const leadId of leadIds) {
    const { data: lead } = await sb
      .from('crm_leads')
      .select('id, phone, whatsapp_number')
      .eq('id', leadId)
      .maybeSingle();
    if (!lead) continue;
    const junkValues = new Set(
      (convs ?? [])
        .filter((c: any) => c.lead_id === leadId && c.customer_phone)
        .map((c: any) => c.customer_phone as string)
    );
    const updates: Record<string, any> = {};
    if (lead.phone && junkValues.has(lead.phone)) updates.phone = null;
    if (lead.whatsapp_number && junkValues.has(lead.whatsapp_number)) updates.whatsapp_number = null;
    if (Object.keys(updates).length > 0) {
      const { error: e } = await sb.from('crm_leads').update(updates).eq('id', leadId);
      if (!e) {
        leadFixed++;
        console.log(`  lead ${leadId}: cleared ${Object.keys(updates).join(', ')}`);
      } else {
        console.warn('lead update failed:', e.message);
      }
    }
  }

  console.log(`\nDone. conversations fixed: ${convFixed}, message rows fixed: ${msgFixed}, leads fixed: ${leadFixed}`);
  console.log('Going forward: real phones auto-backfill when contact sync resolves the LID.');
}

main();