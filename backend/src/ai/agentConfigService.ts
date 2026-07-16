/**
 * Agent Config Service
 * Loads agent_configs from DB with in-memory cache (5min TTL).
 * Falls back to real_estate template if no config exists for org.
 */

import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import { config } from '../config';
import type { AgentConfig, AgentTemplate } from './agentTypes';

// In-memory cache: orgId → { config, expiresAt }
const cache = new Map<string, { config: AgentConfig; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the active agent config for an org.
 * Uses cache, falls back to DB, then to a hardcoded real_estate default.
 */
export async function getAgentConfig(orgId: string): Promise<AgentConfig> {
  // Check cache
  const cached = cache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  // Load from DB
  try {
    const { data, error } = await supabaseAdmin()
      .from('agent_configs')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      const agentConfig = normalizeConfig(data);
      cache.set(orgId, { config: agentConfig, expiresAt: Date.now() + CACHE_TTL_MS });
      return agentConfig;
    }
  } catch (err) {
    logger.error({ err, orgId }, '[AgentConfig] Failed to load from DB');
  }

  // Fallback: load template from DB
  try {
    const { data: tmpl } = await supabaseAdmin()
      .from('agent_templates')
      .select('*')
      .eq('industry', 'real_estate')
      .maybeSingle();

    if (tmpl) {
      const fallback = templateToConfig(orgId, tmpl);
      cache.set(orgId, { config: fallback, expiresAt: Date.now() + CACHE_TTL_MS });
      return fallback;
    }
  } catch {
    // ignore
  }

  // Ultimate fallback: hardcoded
  return hardcodedRealEstateConfig(orgId);
}

/**
 * Get all available industry templates.
 */
export async function listTemplates(): Promise<AgentTemplate[]> {
  const { data, error } = await supabaseAdmin()
    .from('agent_templates')
    .select('*')
    .eq('is_public', true)
    .order('label', { ascending: true });

  if (error || !data) return [];
  return data as AgentTemplate[];
}

/**
 * Helper: check if an error is a "column not found in schema cache" error.
 */
function isColumnMissingError(err: any, columnName: string): boolean {
  if (!err) return false;
  const msg = err.message || String(err);
  return msg.includes(`'${columnName}'`) && (msg.includes('schema cache') || msg.includes('Could not find'));
}

/**
 * Apply a template to an org — creates/updates an agent_config.
 *
 * Bulletproof: tries with `inventory_schema` first, and if the DB rejects it
 * (column not found), automatically retries without it.
 */
export async function applyTemplate(orgId: string, industry: string, businessName?: string): Promise<AgentConfig> {
  const { data: tmpl, error } = await supabaseAdmin()
    .from('agent_templates')
    .select('*')
    .eq('industry', industry)
    .maybeSingle();

  if (error || !tmpl) {
    throw new Error(`Template not found for industry: ${industry}`);
  }

  const c = tmpl.config;
  const configName = `${tmpl.label} Agent`;

  // Deactivate ALL existing configs for this org first
  await supabaseAdmin()
    .from('agent_configs')
    .update({ is_active: false })
    .eq('org_id', orgId);

  // Build the upsert payload WITH inventory_schema
  const upsertPayload: Record<string, any> = {
    org_id: orgId,
    name: configName,
    industry: tmpl.industry,
    persona_name: c.persona_name ?? 'Assistant',
    persona_role: c.persona_role ?? 'assistant',
    tone: c.tone ?? 'professional',
    business_name: businessName ?? config.whatsapp.businessName,
    business_description: c.business_description ?? null,
    qualifying_fields: c.qualifying_fields ?? [],
    intent_types: c.intent_types ?? [],
    status_pipeline: c.status_pipeline ?? [],
    inventory_enabled: !!c.inventory_table,
    inventory_table: c.inventory_table ?? null,
    search_fields: c.search_fields ?? [],
    inventory_schema: c.inventory_schema ?? null, // may fail if migration #10 not applied
    reply_template_match: c.reply_template_match ?? null,
    reply_template_no_match: c.reply_template_no_match ?? null,
    reply_template_missing_info: c.reply_template_missing_info ?? null,
    call_agent_enabled: true,
    call_opening_template: c.call_opening_template ?? null,
    is_active: true,
  };

  // Attempt 1: with inventory_schema
  let { data: upserted, error: upsertErr } = await supabaseAdmin()
    .from('agent_configs')
    .upsert(upsertPayload, { onConflict: 'org_id,name' })
    .select('*')
    .single();

  // Attempt 2: if DB rejected inventory_schema column, retry WITHOUT it
  if (upsertErr && isColumnMissingError(upsertErr, 'inventory_schema')) {
    logger.warn('[AgentConfig] inventory_schema column rejected — retrying without it.');
    delete upsertPayload.inventory_schema;
    const retry = await supabaseAdmin()
      .from('agent_configs')
      .upsert(upsertPayload, { onConflict: 'org_id,name' })
      .select('*')
      .single();
    upserted = retry.data;
    upsertErr = retry.error;
  }

  if (upsertErr || !upserted) {
    throw new Error(`Failed to apply agent config: ${upsertErr?.message}`);
  }

  // Invalidate cache
  cache.delete(orgId);

  return normalizeConfig(upserted);
}

