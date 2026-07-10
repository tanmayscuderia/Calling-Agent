import { describe, it, expect } from 'vitest';
import {
  shouldSearch,
  normalizeExtracted,
  toNum,
  computeLeadUpdates,
  fallbackReply,
  generateQuickReplies,
  ExtractedData,
} from '../../src/ai/realEstateAgent';
import { PropertyMatch } from '../../src/crm/propertyService';

// ── shouldSearch ──────────────────────────────────────────

describe('shouldSearch', () => {
  it('returns true for property_search intent', () => {
    expect(shouldSearch({ intent: 'property_search' })).toBe(true);
  });

  it('returns true for pricing_question intent', () => {
    expect(shouldSearch({ intent: 'pricing_question' })).toBe(true);
  });

  it('returns true for brochure_request intent', () => {
    expect(shouldSearch({ intent: 'brochure_request' })).toBe(true);
  });

  it('returns true for site_visit intent', () => {
    expect(shouldSearch({ intent: 'site_visit' })).toBe(true);
  });

  it('returns true when configuration is present', () => {
    expect(shouldSearch({ configuration: '3BHK' })).toBe(true);
  });

  it('returns true when budget_max is present', () => {
    expect(shouldSearch({ budget_max: 20000000 })).toBe(true);
  });

  it('returns true when city is present', () => {
    expect(shouldSearch({ city: 'Noida' })).toBe(true);
  });

  it('returns false for unrelated intent with no preferences', () => {
    expect(shouldSearch({ intent: 'unrelated' })).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(shouldSearch({})).toBe(false);
  });

  it('returns false for general_question with no preferences', () => {
    expect(shouldSearch({ intent: 'general_question' })).toBe(false);
  });
});

// ── toNum ─────────────────────────────────────────────────

describe('toNum', () => {
  it('converts valid number', () => {
    expect(toNum(42)).toBe(42);
  });

  it('converts numeric string', () => {
    expect(toNum('20000000')).toBe(20000000);
  });

  it('returns null for null', () => {
    expect(toNum(null)).toBe(null);
  });

  it('returns null for undefined', () => {
    expect(toNum(undefined)).toBe(null);
  });

  it('returns null for NaN string', () => {
    expect(toNum('abc')).toBe(null);
  });

  it('returns null for empty string', () => {
    expect(toNum('')).toBe(null);
  });
});

// ── normalizeExtracted ────────────────────────────────────

describe('normalizeExtracted', () => {
  it('normalizes a full extraction object', () => {
    const raw = {
      intent: 'property_search',
      configuration: '3BHK',
      city: 'Noida',
      sector: 'Sector 150',
      budget_min: 15000000,
      budget_max: 20000000,
      possession_preference: 'under_construction',
      purpose: 'end_use',
      timeline: '2027',
      lead_temperature: 'hot',
      needs_human: false,
    };
    const result = normalizeExtracted(raw);
    expect(result.intent).toBe('property_search');
    expect(result.configuration).toBe('3BHK');
    expect(result.budget_max).toBe(20000000);
    expect(result.needs_human).toBe(false);
  });

  it('handles null/undefined input', () => {
    expect(normalizeExtracted(null)).toEqual({});
    expect(normalizeExtracted(undefined)).toEqual({});
  });

  it('handles non-object input', () => {
    expect(normalizeExtracted('string')).toEqual({});
  });

  it('handles empty object', () => {
    expect(normalizeExtracted({})).toEqual({
      intent: null,
      configuration: null,
      city: null,
      sector: null,
      location: null,
      budget_min: null,
      budget_max: null,
      possession_preference: null,
      purpose: null,
      timeline: null,
      lead_temperature: null,
      needs_human: false,
    });
  });

  it('converts string budget to number', () => {
    const result = normalizeExtracted({ budget_max: '20000000' });
    expect(result.budget_max).toBe(20000000);
  });

  it('defaults needs_human to false when missing', () => {
    const result = normalizeExtracted({ intent: 'property_search' });
    expect(result.needs_human).toBe(false);
  });
});

// ── computeLeadUpdates ────────────────────────────────────

