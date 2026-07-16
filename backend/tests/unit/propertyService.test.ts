/**
 * Unit Tests: propertyService.searchProperties
 *
 * These tests guard against the three bugs that were found and fixed:
 *   1. Location alias resolution breaking matches (Delhi→New Delhi vs stored "Delhi")
 *   2. No DB-level filtering (irrelevant cities appearing in results)
 *   3. Projects without unit rows being invisible
 *
 * Supabase and locationAliases are mocked so tests are deterministic and fast.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock data store ──
// Simulates the joined project+units query result.
let mockProjects: any[] = [];

// ── Mock resolveLocations ──
// By default, pass through (no alias resolution).
// Individual tests can override to simulate alias behavior.
let mockResolvedLocations: { city?: string | null; sector?: string | null; location?: string | null } = {};

vi.mock('../../src/utils/locationAliases', () => ({
  resolveLocations: vi.fn(async () => mockResolvedLocations),
}));

// ── Mock Supabase ──
// Supports `.in()` filtering for status column (used by searchProperties)
vi.mock('../../src/db/supabase', () => ({
  supabaseAdmin: () => {
    let statusFilter: string[] | null = null;
    const query: any = {
      select(_cols: string) { return query; },
      eq(_col: string, _val: any) { return query; },
      in(col: string, vals: any[]) {
        // Capture status filter so we can apply it
        if (col === 'status') statusFilter = vals;
        return query;
      },
      order(_col: string, _opts: any) { return query; },
      limit(_n: number) { return query; },
      maybeSingle() { return query; },
      then(resolve: any) {
        let data = mockProjects;
        // Apply status filter if set (simulates DB-level WHERE status IN (...)
        if (statusFilter) {
          data = data.filter((p: any) => statusFilter!.includes(p.status));
        }
        resolve({ data, error: null });
      },
    };
    return {
      from(_table: string) { return query; },
    };
  },
}));

// Import AFTER mocks
import { searchProperties, clearSearchCache } from '../../src/crm/propertyService';

beforeEach(() => {
  mockProjects = [];
  mockResolvedLocations = {};
  clearSearchCache();
});

// ── Test data helpers ──

function makeProject(opts: {
  id?: string;
  name: string;
  city?: string;
  sector?: string;
  location?: string;
  status?: string;
  units?: any[];
  developerName?: string;
}): any {
  return {
    id: opts.id ?? `proj-${opts.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: opts.name,
    developer_name: opts.developerName ?? null,
    city: opts.city ?? null,
    sector: opts.sector ?? null,
    location: opts.location ?? null,
    status: opts.status ?? 'active',
    latitude: null,
    longitude: null,
    maps_url: null,
    units: opts.units ?? [],
  };
}

function makeUnit(opts: {
  id?: string;
  title?: string;
  configuration?: string;
  priceMin?: number;
  priceMax?: number;
  availability?: string;
  possessionStatus?: string;
  superArea?: number;
  brochureUrl?: string;
}): any {
  return {
    id: opts.id ?? `unit-${Math.random().toString(36).slice(2, 8)}`,
    title: opts.title ?? null,
    configuration: opts.configuration ?? null,
    price_min: opts.priceMin ?? null,
    price_max: opts.priceMax ?? null,
    super_area_sqft: opts.superArea ?? null,
    brochure_url: opts.brochureUrl ?? null,
    availability_status: opts.availability ?? 'available',
    possession_status: opts.possessionStatus ?? null,
  };
}

// ── Tests ──

describe('searchProperties', () => {

  // ── BUG #1: Location alias resolution breaking matches ──
  describe('Bug #1 fix: bidirectional location matching', () => {
    it('matches when raw city input differs from alias but matches DB storage', async () => {
      // Customer types "Delhi", alias resolves to "New Delhi",
      // but DB stores city = "Delhi". Must still match.
      mockResolvedLocations = { city: 'New Delhi', sector: null, location: null };
      mockProjects = [
        makeProject({ name: 'Delhi Villa', city: 'Delhi', sector: 'South Delhi' }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Delhi',
        limit: 5,
      });

      expect(results.length).toBe(1);
      expect(results[0].projectName).toBe('Delhi Villa');
    });

    it('matches when alias matches DB even if raw input does not', async () => {
      // Customer types "Gurgaon", alias resolves to "Gurugram",
      // DB stores "Gurugram". Must match via resolved name.
      mockResolvedLocations = { city: 'Gurugram', sector: null, location: null };
      mockProjects = [
        makeProject({ name: 'Gurgaon Heights', city: 'Gurugram', sector: 'Sector 56' }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Gurgaon',
        limit: 5,
      });

      expect(results.length).toBe(1);
      expect(results[0].projectName).toBe('Gurgaon Heights');
    });

    it('ranks matching sector higher than non-matching', async () => {
      mockResolvedLocations = { sector: 'Sector 150', city: null, location: null };
      mockProjects = [
        // DB stores "Sector 150", customer typed "sector 150"
        makeProject({ name: 'Demo Heights', city: 'Noida', sector: 'Sector 150' }),
        // Non-matching sector (should be penalized but may still appear as relaxed result)
        makeProject({ name: 'Other Project', city: 'Noida', sector: 'Sector 76' }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        sector: 'Sector 150',
        limit: 5,
      });

      // Demo Heights should rank #1 with higher score (sector matches)
      expect(results[0].projectName).toBe('Demo Heights');
      expect(results[0].score).toBeGreaterThan(results[1]?.score ?? 0);
    });
  });

  // ── BUG #2: No DB-level filtering ──
  describe('Bug #2 fix: strong city mismatch penalty', () => {
    it('excludes projects from a different city', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({ name: 'Delhi Villa', city: 'Delhi', sector: 'South Delhi' }),
        makeProject({ name: 'Noida Towers', city: 'Noida', sector: 'Sector 150' }),
        makeProject({ name: 'Mumbai Flat', city: 'Mumbai', sector: 'Bandra' }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Delhi',
        limit: 5,
      });

      // Only Delhi should appear
      expect(results.length).toBe(1);
      expect(results[0].city).toBe('Delhi');
    });

    it('scores matching city higher than non-matching', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({ name: 'Noida A', city: 'Noida', sector: 'Sector 150' }),
        makeProject({ name: 'Delhi B', city: 'Delhi', sector: 'South Delhi' }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        limit: 5,
      });

      // Noida project should be in results, Delhi should be excluded
      const cities = results.map((r) => r.city);
      expect(cities).toContain('Noida');
      expect(cities).not.toContain('Delhi');
    });
  });

  // ── BUG #3: Projects without unit rows being invisible ──
  describe('Bug #3 fix: projects as primary source', () => {
    it('finds projects that have no unit rows', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        // Project with NO units
        makeProject({ name: 'Standalone Project', city: 'Noida', sector: 'Sector 150', units: [] }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        limit: 5,
      });

      expect(results.length).toBe(1);
      expect(results[0].projectName).toBe('Standalone Project');
      expect(results[0].unitId).toBe('');
    });

    it('finds projects when all units are unavailable', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({
          name: 'Sold Out Project',
          city: 'Noida',
          sector: 'Sector 150',
          units: [
            makeUnit({ availability: 'sold' }),
            makeUnit({ availability: 'reserved' }),
          ],
        }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        limit: 5,
      });

      // Project should still appear (it's active), just without unit details
      expect(results.length).toBe(1);
      expect(results[0].projectName).toBe('Sold Out Project');
    });
  });

  // ── Configuration matching ──
  describe('configuration matching', () => {
    it('picks the unit matching requested configuration', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({
          name: 'Multi Config Project',
          city: 'Noida',
          sector: 'Sector 150',
          units: [
            makeUnit({ configuration: '2BHK', priceMin: 5000000, priceMax: 8000000 }),
            makeUnit({ configuration: '3BHK', priceMin: 10000000, priceMax: 15000000 }),
            makeUnit({ configuration: '4BHK', priceMin: 20000000, priceMax: 30000000 }),
          ],
        }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        configuration: '3BHK',
        city: 'Noida',
        limit: 3,
      });

      expect(results.length).toBe(1);
      expect(results[0].configuration).toBe('3BHK');
      expect(results[0].priceMin).toBe(10000000);
    });

    it('scores configuration match higher than mismatch', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({
          name: 'Exact Config',
          city: 'Noida',
          sector: 'Sector 150',
          units: [makeUnit({ configuration: '3BHK', priceMin: 10000000, priceMax: 15000000 })],
        }),
        makeProject({
          name: 'Wrong Config',
          city: 'Noida',
          sector: 'Sector 76',
          units: [makeUnit({ configuration: '2BHK', priceMin: 5000000, priceMax: 8000000 })],
        }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        configuration: '3BHK',
        city: 'Noida',
        limit: 3,
      });

      expect(results[0].projectName).toBe('Exact Config');
    });
  });

  // ── Budget matching ──
  describe('budget overlap matching', () => {
    it('matches when unit price range overlaps with budget', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({
          name: 'Budget Match',
          city: 'Noida',
          sector: 'Sector 150',
          units: [makeUnit({ configuration: '3BHK', priceMin: 16500000, priceMax: 21000000 })],
        }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        configuration: '3BHK',
        budgetMax: 20000000,
        limit: 3,
      });

      expect(results.length).toBe(1);
      expect(results[0].priceMin).toBe(16500000);
    });

    it('penalizes units outside budget', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({
          name: 'In Budget',
          city: 'Noida',
          sector: 'Sector 150',
          units: [makeUnit({ configuration: '3BHK', priceMin: 15000000, priceMax: 18000000 })],
        }),
        makeProject({
          name: 'Over Budget',
          city: 'Noida',
          sector: 'Sector 146',
          units: [makeUnit({ configuration: '3BHK', priceMin: 50000000, priceMax: 80000000 })],
        }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        configuration: '3BHK',
        budgetMax: 20000000,
        limit: 3,
      });

      // In Budget should rank first
      expect(results[0].projectName).toBe('In Budget');
    });
  });

  // ── Full demo scenario ──
  describe('demo scenario: 3BHK Noida ~2cr', () => {
    it('ranks Demo Heights #1 for the exact demo query', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({
          name: 'Demo Heights',
          city: 'Noida',
          sector: 'Sector 150',
          developerName: 'Demo Realty',
          units: [
            makeUnit({
              title: '3BHK in Demo Heights',
              configuration: '3BHK',
              priceMin: 16500000,
              priceMax: 21000000,
              possessionStatus: 'under_construction',
              superArea: 1650,
            }),
          ],
        }),
        makeProject({
          name: 'Godrej Tropical Isle',
          city: 'Noida',
          sector: 'Sector 146',
          developerName: 'Godrej Properties',
          units: [
            makeUnit({
              configuration: '3BHK',
              priceMin: 22000000,
              priceMax: 32000000,
              possessionStatus: 'under_construction',
            }),
          ],
        }),
        makeProject({
          name: 'ATS Knightsbridge',
          city: 'Noida',
          sector: 'Sector 124',
          units: [
            makeUnit({
              configuration: '4BHK',
              priceMin: 75000000,
              priceMax: 120000000,
              possessionStatus: 'ready_to_move',
            }),
          ],
        }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        configuration: '3BHK',
        budgetMax: 20000000,
        limit: 3,
      });

      // Demo Heights should be #1 (exact config + budget match)
      expect(results[0].projectName).toBe('Demo Heights');
      expect(results[0].configuration).toBe('3BHK');
      expect(results[0].priceMin).toBe(16500000);
      expect(results[0].score).toBeGreaterThan(0.8);
    });
  });

  // ── Empty results ──
  describe('edge cases', () => {
    it('returns empty when no projects exist', async () => {
      mockResolvedLocations = {};
      mockProjects = [];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        limit: 3,
      });

      expect(results).toEqual([]);
    });

    it('returns empty when city does not match any project', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({ name: 'Noida Project', city: 'Noida', sector: 'Sector 150' }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Mumbai',
        limit: 3,
      });

      expect(results).toEqual([]);
    });

    it('ignores inactive projects', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({ name: 'Archived', city: 'Noida', sector: 'Sector 150', status: 'archived' }),
        makeProject({ name: 'Active', city: 'Noida', sector: 'Sector 76', status: 'active' }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        limit: 5,
      });

      expect(results.length).toBe(1);
      expect(results[0].projectName).toBe('Active');
    });

    it('respects limit parameter', async () => {
      mockResolvedLocations = {};
      mockProjects = Array.from({ length: 10 }, (_, i) =>
        makeProject({ name: `Project ${i}`, city: 'Noida', sector: `Sector ${i}` })
      );

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        limit: 3,
      });

      expect(results.length).toBe(3);
    });

    it('returns all projects when no filters specified', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({ name: 'Project A', city: 'Noida', sector: 'Sector 150' }),
        makeProject({ name: 'Project B', city: 'Delhi', sector: 'South Delhi' }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        limit: 5,
      });

      // No filters → all active projects match with base score
      expect(results.length).toBe(2);
    });
  });

  // ── Possession status ──
  describe('possession status matching', () => {
    it('matches ready_to_move preference', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({
          name: 'Ready Project',
          city: 'Noida',
          sector: 'Sector 76',
          units: [makeUnit({ configuration: '2BHK', possessionStatus: 'ready_to_move', priceMin: 9500000, priceMax: 12500000 })],
        }),
        makeProject({
          name: 'UC Project',
          city: 'Noida',
          sector: 'Sector 150',
          units: [makeUnit({ configuration: '2BHK', possessionStatus: 'under_construction', priceMin: 9500000, priceMax: 12500000 })],
        }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        configuration: '2BHK',
        possessionStatus: 'ready_to_move',
        limit: 3,
      });

      expect(results[0].projectName).toBe('Ready Project');
    });
  });

  // ── Cache behavior ──
  describe('caching', () => {
    it('returns cached results for identical params', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({ name: 'Cached Project', city: 'Noida', sector: 'Sector 150' }),
      ];

      const r1 = await searchProperties({ orgId: 'org-1', city: 'Noida', limit: 3 });
      // Change mock data — cached result should not change
      mockProjects = [];
      const r2 = await searchProperties({ orgId: 'org-1', city: 'Noida', limit: 3 });

      expect(r2).toEqual(r1);
      expect(r2.length).toBe(1);
    });

    it('clearSearchCache forces fresh query', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({ name: 'First', city: 'Noida', sector: 'Sector 150' }),
      ];

      const r1 = await searchProperties({ orgId: 'org-1', city: 'Noida', limit: 3 });

      // Clear cache and change data
      clearSearchCache();
      mockProjects = [
        makeProject({ name: 'Second', city: 'Noida', sector: 'Sector 76' }),
      ];

      const r2 = await searchProperties({ orgId: 'org-1', city: 'Noida', limit: 3 });

      expect(r2[0].projectName).toBe('Second');
    });
  });

  // ── Reason string quality ──
  describe('reason string', () => {
    it('includes configuration, location, and budget in reason', async () => {
      mockResolvedLocations = {};
      mockProjects = [
        makeProject({
          name: 'Demo Heights',
          city: 'Noida',
          sector: 'Sector 150',
          units: [
            makeUnit({
              configuration: '3BHK',
              priceMin: 16500000,
              priceMax: 21000000,
              possessionStatus: 'under_construction',
            }),
          ],
        }),
      ];

      const results = await searchProperties({
        orgId: 'org-1',
        city: 'Noida',
        configuration: '3BHK',
        budgetMax: 20000000,
        limit: 1,
      });

      const reason = results[0].reason;
      expect(reason.toLowerCase()).toContain('3bhk');
      expect(reason.toLowerCase()).toContain('sector 150');
      expect(reason.toLowerCase()).toContain('within budget');
    });
  });
});