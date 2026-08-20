/**
 * Sarvam Tool Routes — HTTP tools the Sarvam voice agent calls LIVE during phone calls.
 *
 * These give the phone agent the same "brain" as WhatsApp:
 *   - lead context (on_start hook): who is the caller, what do we already know
 *   - inventory search (mid-call tool): live Supabase inventory lookups
 *
 * Auth: the tool secret (SARVAM_TOOL_SECRET, defaults to the webhook secret)
 * must arrive via `X-Tool-Secret`, `X-API-Key`, or `Authorization: Bearer` —
 * see authorized() below for why all three are accepted.
 *
 * Responses are deliberately tiny and voice-friendly — the agent speaks these
 * out loud, so no giant payloads mid-call.
 *
 * Plan: docs/SARVAM_CALLING_PLAN.md (Phase 2) + docs/SARVAM_GO_LIVE_CHECKLIST.md
 */

import { FastifyInstance } from 'fastify';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';
import { normalizePhone } from '../utils/phone';
import { getAgentConfig } from '../ai/agentConfigService';
import { searchInventory, InventoryMatch } from '../ai/inventorySearch';
import { getLeadMessages } from '../crm/leadService';
import { parseFreeTextQuery } from '../sarvam/queryParser';
import type { ExtractedData } from '../ai/agentTypes';

// ── Debug logging (temporary — remove once live tool calls are stable) ──
// Appends one JSON line per request to backend/logs/sarvam-tool-calls.log so we
// can see exactly what Sarvam sends on LIVE calls (method, URL, auth headers,
// latency, status) — the dashboard Test button is NOT the same code path.

function logToolCall(entry: Record<string, unknown>) {
  try {
    const dir = join(process.cwd(), 'logs');
    mkdirSync(dir, { recursive: true });
    appendFileSync(
      join(dir, 'sarvam-tool-calls.log'),
      JSON.stringify({ t: new Date().toISOString(), ...entry }) + '\n'
    );
  } catch {
    // logging must never break the tool
  }
}

function maskHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers)) {
    const s = String(v);
    out[k] = ['x-tool-secret', 'x-api-key', 'authorization'].includes(k)
      ? `${s.slice(0, 10)}…(len ${s.length})`
      : v;
  }
  return out;
}

// ── Auth ──

/**
 * Accepts the tool secret from any header form Sarvam's Auth section may send.
 * When a credential is moved into the dashboard's Auth block, Sarvam sends it
 * as its standard `api_key` (X-API-Key) or `bearer` type — not our custom
 * X-Tool-Secret header. Accept all three so the tool config never breaks auth.
 *   - X-Tool-Secret: <secret>   (original custom header)
 *   - X-API-Key: <secret>       (Sarvam api_key auth type)
 *   - Authorization: Bearer <secret>  (Sarvam bearer auth type)
 */
// exported for unit tests; structural type so a plain { headers } object works
export function authorized(req: { headers: Record<string, unknown> }): boolean {
  const candidates = [
    (req.headers['x-tool-secret'] ?? '') as string,
    (req.headers['x-api-key'] ?? '') as string,
    (() => {
      const auth = (req.headers['authorization'] ?? '') as string;
      return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    })(),
  ].filter((v) => v.length > 0);
  return candidates.some((v) => v === config.sarvam.toolSecret);
}

// ── Response shapers (exported for unit tests) ──

export function shapeLead(lead: Record<string, any>): Record<string, any> {
  const notes: string | null =
    typeof lead.notes === 'string' ? lead.notes.slice(0, 200) : null;
  return {
    id: lead.id ?? null,
    name: lead.full_name ?? lead.name ?? null,
    status: lead.status ?? null,
    temperature: lead.temperature ?? lead.lead_temperature ?? null,
    budget_min: lead.budget_min ?? null,
    budget_max: lead.budget_max ?? null,
    preferred_location: lead.preferred_location ?? lead.location ?? null,
    configuration: lead.configuration ?? null,
    source: lead.source ?? null,
    notes,
  };
}

export function shapeMessages(rows: any[], limit = 3): Array<{ dir: string; text: string }> {
  return (rows ?? []).slice(-limit).map((m: any) => ({
    dir: String(m.direction ?? m.sender ?? m.role ?? 'unknown'),
    text: String(m.body ?? m.message ?? m.text ?? '').slice(0, 120),
  }));
}

