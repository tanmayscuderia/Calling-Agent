import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import { resolveLocations, expandLocationForms } from '../utils/locationAliases';

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

// ── Inventory snapshot (Sarvam on_start resilience layer) ──

export interface InventorySnapshot {
  text: string;
  cities: string[];
  total_properties: number;
}

function formatInrRange(min: number, max: number): string {
  const parts = (v: number): { n: string; unit: string } => {
    if (v >= 1_00_00_000) return { n: String(Math.round((v / 1_00_00_000) * 10) / 10), unit: 'cr' };
    if (v >= 1_00_000) return { n: String(Math.round((v / 1_00_000) * 10) / 10), unit: 'L' };
    return { n: String(Math.round(v)), unit: '' };
  };
  const side = (p: { n: string; unit: string }): string => `${p.n} ${p.unit}`.trim();
  if (min > 0 && max > 0 && min !== max) {
    const a = parts(min);
    const b = parts(max);
    // Same unit → compact "1.2–2.1 cr"; mixed units → "45 L–1.2 cr"
    return a.unit === b.unit ? `${a.n}–${b.n} ${b.unit}`.trim() : `${side(a)}–${side(b)}`;
  }
  if (max > 0) return side(parts(max));
  if (min > 0) return side(parts(min));
  return 'price on request';
}

// ── Snapshot cache (5-min TTL, per org) ──
// In zero-mid-call-tool mode the snapshot is the agent's ONLY inventory source,
// fetched by the on_start hook on every call. Inventory doesn't change between
// calls in a test batch, so a 5-min in-memory cache keeps call-start latency
// near zero and stops repeat fetches from burning the tunnel request budget.
interface SnapshotCacheEntry { snap: InventorySnapshot; ts: number; }
const snapshotCache = new Map<string, SnapshotCacheEntry>();
const SNAPSHOT_TTL_MS = 5 * 60_000; // 5 minutes
const SNAPSHOT_CACHE_MAX = 20;      // per-org entries — tiny payloads, generous cap

function snapshotCacheGet(orgId: string): InventorySnapshot | null {
  const hit = snapshotCache.get(orgId);
  if (!hit) return null;
  if (Date.now() - hit.ts > SNAPSHOT_TTL_MS) {
    snapshotCache.delete(orgId);
    return null;
  }
  return hit.snap;
}

/**
 * Hard cap on project bullet lines in the snapshot markdown. ~16 tokens per
 * project → 300 lines ≈ 4.8k tokens, safe for the fast voice models; at real
 * scale (100–200 projects) this never triggers. Beyond the cap the dump is
 * silently truncated with a "(+N more — offer callback)" footer.
 */
const SNAPSHOT_MAX_PROJECT_LINES = 300;

/**
 * FULL inventory as MARKDOWN for the Sarvam agent variable `inventory_summary`
 * (on_start hook — zero-mid-call-tool mode, prompt v7.6):
 *   # guard header (never-invent), `## City (n)` sections, dash bullets
 *   `- Name (Sector) — cfg/cfg — 1.2–2.1 cr`, silent 300-line cap with footer.
 * Prices/configs come ONLY from units with availability_status === 'available'
 * so a sold-out project never advertises a price; projects with no available
 * units still appear as "price on request". Cached 5 min per org —
 * clearSearchCache() invalidates (called on every inventory CRUD mutation).
 */
