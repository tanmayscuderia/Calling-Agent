/**
 * LLM Extraction Eval
 *
 * Tests: "Does the LLM correctly extract structured real-estate intent
 * from natural language WhatsApp messages?"
 *
 * Runs real LLM calls. Requires DEEPSEEK_API_KEY or OPENAI_API_KEY in env.
 */
import { describe, it, expect } from 'vitest';
import { llm } from '../../src/ai/llmClient';
import { EXTRACTION_PROMPT } from '../../src/ai/prompts';
import { EXTRACTION_GOLDEN_CASES } from './golden-cases';
import { assertExtractionMeetsSpec } from './eval-harness';

// Skip all evals if no API key configured
const llmConfigured = llm.isConfigured();

describe.skipIf(!llmConfigured)('LLM Extraction Eval', () => {
  for (const tc of EXTRACTION_GOLDEN_CASES) {
    it(`[${tc.id}] extracts: "${tc.input.slice(0, 50)}..."`, async () => {
      const { data } = await llm.generateJson(
        `Customer message:\n"""${tc.input}"""\n\nKnown lead context:\n${JSON.stringify(tc.existingLead ?? {}, null, 2)}`,
        EXTRACTION_PROMPT,
        { temperature: 0.1, thinking: true }
      );

      // Basic shape check
      expect(data).toBeTypeOf('object');
      expect(data).not.toBeNull();

      // Golden spec assertions
      assertExtractionMeetsSpec(data, tc.expect, tc.id);

      // Log the extraction for debugging
      console.log(`  [${tc.id}] →`, JSON.stringify(data));
    }, 60_000);
  }
});

if (!llmConfigured) {
  describe('LLM Extraction Eval (SKIPPED — no API key)', () => {
    it.skip('skipped', () => {});
  });
}