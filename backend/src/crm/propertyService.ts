import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';

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
  unitId: string;
  unitTitle?: string | null;
  configuration?: string | null;
  possessionStatus?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  superAreaSqft?: number | null;
  brochureUrl?: string | null;
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
 * Structured property search with progressive relaxation.
 * Returns top `limit` (default 3) results ordered by score.
 * Results are cached for 60s to avoid repeated DB hits on rapid messages.
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

  // Check cache first
  const cacheKey = JSON.stringify({ orgId, configuration, city, sector, location, budgetMin, budgetMax, possessionStatus, limit });
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.results;
  }

  const sb = supabaseAdmin();
  let query = sb
    .from('real_estate_units')
    .select(
      `id, title, configuration, possession_status, price_min, price_max, super_area_sqft,
       brochure_url, availability_status,
       project:real_estate_projects (id, name, developer_name, city, sector, location)`
    )
    .eq('org_id', orgId)
    .eq('availability_status', 'available');

  if (configuration) {
    query = query.ilike('configuration', `%${configuration}%`);
  }
  if (possessionStatus && possessionStatus !== 'any') {
    const pref = possessionStatus.toLowerCase();
    if (pref === 'ready_to_move') {
      query = query.in('possession_status', ['ready_to_move', 'ready', 'ready to move']);
    } else if (pref === 'under_construction') {
      query = query.in('possession_status', ['under_construction', 'under construction']);
    }
  }

  const { data: units, error } = await query.limit(50);
  if (error) {
    logger.error({ error }, 'property search query failed');
    throw error;
  }

  type Proj = { id: string; name: string; developer_name?: string | null; city?: string | null; sector?: string | null; location?: string | null } | null;
  type Row = (NonNullable<typeof units>[number]) & { project?: Proj };

  const scored: PropertyMatch[] = [];

  for (const u of (units ?? []) as Row[]) {
    let score = 0.4;
    const reasons: string[] = [];

    const uMin = u.price_min != null ? Number(u.price_min) : null;
    const uMax = u.price_max != null ? Number(u.price_max) : null;

    if (budgetMax != null || budgetMin != null) {
      const bMin = budgetMin ?? 0;
      const bMax = budgetMax ?? Number.MAX_SAFE_INTEGER;
      const overlaps = uMin != null && uMax != null ? uMin <= bMax && uMax >= bMin : true;
      if (overlaps) {
        score += 0.25;
        reasons.push('within budget');
        if (uMin != null && uMax != null && budgetMax != null && uMax <= budgetMax && uMin >= (budgetMin ?? 0)) {
          score += 0.05;
        }
      } else {
        score -= 0.35;
      }
    }

    if (configuration && u.configuration) {
      if (norm(u.configuration).includes(norm(configuration))) {
        score += 0.2;
        reasons.push(`${u.configuration}`);
      } else {
        score -= 0.1;
      }
    }

    const p = u.project;
    if (p) {
      const wantSector = norm(sector);
      const wantCity = norm(city);
      const wantLoc = norm(location);

      if (wantSector && norm(p.sector).includes(wantSector)) {
        score += 0.15;
        reasons.push(`in ${p.sector}`);
      } else if (wantSector) {
        score -= 0.08;
      }
      if (wantCity && norm(p.city).includes(wantCity)) {
        score += 0.05;
        reasons.push(`${p.city}`);
      }
      if (wantLoc && (norm(p.location).includes(wantLoc) || norm(p.sector).includes(wantLoc))) {
        score += 0.05;
        reasons.push(p.location ?? p.sector ?? '');
      }
    }

    if (score <= 0) continue;

    // Build a human-readable reason string
    const reasonParts: string[] = [];
    if (u.configuration) reasonParts.push(u.configuration);
    const locStr = [p?.sector, p?.city].filter(Boolean).join(', ');
    if (locStr) reasonParts.push(`in ${locStr}`);
    if (budgetMax != null && uMin != null && uMax != null) {
      const overlaps = uMin <= budgetMax && uMax >= (budgetMin ?? 0);
      if (overlaps) reasonParts.push('within budget');
    }
    if (u.possession_status) reasonParts.push(u.possession_status.replace(/_/g, ' '));

    scored.push({
      projectId: p?.id ?? '',
      projectName: p?.name ?? 'Unknown',
      developerName: p?.developer_name ?? null,
      city: p?.city ?? null,
      sector: p?.sector ?? null,
      location: p?.location ?? null,
      unitId: u.id,
      unitTitle: u.title ?? null,
      configuration: u.configuration ?? null,
      possessionStatus: u.possession_status ?? null,
      priceMin: uMin,
      priceMax: uMax,
      superAreaSqft: u.super_area_sqft ?? null,
      brochureUrl: u.brochure_url ?? null,
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
  logger.info('Property search cache cleared');
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
