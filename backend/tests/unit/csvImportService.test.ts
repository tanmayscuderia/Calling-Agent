/**
 * Unit Test: csvImportService
 *
 * Tests CSV parsing, validation, project grouping/deduplication,
 * and the full import flow.
 * Supabase is mocked with an in-memory store.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── In-memory Supabase mock ──────────────────────────────

let tables: Record<string, any[]> = {};

function resetTables() {
  tables = {
    real_estate_import_batches: [],
    real_estate_projects: [],
    real_estate_units: [],
  };
}

function chainableQuery(tbl: string, data?: any) {
  const self: any = {
    insert(rowOrRows: any) {
      const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
      const withIds = rows.map((r: any) => ({
        ...r,
        id: r.id ?? `${tbl}-${tables[tbl].length + 1}`,
      }));
      tables[tbl].push(...withIds);
      return chainableQuery(tbl, withIds.length === 1 ? withIds[0] : withIds);
    },
    update(patch: any) {
      // Find matching rows by filters and update
      const updated = tables[tbl].map((row: any) =>
        self._matches(row) ? { ...row, ...patch } : row
      );
      tables[tbl] = updated;
      const firstUpdated = updated.find((r: any) => self._matches(r));
      return chainableQuery(tbl, firstUpdated);
    },
    select() {
      return self;
    },
    eq(col: string, val: any) {
      self._filters = self._filters || [];
      self._filters.push({ col, val });
      return self;
    },
    or(filterStr: string) {
      // For or() we store as special filter
      self._filters = self._filters || [];
      self._filters.push({ col: '__or__', val: filterStr });
      return self;
    },
    limit(n: number) {
      self._limit = n;
      return self;
    },
    async maybeSingle() {
      let result = tables[tbl].filter((row: any) => self._matches(row));
      if (self._limit) result = result.slice(0, self._limit);
      if (result.length === 0) return { data: null, error: null };
      return { data: result[0], error: null };
    },
    async single() {
      let result = tables[tbl].filter((row: any) => self._matches(row));
      if (self._limit) result = result.slice(0, self._limit);
      // For insert().select().single(), data is already set
      const finalData = data ?? result[0] ?? null;
      return { data: finalData, error: null };
    },
    then(resolve: any, reject?: any) {
      let result = tables[tbl].filter((row: any) => self._matches(row));
      if (self._limit) result = result.slice(0, self._limit);
      resolve({ data: data ?? result, error: null });
    },
    _filters: [] as any[],
    _matches(row: any) {
      if (!self._filters || self._filters.length === 0) return true;
      return self._filters.every((f: any) => {
        if (f.col === '__or__') {
          // Parse "col.eq.val,col.eq.val"
          const parts = f.val.split(',');
          return parts.some((p: string) => {
            const [col, , val] = p.split('.');
            return String(row[col]) === String(val);
          });
        }
        return row[f.col] === f.val;
      });
    },
  };
  return self;
}

vi.mock('../../src/db/supabase', () => ({
  supabaseAdmin: () => {
    return {
      from(tbl: string) {
        if (!tables[tbl]) tables[tbl] = [];
        return chainableQuery(tbl);
      },
    };
  },
}));

// Import AFTER mock is set up
import { importPropertiesCsv } from '../../src/uploads/csvImportService';

beforeEach(() => {
  resetTables();
});

// ── Tests ────────────────────────────────────────────────

describe('csvImportService.importPropertiesCsv', () => {
  const ORG_ID = 'org-test-1';

  it('imports a single valid row', async () => {
    const csv = `project_name,configuration,price_min,price_max
Demo Heights,3BHK,16500000,21000000`;

    const result = await importPropertiesCsv(ORG_ID, csv);

    expect(result.totalRows).toBe(1);
    expect(result.successRows).toBe(1);
    expect(result.failedRows).toBe(0);
    expect(result.batchId).toBeTruthy();
    expect(tables.real_estate_projects).toHaveLength(1);
    expect(tables.real_estate_units).toHaveLength(1);
    expect(tables.real_estate_projects[0].name).toBe('Demo Heights');
  });

  it('imports multiple rows for same project (dedup)', async () => {
    const csv = `project_name,configuration,price_min,price_max
Demo Heights,2BHK,9500000,12500000
Demo Heights,3BHK,16500000,21000000
Demo Heights,4BHK,22000000,28000000`;

    const result = await importPropertiesCsv(ORG_ID, csv);

    expect(result.totalRows).toBe(3);
    expect(result.successRows).toBe(3);
    // Only 1 project should be created (deduped by name)
    expect(tables.real_estate_projects).toHaveLength(1);
    expect(tables.real_estate_units).toHaveLength(3);
  });

  it('creates separate projects for different names', async () => {
    const csv = `project_name,configuration,price_min,price_max
Demo Heights,3BHK,16500000,21000000
ATS Knightsbridge,4BHK,75000000,120000000`;

    const result = await importPropertiesCsv(ORG_ID, csv);

    expect(result.successRows).toBe(2);
    expect(tables.real_estate_projects).toHaveLength(2);
    expect(tables.real_estate_units).toHaveLength(2);
  });

  it('fails rows with missing required fields', async () => {
    const csv = `project_name,configuration,price_min,price_max
Demo Heights,3BHK,16500000
Unknown,,,
Incomplete,,5000000,8000000`;

    const result = await importPropertiesCsv(ORG_ID, csv);

    expect(result.totalRows).toBe(3);
    expect(result.failedRows).toBe(3);
    expect(result.successRows).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('missing required fields');
  });

  it('creates import batch with correct metadata', async () => {
    const csv = `project_name,configuration,price_min,price_max
Demo Heights,3BHK,16500000,21000000`;

    await importPropertiesCsv(ORG_ID, csv, 'test-upload.csv');

    const batch = tables.real_estate_import_batches[0];
    expect(batch).toBeTruthy();
    expect(batch.org_id).toBe(ORG_ID);
    expect(batch.source_type).toBe('csv');
    expect(batch.file_name).toBe('test-upload.csv');
    expect(batch.status).toBe('completed');
    expect(batch.total_rows).toBe(1);
    expect(batch.success_rows).toBe(1);
  });

  it('parses amenities as comma-separated array', async () => {
    const csv = `project_name,configuration,price_min,price_max,amenities
Demo Heights,3BHK,16500000,21000000,"clubhouse, parking, green area"`;

    await importPropertiesCsv(ORG_ID, csv);

    const project = tables.real_estate_projects[0];
    expect(project.amenities).toEqual(['clubhouse', 'parking', 'green area']);
  });

  it('handles empty amenities field', async () => {
    const csv = `project_name,configuration,price_min,price_max,amenities
Demo Heights,3BHK,16500000,21000000,`;

    await importPropertiesCsv(ORG_ID, csv);

    const project = tables.real_estate_projects[0];
    expect(project.amenities).toEqual([]);
  });

  it('strips currency symbols and commas from prices', async () => {
    const csv = `project_name,configuration,price_min,price_max
Demo Heights,3BHK,"₹1,65,00,000","₹2,10,00,000"`;

    await importPropertiesCsv(ORG_ID, csv);

    const unit = tables.real_estate_units[0];
    // num() strips non-digit/dot/minus
    expect(unit.price_min).toBe(16500000);
    expect(unit.price_max).toBe(21000000);
  });

  it('parses optional fields (city, sector, location)', async () => {
    const csv = `project_name,configuration,price_min,price_max,city,sector,location
Demo Heights,3BHK,16500000,21000000,Noida,Sector 150,Golf Course Road`;

    await importPropertiesCsv(ORG_ID, csv);

    const project = tables.real_estate_projects[0];
    expect(project.city).toBe('Noida');
    expect(project.sector).toBe('Sector 150');
    expect(project.location).toBe('Golf Course Road');
  });

  it('creates unit with correct configuration and price', async () => {
    const csv = `project_name,configuration,price_min,price_max,unit_type,possession_status
Demo Heights,3BHK,16500000,21000000,apartment,under_construction`;

    await importPropertiesCsv(ORG_ID, csv);

    const unit = tables.real_estate_units[0];
    expect(unit.configuration).toBe('3BHK');
    expect(unit.unit_type).toBe('apartment');
    expect(unit.possession_status).toBe('under_construction');
    expect(unit.availability_status).toBe('available');
  });

  it('marks batch as failed when all rows fail', async () => {
    const csv = `project_name,configuration,price_min
Incomplete,3BHK,16500000`;

    await importPropertiesCsv(ORG_ID, csv);

    const batch = tables.real_estate_import_batches[0];
    expect(batch.status).toBe('failed');
  });

  it('auto-generates unit title from config + project name', async () => {
    const csv = `project_name,configuration,price_min,price_max
Demo Heights,3BHK,16500000,21000000`;

    await importPropertiesCsv(ORG_ID, csv);

    const unit = tables.real_estate_units[0];
    expect(unit.title).toBe('3BHK in Demo Heights');
  });

  it('uses explicit title when provided in CSV', async () => {
    const csv = `project_name,configuration,price_min,price_max,title
Demo Heights,3BHK,16500000,21000000,Premium 3BHK with City View`;

    await importPropertiesCsv(ORG_ID, csv);

    const unit = tables.real_estate_units[0];
    expect(unit.title).toBe('Premium 3BHK with City View');
  });

  it('handles multi-row CSV with mixed success and failure', async () => {
    const csv = `project_name,configuration,price_min,price_max
Demo Heights,3BHK,16500000,21000000
,2BHK,9500000,12500000
ATS,,,`;

    const result = await importPropertiesCsv(ORG_ID, csv);

    expect(result.totalRows).toBe(3);
    expect(result.successRows).toBe(1);
    expect(result.failedRows).toBe(2);
  });
});