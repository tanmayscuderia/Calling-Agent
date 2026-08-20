/**
 * Unit tests for Sarvam tool routes (voice-agent HTTP tools).
 * Covers: authorized() (X-Tool-Secret / X-API-Key / Bearer auth forms),
 * response shapers (voice-friendly output), and query parsing.
 * Full HTTP tests would need a supabase mock — kept light per repo test style.
 */
import { describe, it, expect } from 'vitest';
import { config } from '../../src/config';
import {
  authorized,
  shapeLead,
  shapeMessages,
  shapeInventory,
  parseInventoryQuery,
} from '../../src/routes/sarvamTools.routes';

describe('authorized (tool auth)', () => {
  const secret = config.sarvam.toolSecret;

  it('accepts X-Tool-Secret (original custom header)', () => {
    expect(authorized({ headers: { 'x-tool-secret': secret } })).toBe(true);
  });

  it('accepts X-API-Key (Sarvam Auth-block api_key form)', () => {
    expect(authorized({ headers: { 'x-api-key': secret } })).toBe(true);
  });

  it('accepts Authorization: Bearer (Sarvam Auth-block bearer form)', () => {
    expect(authorized({ headers: { authorization: `Bearer ${secret}` } })).toBe(true);
  });

  it('rejects wrong or missing credentials', () => {
    expect(authorized({ headers: { 'x-api-key': 'wrong-secret' } })).toBe(false);
    expect(authorized({ headers: {} })).toBe(false);
  });
});

describe('shapeLead', () => {
  it('maps known lead fields into a compact voice payload', () => {
    const lead = {
      id: 'lead-1',
      full_name: 'Rahul Kumar',
      temperature: 'hot',
      budget_min: 5000000,
      budget_max: 8000000,
      preferred_location: 'Whitefield',
      configuration: '3BHK',
      source: 'whatsapp',
      notes: 'x'.repeat(500),
    };
    const out = shapeLead(lead);
    expect(out.name).toBe('Rahul Kumar');
    expect(out.budget_max).toBe(8000000);
    expect(out.notes).toHaveLength(200); // truncated for voice
  });

  it('returns nulls for unknown caller fields (not undefined)', () => {
    const out = shapeLead({});
    expect(out.name).toBeNull();
    expect(out.preferred_location).toBeNull();
    expect(out.notes).toBeNull();
  });

  it('prefers full_name but falls back to name', () => {
    expect(shapeLead({ name: 'Amit' }).name).toBe('Amit');
  });
});

describe('shapeMessages', () => {
  it('keeps only the last N messages and truncates text', () => {
    const rows = [
      { direction: 'inbound', body: 'hello' },
      { direction: 'outbound', body: 'y'.repeat(300) },
    ];
    const out = shapeMessages(rows, 1);
    expect(out).toHaveLength(1);
    expect(out[0].text).toHaveLength(120);
  });

  it('handles missing field names gracefully', () => {
    const out = shapeMessages([{ role: 'user', text: 'hi' }]);
    expect(out[0].dir).toBe('user');
    expect(out[0].text).toBe('hi');
  });
});

describe('shapeInventory', () => {
  it('renders matches as speakable results', () => {
    const out = shapeInventory([
      {
        id: 'u1',
        score: 0.9,
        label: '3BHK — Prestige Shantiniketan',
        sublabel: 'Whitefield, Bengaluru',
        priceRange: '₹72L – ₹78L',
        reason: 'matches budget + location',
      },
    ]);
    expect(out.count).toBe(1);
    expect(out.results[0]).toEqual({
      label: '3BHK — Prestige Shantiniketan',
      location: 'Whitefield, Bengaluru',
      price: '₹72L – ₹78L',
      why: 'matches budget + location',
    });
  });

  it('empty results → count 0', () => {
    expect(shapeInventory([]).count).toBe(0);
  });
});

describe('parseInventoryQuery', () => {
  it('parses location, budget, configuration into extracted data', () => {
    const q = parseInventoryQuery({
      location: 'whitefield',
      budget_max: '8000000',
      budget_min: '5000000',
      configuration: '3BHK',
    });
    expect(q.preferred_location).toBe('whitefield');
    expect(q.budget_min).toBe(5000000);
    expect(q.budget_max).toBe(8000000);
    expect(q.configuration).toBe('3BHK');
  });

  it('ignores garbage budget values', () => {
    const q = parseInventoryQuery({ budget_max: 'abc' });
    expect(q.budget_max).toBeUndefined();
  });
});