/**
 * Location Alias Resolution
 *
 * Resolves shorthand/colloquial location names to their canonical form.
 * E.g., "GK 2" → "Greater Kailash 2", "Gurgaon" → "Gurugram"
 *
 * Two layers:
 * 1. Built-in dictionary (loaded on startup, covers common NCR/Mumbai/Bangalore areas)
 * 2. Per-org DB aliases (loaded lazily, cached for 5 min per org)
 */

import { supabaseAdmin } from '../db/supabase';
import { logger } from './logger';

// ── Types ──

export interface ResolvedLocation {
  /** The canonical name if a match was found, otherwise the normalized input */
  canonical: string;
  /** True if an alias match was found */
  resolved: boolean;
  /** Original input */
  original: string;
  /** The scope of the match (city, sector, etc.) */
  scope?: string;
}

// ── Built-in dictionary ──
// Key = normalized alias, Value = { canonical, scope }
// Both the alias AND the canonical name map to the canonical.

interface AliasEntry {
  canonical: string;
  scope: string;
}

const builtInDict = new Map<string, AliasEntry>();

// Raw data — alias → canonical mapping
const BUILTIN_ALIASES: Array<{ canonical: string; aliases: string[]; scope: string }> = [
  // ── NCR Cities ──
  { canonical: 'Gurugram', scope: 'city', aliases: ['gurgaon', 'gurugram', 'gurgoan'] },
  { canonical: 'Noida', scope: 'city', aliases: ['noida', 'gautam buddh nagar', 'gautam Buddh nagar'] },
  { canonical: 'Greater Noida', scope: 'city', aliases: ['greater noida', 'gr noida', 'greater noida west', 'noida extension', 'noida ext'] },
  { canonical: 'Faridabad', scope: 'city', aliases: ['faridabad', 'faridabaad'] },
  { canonical: 'Ghaziabad', scope: 'city', aliases: ['ghaziabad', 'gzb'] },
  { canonical: 'Dwarka', scope: 'city', aliases: ['dwarka', 'dwarka sub city'] },
  { canonical: 'New Delhi', scope: 'city', aliases: ['delhi', 'new delhi', 'central delhi', 'south delhi', 'north delhi', 'west delhi', 'east delhi'] },

  // ── NCR Sectors / Areas ──
  { canonical: 'Greater Kailash 2', scope: 'sector', aliases: ['gk 2', 'gk2', 'gk ii', 'gk-2', 'greater kailash ii', 'greater kailash two'] },
  { canonical: 'Greater Kailash 1', scope: 'sector', aliases: ['gk 1', 'gk1', 'gk i', 'gk-1', 'greater kailash i', 'greater kailash one', 'gk'] },
  { canonical: 'Lajpat Nagar', scope: 'sector', aliases: ['lajpat nagar', 'lajpatnagar', 'lpn'] },
  { canonical: 'Vasant Kunj', scope: 'sector', aliases: ['vasant kunj'] },
  { canonical: 'Saket', scope: 'sector', aliases: ['saket'] },
  { canonical: 'Sector 150', scope: 'sector', aliases: ['sector 150', 'sec 150', 'sector-150', 'sector150', 'noida sector 150', 'sec 150 noida'] },
  { canonical: 'Sector 146', scope: 'sector', aliases: ['sector 146', 'sec 146', 'sector-146', 'sector146', 'noida sector 146', 'sec 146 noida'] },
  { canonical: 'Sector 124', scope: 'sector', aliases: ['sector 124', 'sec 124', 'sector-124', 'sector124', 'noida sector 124', 'sec 124 noida'] },
  { canonical: 'Sector 76', scope: 'sector', aliases: ['sector 76', 'sec 76', 'sector-76', 'sector76', 'noida sector 76', 'sec 76 noida'] },
  { canonical: 'Sohna Road', scope: 'sector', aliases: ['sohna road', 'sohna rd', 'sohna'] },
  { canonical: 'MG Road', scope: 'sector', aliases: ['mg road', 'm g road', 'm.g. road', 'mahatma gandhi road', 'mg rd'] },
  { canonical: 'Golf Course Road', scope: 'sector', aliases: ['golf course road', 'golf course rd', 'golf course', 'gcr'] },
  { canonical: 'Cyber City', scope: 'sector', aliases: ['cyber city', 'dlf cyber city', 'dlf cybercity', 'cybercity'] },
  { canonical: 'Dwarka Expressway', scope: 'sector', aliases: ['dwarka expressway', 'dwarka expwy', 'northern peripheral road', 'npr'] },
  { canonical: 'Yamuna Expressway', scope: 'sector', aliases: ['yamuna expressway', 'yamuna expwy', 'yexp'] },

  // ── Mumbai ──
  { canonical: 'Mumbai', scope: 'city', aliases: ['mumbai', 'bombay'] },
  { canonical: 'Navi Mumbai', scope: 'city', aliases: ['navi mumbai', 'new mumbai', 'vashi'] },
  { canonical: 'Thane', scope: 'city', aliases: ['thane', 'thana'] },
  { canonical: 'Pune', scope: 'city', aliases: ['pune', 'poona'] },
  { canonical: 'Bandra West', scope: 'sector', aliases: ['bandra west', 'bandra w', 'bandra', 'bandra(w)'] },
  { canonical: 'Andheri West', scope: 'sector', aliases: ['andheri west', 'andheri w', 'andheri(w)', 'andheri'] },
  { canonical: 'Worli', scope: 'sector', aliases: ['worli'] },
  { canonical: 'Lower Parel', scope: 'sector', aliases: ['lower parel'] },
  { canonical: 'Powai', scope: 'sector', aliases: ['powai'] },
  { canonical: 'Goregaon', scope: 'sector', aliases: ['goregaon', 'goregaon east', 'goregaon west'] },

  // ── Bangalore ──
  { canonical: 'Bengaluru', scope: 'city', aliases: ['bengaluru', 'bangalore', 'bangaluru', 'bengalooru'] },
  { canonical: 'Whitefield', scope: 'sector', aliases: ['whitefield', 'white field'] },
  { canonical: 'Koramangala', scope: 'sector', aliases: ['koramangala', 'koramangla'] },
  { canonical: 'Indiranagar', scope: 'sector', aliases: ['indiranagar', 'indira nagar'] },
  { canonical: 'Electronic City', scope: 'sector', aliases: ['electronic city', 'elec city', 'ecity'] },
  { canonical: 'HSR Layout', scope: 'sector', aliases: ['hsr layout', 'hsr'] },
  { canonical: 'Sarjapur Road', scope: 'sector', aliases: ['sarjapur road', 'sarjapur rd', 'sarjapur'] },
  { canonical: 'Hebbal', scope: 'sector', aliases: ['hebbal'] },
  { canonical: 'Marathahalli', scope: 'sector', aliases: ['marathahalli', 'marthahalli', 'marathalli'] },
  { canonical: 'Devanahalli', scope: 'sector', aliases: ['devanahalli', 'bengaluru airport'] },
];

