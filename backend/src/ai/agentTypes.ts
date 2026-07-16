/**
 * Industry-agnostic agent type definitions.
 * These types describe a configurable AI agent that can be tuned
 * for any industry via agent_configs.
 */

// ── Qualifying Field Schema ──
export interface QualifyingField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'enum' | 'boolean';
  options?: string[];
  required_for_qualified?: boolean;
}

// ── Intent Type ──
export interface IntentType {
  key: string;
  label: string;
}

// ── Status Pipeline Stage ──
export interface StatusStage {
  key: string;
  label: string;
}

// ── Search Field Mapping ──
export interface SearchFieldConfig {
  field: string;        // DB column name in inventory table
  operator: 'ilike' | 'eq' | 'lte' | 'gte';
  extract_key: string;  // key from extracted data
  label?: string;
}

// ── Inventory Schema (config-driven UI/CSV/form) ──
export interface InventoryFilterField {
  field: string;
  label: string;
  type: 'select' | 'number' | 'text';
}

export interface InventorySchema {
  table: string;                          // 'real_estate_units' | 'inventory_items'
  item_label: string;                     // 'Property' | 'Vehicle' | 'Service'
  item_label_plural: string;              // 'Properties' | 'Vehicles'
  display_fields: string[];               // which fields to show in cards
  csv_columns: string[];                  // expected CSV columns
  filter_fields: InventoryFilterField[];  // filters shown in UI
}

// ── Full Agent Config (from DB) ──
export interface AgentConfig {
  id: string;
  org_id: string;
  name: string;
  industry: string;

  // Personality
  persona_name: string;
  persona_role: string;
  tone: string;

  // Business
  business_name: string | null;
  business_description: string | null;
  business_location: string | null;

  // Override
  system_prompt_override: string | null;

  // Schema
  qualifying_fields: QualifyingField[];
  intent_types: IntentType[];
  status_pipeline: StatusStage[];

  // Inventory
  inventory_enabled: boolean;
  inventory_table: string | null;
  search_fields: SearchFieldConfig[];
  inventory_schema: InventorySchema | null;

  // Templates
  reply_template_match: string | null;
  reply_template_no_match: string | null;
  reply_template_missing_info: string | null;

  // Call
  call_agent_enabled: boolean;
  call_opening_template: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Template (from agent_templates table) ──
export interface AgentTemplate {
  id: string;
  industry: string;
  label: string;
  description: string;
  icon: string;
  config: Record<string, any>;
  is_public: boolean;
}

// ── Extracted data from LLM (generic) ──
export interface ExtractedData {
  intent?: string | null;
  lead_temperature?: string | null;
  needs_human?: boolean;
  [key: string]: any; // dynamic qualifying fields
}

// ── Agent Result ──
export interface GenericAgentResult {
  reply: string;
  extractedIntent: string;
  extractedData: ExtractedData;
  matchedProperties: Array<{
    id?: string;
    score: number;
    reason: string;
    label: string;        // human-readable label
    sublabel?: string;    // e.g. location/category
    priceRange?: string;
    details?: Record<string, any>;
  }>;
  leadUpdates: Record<string, any>;
  shouldHandoff: boolean;
  model: string;
  latencyMs: number;
  mediaToSend?: { url: string; fileName?: string; caption?: string; mimeType?: string } | null;
  quickReplies?: string[];
}