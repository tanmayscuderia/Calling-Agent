# DeepSeek Integration Guide

How DeepSeek is integrated into this project, and where to find specific API details.

> **DeepSeek is the default LLM provider.** OpenAI is supported as a fallback.
> Full local docs available at: [`deepseek-docs-md/pages/`](../deepseek-docs-md/pages/)

---

## Current Configuration

| Setting | Value | Source |
|---------|-------|--------|
| **Provider** | `deepseek` | `config.ts` → `LLM_PROVIDER` env |
| **Model** | `deepseek-v4-flash` | Hardcoded in `config.ts` (see below) |
| **Base URL** | `https://api.deepseek.com` | `DEEPSEEK_BASE_URL` env (no `/v1` suffix) |
| **Endpoint** | `POST /chat/completions` | OpenAI-compatible |
| **Auth** | `Bearer ${DEEPSEEK_API_KEY}` | Standard Bearer token |
| **JSON Mode** | `response_format: {type: "json_object"}` | Used in `generateJson()` |
| **API Key URL** | https://platform.deepseek.com/api_keys | |

> **Model is hardcoded:** The model is locked to `deepseek-v4-flash` in `backend/src/config.ts` (line 50) for maximum speed and lowest cost across all tasks (WhatsApp replies, call summaries, intent extraction). To change it, edit `config.ts` — the `DEEPSEEK_MODEL` env var is **not** read.
>
> ```typescript
> // backend/src/config.ts (line 46-53)
> deepseek: {
>   apiKey: required('DEEPSEEK_API_KEY'),
>   model: 'deepseek-v4-flash',  // ← hardcoded, not env-controlled
>   baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
> },
> ```

> **Deprecation Notice:** `deepseek-chat` and `deepseek-reasoner` deprecate on **2026/07/24**. We use `deepseek-v4-flash` which is the current model.
> See: [`deepseek-docs-md/pages/updates.md`](../deepseek-docs-md/pages/updates.md)

---

## Where DeepSeek Is Called

| File | Function | Method | Why |
|------|----------|--------|-----|
| `baseAgent.ts` | Intent extraction | `llm.generateJson()` | Extract structured data from customer message |
| `baseAgent.ts` | Reply generation | `llm.generateText()` | Generate natural WhatsApp reply |
| `callAgent.ts` | Call conversation | `llm.generateText()` | Agent responds each turn |
| `callAgent.ts` | Call summary | `llm.generateJson()` | Summarize call into outcome + temperature |

> **Note:** `realEstateAgent.ts` is the legacy real-estate-specific agent. New industries use `baseAgent.ts` which is config-driven via `agent_configs`.

---

## How Our LLM Client Works

```typescript
// backend/src/ai/llmClient.ts

// JSON mode — native structured output
await llm.generateJson(userPrompt, systemPrompt, {
  temperature: 0.1,   // Low temp for extraction
  thinking: true,     // Enable for complex reasoning
});

// Text generation — natural replies
await llm.generateText(userPrompt, systemPrompt, {
  temperature: 0.4,   // Slightly higher for natural tone
});
```

### Request Body (what we send to DeepSeek)

```json
{
  "model": "deepseek-v4-flash",
  "messages": [
    { "role": "system", "content": "You are a sales assistant..." },
    { "role": "user", "content": "I want a 3BHK in Noida" }
  ],
  "temperature": 0.4,
  "stream": false,
  "max_tokens": 4096,
  "response_format": { "type": "json_object" }
}
```

---

## DeepSeek Features We Use

### 1. JSON Mode (Native Structured Output)

DeepSeek supports `response_format: {type: "json_object"}` for reliable JSON.

We use this in:
- Intent extraction (customer message → structured data)
- Call summary generation

### 2. Thinking Mode (Reasoning)

DeepSeek V4 supports thinking/reasoning mode for complex tasks:

```json
{
  "thinking": { "type": "enabled" },
  "reasoning_effort": "high"
}
```

We optionally enable this for:
- Call summaries (complex reasoning about outcome)
- Edge-case qualification decisions

> **Thinking-mode fallback:** If the model returns an empty response in thinking mode (known issue), our LLM client automatically retries without thinking. See `llmClient.ts`.

### 3. OpenAI-Compatible API

DeepSeek uses the same request/response format as OpenAI `/chat/completions`.
This means:
- Same SDK works
- Same message structure
- Same parameters (`temperature`, `max_tokens`, etc.)
- Easy to switch between providers

**Local docs:** [`deepseek-docs-md/pages/index.md`](../deepseek-docs-md/pages/index.md)

---

## Cost Estimation

DeepSeek is significantly cheaper than OpenAI (~10x for similar tasks).

| Task | Approx Tokens | Cost (V4-flash) |
|------|---------------|-----------------|
| Intent extraction | ~500 in, ~200 out | ~$0.0002 |
| WhatsApp reply | ~800 in, ~150 out | ~$0.0002 |
| Call turn | ~1000 in, ~200 out | ~$0.0003 |
| Call summary | ~2000 in, ~300 out | ~$0.0006 |

---

## Rate Limits

| Tier | Limit |
|------|-------|
| Default | ~60 RPM (requests per minute) |
| Higher tiers | Available on request |

Our queue worker includes LLM concurrency limiting (`LLM_MAX_CONCURRENT`, default 3) and min-delay between calls (`LLM_MIN_DELAY_MS`) to stay within rate limits.

---

## Switching Between DeepSeek and OpenAI

```bash
# Use DeepSeek (default)
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-key

# Use OpenAI instead
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
```

No code changes needed — `llmClient.ts` handles both providers.

---

## Error Handling

Our client handles these DeepSeek errors gracefully:

| Error | What happens |
|-------|-------------|
| Missing API key | Returns fallback message, logs warning |
| Rate limited (429) | Retries with exponential backoff (5×: 3s → 6s → 12s → 24s → 48s + jitter) |
| Invalid model (400) | Throws error with DeepSeek's message |
| Timeout | Throws error, queue retries |
| Empty response (thinking mode) | Auto-retries without thinking mode |

All AI runs (including errors) are logged in the `ai_agent_runs` table with latency, model, input/output text, and error details.