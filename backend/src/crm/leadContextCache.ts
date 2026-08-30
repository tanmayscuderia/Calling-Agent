/**
 * In-memory cache for the Sarvam on_start lead-context hook (per phone).
 *
 * Why: every call fires lead-context at call start; repeat calls to the same
 * number within a few minutes re-run the same Supabase lookups over the
 * tunnel. A 5-min cache keeps call-start latency near zero.
 *
 * SAFETY RULES:
 *  - ONLY found-lead payloads are cached. An unknown caller must stay uncached
 *    so a lead created seconds later is visible immediately.
 *  - clearLeadContextCache() runs after every finalized call result
 *    (processCallResultJob) — a call that just ended may have changed the
 *    lead's status/notes/enrichment, and stale context must never serve the
 *    next call within the TTL.
 */

interface LeadCacheEntry { body: Record<string, any>; ts: number; }
const cache = new Map<string, LeadCacheEntry>();
const LEAD_CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const LEAD_CACHE_MAX = 500;

/** Returns the cached payload for this caller, or null on miss/expiry. */
export function leadCacheGet(orgId: string, phone: string): Record<string, any> | null {
  const hit = cache.get(`${orgId}:${phone}`);
  if (!hit) return null;
  if (Date.now() - hit.ts > LEAD_CACHE_TTL_MS) {
    cache.delete(`${orgId}:${phone}`);
    return null;
  }
  return hit.body;
}

/** Cache a found-lead payload for this caller. */
export function leadCacheSet(orgId: string, phone: string, body: Record<string, any>): void {
  if (cache.size >= LEAD_CACHE_MAX) {
    // Map preserves insertion order — drop the oldest entry
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(`${orgId}:${phone}`, { body, ts: Date.now() });
}

/** Drop ALL entries — cheap; the cache repopulates on the next call. */
export function clearLeadContextCache(): void {
  cache.clear();
}