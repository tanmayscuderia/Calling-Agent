/**
 * Unit Test: LLM Client — Reasoning Content Safety
 *
 * This test guards against the most dangerous bug we've had:
 * DeepSeek reasoning models return TWO fields:
 *   - `content`            → the actual customer-facing reply
 *   - `reasoning_content`  → internal chain-of-thought ("We need to...")
 *
 * If `content` is empty (rate limit, overload, model quirk), the OLD code
 * fell back to `reasoning_content`, leaking internal thoughts to WhatsApp users.
 *
 * This test mocks fetch() to simulate various DeepSeek response shapes and
 * verifies that reasoning_content is NEVER returned as output.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the config so we don't need real env vars
vi.mock('../../src/config', () => ({
  config: {
    llm: {
      provider: 'deepseek',
      deepseek: {
        apiKey: 'test-key-deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-v4-flash',
      },
      openai: {
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      },
    },
  },
}));

// Import AFTER mock is set up
import { llm } from '../../src/ai/llmClient';

// ── Helpers ──────────────────────────────────────────────

function makeDeepSeekResponse(opts: {
  content?: string;
  reasoningContent?: string;
  usage?: object;
}): Response {
  const message: any = {};
  if (opts.content !== undefined) message.content = opts.content;
  if (opts.reasoningContent !== undefined) message.reasoning_content = opts.reasoningContent;

  const json = {
    choices: [{ message, finish_reason: 'stop' }],
    usage: opts.usage ?? { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  };

  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeOpenAIResponse(content: string): Response {
  const json = {
    choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  };
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Tests ────────────────────────────────────────────────

describe('LLM Client — Reasoning Content Safety', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns content when both content and reasoning_content are present', async () => {
    fetchSpy.mockResolvedValue(
      makeDeepSeekResponse({
        content: 'Hi! We have a 3BHK in Sector 150. What is your budget?',
        reasoningContent: 'The customer is asking about 3BHK. I should check inventory...',
      })
    );

    const result = await llm.generateText('I want a 3BHK', 'You are a real estate agent');

    expect(result.text).toBe('Hi! We have a 3BHK in Sector 150. What is your budget?');
    expect(result.text).not.toContain('The customer is asking');
  });

  it('NEVER returns reasoning_content when content is empty (throws instead)', async () => {
    // Simulate the exact bug: content empty, reasoning_content has chain-of-thought
    const leakedThought = 'We need to respond to customer\'s latest message. Customer says budget is not an issue.';

    fetchSpy.mockResolvedValue(
      makeDeepSeekResponse({
        content: '', // ← empty!
        reasoningContent: leakedThought,
      })
    );

    // Should throw, NOT return the leaked thought
    await expect(
      llm.generateText('Budget is not an issue', 'You are a real estate agent')
    ).rejects.toThrow();

    // Verify it was called multiple times (retried)
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(1);
  });

  it('NEVER returns reasoning_content when content is whitespace only', async () => {
    fetchSpy.mockResolvedValue(
      makeDeepSeekResponse({
        content: '   \n  ', // whitespace only
        reasoningContent: 'Internal: customer seems interested in 3BHK properties.',
      })
    );

    await expect(
      llm.generateText('Tell me more', 'You are a real estate agent')
    ).rejects.toThrow();
  });

  it('NEVER returns reasoning_content when content is null/undefined', async () => {
    fetchSpy.mockResolvedValue(
      makeDeepSeekResponse({
        content: undefined as any, // null content
        reasoningContent: 'I should ask about their preferred location.',
      })
    );

    await expect(
      llm.generateText('Hi', 'You are a real estate agent')
    ).rejects.toThrow();
  });

  it('eventually succeeds if content comes back non-empty on retry', async () => {
    // First call: empty content (triggers retry)
    // Second call: proper content
    fetchSpy
      .mockResolvedValueOnce(
        makeDeepSeekResponse({
          content: '',
          reasoningContent: 'Thinking about what to say...',
        })
      )
      .mockResolvedValueOnce(
        makeDeepSeekResponse({
          content: 'Sure! What budget are you looking at?',
          reasoningContent: 'The customer wants property info.',
        })
      );

    const result = await llm.generateText('I need a house', 'You are a real estate agent');

    expect(result.text).toBe('Sure! What budget are you looking at?');
    expect(result.text).not.toContain('Thinking about');
    expect(fetchSpy.mock.calls.length).toBe(2); // retried once
  });

  it('returns content as-is when reasoning_content is absent (non-reasoning model)', async () => {
    fetchSpy.mockResolvedValue(
      makeDeepSeekResponse({
        content: 'Hello! How can I help you find a property today?',
        reasoningContent: undefined,
      })
    );

    const result = await llm.generateText('Hi', 'You are a real estate agent');

    expect(result.text).toBe('Hello! How can I help you find a property today?');
  });

  it('works with OpenAI-style responses (no reasoning_content field)', async () => {
    fetchSpy.mockResolvedValue(makeOpenAIResponse('Sure, I can help with that.'));

    const result = await llm.generateText('Help me', 'You are a real estate agent');

    expect(result.text).toBe('Sure, I can help with that.');
  });

  it('generateJson never leaks reasoning into parsed JSON output', async () => {
    // Even in JSON mode, if content is empty, it should fail
    fetchSpy.mockResolvedValue(
      makeDeepSeekResponse({
        content: '',
        reasoningContent: 'I need to extract the intent as JSON...',
      })
    );

    await expect(
      llm.generateJson('I want a 3BHK', 'Extract intent as JSON')
    ).rejects.toThrow();
  });

  it('generateJson returns parsed content (not reasoning) when content is valid JSON', async () => {
    fetchSpy.mockResolvedValue(
      makeDeepSeekResponse({
        content: JSON.stringify({
          intent: 'property_search',
          configuration: '3BHK',
          budget_max: 20000000,
        }),
        reasoningContent: 'Customer wants 3BHK around 2 crore...',
      })
    );

    const { data } = await llm.generateJson('I want a 3BHK around 2 crore', 'Extract intent');
    expect(data.intent).toBe('property_search');
    expect(data.configuration).toBe('3BHK');
    expect(data.budget_max).toBe(20000000);
  });
});

// ── Chain-of-thought pattern detection ───────────────────

describe('Chain-of-thought leak detection patterns', () => {
  /**
   * These are the actual patterns that leaked in production on 2026-07-10.
   * If any of these appear in LLM output, it's a reasoning leak.
   */
  const COT_PATTERNS = [
    "we need to respond",
    "we need to",
    "i should ask",
    "i should check",
    "i need to respond",
    "i need to extract",
    "let me think",
    "let me check",
    "let me look",
    "the customer is asking",
    "customer says",
    "customer wants",
    "i'll ask the",
    "i will ask the",
    "i think i should",
    "thinking about",
    "internal:",
    "my reasoning",
    "step 1:",
    "step 2:",
    "first, i",
    "next, i",
  ];

  const REAL_LEAKED_REPLY = "We need to respond to customer's latest message. Customer says budget is not an issue. But it should not be high rise.";

  it('flags the actual production leak', () => {
    const lower = REAL_LEAKED_REPLY.toLowerCase();
    const matched = COT_PATTERNS.some((p) => lower.includes(p));
    expect(matched).toBe(true);
  });

  it('does not flag legitimate customer-facing replies', () => {
    const legitimateReplies = [
      "Hi! We have a 3BHK in Sector 150. What's your budget?",
      "Sure, I can arrange a callback. What time works for you?",
      "Great! Demo Heights fits your requirements. Would you like a site visit?",
      "I don't see an exact match. Could you share your preferred location?",
      "Yes, we have 2 options matching this. Would you like more details?",
      // These phrases contain "let me" but are customer-facing, NOT chain-of-thought
      "Could you let me know your budget and preferred configuration?",
      "Sure, I'll check low-rise options. Could you let me know the configuration?",
    ];

    for (const reply of legitimateReplies) {
      const lower = reply.toLowerCase();
      const matched = COT_PATTERNS.some((p) => lower.includes(p));
      expect(matched, `False positive on legitimate reply: "${reply}"`).toBe(false);
    }
  });
});
