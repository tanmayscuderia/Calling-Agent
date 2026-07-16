/**
 * Generic Inventory Item Service
 * CRUD + search for the `inventory_items` table.
 * Used by all non-real-estate industries (automotive, salon, insurance, education, etc.)
 */

import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import { clearSearchCache } from './propertyService';

// ── Types ──

export interface InventoryItem {
  id: string;
  org_id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  sub_category?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  currency: string;
  location?: string | null;
  city?: string | null;
  area?: string | null;
  status: string;
  attributes: Record<string, any>;
  media_urls: string[];
  brochure_url?: string | null;
  metadata: Record<string, any>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemSearchParams {
  orgId: string;
  query?: string | null;
  category?: string | null;
  city?: string | null;
  location?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  status?: string | null;
  limit?: number;
}

// ── CRUD ──

export async function listItems(
  orgId: string,
  filters?: { category?: string; city?: string; status?: string; limit?: number; offset?: number }
): Promise<{ items: InventoryItem[]; total: number }> {
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  let query = supabaseAdmin()
    .from('inventory_items')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.city) query = query.ilike('city', `%${filters.city}%`);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: (data ?? []) as InventoryItem[],
    total: count ?? 0,
  };
}

export async function getItem(orgId: string, id: string): Promise<InventoryItem | null> {
  const { data, error } = await supabaseAdmin()
    .from('inventory_items')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as InventoryItem | null;
}

