/**
 * Cached LLM Wrapper for Evals
 *
 * Wraps llm.generateText / llm.generateJson with a file-based cache.
 * First run hits the real API and saves the response.
 * Subsequent runs return the cached response — zero API calls, zero cost.
 *
 * Cache key: SHA-256 of (userPrompt + systemPrompt + model + options)
 * Cache file: tests/evals/.cache/llm-responses.json
 *
 * Env vars:
 *   EVAL_NO_CACHE=1   — bypass cache, always hit API
 *   EVAL_DRY_RUN=1    — skip API entirely, return mock response
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { llm, type LlmResponse, type ChatOptions } from '../../src/ai/llmClient';
import { incrementEvalCallCount, getEvalCallCount } from './evalGuard';

const CACHE_DIR = path.join(__dirname, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'llm-responses.json');

interface CacheEntry {
  response: string;
  model: string;
  cachedAt: string;
}

interface CacheData {
  version: number;
  entries: Record<string, CacheEntry>;
}

// --- Cache I/O ---

let cacheData: CacheData | null = null;
let cacheHits = 0;
let cacheMisses = 0;

function loadCache(): CacheData {
  if (cacheData) return cacheData;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } else {
      cacheData = { version: 1, entries: {} };
    }
  } catch {
    cacheData = { version: 1, entries: {} };
  }
  return cacheData!;
}

function saveCache(): void {
  if (!cacheData) return;
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
  } catch (err) {
    console.warn(`[llmCache] Failed to save cache: ${err}`);
  }
}

function cacheKey(userPrompt: string, systemPrompt: string, model: string, extra?: string): string {
  const payload = `${userPrompt}|||${systemPrompt}|||${model}|||${extra || ''}`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

// --- Public API ---

export function isDryRun(): boolean {
  return process.env.EVAL_DRY_RUN === 'true' || process.env.EVAL_DRY_RUN === '1';
}

export function isNoCache(): boolean {
  return process.env.EVAL_NO_CACHE === 'true' || process.env.EVAL_NO_CACHE === '1';
}

/**
 * Cached generateText — returns the same response for identical prompts.
 * Signature mirrors llm.generateText(userPrompt, systemPrompt?, opts?)
 */
export async function cachedGenerateText(
  userPrompt: string,
  systemPrompt?: string,
  opts?: ChatOptions
): Promise<LlmResponse> {
  const model = llm.activeModel;

  // Dry-run mode: return mock without hitting API
  if (isDryRun()) {
    return {
      text: '[DRY RUN] Mock response — no API call made.',
      model: 'dry-run',
      latencyMs: 0,
    };
  }

  const key = cacheKey(userPrompt, systemPrompt || '', model, JSON.stringify(opts || {}));

  // Check cache first (unless bypass is set)
  if (!isNoCache()) {
    const cache = loadCache();
    if (cache.entries[key]) {
      cacheHits++;
      return {
        text: cache.entries[key].response,
        model: cache.entries[key].model,
        latencyMs: 0,
      };
    }
  }

  // Cache miss — hit real API
  cacheMisses++;
  incrementEvalCallCount();

  const response = await llm.generateText(userPrompt, systemPrompt, opts);

  // Save to cache
  if (!isNoCache()) {
    const cache = loadCache();
    cache.entries[key] = {
      response: response.text,
      model: response.model,
      cachedAt: new Date().toISOString(),
    };
    saveCache();
  }

  return response;
}

interface CachedJsonResponse {
  data: any;
  raw: string;
  model: string;
  latencyMs: number;
}

/**
 * Cached generateJson — returns the same parsed JSON for identical prompts.
 * Signature mirrors llm.generateJson(userPrompt, systemPrompt?, opts?)
 */
export async function cachedGenerateJson(
  userPrompt: string,
  systemPrompt?: string,
  opts?: { temperature?: number; thinking?: boolean }
): Promise<CachedJsonResponse> {
  const model = llm.activeModel;

  // Dry-run mode: return mock JSON
  if (isDryRun()) {
    return {
      data: { mock: true, message: 'DRY RUN — no API call' },
      raw: '{"mock":true}',
      model: 'dry-run',
      latencyMs: 0,
    };
  }

  const key = cacheKey(userPrompt, systemPrompt || '', model, `json:${JSON.stringify(opts || {})}`);

  // Check cache
  if (!isNoCache()) {
    const cache = loadCache();
    if (cache.entries[key]) {
      cacheHits++;
      try {
        const parsed = JSON.parse(cache.entries[key].response);
        return {
          data: parsed,
          raw: cache.entries[key].response,
          model: cache.entries[key].model,
          latencyMs: 0,
        };
      } catch {
        // Cache corruption — fall through to API call
      }
    }
  }

  // Cache miss
  cacheMisses++;
  incrementEvalCallCount();

  const response = await llm.generateJson(userPrompt, systemPrompt, opts);

  // Save to cache (store the raw JSON string)
  if (!isNoCache()) {
    const cache = loadCache();
    const rawStr = response.raw || JSON.stringify(response.data);
    cache.entries[key] = {
      response: rawStr,
      model: response.model,
      cachedAt: new Date().toISOString(),
    };
    saveCache();
  }

  return response;
}

