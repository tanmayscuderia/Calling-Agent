import { listInteractions } from '../src/sarvam/sarvamClient';

(async () => {
  const now = new Date();
  const start = new Date(now.getTime() - 48 * 3600 * 1000);
  const page = await listInteractions({
    startDatetime: start.toISOString(),
    endDatetime: now.toISOString(),
    limit: 3,
    sortBy: 'start_datetime',
    sortOrder: 'desc',
  });
  const items = (page?.items ?? []) as any[];
  console.log('interactions returned:', items.length);
  for (const it of items.slice(0, 2)) {
    console.log('---');
    console.log('keys:', Object.keys(it).join(', '));
    console.log(JSON.stringify({
      interaction_id: it.interaction_id,
      user_contact: (it as any).user_contact ?? '(absent)',
      user_contact_masked: it.user_contact_masked ?? null,
      user_contact_hashed: String(it.user_contact_hashed ?? '').slice(0, 16) + '...',
    }, null, 1));
  }
  process.exit(0);
})().catch((e) => { console.error('ERR', e?.message || e); process.exit(1); });
