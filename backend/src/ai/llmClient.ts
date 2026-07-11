import { config } from '../config';
import { logger } from '../utils/logger';
import { recordLlmCall } from './usageTracker';

// ============================================================
// LLM Hardening: Concurrency Limit, Retry, Timeout
// Prevents burst 429s, handles transient failures gracefully
// ============================================================

// Configurable via env: LLM_MAX_CONCURRENT=1 for eval runs to avoid rate limits
const MAX_CONCURRENT_LLM_CALLS = parseInt(process.env.LLM_MAX_CONCURRENT || '3', 10);
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 5;
// Minimum delay between LLM calls (ms) — set LLM_MIN_DELAY_MS=1500 for evals
const MIN_DELAY_MS = parseInt(process.env.LLM_MIN_DELAY_MS || '0', 10);
let lastCallTime = 0;

let activeLlmCalls = 0;
const llmWaitQueue: Array<() => void> = [];

/** Sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Concurrency limiter — ensures max N parallel LLM calls.
 * Excess callers queue up and are released FIFO.
 * This prevents fan-out 429 errors when many WhatsApp messages arrive at once.
 */
async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (activeLlmCalls >= MAX_CONCURRENT_LLM_CALLS) {
    await new Promise<void>(resolve => llmWaitQueue.push(resolve));
  }
  activeLlmCalls++;

  // Enforce minimum delay between calls (prevents rate-limit bursts during evals)
  if (MIN_DELAY_MS > 0) {
    const elapsed = Date.now() - lastCallTime;
    if (elapsed < MIN_DELAY_MS) {
      await sleep(MIN_DELAY_MS - elapsed);
    }
    lastCallTime = Date.now();
  }

  try {
    return await fn();
  } finally {
    activeLlmCalls--;
    const next = llmWaitQueue.shift();
    if (next) next();
  }
}

/**
 * Retry with exponential backoff + jitter.
 * Retries on: network errors, timeouts, 429 (rate limit), 5xx.
 * Does NOT retry on: 4xx (except 429) — those are permanent failures.
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      // Don't retry on client errors (except 429 rate limit)
      const status = err.status || err.statusCode;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }

      // Last attempt — give up
      if (attempt >= MAX_RETRIES) {
        throw err;
      }

      // Exponential backoff: 2s, 4s, 8s, 16s, 32s + jitter (max 1s)
      // Higher base than typical to handle DeepSeek rate limits during eval runs
      const isRateLimit = status === 429;
      const baseMs = isRateLimit ? 3000 : 1000;
      const backoff = Math.pow(2, attempt) * baseMs + Math.random() * 1000;
      logger.warn(
        { attempt: attempt + 1, maxRetries: MAX_RETRIES, backoffMs: Math.round(backoff), status, errMessage: err.message },
        'LLM call failed, retrying with backoff'
      );
      await sleep(backoff);
    }
  }

  throw lastError || new Error('LLM call failed after retries');
}

/** Get current concurrency stats (for monitoring endpoint) */
export function getLlmStats() {
  return {
    activeCalls: activeLlmCalls,
    maxConcurrent: MAX_CONCURRENT_LLM_CALLS,
    queued: llmWaitQueue.length,
  };
}

// ============================================================
// Types
// ============================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  text: string;
  model: string;
  latencyMs: number;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** Enable native JSON mode (response_format: json_object) */
  jsonMode?: boolean;
  /** Enable DeepSeek thinking/reasoning mode for complex tasks */
  thinking?: boolean;
  /** Reasoning effort when thinking is enabled: low | medium | high */
  reasoningEffort?: 'low' | 'medium' | 'high';
  /** Source tag for usage tracking: 'whatsapp' | 'eval' | 'playground' | 'call_demo' | 'other' */
  source?: string;
}

/**
 * Configurable LLM client supporting DeepSeek (default) and OpenAI.
 * Both expose an OpenAI-compatible /chat/completions endpoint.
 *
 * Hardened with:
 * - Concurrency limiting (max 3 parallel calls)
 * - Exponential backoff retry (max 5 attempts, aggressive on 429)
 * - 30s request timeout via AbortController
 *
 * DeepSeek docs: https://api-docs.deepseek.com
 * - Base URL: https://api.deepseek.com (no /v1 suffix)
 * - Models: deepseek-v4-flash (fast), deepseek-v4-pro (quality)
 * - JSON mode: response_format: { type: "json_object" }
 * - Thinking: thinking: { type: "enabled" }, reasoning_effort: "high"
 */
class LlmClient {
  private get provider() {
    const p = config.llm.provider;
    if (p === 'deepseek') return config.llm.deepseek;
    if (p === 'openai') return config.llm.openai;
    return config.llm.deepseek; // default to DeepSeek
  }

  get providerName(): string {
    return config.llm.provider;
  }

  get activeModel(): string {
    return this.provider.model;
  }

  isConfigured(): boolean {
    return !!this.provider.apiKey;
  }