/**
 * Print cache statistics at the end of an eval run.
 */
export function printCacheStats(label?: string): void {
  const tag = label ? `[${label}]` : '[eval]';
  const total = cacheHits + cacheMisses;
  if (total === 0) {
    console.log(`📦 ${tag} No LLM calls made.`);
    return;
  }

  const hitRate = Math.round((cacheHits / total) * 100);
  console.log('');
  console.log(`📦 ${tag} LLM Cache Stats:`);
  console.log(`   Cache hits:   ${cacheHits} (free)`);
  console.log(`   Cache misses: ${cacheMisses} (API calls)`);
  console.log(`   Hit rate:     ${hitRate}%`);

  if (cacheMisses > 0) {
    console.log(`   💡 Re-run without changes to get ${cacheMisses} more cached responses.`);
  }

  console.log(`   📊 Total eval API calls this session: ${getEvalCallCount()}`);
  console.log('');
}

/**
 * Reset cache stats (useful between test files).
 */
export function resetCacheStats(): void {
  cacheHits = 0;
  cacheMisses = 0;
}

// ============================================================
// Monkey-Patch Mode
// Instead of changing every llm.generateText/generateJson call site,
// call installEvalCache() once in a beforeAll hook. It wraps the
// singleton's methods so all existing eval calls get cached automatically.
// ============================================================

/**
 * Install the cache wrapper on the llm singleton.
 * Call this once in a beforeAll() hook in each eval file.
 * All subsequent llm.generateText / llm.generateJson calls will be cached.
 */
export function installEvalCache(): void {
  // Save original methods
  const originalGenerateText = llm.generateText.bind(llm);
  const originalGenerateJson = llm.generateJson.bind(llm);

  // Replace generateText with cached version
  (llm as any).generateText = async function (
    userPrompt: string,
    systemPrompt?: string,
    opts?: ChatOptions
  ): Promise<LlmResponse> {
    if (isDryRun()) {
      return { text: '[DRY RUN]', model: 'dry-run', latencyMs: 0 };
    }

    const model = llm.activeModel;
    const key = cacheKey(userPrompt, systemPrompt || '', model, JSON.stringify(opts || {}));

    if (!isNoCache()) {
      const cache = loadCache();
      if (cache.entries[key]) {
        cacheHits++;
        return { text: cache.entries[key].response, model: cache.entries[key].model, latencyMs: 0 };
      }
    }

    cacheMisses++;
    incrementEvalCallCount();
    const response = await originalGenerateText(userPrompt, systemPrompt, opts);

    if (!isNoCache()) {
      const cache = loadCache();
      cache.entries[key] = { response: response.text, model: response.model, cachedAt: new Date().toISOString() };
      saveCache();
    }

    return response;
  };

  // Replace generateJson with cached version
  (llm as any).generateJson = async function (
    userPrompt: string,
    systemPrompt?: string,
    opts?: { temperature?: number; thinking?: boolean }
  ): Promise<{ data: any; raw: string; model: string; latencyMs: number }> {
    if (isDryRun()) {
      return { data: { mock: true }, raw: '{"mock":true}', model: 'dry-run', latencyMs: 0 };
    }

    const model = llm.activeModel;
    const key = cacheKey(userPrompt, systemPrompt || '', model, `json:${JSON.stringify(opts || {})}`);

    if (!isNoCache()) {
      const cache = loadCache();
      if (cache.entries[key]) {
        cacheHits++;
        try {
          const parsed = JSON.parse(cache.entries[key].response);
          return { data: parsed, raw: cache.entries[key].response, model: cache.entries[key].model, latencyMs: 0 };
        } catch {
          // fall through
        }
      }
    }

    cacheMisses++;
    incrementEvalCallCount();
    const response = await originalGenerateJson(userPrompt, systemPrompt, opts);

    if (!isNoCache()) {
      const cache = loadCache();
      const rawStr = response.raw || JSON.stringify(response.data);
      cache.entries[key] = { response: rawStr, model: response.model, cachedAt: new Date().toISOString() };
      saveCache();
    }

    return response;
  };
}