export async function createItem(orgId: string, input: Record<string, any>): Promise<InventoryItem> {
  const { data, error } = await supabaseAdmin()
    .from('inventory_items')
    .insert({
      org_id: orgId,
      title: input.title,
      subtitle: input.subtitle ?? null,
      description: input.description ?? null,
      category: input.category ?? null,
      sub_category: input.sub_category ?? null,
      price_min: input.price_min != null ? Number(input.price_min) : null,
      price_max: input.price_max != null ? Number(input.price_max) : null,
      currency: input.currency ?? 'INR',
      location: input.location ?? null,
      city: input.city ?? null,
      area: input.area ?? null,
      status: input.status ?? 'active',
      attributes: input.attributes ?? {},
      media_urls: input.media_urls ?? [],
      brochure_url: input.brochure_url ?? null,
      metadata: input.metadata ?? {},
      created_by: input.created_by ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  clearSearchCache();
  return data as InventoryItem;
}

export async function updateItem(orgId: string, id: string, input: Record<string, any>): Promise<InventoryItem> {
  const allowed: Record<string, any> = {};
  const allowedFields = [
    'title', 'subtitle', 'description', 'category', 'sub_category',
    'price_min', 'price_max', 'currency', 'location', 'city', 'area',
    'status', 'attributes', 'media_urls', 'brochure_url', 'metadata',
  ];
  for (const f of allowedFields) {
    if (f in input) {
      if (f === 'price_min' || f === 'price_max') {
        allowed[f] = input[f] != null ? Number(input[f]) : null;
      } else {
        allowed[f] = input[f];
      }
    }
  }

  const { data, error } = await supabaseAdmin()
    .from('inventory_items')
    .update(allowed)
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  clearSearchCache();
  return data as InventoryItem;
}

export async function deleteItem(orgId: string, id: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from('inventory_items')
    .delete()
    .eq('org_id', orgId)
    .eq('id', id);
  if (error) throw error;
  clearSearchCache();
}

// ── Search ──

export interface InventoryItemMatch {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  location?: string | null;
  city?: string | null;
  brochure_url?: string | null;
  score: number;
  reason: string;
}

function norm(s?: string | null): string {
  return (s ?? '').trim().toLowerCase();
}

/**
 * Search inventory_items with structured filters + text matching.
 * Returns top `limit` results ordered by score.
 */
export async function searchItems(params: InventoryItemSearchParams): Promise<InventoryItemMatch[]> {
  const { orgId, query, category, city, location, budgetMin, budgetMax, status, limit = 3 } = params;

  let q = supabaseAdmin()
    .from('inventory_items')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', status ?? 'active');

  if (category) {
    q = q.or(`category.ilike.%${category}%,sub_category.ilike.%${category}%`);
  }
  if (city) {
    q = q.or(`city.ilike.%${city}%,location.ilike.%${city}%`);
  }
  if (location) {
    q = q.or(`location.ilike.%${location}%,area.ilike.%${location}%,city.ilike.%${location}%`);
  }
  if (query) {
    q = q.or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
  }

  const { data: items, error } = await q.limit(50);
  if (error) {
    logger.error({ error }, 'inventory_items search failed');
    throw error;
  }

  const scored: InventoryItemMatch[] = [];

  for (const item of (items ?? []) as InventoryItem[]) {
    let score = 0.3;
    const reasons: string[] = [];

    // Budget matching
    const iMin = item.price_min != null ? Number(item.price_min) : null;
    const iMax = item.price_max != null ? Number(item.price_max) : null;

    if (budgetMax != null || budgetMin != null) {
      const bMin = budgetMin ?? 0;
      const bMax = budgetMax ?? Number.MAX_SAFE_INTEGER;
      const overlaps = iMin != null && iMax != null ? iMin <= bMax && iMax >= bMin : true;
      if (overlaps) {
        score += 0.3;
        reasons.push('within budget');
      } else {
        score -= 0.3;
      }
    }

    // Category matching
    if (category && item.category) {
      if (norm(item.category).includes(norm(category))) {
        score += 0.2;
        reasons.push(item.category);
      } else {
        score -= 0.1;
      }
    }

    // Location matching
    if (city || location) {
      const wantLoc = norm(location ?? city);
      const itemLoc = norm(item.city) + ' ' + norm(item.location) + ' ' + norm(item.area);
      if (wantLoc && itemLoc.includes(wantLoc)) {
        score += 0.15;
        reasons.push(`in ${item.city ?? item.location ?? location}`);
      }
    }

    // Text query matching
    if (query) {
      const searchText = norm(item.title) + ' ' + norm(item.subtitle) + ' ' + norm(item.description);
      if (searchText.includes(norm(query))) {
        score += 0.15;
        reasons.push(`matches "${query}"`);
      }
    }

    if (score <= 0) continue;

    // Build reason string
    const reasonParts: string[] = [];
    if (item.title) reasonParts.push(item.title);
    if (item.category) reasonParts.push(item.category);
    const locStr = [item.city, item.area].filter(Boolean).join(', ');
    if (locStr) reasonParts.push(`in ${locStr}`);
    if (budgetMax != null && iMin != null && iMax != null) {
      if (iMin <= budgetMax && iMax >= (budgetMin ?? 0)) {
        reasonParts.push('within budget');
      }
    }

    scored.push({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      category: item.category,
      price_min: iMin,
      price_max: iMax,
      location: item.location,
      city: item.city,
      brochure_url: item.brochure_url,
      score: Math.max(0, Math.min(1, score)),
      reason: reasonParts.join(', ') || 'available listing',
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// ── Batch import (used by CSV importer) ──

export async function batchCreateItems(orgId: string, items: Record<string, any>[]): Promise<InventoryItem[]> {
  const rows = items.map((input) => ({
    org_id: orgId,
    title: input.title,
    subtitle: input.subtitle ?? null,
    description: input.description ?? null,
    category: input.category ?? null,
    sub_category: input.sub_category ?? null,
    price_min: input.price_min != null ? Number(input.price_min) : null,
    price_max: input.price_max != null ? Number(input.price_max) : null,
    currency: input.currency ?? 'INR',
    location: input.location ?? null,
    city: input.city ?? null,
    area: input.area ?? null,
    status: input.status ?? 'active',
    attributes: input.attributes ?? {},
    media_urls: input.media_urls ?? [],
    brochure_url: input.brochure_url ?? null,
    metadata: input.metadata ?? {},
  }));

  const { data, error } = await supabaseAdmin()
    .from('inventory_items')
    .insert(rows)
    .select();

  if (error) throw error;
  clearSearchCache();
  return (data ?? []) as InventoryItem[];
}