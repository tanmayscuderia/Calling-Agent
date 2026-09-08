/**
 * Backfill utility: re-run inbound call ingestion over a wider window than
 * the live poller (which only looks back 24h). Uses the analytics
 * INTERACTIONS endpoint (raw caller phone via user_contact).
 *
 * Usage: npx tsx scripts/backfill-attempts.ts --days 8
 * Safe to re-run — ingestInboundAttempt dedupes on (org_id, external_call_id).
 */
import { listInteractions } from '../src/sarvam/sarvamClient';
import { ingestInboundAttempt } from '../src/sarvam/callResultService';
import { config } from '../src/config';

(async () => {
  const daysIdx = process.argv.indexOf('--days');
  const days = Number(daysIdx !== -1 ? process.argv[daysIdx + 1] : '3') || 3;
  const orgId = config.sarvam.defaultOrgId;
  if (!orgId) {
    console.error('SARVAM_DEFAULT_ORG_ID missing');
    process.exit(1);
  }
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
  const items = (page?.items ?? []) as any[];
  console.log(`Found ${items.length} inbound interactions in the last ${days} day(s)`);
  let ingested = 0, duplicate = 0, skipped = 0, failed = 0;
  for (const it of items) {
    const label = it.interaction_id;
    const att = {
      attempt_id: '',
      user_identifier: it.user_contact ?? it.user_identifier ?? '',
      interaction_id: it.interaction_id,
      connectivity_status: null,
      duration_in_seconds: it.duration_in_seconds,
      start_datetime: it.start_datetime,
      agent_variables: it.agent_variables ?? null,
      failure_reason: it.failure_reason ?? null,
      audio_url: it.audio_url ?? null,
      ended_by: it.ended_by ?? null,
    };
    try {
      const r = await ingestInboundAttempt(orgId, att as any);
      if (r === 'processed') { ingested++; console.log('  + ingested:', label); }
      else if (r === 'duplicate') { duplicate++; console.log('  = duplicate:', label); }
      else { skipped++; console.log('  - skipped:', label, `(${r})`); }
    } catch (e: any) {
      failed++; console.error('  ! failed:', label, e?.message);
    }
  }
  console.log(`Done. ingested=${ingested} duplicate=${duplicate} skipped=${skipped} failed=${failed}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
