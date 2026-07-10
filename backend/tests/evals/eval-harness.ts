/**
 * Eval Harness — smart assertion helpers for LLM output.
 * These are deliberately fuzzy/tolerant because LLMs vary wording.
 */
import { expect } from 'vitest';
import { ExtractionExpectation, ReplyExpectation } from './golden-cases';

/** Normalize smart/curly quotes and dashes to their ASCII equivalents. */
function normalizeForMatching(s: string): string {
  return s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")  // curly single quotes → '
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // curly double quotes → "
    .replace(/[\u2013\u2014]/g, '-')              // en/em dash → -
    .replace(/\u2026/g, '...')                    // ellipsis → ...
    .toLowerCase();
}

/**
 * Assert that a budget value is within ±20% of the expected.
 * "2 crore" might come back as 20000000, 19999999, or 18000000 — all fine.
 */
export function assertBudgetNear(actual: number | null | undefined, expected: number, label = 'budget') {
  if (actual == null) {
    // Some models might put it in a different field; just warn-soft
    expect.fail(`${label}: expected ~${expected} but got null/undefined`);
  }
  const tolerance = expected * 0.2;
  const lower = expected - tolerance;
  const upper = expected + tolerance;
  expect(actual!).toBeGreaterThanOrEqual(lower);
  expect(actual!).toBeLessThanOrEqual(upper);
}

/**
 * Assert that a string contains a substring (case-insensitive).
 */
export function assertContainsIgnoreCase(haystack: string, needle: string, context = '') {
  expect(haystack.toLowerCase()).toContain(needle.toLowerCase());
}

/**
 * Assert that a string does NOT contain any of the banned substrings.
 */
export function assertDoesNotContain(haystack: string, banned: string[], context = '') {
  const lower = haystack.toLowerCase();
  for (const b of banned) {
    expect(lower).not.toContain(b.toLowerCase());
  }
}

/**
 * Assert the reply meets word count / question / grounding rules.
 */
export function assertReplyMeetsSpec(reply: string, spec: ReplyExpectation, caseId: string) {
  // Word count
  if (spec.maxWords) {
    const wordCount = reply.trim().split(/\s+/).length;
    if (wordCount > spec.maxWords) {
      expect.fail(`[${caseId}] Reply too long: ${wordCount} words (max ${spec.maxWords}). Reply: "${reply}"`);
    }
  }

  // Contains a question
  if (spec.hasQuestion) {
    if (!reply.includes('?')) {
      expect.fail(`[${caseId}] Reply should contain a question mark. Reply: "${reply}"`);
    }
  }

  // Must mention property
  if (spec.mentionsProperty) {
    assertContainsIgnoreCase(reply, spec.mentionsProperty, `[${caseId}] Reply should mention "${spec.mentionsProperty}"`);
  }

  // Must not mention banned names (hallucination check)
  if (spec.doesNotMention?.length) {
    assertDoesNotContain(reply, spec.doesNotMention, `[${caseId}] Reply mentions a banned/invented property`);
  }

  // Must contain at least one of the expected keywords
  if (spec.containsAny?.length) {
    const normalized = normalizeForMatching(reply);
    const found = spec.containsAny.some((kw) => normalized.includes(normalizeForMatching(kw)));
    expect(found, `[${caseId}] Reply should contain at least one of: ${spec.containsAny.join(', ')}. Reply: "${reply}"`).toBe(true);
  }
}

/**
 * Assert extraction JSON meets the golden spec.
 */
export function assertExtractionMeetsSpec(data: any, spec: ExtractionExpectation, caseId: string) {
  if (spec.intent) {
    expect(data.intent, `[${caseId}] intent mismatch`).toBe(spec.intent);
  }
  if (spec.configurationContains) {
    const config = String(data.configuration ?? '').toLowerCase();
    expect(config).toContain(spec.configurationContains.toLowerCase());
  }
  if (spec.city) {
    expect(String(data.city ?? '').toLowerCase()).toContain(spec.city.toLowerCase());
  }
  if (spec.budgetMaxNear) {
    assertBudgetNear(data.budget_max, spec.budgetMaxNear, `[${caseId}] budget_max`);
  }
  if (spec.purpose) {
    expect(String(data.purpose ?? '').toLowerCase()).toBe(spec.purpose);
  }
  if (spec.possessionPreference) {
    expect(String(data.possession_preference ?? '').toLowerCase()).toBe(spec.possessionPreference);
  }
  if (spec.temperature) {
    expect(String(data.lead_temperature ?? '').toLowerCase()).toBe(spec.temperature);
  }
}

