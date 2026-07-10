/**
 * Template-Driven Extraction Eval
 *
 * Tests: "Does the DYNAMIC promptEngine.buildExtractionPrompt() produce a
 * prompt that the LLM can understand and extract correctly from?"
 *
 * This is the PRODUCTION code path. The legacy llm-extraction.eval.ts
 * tests the old hardcoded EXTRACTION_PROMPT — this file tests the
 * real prompt that production sends to the LLM.
 *
 * If these pass but the legacy evals also pass, the dynamic system
 * is proven equivalent to the hardcoded approach.
 */
import { describe, it, expect } from 'vitest';
import { llm } from '../../src/ai/llmClient';
import { buildExtractionPrompt } from '../../src/ai/promptEngine';
import { EXTRACTION_GOLDEN_CASES } from './golden-cases';
import { assertExtractionMeetsSpec } from './eval-harness';
import { REAL_ESTATE_CONFIG } from '../fixtures/agentConfigs';

const llmConfigured = llm.isConfigured();

// Build the extraction prompt from the config — this is the production path
const extractionPrompt = buildExtractionPrompt(REAL_ESTATE_CONFIG);

describe.skipIf(!llmConfigured)('Template-Driven Extraction Eval (promptEngine)', () => {
  // Log the dynamically generated prompt for inspection
  it('prompt is dynamically generated and contains config-driven schema', () => {
    expect(extractionPrompt).toContain('"configuration"');
    expect(extractionPrompt).toContain('"budget_max"');
    expect(extractionPrompt).toContain('"possession_preference"');
    expect(extractionPrompt).toContain('property_search');
    expect(extractionPrompt).toContain('callback_request');
    // Should contain Indian budget rules
    expect(extractionPrompt).toContain('crore');
    expect(extractionPrompt).toContain('lakhs');
    console.log('\n=== DYNAMIC EXTRACTION PROMPT (Real Estate) ===\n', extractionPrompt, '\n=== END ===\n');
  });

  for (const tc of EXTRACTION_GOLDEN_CASES) {
    it(`[${tc.id}] extracts via dynamic prompt: "${tc.input.slice(0, 50)}..."`, async () => {
      const userPrompt = `Customer message:\n"""${tc.input}"""\n\nKnown lead context:\n${JSON.stringify(tc.existingLead ?? {}, null, 2)}`;

      const { data } = await llm.generateJson(userPrompt, extractionPrompt, {
        temperature: 0.1,
        thinking: true,
      });

      expect(data).toBeTypeOf('object');
      expect(data).not.toBeNull();

      assertExtractionMeetsSpec(data, tc.expect, tc.id);

      console.log(`  [${tc.id}] →`, JSON.stringify(data));
    }, 60_000);
  }
});

if (!llmConfigured) {
  describe('Template-Driven Extraction Eval (SKIPPED — no API key)', () => {
    it.skip('skipped', () => {});
  });
}