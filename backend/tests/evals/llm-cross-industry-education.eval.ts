/**
 * Cross-Industry Eval — Education
 *
 * Tests: "Does the dynamic promptEngine work for a COMPLETELY DIFFERENT
 * industry (education), not just real estate?"
 *
 * Uses EDUCATION_CONFIG to generate prompts via buildSystemPrompt() and
 * buildExtractionPrompt(). The LLM must extract education-specific fields
 * (course_interest, preferred_mode, education_level) — proving the system
 * is truly industry-agnostic.
 */
import { describe, it, expect } from 'vitest';
import { llm } from '../../src/ai/llmClient';
import { buildSystemPrompt, buildExtractionPrompt } from '../../src/ai/promptEngine';
import { EDUCATION_EXTRACTION_CASES, EDUCATION_REPLY_CASES, formatEduInventoryForPrompt } from './education-cases';
import { assertBudgetNear, assertReplyMeetsSpec } from './eval-harness';
import { EDUCATION_CONFIG } from '../fixtures/agentConfigs';

const llmConfigured = llm.isConfigured();

const eduSystemPrompt = buildSystemPrompt(EDUCATION_CONFIG);
const eduExtractionPrompt = buildExtractionPrompt(EDUCATION_CONFIG);

describe.skipIf(!llmConfigured)('Cross-Industry Eval — Education (promptEngine)', () => {
  // Verify education-specific prompt
  it('education prompt does NOT contain real-estate terms', () => {
    expect(eduSystemPrompt).toContain('Arjun');
    expect(eduSystemPrompt).toContain('SkillForward Academy');
    expect(eduSystemPrompt).toContain('Course Interest');
    expect(eduSystemPrompt).not.toContain('Priya');
    expect(eduSystemPrompt).not.toContain('Demo Realty');
    expect(eduSystemPrompt).not.toContain('property');

    expect(eduExtractionPrompt).toContain('"course_interest"');
    expect(eduExtractionPrompt).toContain('"preferred_mode"');
    expect(eduExtractionPrompt).toContain('"education_level"');
    expect(eduExtractionPrompt).not.toContain('"configuration"');
    expect(eduExtractionPrompt).not.toContain('"possession_preference"');

    console.log('\n=== DYNAMIC EXTRACTION PROMPT (Education) ===\n', eduExtractionPrompt, '\n=== END ===\n');
  });

  // ── Extraction cases ──
  for (const tc of EDUCATION_EXTRACTION_CASES) {
    it(`[${tc.id}] extracts edu fields: "${tc.input.slice(0, 50)}..."`, async () => {
      const userPrompt = `Customer message:\n"""${tc.input}"""\n\nKnown lead context:\n{}`;

      const { data } = await llm.generateJson(userPrompt, eduExtractionPrompt, {
        temperature: 0.1,
        thinking: true,
      });

      expect(data).toBeTypeOf('object');
      expect(data).not.toBeNull();

      if (tc.expect.intent) {
        expect(data.intent, `[${tc.id}] intent`).toBe(tc.expect.intent);
      }
      if (tc.expect.courseInterestContains) {
        expect(String(data.course_interest ?? '').toLowerCase()).toContain(tc.expect.courseInterestContains.toLowerCase());
      }
      if (tc.expect.educationLevel) {
        expect(String(data.education_level ?? '').toLowerCase()).toBe(tc.expect.educationLevel);
      }
      if (tc.expect.preferredMode) {
        expect(String(data.preferred_mode ?? '').toLowerCase()).toBe(tc.expect.preferredMode);
      }
      if (tc.expect.budgetMaxNear) {
        assertBudgetNear(data.budget_max, tc.expect.budgetMaxNear, `[${tc.id}] budget_max`);
      }
      if (tc.expect.temperature) {
        expect(String(data.lead_temperature ?? '').toLowerCase()).toBe(tc.expect.temperature);
      }

      console.log(`  [${tc.id}] →`, JSON.stringify(data));
    }, 60_000);
  }

  // ── Reply cases ──
  for (const tc of EDUCATION_REPLY_CASES) {
    it(`[${tc.id}] replies via edu prompt: "${tc.inboundText.slice(0, 50)}..."`, async () => {
      const userPrompt = `Inventory available for this reply (use ONLY these, do not invent):
${formatEduInventoryForPrompt(tc.inventory)}

Customer lead context:
${JSON.stringify(tc.leadContext ?? {}, null, 2)}

Customer's latest message:
"""${tc.inboundText}"""

Write a short WhatsApp reply (2-3 sentences max, under 50 words). Be direct and always end with a question.
Reply to the customer:`;

      const { text: reply } = await llm.generateText(userPrompt, eduSystemPrompt, {
        temperature: 0.5,
        maxTokens: 400,
      });

      console.log(`  [${tc.id}] → "${reply}"`);

      assertReplyMeetsSpec(reply, tc.expect, tc.id);
    }, 30_000);
  }
});

if (!llmConfigured) {
  describe('Cross-Industry Eval — Education (SKIPPED — no API key)', () => {
    it.skip('skipped', () => {});
  });
}