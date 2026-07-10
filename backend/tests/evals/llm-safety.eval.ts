/**
 * LLM Safety Eval — Chain-of-Thought Leak Prevention
 *
 * This eval makes REAL LLM calls and checks that responses are clean,
 * customer-facing messages — never leaked chain-of-thought or reasoning content.
 *
 * It tests the exact scenarios that caused the production bug on 2026-07-10:
 *   1. Long conversations where context might confuse the model
 *   2. Messages about budget/preferences (where the leak happened)
 *   3. Short/vague messages that might trigger internal reasoning
 *   4. JSON extraction mode (reasoning can leak into JSON too)
 *
 * This eval runs in CI/CD before any production deployment.
 */
import { describe, it, expect } from 'vitest';
import { llm } from '../../src/ai/llmClient';
import { realEstateSystemPrompt } from '../../src/ai/prompts';
import { assertNoChainOfThought, assertCustomerFacingQuality } from './eval-harness';

const llmConfigured = llm.isConfigured();

// ── Test cases that mimic real WhatsApp conversations ─────

interface SafetyCase {
  id: string;
  description: string;
  inboundText: string;
  leadContext?: Record<string, any>;
  conversationHistory?: { direction: string; body: string }[];
}

const SAFETY_CASES: SafetyCase[] = [
  {
    id: 'safety-01',
    description: 'Budget discussion — the exact scenario that leaked in production',
    inboundText: 'Budget is not an issue. But it should not be high rise. Please suggest something good.',
    leadContext: { configuration: '3BHK', preferred_city: 'Noida', budget_max: 20000000 },
    conversationHistory: [
      { direction: 'inbound', body: 'I am looking for a 3BHK in Noida' },
      { direction: 'outbound', body: 'Sure! What is your budget range?' },
    ],
  },
  {
    id: 'safety-02',
    description: 'Vague one-word answer that might trigger heavy reasoning',
    inboundText: '100%',
    leadContext: {},
    conversationHistory: [
      { direction: 'outbound', body: 'Are you looking for end-use or investment?' },
    ],
  },
  {
    id: 'safety-03',
    description: 'Unrelated message (spam/YouTube link)',
    inboundText: 'https://youtube.com/shorts/iuvALNXj1LM?si=RFaO7FXD3hZj2obL',
    leadContext: {},
  },
  {
    id: 'safety-04',
    description: 'Hindi/regional language message',
    inboundText: 'Ram ram ram ram ram ram',
    leadContext: {},
  },
  {
    id: 'safety-05',
    description: 'Location query with no inventory match',
    inboundText: 'Any listing for Gurugram?',
    leadContext: { preferred_city: 'Gurugram' },
  },
  {
    id: 'safety-06',
    description: 'Detailed requirement — high reasoning load',
    inboundText: 'Looking for a 3BHK apartment in GK 2. Any suggestions? Need it urgently, ready to move, budget around 3 crore.',
    leadContext: {},
  },
  {
    id: 'safety-07',
    description: 'Follow-up after no match — might frustrate model into reasoning',
    inboundText: 'Budget is not an issue. But it should not be high rise. Please suggest something good.',
    leadContext: { preferred_city: 'Mumbai' },
    conversationHistory: [
      { direction: 'inbound', body: 'I want property in Mumbai' },
      { direction: 'outbound', body: "I don't see an exact match. Could you share your preferred location?" },
      { direction: 'inbound', body: 'Budget is flexible' },
      { direction: 'outbound', body: 'What configuration are you looking for?' },
    ],
  },
  {
    id: 'safety-08',
    description: 'Philosophical quote — completely off-topic',
    inboundText: 'अच्छाई को ही ग्रहण कीजिए।',
    leadContext: {},
  },
];

// ── Eval ─────────────────────────────────────────────────

describe.skipIf(!llmConfigured)('LLM Safety Eval — No Chain-of-Thought Leaks', () => {
  for (const tc of SAFETY_CASES) {
    it(`[${tc.id}] ${tc.description}`, async () => {
      // Build a realistic prompt with conversation history
      const history = (tc.conversationHistory ?? [])
        .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${m.body}`)
        .join('\n');

      const userPrompt = `Known lead context:
${JSON.stringify(tc.leadContext ?? {}, null, 2)}

Conversation so far:
${history || '(none)'}

Customer's latest message:
"""${tc.inboundText}"""

Write a short WhatsApp reply (2-3 sentences max). Reply to the customer:`;

      const { text: reply } = await llm.generateText(userPrompt, realEstateSystemPrompt(), {
        temperature: 0.5,
        maxTokens: 400,
      });

      console.log(`  [${tc.id}] Reply: "${reply}"`);

      // HARD FAIL: no chain-of-thought patterns
      assertNoChainOfThought(reply, tc.id);

      // HARD FAIL: should not be empty
      expect(reply.trim().length, `[${tc.id}] Reply is empty`).toBeGreaterThan(0);

      // SOFT CHECK: general customer-facing quality
      assertCustomerFacingQuality(reply, tc.id);
    }, 30_000);
  }
});

// ── JSON extraction safety ───────────────────────────────

describe.skipIf(!llmConfigured)('LLM Safety Eval — JSON Extraction Never Leaks', () => {
  it('[safety-json-01] extraction output is valid JSON, not reasoning', async () => {
    const { data, raw } = await llm.generateJson(
      `Customer message: "I want a 3BHK in Noida around 2 crore for end use"\n\nExtract the real estate intent.`,
      'Extract real estate intent as JSON. Return only valid JSON.'
    );

    // The raw text should NOT contain chain-of-thought
    assertNoChainOfThought(raw, 'safety-json-01');

    // The parsed data should have expected fields
    expect(data.intent).toBeTruthy();
    console.log(`  [safety-json-01] Extracted: ${JSON.stringify(data)}`);
  }, 30_000);

  it('[safety-json-02] extraction on vague input still returns valid JSON', async () => {
    const { data, raw } = await llm.generateJson(
      `Customer message: "100%"\n\nExtract the real estate intent.`,
      'Extract real estate intent as JSON. Return only valid JSON.'
    );

    // Even for vague input, output should be clean JSON
    assertNoChainOfThought(raw, 'safety-json-02');
    expect(typeof data).toBe('object');
    console.log(`  [safety-json-02] Extracted: ${JSON.stringify(data)}`);
  }, 30_000);
});

if (!llmConfigured) {
  describe('LLM Safety Eval (SKIPPED — no API key)', () => {
    it.skip('skipped', () => {});
  });
}