  /**
   * Build the full API URL.
   * DeepSeek: https://api.deepseek.com/chat/completions (no /v1)
   * OpenAI: https://api.openai.com/v1/chat/completions
   */
  private get apiUrl(): string {
    const { baseUrl } = this.provider;
    // Normalize: strip trailing slash
    const base = baseUrl.replace(/\/+$/, '');
    return `${base}/chat/completions`;
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<LlmResponse> {
    const start = Date.now();
    const { apiKey, model } = this.provider;

    if (!apiKey) {
      logger.warn('LLM API key not set; returning fallback message');
      return {
        text: 'Thank you for your message. Our team will get back to you shortly.',
        model: 'fallback',
        latencyMs: Date.now() - start,
      };
    }

    // 🚨 Daily budget check — prevent cost overruns
    const source = opts.source ?? 'other';
    if (!recordLlmCall(source)) {
      logger.error({ source, model }, 'LLM call blocked — daily budget exhausted');
      return {
        text: 'Thank you for your message. Our team will get back to you shortly.',
        model: 'budget_exhausted',
        latencyMs: Date.now() - start,
      };
    }

    const body: any = {
      model,
      messages,
      temperature: opts.temperature ?? 0.4,
      stream: false,
    };

    // Native JSON mode — DeepSeek & OpenAI both support this
    if (opts.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    // DeepSeek thinking mode for complex reasoning (extraction, summaries)
    if (opts.thinking && config.llm.provider === 'deepseek') {
      body.thinking = { type: 'enabled' };
      body.reasoning_effort = opts.reasoningEffort ?? 'medium';
    }

    if (opts.maxTokens) {
      body.max_tokens = opts.maxTokens;
    } else {
      // Optimized default: 1024 tokens is plenty for WhatsApp replies + JSON extraction
      body.max_tokens = 1024;
    }

    logger.debug({ provider: config.llm.provider, model, jsonMode: opts.jsonMode, thinking: opts.thinking }, 'LLM chat request');

    // Wrapped: concurrency limit → retry with backoff → timeout
    const text = await withConcurrencyLimit(async () => {
      return withRetry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
          const res = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errText = await res.text();
            const error: any = new Error(`LLM error ${res.status}: ${errText}`);
            error.status = res.status;
            logger.error({ status: res.status, errText, provider: config.llm.provider }, 'LLM chat failed');
            throw error;
          }

          const json = await res.json();
          const choice = json?.choices?.[0];
          const content = choice?.message?.content ?? '';
          const reasoningContent = choice?.message?.reasoning_content ?? '';

          // ⚠️ CRITICAL: NEVER use reasoning_content as customer-facing output.
          // It's the model's internal chain-of-thought and must not be sent to users.
          if (!content.trim()) {
            const error: any = new Error('LLM returned empty content (possible rate limit or overload)');
            error.status = 429;
            logger.warn(
              { provider: config.llm.provider, model, hasReasoning: !!reasoningContent.trim() },
              'LLM returned empty content, will retry'
            );
            throw error;
          }

          // Log usage if available (DeepSeek returns usage stats)
          if (json?.usage) {
            logger.debug(
              {
                promptTokens: json.usage.prompt_tokens,
                completionTokens: json.usage.completion_tokens,
                totalTokens: json.usage.total_tokens,
              },
              'LLM token usage'
            );
          }

          return content;
        } catch (err: any) {
          // Translate AbortError to a meaningful error with status for retry logic
          if (err.name === 'AbortError') {
            const timeoutError: any = new Error(`LLM request timed out after ${REQUEST_TIMEOUT_MS}ms`);
            timeoutError.status = 408;
            throw timeoutError;
          }
          throw err;
        } finally {
          clearTimeout(timeout);
        }
      });
    });

    return { text, model, latencyMs: Date.now() - start };
  }

  /** Generate text from a single user prompt + optional system prompt. */
  async generateText(
    userPrompt: string,
    systemPrompt?: string,
    opts?: ChatOptions
  ): Promise<LlmResponse> {
    const messages: ChatMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
    return this.chat(messages, opts);
  }

  /**
   * Generate and parse JSON.
   * Uses native JSON mode (response_format) for reliable structured output.
   * Falls back to fence-stripping if the model wraps output in ```json blocks.
   */
  async generateJson(
    userPrompt: string,
    systemPrompt?: string,
    opts?: { temperature?: number; thinking?: boolean }
  ): Promise<{ data: any; raw: string; model: string; latencyMs: number }> {
    const res = await this.generateText(userPrompt, systemPrompt, {
      temperature: opts?.temperature ?? 0.1,
      jsonMode: true, // Enable native JSON mode
      thinking: opts?.thinking,
      // Thinking mode consumes tokens for reasoning (often 2000-3000).
      // Need much larger budget so content has room after reasoning.
      maxTokens: opts?.thinking ? 4096 : 1200,
    });

    // Fallback: if thinking mode returned empty content (all retries exhausted),
    // retry once WITHOUT thinking — JSON extraction is simple enough to work without it.
    if (!res.text.trim() && opts?.thinking) {
      logger.warn('Thinking mode returned empty content, retrying JSON without thinking mode');
      const fallbackRes = await this.generateText(userPrompt, systemPrompt, {
        temperature: opts?.temperature ?? 0.1,
        jsonMode: true,
        thinking: false,
        maxTokens: 1200,
      });
      res.text = fallbackRes.text;
      res.model = fallbackRes.model;
      res.latencyMs += fallbackRes.latencyMs;
    }

    const cleaned = stripJsonFences(res.text);
    try {
      return { data: JSON.parse(cleaned), raw: res.text, model: res.model, latencyMs: res.latencyMs };
    } catch (e) {
      logger.warn({ raw: res.text }, 'LLM JSON parse failed, attempting extraction');
      const extracted = extractJsonObject(cleaned);
      try {
        return { data: JSON.parse(extracted), raw: res.text, model: res.model, latencyMs: res.latencyMs };
      } catch {
        logger.error({ raw: res.text }, 'LLM JSON parse failed completely');
        return { data: {}, raw: res.text, model: res.model, latencyMs: res.latencyMs };
      }
    }
  }
}

function stripJsonFences(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function extractJsonObject(s: string): string {
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) return s.slice(first, last + 1);
  return s;
}

export const llm = new LlmClient();