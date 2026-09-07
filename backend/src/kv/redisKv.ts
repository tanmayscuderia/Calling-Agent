import Redis from 'ioredis';
import { logger } from '../utils/logger';
import type { KvStore } from './kvStore';

/**
 * Redis-backed KvStore (ioredis).
 *
 * Notes on the atomic ops:
 *  - incrWithTtl uses INCR + PEXPIRE NX: the TTL is set only when absent, so
 *    the window is fixed from the first increment and a crash between INCR
 *    and EXPIRE cannot leave an immortal key.
 *  - decrFloorZero is a tiny Lua script so the floor-at-zero check + decrement
 *    are atomic (two processes racing plain DECR could drive it negative and
 *    permanently skew a semaphore).
 */
export class RedisKv implements KvStore {
  readonly mode = 'redis' as const;
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      connectTimeout: 2_000,
      // Keep the process alive even if Redis drops; healthy() reports state.
      enableOfflineQueue: false,
    });
    this.client.on('error', (err) => {
      logger.warn({ err: err.message }, '[KV] Redis error — callers should fall back per-operation');
    });
  }

  async incrWithTtl(key: string, ttlMs: number): Promise<number> {
    const n = await this.client.incr(key);
    await this.client.pexpire(key, ttlMs, 'NX');
    return n;
  }

  async decrFloorZero(key: string): Promise<number> {
    const script = `
      local v = redis.call('GET', KEYS[1])
      if not v then return 0 end
      v = tonumber(v)
      if v <= 0 then return 0 end
      redis.call('DECR', KEYS[1])
      return v - 1
    `;
    const n = await this.client.eval(script, 1, key);
    return Number(n);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  async setJson<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlMs) {
      await this.client.set(key, raw, 'PX', ttlMs);
    } else {
      await this.client.set(key, raw);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async bumpVersion(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async getVersion(key: string): Promise<number> {
    const v = await this.client.get(key);
    return v === null ? 0 : Number(v);
  }

  healthy(): boolean {
    return this.client.status === 'ready';
  }

  async close(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
