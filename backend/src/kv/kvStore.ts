/**
 * KV abstraction — one interface, two backends.
 *
 * Why: several pieces of shared state live in process-local Maps (rate-limit
 * counters, LLM concurrency semaphore, config/lead/snapshot caches). That is
 * correct while the API is a single process, and breaks the moment the
 * topology splits (WORKER_IN_PROCESS=false, 2+ API replicas, docker-compose
 * api+worker) — e.g. the worker's cache invalidation can no longer reach the
 * API process. This interface lets each piece opt into a shared backend
 * (Redis) when REDIS_URL is configured, while keeping the in-memory backend
 * as the zero-dependency default for dev, tests, and CI.
 *
 * SEMANTICS:
 *  - incrWithTtl: atomic counter that expires ttlMs after FIRST increment
 *    (Redis: INCR + PEXPIRE NX — no orphan keys, no TTL refresh per hit).
 *  - decrFloorZero: decrement, never below 0 (crash-safe semaphore release).
 *  - getJson/setJson: JSON-encoded values, optional TTL, lazy expiry.
 *  - bumpVersion/getVersion: cheap cross-process invalidation. Bump a
 *    version key; readers compare the version embedded in cached entries.
 */

export interface KvStore {
  readonly mode: 'memory' | 'redis';
  /** Atomic increment; expires ttlMs after first increment. Returns new value. */
  incrWithTtl(key: string, ttlMs: number): Promise<number>;
  /** Decrement, floored at 0. Returns the new value. */
  decrFloorZero(key: string): Promise<number>;
  /** JSON-encoded read; null on miss/expiry. Throws on Redis transport errors. */
  getJson<T>(key: string): Promise<T | null>;
  /** JSON-encoded write with optional TTL. */
  setJson<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  /** Delete one key. */
  del(key: string): Promise<void>;
  /** Increment a persistent version counter (never expires). Returns new value. */
  bumpVersion(key: string): Promise<number>;
  /** Read a version counter (0 when absent). */
  getVersion(key: string): Promise<number>;
  /** True when the backend is usable right now. */
  healthy(): boolean;
  close(): Promise<void>;
}
