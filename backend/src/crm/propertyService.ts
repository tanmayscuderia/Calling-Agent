import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import { resolveLocations } from '../utils/locationAliases';

// ── In-memory cache for property search (60s TTL) ──
// Avoids hitting DB on every AI reply for the same search params.
interface CacheEntry { results: PropertyMatch[]; ts: number; }
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

export interface PropertySearchParams {
  orgId: string;
  configuration?: string | null;
  city?: string | null;
  sector?: string | null;
  location?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  possessionStatus?: string | null;
  limit?: number;
}

export interface PropertyMatch {
  projectId: string;
  projectName: string;
  developerName?: string | null;
  city?: string | null;
  sector?: string | null;
  location?: string | null;
  address?: string | null;
  unitId: string;
  unitTitle?: string | null;
  configuration?: string | null;
  possessionStatus?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  superAreaSqft?: number | null;
  brochureUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapsUrl?: string | null;
  score: number;
  reason: string;
}

export async function listProjects(orgId: string) {
  const { data, error } = await supabaseAdmin()
    .from('real_estate_projects')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProject(orgId: string, id: string) {
  const { data, error } = await supabaseAdmin()
    .from('real_estate_projects')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProject(orgId: string, input: Record<string, any>) {
  const { data, error } = await supabaseAdmin()
    .from('real_estate_projects')
    .insert({ ...input, org_id: orgId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listUnits(orgId: string, projectId?: string) {
  let q = supabaseAdmin()
    .from('real_estate_units')
    .select('*, project:real_estate_projects(*)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (projectId) q = q.eq('project_id', projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createUnit(orgId: string, input: Record<string, any>) {
  const { data, error } = await supabaseAdmin()
    .from('real_estate_units')
    .insert({ ...input, org_id: orgId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

function norm(s?: string | null): string {
  return (s ?? '').trim().toLowerCase();
}

/**
 * Unified property search — queries projects as the PRIMARY source and
 * LEFT JOINs units. This means every project is always findable even if
 * it has no unit row. Eliminates the "invisible property" problem.
 *
 * Scoring uses bidirectional location matching: checks both the resolved
 * alias (e.g. "New Delhi") and the raw user input (e.g. "Delhi") against
 * what's stored in the DB, so alias resolution never breaks a match.
 *
 * Results are cached for 60s.
 */
export async function searchProperties(params: PropertySearchParams): Promise<PropertyMatch[]> {
  const {
    orgId,
    configuration,
    city,
    sector,
    location,
    budgetMin,
    budgetMax,
    possessionStatus,
    limit = 3,
  } = params;

  // ── LOCATION ALIAS RESOLUTION ──
  const resolved = await resolveLocations({ city, sector, location }, orgId);

  // Keep BOTH raw and resolved for bidirectional matching
  const cityRaw = city?.trim() || null;
  const cityResolved = resolved.city;
  const sectorRaw = sector?.trim() || null;
  const sectorResolved = resolved.sector;
  const locRaw = location?.trim() || null;
  const locResolved = resolved.location;

  const cacheKey = JSON.stringify({ orgId, configuration, cityRaw, cityResolved, sectorRaw, sectorResolved, locRaw, locResolved, budgetMin, budgetMax, possessionStatus, limit });
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.results;
  }

  // ── QUERY: projects LEFT JOIN units ──
  // Primary source = real_estate_projects (always present).
  // Units are nested — we'll flatten the best-matching unit per project.
  const { data: projects, error } = await supabaseAdmin()
    .from('real_estate_projects')
    .select(
      `id, name, developer_name, city, sector, location, address, status, latitude, longitude, maps_url,
       units:real_estate_units ( id, title, configuration, possession_status, price_min, price_max, super_area_sqft, brochure_url, availability_status )`
    )
    .eq('org_id', orgId)
    .in('status', ['active'])
    .limit(50);

  if (error) {
    logger.error({ error }, 'property search query failed');
    throw error;
  }

  type UnitRow = {
    id: string; title: string | null; configuration: string | null;
    possession_status: string | null; price_min: number | null; price_max: number | null;
    super_area_sqft: number | null; brochure_url: string | null; availability_status: string;
  };
  type ProjRow = {
    id: string; name: string; developer_name: string | null;
    city: string | null; sector: string | null; location: string | null; address: string | null;
    status: string; latitude: number | null; longitude: number | null; maps_url: string | null;
    units: UnitRow[];
  };

  const scored: PropertyMatch[] = [];

  for (const p of (projects ?? []) as ProjRow[]) {
    // ── Pick the best-matching unit for this project ──
    // If configuration specified, prefer the unit that matches it.
    // Otherwise pick the first available unit (or null if no units).
    const availableUnits = (p.units ?? []).filter((u) => u.availability_status === 'available');

    let bestUnit: UnitRow | null = null;
    if (configuration && availableUnits.length > 0) {
      bestUnit = availableUnits.find((u) => u.configuration && norm(u.configuration).includes(norm(configuration))) ?? availableUnits[0]!;
    } else if (availableUnits.length > 0) {
      bestUnit = availableUnits[0]!;
    }

    // ── Score this project ──
    let score = 0.35; // base score for being an active project
    const reasons: string[] = [];

    // Configuration scoring (from unit if available)
    if (configuration && bestUnit?.configuration) {
      if (norm(bestUnit.configuration).includes(norm(configuration))) {
        score += 0.2;
        reasons.push(bestUnit.configuration);
      } else {
        score -= 0.1;
      }
    }

    // Budget scoring (from unit if available)
    const uMin = bestUnit?.price_min != null ? Number(bestUnit.price_min) : null;
    const uMax = bestUnit?.price_max != null ? Number(bestUnit.price_max) : null;
    if ((budgetMin != null || budgetMax != null) && uMin != null && uMax != null) {
      const bMin = budgetMin ?? 0;
      const bMax = budgetMax ?? Number.MAX_SAFE_INTEGER;
      const overlaps = uMin <= bMax && uMax >= bMin;
      if (overlaps) {
        score += 0.25;
        reasons.push('within budget');
        if (budgetMax != null && uMax <= budgetMax && uMin >= (budgetMin ?? 0)) {
          score += 0.05;
        }
      } else {
        score -= 0.35;
      }
    }

    // ── BIDIRECTIONAL LOCATION MATCHING ──
    // Check both raw and resolved forms against DB values.
    // Fixes: "Delhi" resolved to "New Delhi" but stored as "Delhi" → was missed.
    const cityVals = [cityRaw, cityResolved].filter(Boolean).map(norm);
    const sectorVals = [sectorRaw, sectorResolved].filter(Boolean).map(norm);
    const locVals = [locRaw, locResolved].filter(Boolean).map(norm);

    const pCity = norm(p.city);
    const pSector = norm(p.sector);
    const pLoc = norm(p.location);

    // City match (bidirectional)
    // Strong penalty: if user specifies a city and it doesn't match,
    // the property is almost certainly irrelevant.
    if (cityVals.length > 0) {
      const matched = cityVals.some((cv) => pCity.includes(cv) || cv.includes(pCity));
      if (matched && pCity) {
        score += 0.1;
        reasons.push(p.city!);
      } else {
        score -= 0.4; // strong penalty — effectively excludes non-matching cities
      }
    }

    // Sector match (bidirectional)
    if (sectorVals.length > 0) {
      const matched = sectorVals.some((sv) => pSector.includes(sv) || sv.includes(pSector));
      if (matched && pSector) {
        score += 0.15;
        reasons.push(`in ${p.sector}`);
      } else {
        score -= 0.2;
      }
    }

    // Location match (bidirectional, checks both location and sector fields)
    if (locVals.length > 0) {
      const matched = locVals.some((lv) => pLoc.includes(lv) || lv.includes(pLoc) || pSector.includes(lv) || lv.includes(pSector));
      if (matched) {
        score += 0.05;
        reasons.push(p.location ?? p.sector ?? '');
      }
    }

    // Possession status scoring
    if (possessionStatus && possessionStatus !== 'any' && bestUnit?.possession_status) {
      const pref = possessionStatus.toLowerCase().replace(/[\s-]/g, '_');
      const unitPs = norm(bestUnit.possession_status).replace(/[\s-]/g, '_');
      if (pref === unitPs || (pref === 'ready_to_move' && unitPs.includes('ready')) || (pref === 'under_construction' && unitPs.includes('under'))) {
        score += 0.1;
        reasons.push(bestUnit.possession_status.replace(/_/g, ' '));
      }
    }

    // Skip if score dropped to zero or below
    if (score <= 0.1) continue;

    // ── Build human-readable reason ──
    const reasonParts: string[] = [];
    if (bestUnit?.configuration) reasonParts.push(bestUnit.configuration);
    const locStr = [p.sector, p.city].filter(Boolean).join(', ');
    if (locStr) reasonParts.push(`in ${locStr}`);
    if (budgetMax != null && uMin != null && uMax != null) {
      if (uMin <= budgetMax && uMax >= (budgetMin ?? 0)) reasonParts.push('within budget');
    }
    if (bestUnit?.possession_status) reasonParts.push(bestUnit.possession_status.replace(/_/g, ' '));

    scored.push({
      projectId: p.id,
      projectName: p.name,
      developerName: p.developer_name ?? null,
      city: p.city ?? null,
      sector: p.sector ?? null,
      location: p.location ?? null,
      address: p.address ?? null,
      unitId: bestUnit?.id ?? '',
      unitTitle: bestUnit?.title ?? null,
      configuration: bestUnit?.configuration ?? configuration ?? null,
      possessionStatus: bestUnit?.possession_status ?? null,
      priceMin: uMin,
      priceMax: uMax,
      superAreaSqft: bestUnit?.super_area_sqft ?? null,
      brochureUrl: bestUnit?.brochure_url ?? null,
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      mapsUrl: p.maps_url ?? null,
      score: Math.max(0, Math.min(1, score)),
      reason: reasonParts.join(', ') || 'available listing',
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, limit);

  // Save to cache
  searchCache.set(cacheKey, { results, ts: Date.now() });

  return results;
}

/** Invalidate cache when inventory changes (upload/edit/delete) */
export function clearSearchCache(): void {
  searchCache.clear();
  // Also clear the AI locations cache so new cities/sectors appear immediately
  try {
    const { clearLocationsCache } = require('../ai/baseAgent');
    clearLocationsCache();
  } catch {
    // baseAgent may not be loaded yet in some contexts — safe to ignore
  }
  logger.info('Property search cache + locations cache cleared');
}

// ── CRUD: Update / Delete for Phase 1 ──────────────────────

export async function updateProject(orgId: string, id: string, input: Record<string, any>) {
  const { data, error } = await supabaseAdmin()
    .from('real_estate_projects')
    .update(input)
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  clearSearchCache();
  return data;
}

export async function deleteProject(orgId: string, id: string) {
  const { error } = await supabaseAdmin()
    .from('real_estate_projects')
    .delete()
    .eq('org_id', orgId)
    .eq('id', id);
  if (error) throw error;
  clearSearchCache();
  return { success: true };
}

export async function updateUnit(orgId: string, id: string, input: Record<string, any>) {
  const { data, error } = await supabaseAdmin()
    .from('real_estate_units')
    .update(input)
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  clearSearchCache();
  return data;
}

export async function deleteUnit(orgId: string, id: string) {
  const { error } = await supabaseAdmin()
    .from('real_estate_units')
    .delete()
    .eq('org_id', orgId)
    .eq('id', id);
  if (error) throw error;
  clearSearchCache();
  return { success: true };
}

/** Get project with all its units for detail page */
export async function getProjectWithUnits(orgId: string, id: string) {
  const [projectResult, unitsResult] = await Promise.all([
    supabaseAdmin()
      .from('real_estate_projects')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', id)
      .maybeSingle(),
    supabaseAdmin()
      .from('real_estate_units')
      .select('*')
      .eq('org_id', orgId)
      .eq('project_id', id)
      .order('price_min', { ascending: true, nullsFirst: false }),
  ]);

  if (projectResult.error) throw projectResult.error;
  if (unitsResult.error) throw unitsResult.error;

  return {
    project: projectResult.data,
    units: unitsResult.data ?? [],
  };
}