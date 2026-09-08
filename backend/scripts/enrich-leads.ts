/**
 * Lead enrichment backfill: for every inbound call_session in the window,
 * fetch its transcript from Sarvam analytics and re-run the shared
 * finalization pipeline — LLM summary → whitelisted preference extraction
 * (city/config/budget/purpose/timeline) → temperature → caller_name →
 * follow-ups. Idempotent: finalizeCall re-patches the same session.
 *
 * Usage: npx tsx scripts/enrich-leads.ts --days 10
 */
import { supabaseAdmin } from '../src/db/supabase';
import { getInteractionTranscript, listInteractions } from '../src/sarvam/sarvamClient';
import { finalizeCall } from '../src/sarvam/callFinalizer';
import { config } from '../src/config';

(async () => {
  const daysIdx = process.argv.indexOf('--days');
  const days = Number(daysIdx !== -1 ? process.argv[daysIdx + 1] : '10') || 10;
  const orgId = config.sarvam.defaultOrgId;
  if (!orgId) { console.error('SARVAM_DEFAULT_ORG_ID missing'); process.exit(1); }
  const sb = supabaseAdmin();

  const { data: sessions, error } = await sb
    .from('call_sessions')
    .select('id, lead_id, status, duration_sec, started_at, ended_at, metadata, summary')
    .eq('direction', 'inbound')
    .not('lead_id', 'is', null)
    .gte('created_at', new Date(Date.now() - days * 24 * 3600 * 1000).toISOString());
  if (error) throw error;
  // Re-run friendly: sessions that already have a summary were enriched in a
  // previous pass — skip them so retry loops only pay LLM cost for failures.
  const targets = (sessions ?? []).filter((s: any) => !s.summary);
  console.log(`sessions in window: ${sessions?.length ?? 0}, needing enrichment: ${targets.length}`);

  const page = await listInteractions({
    startDatetime: new Date(Date.now() - days * 24 * 3600 * 1000).toISOString(),
    endDatetime: new Date().toISOString(),
    limit: 100,
    sortBy: 'start_datetime',
    sortOrder: 'desc',
    filterConditions: [{ id: '1', field: 'channel_direction', operator: 'equals', value: 'inbound' }],
  });
  const varsByIid = new Map<string, any>();
  for (const it of ((page?.items ?? []) as any[])) {
    if (it.agent_variables) varsByIid.set(String(it.interaction_id ?? '').replace(/\//g, '_'), it.agent_variables);
  }

  let enriched = 0, noTranscript = 0, failed = 0;
  for (const s of targets) {
    const iid = (s.metadata as any)?.interaction_id;
    if (!iid) continue;
    try {
      const details = await getInteractionTranscript(String(iid));
      const rows = ((details as any)?.messages ?? [])
        .map((t: any) => ({ role: String(t?.role ?? 'user'), text: String(t?.content ?? '') }))
        .filter((t: any) => t.text.trim());
      if (rows.length === 0) { noTranscript++; console.log('  - no transcript:', iid); continue; }

      await finalizeCall({
        orgId,
        callSessionId: s.id,
        leadId: s.lead_id,
        status: s.status === 'in_progress' ? 'completed' : String(s.status),
        transcriptRows: rows,
        durationSec: (s as any).duration_sec ?? null,
        startedAt: (s as any).started_at ?? null,
        agentVariables: varsByIid.get(String(iid).replace(/\//g, '_')) ?? null,
        extraPatch: {
          interaction_id: iid,
          ...((s as any).ended_at ? { ended_at: (s as any).ended_at } : {}),
        },
        persistTurns: true,
      });
      enriched++;
      console.log('  + enriched:', iid);
    } catch (e: any) {
      failed++;
      console.error('  ! failed:', iid, e?.message);
    }
  }
  console.log(`Done. enriched=${enriched} noTranscript=${noTranscript} failed=${failed}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