describe('computeLeadUpdates', () => {
  const mockMatches: PropertyMatch[] = [
    {
      projectId: 'p1',
      projectName: 'Demo Heights',
      unitId: 'u1',
      configuration: '3BHK',
      score: 0.8,
      reason: 'matches',
    } as any,
  ];

  it('maps all extracted fields to lead columns', () => {
    const ex: ExtractedData = {
      city: 'Noida',
      sector: 'Sector 150',
      configuration: '3BHK',
      budget_min: 15000000,
      budget_max: 20000000,
      possession_preference: 'under_construction',
      purpose: 'end_use',
      timeline: '2027',
      lead_temperature: 'hot',
    };
    const updates = computeLeadUpdates(ex, mockMatches);
    expect(updates.preferred_city).toBe('Noida');
    expect(updates.preferred_sector).toBe('Sector 150');
    expect(updates.configuration).toBe('3BHK');
    expect(updates.budget_min).toBe(15000000);
    expect(updates.budget_max).toBe(20000000);
    expect(updates.possession_preference).toBe('under_construction');
    expect(updates.purpose).toBe('end_use');
    expect(updates.timeline).toBe('2027');
    expect(updates.temperature).toBe('hot');
  });

  it('does not set temperature for "unknown"', () => {
    const updates = computeLeadUpdates({ lead_temperature: 'unknown' }, []);
    expect(updates.temperature).toBeUndefined();
  });

  it('generates ai_summary from matches', () => {
    const updates = computeLeadUpdates({}, mockMatches);
    expect(updates.ai_summary).toContain('Demo Heights');
    expect(updates.ai_summary).toContain('3BHK');
  });

  it('returns empty object for empty extraction and no matches', () => {
    const updates = computeLeadUpdates({}, []);
    expect(Object.keys(updates).length).toBe(0);
  });

  it('includes location when present', () => {
    const updates = computeLeadUpdates({ location: 'Near expressway' }, []);
    expect(updates.preferred_location).toBe('Near expressway');
  });
});

// ── fallbackReply ─────────────────────────────────────────

describe('fallbackReply', () => {
  const mockMatch: PropertyMatch = {
    projectId: 'p1',
    projectName: 'Demo Heights',
    unitId: 'u1',
    configuration: '3BHK',
    sector: 'Sector 150',
    city: 'Noida',
    priceMin: 16500000,
    priceMax: 21000000,
    possessionStatus: 'under_construction',
    score: 0.85,
    reason: 'matches',
  } as any;

  it('generates reply with property details when matches exist', () => {
    const reply = fallbackReply({}, [mockMatch]);
    expect(reply).toContain('Demo Heights');
    expect(reply).toContain('Sector 150');
    expect(reply).toContain('3BHK');
    expect(reply).toContain('site visit');
  });

  it('asks for budget and location when no info', () => {
    const reply = fallbackReply({}, []);
    expect(reply.toLowerCase()).toContain('budget');
    expect(reply.toLowerCase()).toContain('location');
  });

  it('says no exact match when preferences exist but no results', () => {
    const reply = fallbackReply({ budget_max: 5000000, city: 'Mumbai' }, []);
    expect(reply.toLowerCase()).toContain("don't see an exact match");
  });
});

// ── generateQuickReplies ──────────────────────────────────

describe('generateQuickReplies', () => {
  it('offers site visit and brochure when matches exist', () => {
    const mockMatch = { projectId: 'p1', projectName: 'Test', unitId: 'u1', configuration: '3BHK', score: 0.8, reason: '' } as any;
    const chips = generateQuickReplies({}, [mockMatch], {}, '');
    expect(chips).toContain('📅 Schedule a site visit');
    expect(chips).toContain('📄 Share brochure');
  });

  it('offers configuration chips when missing', () => {
    const chips = generateQuickReplies({}, [], {}, '');
    expect(chips).toContain('2BHK');
    expect(chips).toContain('3BHK');
    expect(chips).toContain('4BHK');
  });

  it('offers budget chips when missing', () => {
    const chips = generateQuickReplies({}, [], {}, '');
    expect(chips.some((c) => c.includes('Budget'))).toBe(true);
  });

  it('offers location chips when missing (config+budget pre-filled)', () => {
    // With config and budget already known, location chips fit within the 5-chip limit
    const chips = generateQuickReplies({}, [], { configuration: '3BHK', budget_max: 20000000 }, '');
    expect(chips.some((c) => c.includes('Noida'))).toBe(true);
  });

  it('offers callback time slots when intent is callback', () => {
    const chips = generateQuickReplies({ intent: 'callback_request' }, [], {}, '');
    expect(chips).toContain('Today evening');
    expect(chips).toContain('Tomorrow morning');
  });

  it('limits to 5 chips', () => {
    const chips = generateQuickReplies({}, [], {}, '');
    expect(chips.length).toBeLessThanOrEqual(5);
  });

  it('does not offer config chips when lead already has configuration', () => {
    const chips = generateQuickReplies({}, [], { configuration: '3BHK' }, '');
    expect(chips).not.toContain('2BHK');
    expect(chips).not.toContain('3BHK');
  });
});