/**
 * Format inventory for the LLM prompt (used by reply evals).
 */
export function formatInventoryForPrompt(inv: ReplyCase['inventory']): string {
  if (!inv.length) return '(no matching inventory)';
  return inv
    .map((p, i) => `${i + 1}. ${p.name}, ${p.sector} ${p.city} — ${p.configuration}, ₹${(p.priceMin / 10000000).toFixed(2)}–${(p.priceMax / 10000000).toFixed(2)} Cr, ${p.possession}.`)
    .join('\n');
}

// Import type for formatInventoryForPrompt
import { ReplyCase } from './golden-cases';

// ── Chain-of-thought leak detection ──────────────────────

/**
 * Patterns that indicate leaked chain-of-thought / reasoning content.
 * These are real patterns observed in production on 2026-07-10 when
 * DeepSeek's `reasoning_content` was incorrectly used as the reply.
 *
 * If any of these appear in a customer-facing reply, it's a critical bug.
 */
const CHAIN_OF_THOUGHT_PATTERNS: string[] = [
  // Self-directed reasoning (first-person internal monologue)
  // NOTE: "let me check/look/see" excluded — these are legitimate
  // customer-facing phrases ("Let me check our options for you").
  "we need to respond",
  "we need to",
  "i should ask",
  "i should check",
  "i should look",
  "i need to respond",
  "i need to extract",
  "i need to ask",
  "let me think",
  "let me analyze",
  "i'll ask the",
  "i will ask the",
  "i think i should",
  "thinking about",
  "internal:",
  "my reasoning",
  "my thought process",
  "step 1:",
  "step 2:",
  "first, i",
  "next, i",
  // Third-person analysis (talking ABOUT the customer, not TO them)
  "the customer is asking",
  "customer says",
  "customer wants",
  "the user is asking",
  "the user wants",
  "based on the context",
  "looking at the conversation",
  "analyzing the message",
];

/**
 * Assert that a reply does NOT contain leaked chain-of-thought.
 * This is a HARD FAIL — if reasoning content leaks into a customer reply,
 * it's a P0 bug that must be caught before production.
 *
 * Usage in evals:
 *   assertNoChainOfThought(reply, 'test-case-id');
 */
export function assertNoChainOfThought(reply: string, context = '') {
  const lower = reply.toLowerCase();

  for (const pattern of CHAIN_OF_THOUGHT_PATTERNS) {
    if (lower.includes(pattern)) {
      expect.fail(
        `[${context}] CRITICAL: Chain-of-thought leak detected!\n` +
        `Matched pattern: "${pattern}"\n` +
        `Reply: "${reply}"\n` +
        `This indicates reasoning_content is leaking into customer-facing output.`
      );
    }
  }
}

/**
 * Assert that a reply looks like a natural customer-facing message:
 * - Does not contain chain-of-thought
 * - Does not start with meta-commentary
 * - Is reasonably short (not a wall of reasoning text)
 */
export function assertCustomerFacingQuality(reply: string, context = '') {
  // 1. No chain-of-thought
  assertNoChainOfThought(reply, context);

  // 2. Should not start with meta phrases
  const metaStarters = ['okay so', 'so the customer', 'alright,', 'now i', 'the user'];
  const lowerStart = reply.toLowerCase().trim().slice(0, 30);
  for (const starter of metaStarters) {
    if (lowerStart.startsWith(starter)) {
      expect.fail(
        `[${context}] Reply starts with meta-commentary: "${starter}"\n` +
        `Reply: "${reply}"`
      );
    }
  }
}