export async function getInventorySnapshot(orgId: string): Promise<InventorySnapshot> {
  const cached = snapshotCacheGet(orgId);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin()
    .from('real_estate_projects')
    .select(
      'name, city, sector, units:real_estate_units ( configuration, title, price_min, price_max, availability_status )'
    )
    .eq('org_id', orgId);
  if (error) throw error;

  const byCity = new Map<
    string,
    { name: string; sector: string | null; min: number; max: number; configs: Set<string> }[]
  >();
  for (const p of data ?? []) {
    const city = String(p.city ?? '').trim() || 'Unknown';
    const units: any[] = Array.isArray(p.units) ? p.units : [];
    const available = units.filter((u) => u.availability_status === 'available');

    const mins = available.map((u) => Number(u.price_min) || 0).filter((v) => v > 0);
    const maxs = available.map((u) => Number(u.price_max) || 0).filter((v) => v > 0);
    const configs = new Set<string>();
    for (const u of available) {
      const cfg = String(u.configuration ?? '').trim();
      if (cfg) configs.add(cfg);
    }

    const entry = {
      name: String(p.name ?? '').trim() || 'Unnamed project',
      sector: String(p.sector ?? '').trim() || null,
      min: mins.length > 0 ? Math.min(...mins) : 0,
      max: maxs.length > 0 ? Math.max(...maxs) : 0,
      configs,
    };
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city)!.push(entry);
  }

  const cities = [...byCity.keys()].sort((a, b) => a.localeCompare(b));
  const total_properties = cities.reduce((n, c) => n + byCity.get(c)!.length, 0);

  let text = '';
  if (cities.length > 0) {
    const lines: string[] = [
      '# INVENTORY — this list is the ONLY truth. Never invent or guess any property outside it.',
    ];
    let shown = 0;
    for (const city of cities) {
      if (shown >= SNAPSHOT_MAX_PROJECT_LINES) break;
      const projs = byCity.get(city)!;
      lines.push(`## ${city} (${projs.length})`);
      for (const pr of projs) {
        if (shown >= SNAPSHOT_MAX_PROJECT_LINES) break;
        const sector = pr.sector ? ` (${pr.sector})` : '';
        const cfg = pr.configs.size > 0 ? ` — ${[...pr.configs].slice(0, 4).join('/')}` : '';
        lines.push(`- ${pr.name}${sector}${cfg} — ${formatInrRange(pr.min, pr.max)}`);
        shown += 1;
      }
    }
    if (shown < total_properties) {
      lines.push(`(+${total_properties - shown} more — offer callback)`);
    }
    text = lines.join('\n');
  }

  const snap: InventorySnapshot = { text, cities, total_properties };
  if (snapshotCache.size >= SNAPSHOT_CACHE_MAX) {
    // Map preserves insertion order — drop the oldest entry
    const oldest = snapshotCache.keys().next().value;
    if (oldest !== undefined) snapshotCache.delete(oldest);
  }
  snapshotCache.set(orgId, { snap, ts: Date.now() });
  return snap;
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

    // "Penthouse"/"Villa" asks arrive as `configuration` from the voice
    // parser, but the type often lives in the unit TITLE or project NAME
    // while unit.configuration is "4BHK". Match any of the three.
    const configMatches = (u: UnitRow) =>
      (u.configuration != null && norm(u.configuration).includes(norm(configuration))) ||
      (u.title != null && norm(u.title).includes(norm(configuration))) ||
      norm(p.name).includes(norm(configuration));

    let bestUnit: UnitRow | null = null;
    if (configuration && availableUnits.length > 0) {
      bestUnit = availableUnits.find((u) => configMatches(u)) ?? availableUnits[0]!;
    } else if (availableUnits.length > 0) {
      bestUnit = availableUnits[0]!;
    }

    // ── Score this project ──
    let score = 0.35; // base score for being an active project
    const reasons: string[] = [];

    // Configuration scoring — unit config, unit title, OR project name
    // (a "Penthouse" ask must match a 4BHK unit in a project named "Penthouse")
    if (configuration) {
      const nameOrTitleHit =
        (bestUnit?.title != null && norm(bestUnit.title).includes(norm(configuration))) ||
        norm(p.name).includes(norm(configuration));
      if (bestUnit?.configuration && norm(bestUnit.configuration).includes(norm(configuration))) {
        score += 0.2;
        reasons.push(bestUnit.configuration);
      } else if (nameOrTitleHit) {
        score += 0.2;
        reasons.push(configuration);
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
      } else if (uMax < bMin) {
        // Entirely BELOW the budget floor — a cheaper option is a valid
        // candidate ("we have a 6–7 Cr penthouse within your 8–10 Cr range"),
        // not a mismatch. Only ABOVE the ceiling stays penalized.
        score += 0.15;
        reasons.push('under budget — great value');
      } else {
        score -= 0.35;
      }
    }

    // ── BIDIRECTIONAL LOCATION MATCHING ──
    // Expand each input to ALL its alias forms (gurgaon/gurugram/gurgoan…)
    // so the user's spelling matches the DB's spelling, whichever side uses
    // which form. Fixes: caller says गुड़गांव → "Gurugram", DB stores "Gurgaon".
    const cityVals = [...new Set(expandLocationForms(cityRaw, cityResolved))];
    const sectorVals = [...new Set(expandLocationForms(sectorRaw, sectorResolved))];
    const locVals = [...new Set(expandLocationForms(locRaw, locResolved))];

    const pCity = norm(p.city);
    const pSector = norm(p.sector);
    const pLoc = norm(p.location);

    // City match (bidirectional) — HARD GATE
    // When the caller names a city and it doesn't match, skip the project
    // entirely. Bonuses (config, budget) must never override wrong-city results.
    // Fixes: "2BHK in Pune" leaking Noida 2BHKs (score 0.15 > cutoff 0.1).
    if (cityVals.length > 0) {
      const matched = cityVals.some((cv) => pCity.includes(cv) || cv.includes(pCity));
      if (matched && pCity) {
        score += 0.1;
        reasons.push(p.city!);
      } else {
        continue; // wrong city — skip regardless of config/budget match
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

    // Location match (bidirectional, checks location + sector + city fields)
    // REQUIREMENT, not a bonus: a caller-named location the project doesn't
    // have (city/sector/location) excludes it entirely. Live 2026-08-28:
    // location="Allahabad" / "New York Goa" leaked an unfiltered top-3 because
    // a non-matching location previously cost nothing (base 0.35 passed).
    // City is included in the check so a locationRaw equal to the city name
    // ("2BHK Noida" -> location "Noida") never wrongly excludes a match.
    if (locVals.length > 0) {
      const matched = locVals.some(
        (lv) =>
          (pLoc && (pLoc.includes(lv) || lv.includes(pLoc))) ||
          (pSector && (pSector.includes(lv) || lv.includes(pSector))) ||
          (pCity && (pCity.includes(lv) || lv.includes(pCity)))
      );
      if (matched) {
        score += 0.05;
        reasons.push(p.location ?? p.sector ?? '');
      } else {
        continue; // wrong/unknown location — skip regardless of other bonuses
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
    if ((budgetMin != null || budgetMax != null) && uMin != null && uMax != null) {
      if (uMin <= (budgetMax ?? Number.MAX_SAFE_INTEGER) && uMax >= (budgetMin ?? 0)) {
        reasonParts.push('within budget');
      } else if (uMax < (budgetMin ?? 0)) {
        reasonParts.push('under budget');
      }
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
  // The snapshot markdown must refresh after inventory changes too — otherwise
  // the on_start hook serves a stale list for up to 5 minutes (its cache TTL).
  snapshotCache.clear();
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