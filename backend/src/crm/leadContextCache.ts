/**
 * Cache for the Sarvam on_start lead-context hook (per phone).
 *
 * Why: every call fires lead-context at call start; repeat calls to the same
 * number within a few minutes re-run the same Supabase lookups over the
 * tunnel. A 5-min cache keeps call-start latency near zero.
 *
 * SAFETY RULES:
 *  - ONLY found-lead payloads are cached. An unknown caller must stay uncached
 *    so a lead created seconds later is visible immediately.
 *  - clearLeadContextCache() runs after every finalized call result
 *    (processCallResultJob + inbound ingest) — a call that just ended may have
 *    changed the lead's status/notes/enrichment, and stale context must never
 *    serve the next call within the TTL.
 *
 * Storage: the KV layer — memory default (single process), Redis-shared when
 * REDIS_URL is set, so the WORKER's post-call invalidation reaches the API
 * process's cache in split topologies (WORKER_IN_PROCESS=false /
 * docker-compose api+worker). Invalidation = version bump: each entry embeds
 * the version it was written under; any mismatch is a miss — no key scans,
 * no pub/sub.
 *
 * NOTE: functions are async now (KV I/O). The old 500-entry LRU cap is gone —
 * the 5-min TTL bounds the entry count; at one entry per calling number the
 * footprint is negligible.
 */
import { getKv } from '../kv';

const VER_KEY = 'leadctx:ver';
const KEY = (orgId: string, phone: string) => `leadctx:${orgId}:${phone}`;
const LEAD_CACHE_TTL_MS = 5 * 60_000; // 5 minutes

interface LeadCacheEntry {
  ver: number;
  body: Record<string, any>;
}

/** Returns the cached payload for this caller, or null on miss/expiry/invalidation. */
export async function leadCacheGet(orgId: string, phone: string): Promise<Record<string, any> | null> {
  const kv = await getKv();
  const [ver, entry] = await Promise.all([
    kv.getVersion(VER_KEY),
    kv.getJson<LeadCacheEntry>(KEY(orgId, phone)),
  ]);
  if (!entry || entry.ver !== ver) return null; // bumped since write → stale
  return entry.body;
}

/** Cache a found-lead payload for this caller. */
export async function leadCacheSet(orgId: string, phone: string, body: Record<string, any>): Promise<void> {
  const kv = await getKv();
  const ver = await kv.getVersion(VER_KEY);
  await kv.setJson(KEY(orgId, phone), { ver, body }, LEAD_CACHE_TTL_MS);
}

/** Drop ALL entries — cheap; the cache repopulates on the next call. */
export async function clearLeadContextCache(): Promise<void> {
  const kv = await getKv();
  await kv.bumpVersion(VER_KEY);
}
