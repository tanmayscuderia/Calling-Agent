/**
 * LLM Call Agent Eval
 *
 * Tests: "Does the calling agent (Priya) maintain a natural conversation,
 * ask the right qualifying questions, and generate a correct summary?"
 *
 * Uses prompts.ts directly (not promptEngine) to avoid DB dependency.
 */
import { describe, it, expect } from 'vitest';
import { llm } from '../../src/ai/llmClient';
import { callingAgentSystemPrompt, CALL_SUMMARY_PROMPT, CALLING_AGENT_OPENING } from '../../src/ai/prompts';
import { CALL_GOLDEN_CASES, CALL_SUMMARY_TRANSCRIPT } from './golden-cases';

const llmConfigured = llm.isConfigured();

describe.skipIf(!llmConfigured)('LLM Call Agent Eval', () => {
  // ── Test 1: Opening line ──
  it('[CALL-0] opening line is appropriate', () => {
    const opening = CALLING_AGENT_OPENING('Demo Realty');
    console.log(`  [CALL-0] opening: "${opening}"`);

    expect(opening).toContain('Priya');
    expect(opening).toContain('Demo Realty');
    expect(opening).toContain('?'); // Asks a question
  });

  // ── Test 2-4: Conversation turns ──
  for (const tc of CALL_GOLDEN_CASES) {
    if (!tc.customerReply) continue; // Skip opening-only cases for LLM turn test

    it(`[${tc.id}] ${tc.description}`, async () => {
      const transcript = tc.priorTurns
        .map((t) => `${t.speaker === 'agent' ? 'Priya' : 'Customer'}: ${t.text}`)
        .join('\n');

      const userPrompt = `Business: Demo Realty
Lead context:
${JSON.stringify(tc.lead, null, 2)}

Call transcript so far:
${transcript}

Customer just said: "${tc.customerReply}"

Continue the conversation as Priya. Reply with ONLY your next line:`;

      const { text: reply } = await llm.generateText(userPrompt, callingAgentSystemPrompt(), {
        temperature: 0.6,
        maxTokens: 300,
      });

      console.log(`  [${tc.id}] reply: "${reply}"`);

      // Word count
      if (tc.expect.maxWords) {
        const wc = reply.trim().split(/\s+/).length;
        expect(wc).toBeLessThanOrEqual(tc.expect.maxWords);
      }

      // Question check
      if (tc.expect.hasQuestion) {
        expect(reply).toContain('?');
      }

      // Keyword check (normalize smart quotes/dashes for robust matching)
      if (tc.expect.containsAny) {
        const norm = (s: string) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u2013\u2014]/g, '-').toLowerCase();
        const normalizedReply = norm(reply);
        const found = tc.expect.containsAny.some((kw) => normalizedReply.includes(norm(kw)));
        expect(found, `Expected reply to contain one of: ${tc.expect.containsAny.join(', ')}. Got: "${reply}"`).toBe(true);
      }
    }, 30_000);
  }

  // ── Test 5: Call summary ──
  it('[CALL-SUMMARY] generates correct summary JSON', async () => {
    const transcript = CALL_SUMMARY_TRANSCRIPT.map(
      (t) => `${t.speaker === 'agent' ? 'Priya' : 'Customer'}: ${t.text}`
    ).join('\n');

    const { data } = await llm.generateJson(
      `Call transcript:\n${transcript}\n\nGenerate the summary JSON.`,
      CALL_SUMMARY_PROMPT
    );

    console.log(`  [CALL-SUMMARY] →`, JSON.stringify(data, null, 2));

    // Summary should mention key details
    expect(data.summary).toBeTypeOf('string');
    expect(data.summary.toLowerCase()).toMatch(/3bhk|sector|demo|visit|site/);

    // Outcome should be interested or site_visit_requested
    expect(['interested', 'site_visit_requested', 'callback_requested']).toContain(data.outcome);

    // Temperature should be hot (customer agreed to site visit)
    expect(data.lead_temperature).toBe('hot');
  }, 30_000);
});

if (!llmConfigured) {
  describe('LLM Call Agent Eval (SKIPPED — no API key)', () => {
    it.skip('skipped', () => {});
  });
}