/**
 * Update an existing agent config.
 */
export async function updateAgentConfig(orgId: string, configId: string, updates: Record<string, any>): Promise<AgentConfig> {
  const allowedFields = [
    'name', 'persona_name', 'persona_role', 'tone',
    'business_name', 'business_description', 'business_location',
    'system_prompt_override',
    'qualifying_fields', 'intent_types', 'status_pipeline',
    'inventory_enabled', 'inventory_table', 'search_fields',
    'inventory_schema', // migration #10 — may not exist yet
    'reply_template_match', 'reply_template_no_match', 'reply_template_missing_info',
    'call_agent_enabled', 'call_opening_template',
    'is_active',
  ];

  const patch: Record<string, any> = {};
  for (const key of allowedFields) {
    if (key in updates) patch[key] = updates[key];
  }

  // Attempt 1: full patch (includes inventory_schema if present)
  let { data, error } = await supabaseAdmin()
    .from('agent_configs')
    .update(patch)
    .eq('id', configId)
    .eq('org_id', orgId)
    .select('*')
    .single();

  // Attempt 2: if DB rejected inventory_schema column, retry without it
  if (error && isColumnMissingError(error, 'inventory_schema') && 'inventory_schema' in patch) {
    logger.warn('[AgentConfig] inventory_schema column rejected during update — retrying without it.');
    delete patch.inventory_schema;
    const retry = await supabaseAdmin()
      .from('agent_configs')
      .update(patch)
      .eq('id', configId)
      .eq('org_id', orgId)
      .select('*')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    throw new Error(`Failed to update agent config: ${error?.message}`);
  }

  cache.delete(orgId);
  return normalizeConfig(data);
}

/**
 * Invalidate the cache for an org (call after settings changes).
 */
export function invalidateConfigCache(orgId?: string): void {
  if (orgId) {
    cache.delete(orgId);
  } else {
    cache.clear();
  }
}

// ── Helpers ──

