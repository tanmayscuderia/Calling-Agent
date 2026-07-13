/**
 * LLM E2E Agent Eval
 *
 * Tests: "Does the full respondToMessage pipeline work end-to-end?"
 *
 * This eval mocks the config + inventory layers so we don't need a live DB.
 * It exercises: extraction → search → reply generation → lead updates.
 *
 * IMPORTANT: This now uses the UNIFIED baseAgent — the same code path that
 * both the Playground (/api/ai/simulate) and Production WhatsApp use.
 * There is no longer a separate realEstateAgent.ts.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock getAgentConfig BEFORE importing the agent — returns the real estate fixture
vi.mock('../../src/ai/agentConfigService', () => ({
  getAgentConfig: vi.fn(async () => {
    const { REAL_ESTATE_CONFIG } = await import('../fixtures/agentConfigs');
    return REAL_ESTATE_CONFIG;
  }),
}));

// Mock searchInventory — returns mock matches based on extracted data
vi.mock('../../src/ai/inventorySearch', () => ({
  searchInventory: vi.fn(async (_orgId: string, _cfg: any, extracted: any, _lead: any) => {
    const { formatRange } = {
      formatRange: (min: number, max: number) =>
        min >= 10000000
          ? `₹${(min / 10000000).toFixed(2)} – ₹${(max / 10000000).toFixed(2)} Cr`
          : `₹${min} – ₹${max}`,
    };

    // No preferences → no match
    if (!extracted.configuration && !extracted.budget_max && !extracted.city) return [];

    // 3BHK Noida ~2cr → Demo Heights
    if (
      extracted.configuration?.toLowerCase().includes('3bhk') &&
      extracted.budget_max &&
      extracted.budget_max >= 15_000_000
    ) {
      return [
        {
          id: 'mock-u1',
          score: 0.85,
          reason: 'Matches 3BHK, Sector 150, budget around 2 crore',
          label: 'Demo Heights',
          sublabel: 'Sector 150, Noida',
          priceRange: formatRange(16_500_000, 21_000_000),
          details: {
            configuration: '3BHK',
            possessionStatus: 'under_construction',
            developerName: 'Demo Realty',
            superAreaSqft: 1650,
            city: 'Noida',
            sector: 'Sector 150',
            brochureUrl: null,
          },
        },
      ];
    }

    // 4BHK → ATS Knightsbridge
    if (extracted.configuration?.toLowerCase().includes('4bhk')) {
      return [
        {
          id: 'mock-u2',
          score: 0.8,
          reason: 'Matches 4BHK ready to move',
          label: 'ATS Knightsbridge',
          sublabel: 'Sector 124, Noida',
          priceRange: formatRange(75_000_000, 120_000_000),
          details: {
            configuration: '4BHK',
            possessionStatus: 'ready_to_move',
            developerName: 'ATS',
            superAreaSqft: 3200,
            city: 'Noida',
            sector: 'Sector 124',
            brochureUrl: null,
          },
        },
      ];
    }

    return [];
  }),
}));

import { respondToMessage } from '../../src/ai/baseAgent';
import { llm } from '../../src/ai/llmClient';

const llmConfigured = llm.isConfigured();

const TEST_ORG_ID = '00000000-0000-0000-0000-000000000000';

describe.skipIf(!llmConfigured)('LLM E2E Agent Eval (Unified baseAgent)', () => {
  it('[E2E-1] full flow: 3BHK Noida 2cr → matched reply + lead updates', async () => {
    const result = await respondToMessage({
      orgId: TEST_ORG_ID,
      lead: { full_name: null, preferred_city: null, configuration: null, budget_max: null },
      conversation: { id: 'conv-1', ai_enabled: true },
      inboundText: 'Hi, I am looking for a 3BHK in Noida around 2 crore',
      recentMessages: [],
    });

    console.log(`  [E2E-1] reply: "${result.reply}"`);
    console.log(`  [E2E-1] extractedData:`, JSON.stringify(result.extractedData));
    console.log(`  [E2E-1] matches: ${result.matchedProperties.length}`);
    console.log(`  [E2E-1] leadUpdates:`, JSON.stringify(result.leadUpdates));

    // Should find a match
    expect(result.matchedProperties.length).toBeGreaterThan(0);

    // Should mention the property
    expect(result.reply.toLowerCase()).toContain('demo heights');

    // Should ask a follow-up question
    expect(result.reply).toContain('?');

    // Reply should be WhatsApp-length
    const wordCount = result.reply.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(60);

    // Lead updates should capture extracted info
    expect(result.leadUpdates.configuration).toMatch(/3bhk/i);
    expect(result.leadUpdates.preferred_city).toMatch(/noida/i);
    expect(result.leadUpdates.budget_max).toBeGreaterThanOrEqual(15_000_000);
  }, 45_000);

  it('[E2E-2] full flow: callback request → hot lead', async () => {
    const result = await respondToMessage({
      orgId: TEST_ORG_ID,
      lead: { configuration: '3BHK', preferred_city: 'Noida', budget_max: 20_000_000 },
      conversation: { id: 'conv-2', ai_enabled: true },
      inboundText: 'Yes call me today evening',
      recentMessages: [
        { direction: 'outbound', body: 'We have Demo Heights available. Would you like a callback?' },
      ],
    });

    console.log(`  [E2E-2] reply: "${result.reply}"`);
    console.log(`  [E2E-2] intent: ${result.extractedIntent}`);

    // Intent should be callback
    expect(result.extractedIntent).toBe('callback_request');

    // Should ask about time slot
    const lower = result.reply.toLowerCase();
    expect(lower).toMatch(/time|slot|evening|when/);

    // Lead should be hot or temperature should be set
    expect(result.extractedData.lead_temperature).toBe('hot');
  }, 45_000);

  it('[E2E-3] full flow: unrelated question → redirect', async () => {
    const result = await respondToMessage({
      orgId: TEST_ORG_ID,
      lead: {},
      conversation: { id: 'conv-3', ai_enabled: true },
      inboundText: 'What\'s the weather like today?',
      recentMessages: [],
    });

    console.log(`  [E2E-3] reply: "${result.reply}"`);

    // Should NOT mention any property
    expect(result.reply.toLowerCase()).not.toContain('demo heights');

    // Reply should be short
    const wordCount = result.reply.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(50);

    // Should redirect to property
    const lower = result.reply.toLowerCase();
    expect(lower).toMatch(/property|real estate|home|help|looking/);
  }, 45_000);
});

if (!llmConfigured) {
  describe('LLM E2E Agent Eval (SKIPPED — no API key)', () => {
    it.skip('skipped', () => {});
  });
}