/**
 * Unit tests for Sarvam tool routes (voice-agent HTTP tools).
 * Covers: authorized() (X-Tool-Secret / X-API-Key / Bearer auth forms),
 * response shapers (voice-friendly output), and query parsing.
 * Full HTTP tests would need a supabase mock — kept light per repo test style.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { config } from '../../src/config';
import { normalizePhone } from '../../src/utils/phone';
import { parseFreeTextQuery } from '../../src/sarvam/queryParser';
import {
  authorized,
  shapeLead,
  shapeMessages,
  shapeInventory,
  parseInventoryQuery,
  buildSearchPasses,
  hasUsableCriteria,
  zeroResultPayload,
  cacheGet,
  cacheSet,
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

  it('parses free-text query into structured filters (city/budget)', () => {
    const q = parseInventoryQuery({ query: 'Noida property 8 to 10 crore' });
    expect(q.city).toBe('Noida');
    expect(q.budget_min).toBe(80_000_000);
    expect(q.budget_max).toBe(100_000_000);
  });

  it('parses sector + BHK from free-text query', () => {
    const q = parseInventoryQuery({ query: 'Noida sector 70 to 80, 2BHK' });
    expect(q.city).toBe('Noida');
    expect(q.sector).toBe('Sector 70');
    expect(q.configuration).toBe('2BHK');
  });

  it('explicit params win over parsed query values', () => {
    const q = parseInventoryQuery({
      query: 'gurgaon 3bhk 5 crore',
      city: 'Noida',
      budget_max: '60000000',
    });
    expect(q.city).toBe('Noida');
    expect(q.budget_max).toBe(60_000_000);
    // configuration has no explicit param → gap-filled from the query
    expect(q.configuration).toBe('3BHK');
  });
});

describe('zeroResultPayload (empty-search guidance)', () => {
  it('unknown city + known cities → note names the city, lists where we DO serve', () => {
    const out = zeroResultPayload({ city: 'Pune' }, 'Pune', ['Noida', 'Gurgaon']);
    expect(out.count).toBe(0);
    expect(out.results).toEqual([]);
    expect(out.available_locations).toEqual(['Noida', 'Gurgaon']);
    expect(out.note).toContain('in Pune');
    expect(out.note).toContain('Noida, Gurgaon');
    expect(out.note).toContain('Do NOT invent');
  });

  it('no cities available → falls back to WhatsApp follow-up wording, empty array', () => {
    const out = zeroResultPayload({ city: 'Pune' }, 'Pune', []);
    expect(out.available_locations).toEqual([]);
    expect(out.note).toContain('in Pune');
    expect(out.note).toContain('WhatsApp');
  });

  it('no location filter → generic "those criteria" phrasing', () => {
    const out = zeroResultPayload({}, null, ['Noida']);
    expect(out.note).toContain('for those criteria');
    expect(out.note).toContain('for that');
  });

  it('echoes applied filters back for transcript verification', () => {
    const filters = { cities: ['Noida', 'Pune'], budget_max: 120000000 };
    const out = zeroResultPayload(filters, 'Pune', []);
    expect(out.filters).toEqual(filters);
  });

  // ── Coverage-truth regression (live incident 2026-08-24) ──
  // The voice LLM read the request-echo `filters.cities` as availability and
  // told the caller we had stock in Pune (we didn't). Zero-result payloads now
  // carry machine-readable truth: every requested city is explicitly coverage 0.
  it('explicit requested cities → coverage 0 for each + no_results_in list', () => {
    const out = zeroResultPayload({ cities: ['Noida', 'Pune'] }, 'Noida / Pune', [], ['Noida', 'Pune']);
    expect(out.requested_cities).toEqual(['Noida', 'Pune']);
    expect(out.coverage).toEqual({ Noida: 0, Pune: 0 });
    expect(out.no_results_in).toEqual(['Noida', 'Pune']);
  });

  it('no requested-cities array → derives them from the `where` string (single city)', () => {
    const out = zeroResultPayload({ city: 'Gurgaon' }, 'Gurgaon', ['Noida']);
    expect(out.requested_cities).toEqual(['Gurgaon']);
    expect(out.coverage).toEqual({ Gurgaon: 0 });
    expect(out.no_results_in).toEqual(['Gurgaon']);
  });

  it('no city information at all → coverage fields omitted (nothing to claim)', () => {
    const out = zeroResultPayload({ budget_max: 5000000 }, null, ['Noida']);
    expect(out).not.toHaveProperty('coverage');
    expect(out).not.toHaveProperty('requested_cities');
    expect(out).not.toHaveProperty('no_results_in');
  });
});

describe('response cache (tunnel-budget saver)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for unknown keys (cache miss)', () => {
    expect(cacheGet('search:/api/tools/sarvam/inventory-search?query=miss-' + Date.now())).toBeNull();
  });

  it('serves identical repeat requests within the TTL', () => {
    const key = `search:/api/tools/sarvam/inventory-search?query=hit-${Date.now()}`;
    const body = { count: 1, results: [{ label: 'Test Tower' }] };
    cacheSet(key, body);
    expect(cacheGet(key)).toEqual(body);
  });

  it('expires entries after 60s (stale data never served)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T10:00:00Z'));
    const key = 'search:/api/tools/sarvam/inventory-search?query=stale';
    cacheSet(key, { count: 2 });
    vi.setSystemTime(new Date('2026-08-21T10:01:01Z')); // +61s
    expect(cacheGet(key)).toBeNull();
  });

  it('evicts the oldest entry when over the size cap', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T10:00:00Z'));
    const oldKey = 'search:/old';
    cacheSet(oldKey, { count: 0 });
    vi.setSystemTime(new Date('2026-08-21T10:00:01Z'));
    for (let i = 0; i < 200; i++) cacheSet(`search:/bulk-${i}`, { count: i });
    // oldKey was the first inserted — evicted by the 200-cap
    expect(cacheGet(oldKey)).toBeNull();
    expect(cacheGet('search:/bulk-199')).toEqual({ count: 199 });
  });
});

describe('lead-context phone guard (empty-phone leak regression)', () => {
  // Found live 2026-08-21: with NO phone param, normalizePhone('') returns ''
  // (never throws), so the old catch-based 400 guard was dead code and the
  // PostgREST .or filter `phone.eq.,whatsapp_number.eq.` matched a lead with
  // empty phone fields — leaking an unrelated caller's context to the voice
  // agent. The route now rejects empty phone with a 400 BEFORE querying.
  it('normalizePhone returns empty string (not throw) for missing/blank input — the invariant the guard covers', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(String(undefined))).toBe('');
    expect(normalizePhone('   ')).toBe('');
  });

  it('a phone with digits still normalizes (prefixed with +)', () => {
    expect(normalizePhone('9876543210')).toBe('+9876543210');
    expect(normalizePhone('+919876543210')).toBe('+919876543210');
  });
});


// ── Regression: 2026-08-21 fan-out bugs (multi-city dropped, multi-config dead code) ──

describe('buildSearchPasses (city × configuration fan-out)', () => {
  it('explicit params → single pass', () => {
    expect(buildSearchPasses({ city: 'Noida', configuration: '3BHK' }, null)).toEqual([
      { city: 'Noida', configuration: '3BHK' },
    ]);
  });

  it('multi-city query → one pass per city (Pune no longer dropped)', () => {
    const q = 'gurgaon and pune me 3bhk';
    const parsed = parseFreeTextQuery(q);
    expect(buildSearchPasses({ query: q }, parsed)).toEqual([
      { city: 'Gurgaon', configuration: '3BHK' },
      { city: 'Pune', configuration: '3BHK' },
    ]);
  });

  it('multi-city × multi-config → full cross product ("Gurgaon and Pune, 3 or 4 bhk")', () => {
    const q = 'gurgaon and pune, 3 or 4 bhk';
    const parsed = parseFreeTextQuery(q);
    expect(buildSearchPasses({ query: q }, parsed)).toEqual([
      { city: 'Gurgaon', configuration: '3BHK' },
      { city: 'Gurgaon', configuration: '4BHK' },
      { city: 'Pune', configuration: '3BHK' },
      { city: 'Pune', configuration: '4BHK' },
    ]);
  });

  it('explicit dashboard params collapse parsed multi-values to one pass', () => {
    const parsed = parseFreeTextQuery('gurgaon and pune 3bhk');
    expect(buildSearchPasses({ city: 'Noida', configuration: '2BHK' }, parsed)).toEqual([
      { city: 'Noida', configuration: '2BHK' },
    ]);
  });

  it('caps at 6 passes so garbled ASR cannot storm Supabase', () => {
    const parsed = {
      configurations: ['1BHK', '2BHK', '3BHK', '4BHK'],
      propertyTypes: [],
      cities: ['Noida', 'Gurgaon', 'Pune'],
    };
    expect(buildSearchPasses({}, parsed)).toHaveLength(6);
  });

  it('parseInventoryQuery leaves multi-value fields unfilled for fan-out', () => {
    expect(parseInventoryQuery({ query: 'gurgaon and pune 3bhk' }).city).toBeUndefined();
    expect(parseInventoryQuery({ query: '3 or 4 bhk in noida' }).configuration).toBeUndefined();
    // single values still gap-fill as before
    expect(parseInventoryQuery({ query: 'noida 3bhk' }).city).toBe('Noida');
    expect(parseInventoryQuery({ query: 'noida 3bhk' }).configuration).toBe('3BHK');
  });

  it('property-type fallback still fills configuration when no BHK present', () => {
    expect(parseInventoryQuery({ query: 'penthouse in mumbai' }).configuration).toBe('Penthouse');
  });
});


// ── Regression: garbled queries must NOT trigger an unfiltered blind search ──

describe('hasUsableCriteria (unfiltered-search guard)', () => {
  it('pure ASR garble with no explicit params → NOT usable (guidance instead of blind top-3)', () => {
    expect(hasUsableCriteria({ query: 'kya available hai' })).toBe(false);
    expect(hasUsableCriteria({ query: 'haa ji' })).toBe(false);
  });

  it('query parsing to ANY filter → usable', () => {
    expect(hasUsableCriteria({ query: 'noida 3bhk' })).toBe(true); // city + config
    expect(hasUsableCriteria({ query: 'whitefield me dikhao' })).toBe(true); // locationRaw only
    expect(hasUsableCriteria({ query: 'under 2 crore' })).toBe(true); // budget only
    expect(hasUsableCriteria({ query: 'penthouse' })).toBe(true); // property type only
    expect(hasUsableCriteria({ query: 'sector 70' })).toBe(true); // sector only
  });

  it('explicit dashboard params → usable regardless of query', () => {
    expect(hasUsableCriteria({ preferred_location: 'whitefield' })).toBe(true);
    expect(hasUsableCriteria({ configuration: '3BHK' })).toBe(true);
    expect(hasUsableCriteria({ budget_max: 8_000_000 })).toBe(true);
  });

  it('empty params → not usable', () => {
    expect(hasUsableCriteria({})).toBe(false);
  });
});
