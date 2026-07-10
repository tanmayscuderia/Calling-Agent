/**
 * Template-Driven Reply Eval
 *
 * Tests: "Does the DYNAMIC promptEngine.buildSystemPrompt() produce a
 * prompt that generates grounded, short, WhatsApp-friendly replies?"
 *
 * This is the PRODUCTION code path. The legacy llm-reply.eval.ts
 * tests the old hardcoded realEstateSystemPrompt() — this file tests
 * the real system prompt that production sends to the LLM.
 */
import { describe, it, expect } from 'vitest';
import { llm } from '../../src/ai/llmClient';
import { buildSystemPrompt } from '../../src/ai/promptEngine';
import { REPLY_GOLDEN_CASES } from './golden-cases';
import { assertReplyMeetsSpec, formatInventoryForPrompt } from './eval-harness';
import { REAL_ESTATE_CONFIG } from '../fixtures/agentConfigs';

const llmConfigured = llm.isConfigured();

// Build the system prompt from the config — this is the production path
const systemPrompt = buildSystemPrompt(REAL_ESTATE_CONFIG);

describe.skipIf(!llmConfigured)('Template-Driven Reply Eval (promptEngine)', () => {
  // Verify the dynamic prompt contains key config elements
  it('prompt is dynamically generated with persona and business context', () => {
    expect(systemPrompt).toContain('Priya');
    expect(systemPrompt).toContain('Demo Realty');
    expect(systemPrompt).toContain('Real Estate Sales Assistant');
    expect(systemPrompt).toContain('Configuration');
    expect(systemPrompt).toContain('Budget');   // capitalized in field labels
    expect(systemPrompt).toContain('WhatsApp');
    // Should NOT contain template placeholders
    expect(systemPrompt).not.toContain('{{');
    console.log('\n=== DYNAMIC SYSTEM PROMPT (Real Estate) ===\n', systemPrompt, '\n=== END ===\n');
  });

  for (const tc of REPLY_GOLDEN_CASES) {
    it(`[${tc.id}] replies via dynamic prompt: "${tc.inboundText.slice(0, 50)}..."`, async () => {
      const userPrompt = `Inventory available for this reply (use ONLY these, do not invent):
${formatInventoryForPrompt(tc.inventory)}

Customer lead context:
${JSON.stringify(tc.leadContext ?? {}, null, 2)}

Customer's latest message:
"""${tc.inboundText}"""

Write a short WhatsApp reply (2-3 sentences max, under 50 words). Be direct and always end with a question.
Reply to the customer:`;

      const { text: reply } = await llm.generateText(userPrompt, systemPrompt, {
        temperature: 0.5,
        maxTokens: 400,
      });

      console.log(`  [${tc.id}] → "${reply}"`);

      assertReplyMeetsSpec(reply, tc.expect, tc.id);
    }, 30_000);
  }
});

if (!llmConfigured) {
  describe('Template-Driven Reply Eval (SKIPPED — no API key)', () => {
    it.skip('skipped', () => {});
  });
}