export function shapeInventory(matches: InventoryMatch[]): Record<string, any> {
  return {
    count: matches.length,
    results: matches.map((m) => ({
      label: m.label,
      location: m.sublabel ?? null,
      price: m.priceRange ?? null,
      why: m.reason,
    })),
  };
}

export function parseInventoryQuery(q: Record<string, any>): ExtractedData {
  const extracted: ExtractedData = {};
  const num = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  if (q.query) extracted.query = String(q.query);
  if (q.location) {
    extracted.preferred_location = String(q.location);
    extracted.location = String(q.location);
  }
  if (q.city) extracted.city = String(q.city);
  if (q.area) extracted.area = String(q.area);
  if (q.configuration) extracted.configuration = String(q.configuration);
  if (q.budget_min) extracted.budget_min = num(q.budget_min);
  if (q.budget_max) extracted.budget_max = num(q.budget_max);

  // Fill gaps from the free-text query (explicit params above always win).
  // The Sarvam dashboard sends the caller's demand as ONE agent-filled
  // `query` param ("Noida sector 70 to 80, 2BHK, 8 to 10 crore") — without
  // this the engine got no structured filters and returned an unfiltered top-3.
  if (extracted.query) {
    const p = parseFreeTextQuery(extracted.query);
    if (!extracted.city && p.city) extracted.city = p.city;
    if (!extracted.sector && p.sector) extracted.sector = p.sector;
    if (!extracted.preferred_location && p.locationRaw) {
      extracted.preferred_location = p.locationRaw;
      extracted.location = p.locationRaw;
    }
    if (extracted.budget_min == null && p.budgetMin != null) extracted.budget_min = p.budgetMin;
    if (extracted.budget_max == null && p.budgetMax != null) extracted.budget_max = p.budgetMax;
    if (!extracted.configuration && p.configurations.length > 0) {
      extracted.configuration = p.configurations[0];
    } else if (!extracted.configuration && p.propertyTypes.length > 0) {
      extracted.configuration = p.propertyTypes[0];
    }
  }
  return extracted;
}

/** Reject if a promise hangs past `ms` — a stuck Supabase call must never stall a live phone call. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout:${label}`)), ms)),
  ]);
}

// ── Zero-result guidance (exported for unit tests) ──

/**
 * Build the count-0 payload that steers the voice agent when a search comes
 * back empty (e.g. caller asks for Pune but inventory is NCR-only):
 * say we don't have it, list cities we DO serve, never invent properties.
 */
export function zeroResultPayload(
  filters: Record<string, unknown>,
  where: string | null,
  cities: string[]
): Record<string, any> {
  const wherePart = where ? ` in ${where}` : ' for those criteria';
  const cityList = cities.length > 0 ? ` We currently have options in: ${cities.join(', ')}.` : '';
  const offer = cities.length > 0
    ? ', offer the cities above, and ask if any of those work'
    : ' and offer to have the team follow up on WhatsApp';
  return {
    count: 0,
    results: [],
    filters,
    note: `No inventory${wherePart}.${cityList} Do NOT invent or guess any property — say we don't have options${where ? ' there' : ' for that'}${offer}.`,
    available_locations: cities,
  };
}

// ── Available locations (zero-result guidance) ──

interface LocationsCache {
  ts: number;
  cities: string[];
}
const locationsCache = new Map<string, LocationsCache>();
const LOCATIONS_TTL_MS = 60_000;

/**
 * Distinct cities this org actually has inventory in, so a zero-result search
 * can tell the agent "no Pune stock, but we have Noida/Gurgaon" instead of the
 * voice LLM improvising (or inventing properties). Cached 60s; NEVER throws —
 * guidance data must not fail a live call.
 */
