import type { KvStore } from './kvStore';

/**
 * In-memory KvStore — the zero-dependency default.
 * Mirrors today's Map-based behavior exactly: correct within one process,
 * lazy (access-time) expiry, no persistence. Used whenever REDIS_URL is not
 * configured or Redis is unreachable at boot.
 */
interface CounterEntry {
  n: number;
  expiresAt: number;
}

export class MemoryKv implements KvStore {
  readonly mode = 'memory' as const;
  private counters = new Map<string, CounterEntry>();
  private json = new Map<string, { v: unknown; expiresAt: number | null }>();
  private versions = new Map<string, number>();

  async incrWithTtl(key: string, ttlMs: number): Promise<number> {
    const now = Date.now();
    const hit = this.counters.get(key);
    if (!hit || hit.expiresAt <= now) {
      this.counters.set(key, { n: 1, expiresAt: now + ttlMs });
      return 1;
    }
    hit.n += 1;
    return hit.n;
  }

  async decrFloorZero(key: string): Promise<number> {
    const hit = this.counters.get(key);
    if (!hit || hit.n <= 0) return 0;
    hit.n -= 1;
    return hit.n;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const hit = this.json.get(key);
    if (!hit) return null;
    if (hit.expiresAt !== null && hit.expiresAt <= Date.now()) {
      this.json.delete(key);
      return null;
    }
    return structuredClone(hit.v) as T;
  }

  async setJson<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.json.set(key, {
      v: structuredClone(value),
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    });
  }

  async del(key: string): Promise<void> {
    this.json.delete(key);
  }

  async bumpVersion(key: string): Promise<number> {
    const next = (this.versions.get(key) ?? 0) + 1;
    this.versions.set(key, next);
    return next;
  }

  async getVersion(key: string): Promise<number> {
    return this.versions.get(key) ?? 0;
  }

  healthy(): boolean {
    return true;
  }

  async close(): Promise<void> {
    this.counters.clear();
    this.json.clear();
    this.versions.clear();
  }
}
