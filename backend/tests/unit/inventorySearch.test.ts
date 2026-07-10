/**
 * Unit Test: inventorySearch — generic search scoring
 *
 * Tests the scoring/matching logic for non-real-estate inventory.
 * The real estate path delegates to propertyService (tested separately).
 *
 * Supabase is mocked with an in-memory store to control inventory data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentConfig, ExtractedData } from '../../src/ai/agentTypes';

// ── In-memory Supabase mock ──────────────────────────────

let tableData: any[] = [];

vi.mock('../../src/db/supabase', () => ({
  supabaseAdmin: () => ({
    from(_tbl: string) {
      const query: any = {
        select() { return query; },
        eq(_col: string, _val: any) { return query; },
        limit(n: number) { query._limit = n; return query; },
        then(resolve: any) {
          resolve({ data: tableData.slice(0, query._limit ?? 100), error: null });
        },
      };
      return query;
    },
  }),
}));

// Import AFTER mock
import { searchInventory } from '../../src/ai/inventorySearch';

beforeEach(() => {
  tableData = [];
});

// ── Test config ──────────────────────────────────────────

function makeConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    id: 'cfg-1',
    org_id: 'org-1',
    name: 'Test Agent',
    industry: 'automobile',
    persona_name: 'Bot',
    persona_role: 'sales assistant',
    tone: 'friendly',
    business_name: 'Test Motors',
    business_description: null,
    business_location: null,
    system_prompt_override: null,
    qualifying_fields: [
      { key: 'body_type', label: 'Body Type', type: 'string' },
      { key: 'budget_max', label: 'Max Budget', type: 'number' },
    ],
    intent_types: [{ key: 'product_search', label: 'Search' }],
    status_pipeline: [],
    inventory_enabled: true,
    inventory_table: 'automobile_inventory',
    search_fields: [
      { field: 'body_type', operator: 'ilike', extract_key: 'body_type', label: 'Body Type' },
      { field: 'price', operator: 'lte', extract_key: 'budget_max', label: 'Budget' },
    ],
    reply_template_match: null,
    reply_template_no_match: null,
    reply_template_missing_info: null,
    call_agent_enabled: false,
    call_opening_template: null,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────

describe('inventorySearch (generic)', () => {
  it('returns empty when inventory_disabled', async () => {
    const cfg = makeConfig({ inventory_enabled: false });
    const result = await searchInventory('org-1', cfg, {});
    expect(result).toEqual([]);
  });

  it('returns empty when no search_fields', async () => {
    const cfg = makeConfig({ search_fields: [] });
    const result = await searchInventory('org-1', cfg, { body_type: 'SUV' });
    expect(result).toEqual([]);
  });

  it('returns empty when inventory table is empty', async () => {
    const cfg = makeConfig();
    const result = await searchInventory('org-1', cfg, { body_type: 'SUV' });
    expect(result).toEqual([]);
  });

  it('returns matches when extracted data matches rows', async () => {
    tableData = [
      { id: '1', name: 'Hyundai Creta', body_type: 'SUV', price: 1500000 },
      { id: '2', name: 'Honda City', body_type: 'Sedan', price: 1200000 },
      { id: '3', name: 'Maruti Brezza', body_type: 'SUV', price: 1100000 },
    ];

    const cfg = makeConfig();
    const result = await searchInventory('org-1', cfg, { body_type: 'SUV' });

    expect(result.length).toBe(2); // Creta + Brezza
    expect(result[0].label).toContain('Creta');
  });

  it('filters by budget using lte operator', async () => {
    tableData = [
      { id: '1', name: 'Car A', body_type: 'SUV', price: 800000 },
      { id: '2', name: 'Car B', body_type: 'SUV', price: 1500000 },
      { id: '3', name: 'Car C', body_type: 'SUV', price: 2500000 },
    ];

    const cfg = makeConfig();
    // Only budget_max → matches cars with price <= 1200000
    const result = await searchInventory('org-1', cfg, { budget_max: 1200000 });

    expect(result.length).toBe(1);
    expect(result[0].label).toBe('Car A');
  });

  it('scores multi-field matches higher than single-field', async () => {
    tableData = [
      // Matches BOTH body_type AND budget
      { id: '1', name: 'Perfect Match', body_type: 'SUV', price: 1000000 },
      // Matches ONLY body_type
      { id: '2', name: 'SUV Only', body_type: 'SUV', price: 3000000 },
    ];

    const cfg = makeConfig();
    const result = await searchInventory('org-1', cfg, {
      body_type: 'SUV',
      budget_max: 1200000,
    });

    expect(result.length).toBe(2);
    // Perfect match should score higher
    expect(result[0].label).toBe('Perfect Match');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('limits results to specified count', async () => {
    tableData = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `SUV ${i}`,
      body_type: 'SUV',
      price: 1000000,
    }));

    const cfg = makeConfig();
    const result = await searchInventory('org-1', cfg, { body_type: 'SUV' }, undefined, 3);

    expect(result.length).toBe(3);
  });

  it('extracts label from title/name/product_name', async () => {
    tableData = [
      { id: '1', title: 'Product A', body_type: 'SUV', price: 1000000 },
      { id: '2', name: 'Product B', body_type: 'SUV', price: 1000000 },
      { id: '3', product_name: 'Product C', body_type: 'SUV', price: 1000000 },
    ];

    const cfg = makeConfig();
    const result = await searchInventory('org-1', cfg, { body_type: 'SUV' });

    expect(result.length).toBe(3);
    expect(result[0].label).toBe('Product A');
    expect(result[1].label).toBe('Product B');
    expect(result[2].label).toBe('Product C');
  });

  it('generates priceRange from price_min/price_max', async () => {
    tableData = [
      { id: '1', name: 'Item A', body_type: 'SUV', price_min: 1000000, price_max: 1500000 },
    ];

    const cfg = makeConfig();
    const result = await searchInventory('org-1', cfg, { body_type: 'SUV' });

    expect(result[0].priceRange).toBeTruthy();
    expect(result[0].priceRange).toContain('L');
  });

  it('falls back to lead preferences when extracted data missing', async () => {
    tableData = [
      { id: '1', name: 'SUV Car', body_type: 'SUV', price: 1000000 },
    ];

    const cfg = makeConfig();
    // body_type in leadPrefs, not in extracted
    const result = await searchInventory(
      'org-1',
      cfg,
      {}, // no extracted data
      { body_type: 'SUV' } // lead preferences
    );

    expect(result.length).toBe(1);
  });

  it('returns empty when no rows match', async () => {
    tableData = [
      { id: '1', name: 'Sedan', body_type: 'Sedan', price: 1000000 },
    ];

    const cfg = makeConfig();
    const result = await searchInventory('org-1', cfg, { body_type: 'Truck' });

    expect(result).toEqual([]);
  });
});