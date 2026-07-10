/**
 * LLM E2E Agent Eval
 *
 * Tests: "Does the full respondToMessage pipeline work end-to-end?"
 *
 * This eval mocks searchProperties so we don't need a live DB.
 * It exercises: extraction → search → reply generation → lead updates.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock searchProperties BEFORE importing the agent
vi.mock('../../src/crm/propertyService', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    searchProperties: vi.fn(async (params: any) => {
      // Return mock matches based on what the agent is looking for
      if (!params.configuration && !params.budgetMax && !params.city) return [];

      // Simulate a match for 3BHK Noida ~2cr
      if (
        params.configuration?.toLowerCase().includes('3bhk') &&
        params.budgetMax &&
        params.budgetMax >= 15_000_000
      ) {
        return [
          {
            projectId: 'mock-p1',
            projectName: 'Demo Heights',
            developerName: 'Demo Realty',
            city: 'Noida',
            sector: 'Sector 150',
            location: 'Noida Sector 150',
            unitId: 'mock-u1',
            unitTitle: '3BHK in Demo Heights',
            configuration: '3BHK',
            possessionStatus: 'under_construction',
            priceMin: 16_500_000,
            priceMax: 21_000_000,
            superAreaSqft: 1650,
            brochureUrl: null,
            score: 0.85,
            reason: 'Matches 3BHK, Sector 150, budget around 2 crore',
          },
        ];
      }

      // 4BHK ready to move
      if (params.configuration?.toLowerCase().includes('4bhk')) {
        return [
          {
            projectId: 'mock-p2',
            projectName: 'ATS Knightsbridge',
            developerName: 'ATS',
            city: 'Noida',
            sector: 'Sector 124',
            location: 'Noida Sector 124',
            unitId: 'mock-u2',
            unitTitle: '4BHK in ATS Knightsbridge',
            configuration: '4BHK',
            possessionStatus: 'ready_to_move',
            priceMin: 75_000_000,
            priceMax: 120_000_000,
            superAreaSqft: 3200,
            brochureUrl: null,
            score: 0.8,
            reason: 'Matches 4BHK ready to move',
          },
        ];
      }

      // Default: no match
      return [];
    }),
  };
});

import { respondToMessage } from '../../src/ai/realEstateAgent';
import { llm } from '../../src/ai/llmClient';

const llmConfigured = llm.isConfigured();

const TEST_ORG_ID = '00000000-0000-0000-0000-000000000000';

describe.skipIf(!llmConfigured)('LLM E2E Agent Eval', () => {
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