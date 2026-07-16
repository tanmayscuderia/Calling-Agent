/**
 * Generic Inventory Search
 * Queries any inventory table using config-driven search_fields.
 * Falls back to the existing real_estate propertyService for real estate,
 * and does generic DB queries for other industries.
 */

import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import type { AgentConfig, ExtractedData, SearchFieldConfig } from './agentTypes';

export interface InventoryMatch {
  id: string;
  score: number;
  reason: string;
  label: string;
  sublabel?: string;
  priceRange?: string;
  details?: Record<string, any>;
}

export interface InventoryRow {
  id: string;
  [key: string]: any;
}

/**
 * Search inventory based on agent config search_fields + extracted data.
 * Handles budget overlap, ilike text, and generic operators.
 */
export async function searchInventory(
  orgId: string,
  cfg: AgentConfig,
  extracted: ExtractedData,
  leadPrefs?: Record<string, any>,
  limit = 3
): Promise<InventoryMatch[]> {
  if (!cfg.inventory_enabled || !cfg.inventory_table) {
    return [];
  }

  // Special case: real estate uses the optimized propertyService
  if (cfg.inventory_table === 'real_estate_units') {
    return searchRealEstate(orgId, extracted, leadPrefs, limit);
  }

  // Generic search for other industries
  return searchGeneric(orgId, cfg, extracted, leadPrefs, limit);
}

// ── Real Estate (uses existing optimized service) ──

async function searchRealEstate(
  orgId: string,
  extracted: ExtractedData,
  leadPrefs: Record<string, any> | undefined,
  limit: number
): Promise<InventoryMatch[]> {
  const { searchProperties } = await import('../crm/propertyService');
  const matches = await searchProperties({
    orgId,
    configuration: extracted.configuration ?? leadPrefs?.configuration ?? undefined,
    city: extracted.city ?? leadPrefs?.preferred_city ?? undefined,
    sector: extracted.sector ?? leadPrefs?.preferred_sector ?? undefined,
    location: extracted.location ?? leadPrefs?.preferred_location ?? undefined,
    budgetMin: extracted.budget_min ?? leadPrefs?.budget_min ?? undefined,
    budgetMax: extracted.budget_max ?? leadPrefs?.budget_max ?? undefined,
    possessionStatus: extracted.possession_preference ?? leadPrefs?.possession_preference ?? undefined,
    limit,
  });

  return matches.map((m) => ({
    id: m.unitId ?? m.projectId ?? '',
    score: m.score,
    reason: m.reason,
    label: m.projectName,
    sublabel: [m.sector, m.city].filter(Boolean).join(', ') || undefined,
    priceRange: formatRange(m.priceMin, m.priceMax),
    details: {
      projectId: m.projectId,
      configuration: m.configuration,
      possessionStatus: m.possessionStatus,
      brochureUrl: m.brochureUrl,
      developerName: m.developerName,
      superAreaSqft: m.superAreaSqft,
      city: m.city,
      sector: m.sector,
      location: m.location,
      address: m.address,
      latitude: m.latitude,
      longitude: m.longitude,
      mapsUrl: m.mapsUrl,
    },
  }));
}

// ── Generic Search (works for any table) ──

async function searchGeneric(
  orgId: string,
  cfg: AgentConfig,
  extracted: ExtractedData,
  leadPrefs: Record<string, any> | undefined,
  limit: number
): Promise<InventoryMatch[]> {
  const table = cfg.inventory_table!;
  const searchFields = cfg.search_fields;
  if (!searchFields.length) return [];

  // Build query
  let query = supabaseAdmin()
    .from(table)
    .select('*')
    .eq('org_id', orgId);

  // For availability/status, try common columns
  // (these don't exist on every table, so use try-catch)
  query = query.limit(limit * 3); // fetch extra for post-filtering

  const { data: rows, error } = await query;

  if (error) {
    logger.warn({ err: error, table }, '[InventorySearch] Generic query failed');
    return [];
  }

  if (!rows || rows.length === 0) return [];

  // Score each row against extracted data
  const scored = rows
    .map((row) => {
      let score = 0;
      let matchedFields = 0;
      const reasons: string[] = [];

      for (const sf of searchFields) {
        const extractVal = extractValueForField(sf, extracted, leadPrefs);
        if (extractVal == null) continue;

        const rowVal = row[sf.field];
        if (rowVal == null) continue;

        const isMatch = matchField(rowVal, extractVal, sf.operator);
        if (isMatch) {
          matchedFields++;
          score += sf.operator === 'ilike' ? 0.3 : 0.4;
          reasons.push(`${sf.label ?? sf.field}: ${String(extractVal)}`);
        }
      }

      // Normalize score
      const totalFields = searchFields.length;
      const finalScore = totalFields > 0 ? Math.min(1, score / Math.max(1, totalFields * 0.3)) : 0;

      return {
        row,
        score: matchedFields > 0 ? finalScore : 0,
        matchedFields,
        reasons,
      };
    })
    .filter((s) => s.matchedFields > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Map to InventoryMatch
  return scored.map((s) => rowToMatch(s.row, s.score, s.reasons, table));
}

function rowToMatch(row: any, score: number, reasons: string[], table: string): InventoryMatch {
  // Try to find a label (title/name/product_name)
  const label = row.title ?? row.name ?? row.product_name ?? row.label ?? `Item ${row.id?.slice(0, 8)}`;

  // Try to find a sublabel (location/category/description)
  const sublabel = row.location ?? row.category ?? row.city ?? row.description?.slice(0, 60) ?? undefined;

  // Try to find a price range
  let priceRange: string | undefined;
  if (row.price_min != null || row.price_max != null) {
    priceRange = formatRange(row.price_min, row.price_max);
  } else if (row.price != null) {
    priceRange = formatRange(row.price, row.price);
  }

  return {
    id: row.id,
    score,
    reason: reasons.join('; ') || 'Partial match',
    label,
    sublabel,
    priceRange,
    details: {
      table,
      ...stripInternalFields(row),
    },
  };
}

function stripInternalFields(row: any): Record<string, any> {
  const { id, org_id, created_at, updated_at, ...rest } = row;
  return rest;
}

function extractValueForField(
  sf: SearchFieldConfig,
  extracted: ExtractedData,
  leadPrefs: Record<string, any> | undefined
): any {
  const key = sf.extract_key;
  // Check extracted first, then lead prefs (with both raw key and preferred_ prefix)
  if (extracted[key] != null) return extracted[key];
  if (leadPrefs) {
    if (leadPrefs[key] != null) return leadPrefs[key];
    if (leadPrefs[`preferred_${key}`] != null) return leadPrefs[`preferred_${key}`];
  }
  return null;
}

function matchField(rowVal: any, extractVal: any, operator: string): boolean {
  switch (operator) {
    case 'ilike':
      return String(rowVal).toLowerCase().includes(String(extractVal).toLowerCase());
    case 'eq':
      return String(rowVal) === String(extractVal);
    case 'lte':
      return Number(rowVal) <= Number(extractVal);
    case 'gte':
      return Number(rowVal) >= Number(extractVal);
    default:
      return false;
  }
}

function formatRange(min: any, max: any): string | undefined {
  if (min == null && max == null) return undefined;
  if (min != null && max != null) {
    if (min === max) return formatCurrency(Number(min));
    return `${formatCurrency(Number(min))} – ${formatCurrency(Number(max))}`;
  }
  return formatCurrency(Number(min ?? max));
}

function formatCurrency(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}