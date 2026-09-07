import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryKv } from '../../src/kv/memoryKv';
import { getKv, resetKvForTests } from '../../src/kv';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('MemoryKv', () => {
  let kv: MemoryKv;
  beforeEach(() => {
    kv = new MemoryKv();
  });

  it('incrWithTtl counts up within the window', async () => {
    expect(await kv.incrWithTtl('k', 5_000)).toBe(1);
    expect(await kv.incrWithTtl('k', 5_000)).toBe(2);
    expect(await kv.incrWithTtl('k', 5_000)).toBe(3);
  });

  it('incrWithTtl resets after the TTL expires', async () => {
    expect(await kv.incrWithTtl('k', 30)).toBe(1);
    await sleep(45);
    expect(await kv.incrWithTtl('k', 30)).toBe(1); // fresh window
  });

  it('incrWithTtl keys are independent', async () => {
    await kv.incrWithTtl('a', 5_000);
    await kv.incrWithTtl('a', 5_000);
    expect(await kv.incrWithTtl('b', 5_000)).toBe(1);
    expect(await kv.incrWithTtl('a', 5_000)).toBe(3);
  });

  it('decrFloorZero never goes below zero', async () => {
    expect(await kv.decrFloorZero('missing')).toBe(0);
    await kv.incrWithTtl('k', 5_000);
    expect(await kv.decrFloorZero('k')).toBe(0);
    expect(await kv.decrFloorZero('k')).toBe(0); // floored
    await kv.incrWithTtl('k', 5_000);
    expect(await kv.decrFloorZero('k')).toBe(0); // was 1, now 0
  });

  it('setJson/getJson round-trips and respects TTL', async () => {
    await kv.setJson('k', { a: 1, nested: { b: 'x' } }, 5_000);
    expect(await kv.getJson('k')).toEqual({ a: 1, nested: { b: 'x' } });
    await kv.setJson('k', { a: 2 }, 30);
    await sleep(45);
    expect(await kv.getJson('k')).toBeNull();
  });

  it('getJson returns null for missing keys', async () => {
    expect(await kv.getJson('nope')).toBeNull();
  });

  it('del removes a key', async () => {
    await kv.setJson('k', 42);
    await kv.del('k');
    expect(await kv.getJson('k')).toBeNull();
  });

  it('bumpVersion/getVersion implement monotonic counters', async () => {
    expect(await kv.getVersion('v')).toBe(0);
    expect(await kv.bumpVersion('v')).toBe(1);
    expect(await kv.bumpVersion('v')).toBe(2);
    expect(await kv.getVersion('v')).toBe(2);
  });

  it('healthy() is true and close() clears state', async () => {
    expect(kv.healthy()).toBe(true);
    await kv.setJson('k', 1);
    await kv.close();
    expect(await kv.getJson('k')).toBeNull();
  });
});

describe('KV factory (no REDIS_URL)', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
    resetKvForTests();
  });

  it('falls back to the in-memory backend', async () => {
    const kv = await getKv();
    expect(kv.mode).toBe('memory');
    expect(kv.healthy()).toBe(true);
  });

  it('returns the same singleton across calls', async () => {
    const a = await getKv();
    const b = await getKv();
    expect(a).toBe(b);
  });
});
