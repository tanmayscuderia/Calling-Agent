/**
 * LLM Reply Eval
 *
 * Tests: "Does the LLM generate a grounded, short, WhatsApp-friendly reply
 * using only the provided inventory?"
 *
 * This eval isolates the reply generation step by providing a pre-formatted
 * inventory list to the LLM, bypassing the DB-dependent searchProperties.
 */
import { describe, it, expect } from 'vitest';
import { llm } from '../../src/ai/llmClient';
import { realEstateSystemPrompt } from '../../src/ai/prompts';
import { REPLY_GOLDEN_CASES } from './golden-cases';
import { assertReplyMeetsSpec, formatInventoryForPrompt } from './eval-harness';

const llmConfigured = llm.isConfigured();

describe.skipIf(!llmConfigured)('LLM Reply Eval', () => {
  for (const tc of REPLY_GOLDEN_CASES) {
    it(`[${tc.id}] replies to: "${tc.inboundText.slice(0, 50)}..."`, async () => {
      const userPrompt = `Inventory available for this reply (use ONLY these, do not invent):
${formatInventoryForPrompt(tc.inventory)}

Customer lead context:
${JSON.stringify(tc.leadContext ?? {}, null, 2)}

Customer's latest message:
"""${tc.inboundText}""

Write a short WhatsApp reply (2-3 sentences max, under 50 words). Be direct and always end with a question.
Reply to the customer:`;

      const { text: reply } = await llm.generateText(userPrompt, realEstateSystemPrompt(), {
        temperature: 0.5,
        maxTokens: 400,
      });

      console.log(`  [${tc.id}] → "${reply}"`);

      assertReplyMeetsSpec(reply, tc.expect, tc.id);
    }, 30_000);
  }
});

if (!llmConfigured) {
  describe('LLM Reply Eval (SKIPPED — no API key)', () => {
    it.skip('skipped', () => {});
  });
}