function normalizeConfig(row: any): AgentConfig {
  return {
    id: row.id,
    org_id: row.org_id,
    name: row.name,
    industry: row.industry,
    persona_name: row.persona_name,
    persona_role: row.persona_role,
    tone: row.tone,
    business_name: row.business_name,
    business_description: row.business_description,
    business_location: row.business_location,
    system_prompt_override: row.system_prompt_override,
    qualifying_fields: row.qualifying_fields ?? [],
    intent_types: row.intent_types ?? [],
    status_pipeline: row.status_pipeline ?? [],
    inventory_enabled: row.inventory_enabled ?? true,
    inventory_table: row.inventory_table ?? null,
    search_fields: row.search_fields ?? [],
    inventory_schema: row.inventory_schema ?? null,
    reply_template_match: row.reply_template_match,
    reply_template_no_match: row.reply_template_no_match,
    reply_template_missing_info: row.reply_template_missing_info,
    call_agent_enabled: row.call_agent_enabled ?? true,
    call_opening_template: row.call_opening_template,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function templateToConfig(orgId: string, tmpl: any): AgentConfig {
  const c = tmpl.config;
  return {
    id: 'template-' + tmpl.id,
    org_id: orgId,
    name: `${tmpl.label} Agent`,
    industry: tmpl.industry,
    persona_name: c.persona_name ?? 'Assistant',
    persona_role: c.persona_role ?? 'assistant',
    tone: c.tone ?? 'professional',
    business_name: config.whatsapp.businessName,
    business_description: c.business_description ?? null,
    business_location: null,
    system_prompt_override: null,
    qualifying_fields: c.qualifying_fields ?? [],
    intent_types: c.intent_types ?? [],
    status_pipeline: c.status_pipeline ?? [],
    inventory_enabled: !!c.inventory_table,
    inventory_table: c.inventory_table ?? null,
    search_fields: c.search_fields ?? [],
    inventory_schema: c.inventory_schema ?? null,
    reply_template_match: c.reply_template_match,
    reply_template_no_match: c.reply_template_no_match,
    reply_template_missing_info: c.reply_template_missing_info,
    call_agent_enabled: true,
    call_opening_template: c.call_opening_template,
    is_active: true,
    created_at: tmpl.created_at,
    updated_at: tmpl.created_at,
  };
}

function hardcodedRealEstateConfig(orgId: string): AgentConfig {
  return {
    id: 'fallback',
    org_id: orgId,
    name: 'Default Agent',
    industry: 'real_estate',
    persona_name: 'Priya',
    persona_role: 'Real Estate Sales Assistant',
    tone: 'professional',
    business_name: config.whatsapp.businessName,
    business_description: 'We help customers find their dream property.',
    business_location: null,
    system_prompt_override: null,
    qualifying_fields: [
      { key: 'configuration', label: 'Configuration', type: 'string', required_for_qualified: true },
      { key: 'city', label: 'City', type: 'string', required_for_qualified: true },
      { key: 'budget_max', label: 'Budget Max', type: 'number', required_for_qualified: true },
    ],
    intent_types: [
      { key: 'property_search', label: 'Looking for property' },
      { key: 'callback_request', label: 'Wants a callback' },
      { key: 'site_visit', label: 'Wants site visit' },
      { key: 'general_question', label: 'General enquiry' },
    ],
    status_pipeline: [
      { key: 'new', label: 'New' },
      { key: 'contacted', label: 'Contacted' },
      { key: 'qualified', label: 'Qualified' },
      { key: 'won', label: 'Won' },
    ],
    inventory_enabled: true,
    inventory_table: 'real_estate_units',
    search_fields: [
      { field: 'configuration', operator: 'ilike', extract_key: 'configuration' },
      { field: 'city', operator: 'ilike', extract_key: 'city' },
      { field: 'price_min', operator: 'lte', extract_key: 'budget_max' },
      { field: 'price_max', operator: 'gte', extract_key: 'budget_min' },
    ],
    inventory_schema: {
      table: 'real_estate_units',
      item_label: 'Property',
      item_label_plural: 'Properties',
      display_fields: ['name', 'location', 'configuration', 'price_range', 'possession_status'],
      csv_columns: ['project_name', 'configuration', 'price_min', 'price_max', 'city', 'sector', 'developer_name', 'possession_status'],
      filter_fields: [
        { field: 'city', label: 'City', type: 'select' },
        { field: 'configuration', label: 'Configuration', type: 'select' },
      ],
    },
    reply_template_match: 'Yes, we have {{count}} option(s) matching this.',
    reply_template_no_match: 'I don\'t see an exact match. What is your max budget and preferred location?',
    reply_template_missing_info: 'Sure. What budget range and preferred location are you looking at?',
    call_agent_enabled: true,
    call_opening_template: 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry for a property. Is this a good time to speak?',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}