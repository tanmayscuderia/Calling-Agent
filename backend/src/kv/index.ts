import type { KvStore } from './kvStore';
import { MemoryKv } from './memoryKv';
import { RedisKv } from './redisKv';
import { logger } from '../utils/logger';

/**
 * KV factory — memory by default, Redis when REDIS_URL is set AND reachable.
 *
 * Init is once-per-process. If the Redis connection fails or times out at
 * boot we permanently fall back to memory for this process's lifetime and
 * log one loud warning: a half-connected backend would be worse than a
 * predictable local one. Call initKv() at process start (server.ts,
 * worker.ts); every consumer awaits getKv().
 *
 * NO REDIS_URL (dev/tests/CI) → memory. Nothing else about behavior changes.
 */
let instance: KvStore | null = null;
let initPromise: Promise<KvStore> | null = null;
let fallbackReason: string | null = null;

export function getKv(): Promise<KvStore> {
  if (instance) return Promise.resolve(instance);
  if (!initPromise) initPromise = initKv();
  return initPromise;
}

async function initKv(): Promise<KvStore> {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    instance = new MemoryKv();
    logger.info('[KV] mode=memory (REDIS_URL not set) — single-process shared state');
    return instance;
  }

  try {
    const store = new RedisKv(redisUrl);
    // Force a round-trip with a hard cap so a dead Redis can't hang boot.
    await Promise.race([
      (async () => {
        // Wait until ready, probing status.
        for (let i = 0; i < 20; i++) {
          if (store.healthy()) break;
          await new Promise((r) => setTimeout(r, 100));
        }
        if (!store.healthy()) throw new Error('not ready within 2s');
        await store.setJson('__kv:bootcheck', { t: Date.now() }, 5_000);
        await store.getJson('__kv:bootcheck');
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('boot check timed out')), 2_000)),
    ]);
    instance = store;
    logger.info('[KV] mode=redis — shared state active across processes');
    return store;
  } catch (err: any) {
    fallbackReason = err?.message ?? 'unknown';
    instance = new MemoryKv();
    logger.error(
      { err: fallbackReason },
      '[KV] REDIS_URL set but Redis unreachable — falling back to MEMORY for this process lifetime'
    );
    return instance;
  }
}

/** Test seam / forced re-init. */
export function resetKvForTests(): void {
  instance = null;
  initPromise = null;
  fallbackReason = null;
}

export function kvFallbackReason(): string | null {
  return fallbackReason;
}

export type { KvStore };