async function getAvailableLocations(
  orgId: string,
  cfg: Awaited<ReturnType<typeof getAgentConfig>>
): Promise<string[]> {
  const table = cfg.inventory_table ?? '';
  if (!table) return [];
  const key = `${orgId}:${table}`;
  const cached = locationsCache.get(key);
  if (cached && Date.now() - cached.ts < LOCATIONS_TTL_MS) return cached.cities;

  let cities: string[] = [];
  try {
    // Real estate: cities live on projects (units only carry config/price).
    const isRealEstate = table === 'real_estate_units';
    const from = isRealEstate ? 'real_estate_projects' : table;
    // Generic tables: prefer the field mapped to city/location in search_fields.
    const column = isRealEstate
      ? 'city'
      : (cfg.search_fields.find((sf) => ['city', 'preferred_city'].includes(sf.extract_key))?.field ??
         cfg.search_fields.find((sf) => ['preferred_location', 'location'].includes(sf.extract_key))?.field ??
         'city');

    let q = supabaseAdmin()
      .from(from)
      .select(column)
      .eq('org_id', orgId)
      .not(column, 'is', null)
      .limit(200);
    if (isRealEstate) q = q.eq('status', 'active');

    const { data } = (await withTimeout(
      q as unknown as Promise<{ data: any[] | null; error: { message: string } | null }>,
      8000,
      'available-locations'
    )) ?? { data: null, error: null };

    cities = [
      ...new Set((data ?? []).map((r: any) => String(r[column] ?? '').trim()).filter(Boolean)),
    ].slice(0, 12);
  } catch {
    cities = []; // never fail the tool over optional guidance
  }
  locationsCache.set(key, { ts: Date.now(), cities });
  return cities;
}

// ── Routes ──