// Initialize built-in dictionary on module load
for (const entry of BUILTIN_ALIASES) {
  // Map each alias → canonical
  for (const alias of entry.aliases) {
    builtInDict.set(normalize(alias), { canonical: entry.canonical, scope: entry.scope });
  }
  // Also map the canonical name → itself (so "Greater Kailash 2" resolves to itself)
  builtInDict.set(normalize(entry.canonical), { canonical: entry.canonical, scope: entry.scope });
}

// ── DB alias cache ──
// Per-org cache: orgId → Map<normalizedAlias, AliasEntry>
const dbAliasCache = new Map<string, { dict: Map<string, AliasEntry>; expiresAt: number }>();
const DB_CACHE_TTL_MS = 5 * 60 * 1000;

async function loadDbAliases(orgId: string): Promise<Map<string, AliasEntry>> {
  const cached = dbAliasCache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.dict;
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from('location_aliases')
      .select('canonical_name, aliases, scope')
      .or(`org_id.eq.${orgId},org_id.is.null`);

    if (error || !data) {
      return builtInDict; // fall back to built-in only
    }

    const dict = new Map<string, AliasEntry>(builtInDict);

    for (const row of data) {
      const canonical = row.canonical_name as string;
      const scope = (row.scope as string) || 'general';
      // Map canonical → itself
      dict.set(normalize(canonical), { canonical, scope });
      // Map each alias → canonical
      for (const alias of (row.aliases as string[]) || []) {
        dict.set(normalize(alias), { canonical, scope });
      }
    }

    dbAliasCache.set(orgId, { dict, expiresAt: Date.now() + DB_CACHE_TTL_MS });
    return dict;
  } catch (err) {
    logger.warn({ err, orgId }, '[LocationAliases] Failed to load DB aliases — using built-in only');
    return builtInDict;
  }
}

/**
 * Normalize a location string for matching.
 * Lowercases, removes punctuation, collapses extra spaces.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,/\-()]/g, ' ')  // replace punctuation with space
    .replace(/\s+/g, ' ')        // collapse multiple spaces
    .trim();
}

/**
 * Resolve a location string to its canonical form.
 * Checks built-in dictionary first, then DB aliases for the org.
 *
 * @example
 * resolveLocation('GK 2') → { canonical: 'Greater Kailash 2', resolved: true }
 * resolveLocation('gurgaon') → { canonical: 'Gurugram', resolved: true }
 * resolveLocation('random place') → { canonical: 'random place', resolved: false }
 */
export async function resolveLocation(
  input: string | null | undefined,
  orgId?: string
): Promise<ResolvedLocation> {
  if (!input || !input.trim()) {
    return { canonical: '', resolved: false, original: input ?? '' };
  }

  const normalized = normalize(input);

  // Try built-in first (synchronous, fast)
  const builtInMatch = builtInDict.get(normalized);
  if (builtInMatch) {
    return {
      canonical: builtInMatch.canonical,
      resolved: true,
      original: input,
      scope: builtInMatch.scope,
    };
  }

  // Try DB aliases if orgId provided
  if (orgId) {
    const dbDict = await loadDbAliases(orgId);
    const dbMatch = dbDict.get(normalized);
    if (dbMatch) {
      return {
        canonical: dbMatch.canonical,
        resolved: true,
        original: input,
        scope: dbMatch.scope,
      };
    }
  }

  // No match — return normalized input as canonical
  return {
    canonical: input.trim(),
    resolved: false,
    original: input,
  };
}

/**
 * Batch resolve multiple location fields at once.
 * Useful for resolving city + sector + location from extracted data.
 */
export async function resolveLocations(
  fields: { city?: string | null; sector?: string | null; location?: string | null },
  orgId?: string
): Promise<{ city: string | null; sector: string | null; location: string | null }> {
  const [city, sector, location] = await Promise.all([
    fields.city ? resolveLocation(fields.city, orgId) : null,
    fields.sector ? resolveLocation(fields.sector, orgId) : null,
    fields.location ? resolveLocation(fields.location, orgId) : null,
  ]);

  return {
    city: city?.canonical ?? null,
    sector: sector?.canonical ?? null,
    location: location?.canonical ?? null,
  };
}

/**
 * Invalidate the DB alias cache for an org.
 * Call this when aliases are updated via the UI.
 */
export function invalidateAliasCache(orgId?: string): void {
  if (orgId) {
    dbAliasCache.delete(orgId);
  } else {
    dbAliasCache.clear();
  }
}