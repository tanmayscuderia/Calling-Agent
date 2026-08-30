/**
 * Unit tests for WhatsApp-grade call extraction:
 * - buildCallSummaryPrompt(cfg) — config-driven schema generation
 * - normalizeCallPreferences() — whitelisting + column mapping
 * Mirrors the guarantees WhatsApp's buildExtractionPrompt + computeLeadUpdates
 * already provide for chat.
 */
import { describe, it, expect } from 'vitest';
import { buildCallSummaryPrompt } from '../../src/ai/promptEngine';
import { normalizeCallPreferences } from '../../src/sarvam/callFinalizer';
import { REAL_ESTATE_CONFIG } from '../fixtures/agentConfigs';

describe('buildCallSummaryPrompt(cfg)', () => {
  const prompt = buildCallSummaryPrompt(REAL_ESTATE_CONFIG);

  it('includes summary/outcome/temperature skeleton fields', () => {
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"outcome"');
    expect(prompt).toContain('"lead_temperature"');
    expect(prompt).toContain('"caller_name"');
    expect(prompt).toContain('"updated_preferences"');
  });

  it('derives the schema from the org’s qualifying_fields', () => {
    for (const f of REAL_ESTATE_CONFIG.qualifying_fields) {
      expect(prompt).toContain(`"${f.key}"`);
    }
    // enum options spelled out
    expect(prompt).toContain('ready_to_move | under_construction | resale | any');
  });

  it('carries the Indian budget + temperature rules from WhatsApp extraction', () => {
    expect(prompt).toContain('2 crore');
    expect(prompt).toContain('→ 20000000');
    expect(prompt).toContain('ALWAYS "hot"');
  });
});

describe('normalizeCallPreferences(prefs, cfg)', () => {
  const cfg = REAL_ESTATE_CONFIG;

  it('maps known keys to real crm_leads columns', () => {
    const out = normalizeCallPreferences(
      {
        configuration: '3BHK',
        city: 'Noida',
        sector: 'Sector 75',
        budget_min: 10000000,
        budget_max: 20000000,
      },
      cfg
    );
    expect(out).toEqual({
      configuration: '3BHK',
      preferred_city: 'Noida',
      preferred_sector: 'Sector 75',
      budget_min: 10000000,
      budget_max: 20000000,
    });
  });

  it('drops junk/hallucinated keys not in qualifying_fields', () => {
    const out = normalizeCallPreferences(
      { requirement: '3BHK in Noida', mood: 'friendly', budget: '2cr' },
      cfg
    );
    expect(out).toEqual({});
  });

  it('coerces numeric strings and drops non-numeric garbage', () => {
    const out = normalizeCallPreferences({ budget_max: '15000000', budget_min: 'not-a-number' }, cfg);
    expect(out.budget_max).toBe(15000000);
    expect(out.budget_min).toBeUndefined();
  });

  it('drops enum values outside the configured options', () => {
    const out = normalizeCallPreferences({ purpose: 'vacation_home' }, cfg);
    expect(out).toEqual({});
  });

  it('keeps valid enum values', () => {
    const out = normalizeCallPreferences({ purpose: 'investment' }, cfg);
    expect(out.purpose).toBe('investment');
  });

  it('routes industry-specific keys without a real column into metadata', () => {
    // EDUCATION_CONFIG would put course_interest into metadata; simulate the
    // same with a real-estate key that has no direct column.
    const cfgWithExtra = {
      ...cfg,
      qualifying_fields: [
        ...cfg.qualifying_fields,
        { key: 'floor_preference', label: 'Floor Preference', type: 'string' as const },
      ],
    };
    const out = { ...normalizeCallPreferences({ floor_preference: 'high floor' }, cfgWithExtra) };
    expect(out.metadata).toEqual({ floor_preference: 'high floor' });
    expect(out.floor_preference).toBeUndefined();
  });

  it('ignores null/undefined/empty values', () => {
    const out = normalizeCallPreferences({ configuration: null, city: undefined, sector: '' }, cfg);
    expect(out).toEqual({});
  });
});