export async function sarvamToolsRoutes(app: FastifyInstance) {
  /**
   * GET /api/tools/sarvam/lead-context?phone=%2B9198…
   * on_start hook for Sarvam: resolve caller → known lead + last messages.
   */
  app.get('/api/tools/sarvam/lead-context', async (req, reply) => {
    const started = Date.now();
    logToolCall({
      event: 'lead-context.request',
      method: req.method,
      url: req.url,
      headers: maskHeaders(req.headers as Record<string, unknown>),
    });
    if (!authorized(req)) {
      logToolCall({ event: 'lead-context.401', ms: Date.now() - started });
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const q = req.query as Record<string, any>;
    let phone: string;
    try {
      phone = normalizePhone(String(q.phone ?? ''));
    } catch {
      return reply.code(400).send({ error: 'Invalid phone' });
    }

    const orgId = String(q.orgId ?? config.defaultOrgId);

    // NEVER fail this hook: a 5xx makes the platform treat the tool as broken.
    // On any error the agent simply starts fresh (unknown caller).
    try {
      // PostgrestFilterBuilder is thenable but not a Promise subtype — cast for withTimeout
      const leadQuery = supabaseAdmin()
        .from('crm_leads')
        .select('*')
        .eq('org_id', orgId)
        .or(`phone.eq.${phone},whatsapp_number.eq.${phone}`)
        .limit(1);
      const { data, error } = (await withTimeout(
        leadQuery as unknown as Promise<{ data: any[] | null; error: { message: string } | null }>,
        8000,
        'lead-context'
      )) ?? { data: null, error: null };

      if (error) throw new Error(error.message);

      if (!data || data.length === 0) {
        // Unknown caller — perfectly fine, agent starts fresh.
        return { found: false, lead: null, recent_messages: [] };
      }

      const lead = data[0];
      let messages: any[] = [];
      try {
        const rows = await getLeadMessages(orgId, lead.id, 10);
        messages = Array.isArray(rows) ? rows : [];
      } catch {
        // messages are optional context — never fail the hook for them
      }

      return {
        found: true,
        lead: shapeLead(lead),
        recent_messages: shapeMessages(messages),
      };
    } catch (err) {
      logger.error({ err: (err as Error).message }, '[SarvamTools] lead lookup failed — starting fresh');
      logToolCall({ event: 'lead-context.fallback', ms: Date.now() - started });
      return { found: false, lead: null, recent_messages: [], note: 'context unavailable, start fresh' };
    }
  });

  /**
   * GET /api/tools/sarvam/inventory-search?location=whitefield&budget_max=8000000&configuration=3BHK
   * Mid-call tool: live inventory search using the SAME engine as WhatsApp.
   */
  app.get('/api/tools/sarvam/inventory-search', async (req, reply) => {
    const started = Date.now();
    logToolCall({
      event: 'inventory-search.request',
      method: req.method,
      url: req.url,
      headers: maskHeaders(req.headers as Record<string, unknown>),
    });
    if (!authorized(req)) {
      logToolCall({ event: 'inventory-search.401', ms: Date.now() - started });
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const q = req.query as Record<string, any>;
    const orgId = String(q.orgId ?? config.defaultOrgId);
    const extracted = parseInventoryQuery(q);
    const limit = Math.min(Math.max(Number(q.limit ?? 3) || 3, 1), 5);

    // No criteria at all (empty/blank params) — guide the agent instead of a blind search.
    const hasCriteria =
      extracted.query ||
      extracted.preferred_location ||
      extracted.city ||
      extracted.area ||
      extracted.configuration ||
      extracted.budget_min ||
      extracted.budget_max;
    if (!hasCriteria) {
      return {
        count: 0,
        results: [],
        note: 'No search criteria — ask the caller for a location, configuration, or budget, then search again.',
      };
    }

    // NEVER fail the call: any error (Supabase down, config error, timeout) returns a
    // valid count-0 payload with HTTP 200 so the voice agent falls back gracefully
    // ("team will send options on WhatsApp") instead of the platform killing the call.
    try {
      const cfg = await withTimeout(getAgentConfig(orgId), 8000, 'agent-config');
      if (!cfg.inventory_enabled || !cfg.inventory_table) {
        return { count: 0, results: [], note: 'Inventory not enabled for this workspace' };
      }

      // "3 or 4 BHK" → one search pass per configuration, merged + deduped.
      const parsedConfigs = extracted.query
        ? parseFreeTextQuery(extracted.query).configurations
        : [];
      const configurations: Array<string | undefined> = extracted.configuration
        ? [String(extracted.configuration)]
        : parsedConfigs.length > 0
          ? parsedConfigs
          : [undefined];

      const seen = new Set<string>();
      const merged: InventoryMatch[] = [];
      for (const configuration of configurations) {
        const variant: ExtractedData = { ...extracted, configuration };
        const matches = await withTimeout(
          searchInventory(
            orgId,
            cfg,
            variant,
            {
              preferred_location: extracted.preferred_location,
              budget_min: extracted.budget_min,
              budget_max: extracted.budget_max,
              configuration: configuration ?? undefined,
            },
            limit
          ),
          8000,
          'inventory-search'
        );
        for (const m of matches) {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            merged.push(m);
          }
        }
      }
      merged.sort((a, b) => b.score - a.score);
      const matches = merged.slice(0, limit);

      // Echo the filters actually applied so the agent (and the transcript)
      // can verify the search matched what the caller asked for.
      const filters: Record<string, unknown> = {};
      if (extracted.city) filters.city = extracted.city;
      if (extracted.sector) filters.sector = extracted.sector;
      if (extracted.preferred_location) filters.location = extracted.preferred_location;
      if (extracted.configuration) filters.configuration = extracted.configuration;
      else if (configurations.filter(Boolean).length > 1) {
        filters.configuration = (configurations as string[]).join(' / ');
      }
      if (extracted.budget_min != null) filters.budget_min = extracted.budget_min;
      if (extracted.budget_max != null) filters.budget_max = extracted.budget_max;

      // ── ZERO-RESULT GUIDANCE ──
      // A bare count-0 made the voice LLM improvise (or invent properties) when
      // callers asked for cities we don't serve (e.g. Pune with NCR-only stock).
      // Tell the agent exactly what to say + where we DO have inventory.
      if (matches.length === 0) {
        const cities = await getAvailableLocations(orgId, cfg);
        const where = extracted.city ?? extracted.preferred_location ?? null;
        const out = zeroResultPayload(filters, where, cities);
        logToolCall({ event: 'inventory-search.zero', ms: Date.now() - started, filters, available_locations: cities });
        return out;
      }

      const out: Record<string, any> = { ...shapeInventory(matches), filters };
      logToolCall({ event: 'inventory-search.200', ms: Date.now() - started, count: out.count, filters });
      return out;
    } catch (err) {
      logger.error(
        { err: (err as Error).message },
        '[SarvamTools] inventory search failed — returning graceful empty result'
      );
      logToolCall({ event: 'inventory-search.fallback', ms: Date.now() - started, err: (err as Error).message });
      return {
        count: 0,
        results: [],
        note: 'Search temporarily unavailable — tell the caller the team will send options on WhatsApp, then continue qualifying.',
      };
    }
  });
}
