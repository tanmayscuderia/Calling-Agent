/**
 * Test AgentConfig Fixtures
 *
 * These are TypeScript mirrors of the agent_templates seeded in
 * supabase/migrations/20260103_0001_agent_configs_templates.sql
 *
 * They let us test promptEngine.buildSystemPrompt() / buildExtractionPrompt()
 * WITHOUT requiring a running database — the exact same config shape that
 * production code loads from agent_configs at runtime.
 */
import type { AgentConfig } from '../../src/ai/agentTypes';

/** Helper to build a config with all required AgentConfig fields. */
function buildConfig(overrides: Partial<AgentConfig> & Pick<AgentConfig, 'industry' | 'persona_name' | 'persona_role' | 'tone' | 'qualifying_fields' | 'intent_types' | 'status_pipeline'>): AgentConfig {
  return {
    id: `test-${overrides.industry}`,
    org_id: 'test-org-id',
    name: `${overrides.industry} Test Config`,
    business_name: null,
    business_description: null,
    business_location: null,
    system_prompt_override: null,
    inventory_enabled: true,
    inventory_table: null,
    search_fields: [],
    reply_template_match: null,
    reply_template_no_match: null,
    reply_template_missing_info: null,
    call_agent_enabled: true,
    call_opening_template: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════
// 1. Real Estate — mirrors the template in the migration SQL
// ════════════════════════════════════════════════════════════
export const REAL_ESTATE_CONFIG: AgentConfig = buildConfig({
  industry: 'real_estate',
  persona_name: 'Priya',
  persona_role: 'Real Estate Sales Assistant',
  tone: 'professional',
  business_name: 'Demo Realty',
  business_description: 'We help customers find their dream property — residential and commercial.',
  qualifying_fields: [
    { key: 'configuration', label: 'Configuration', type: 'string', required_for_qualified: true },
    { key: 'city', label: 'City', type: 'string', required_for_qualified: true },
    { key: 'sector', label: 'Area/Sector', type: 'string' },
    { key: 'budget_min', label: 'Budget Min', type: 'number' },
    { key: 'budget_max', label: 'Budget Max', type: 'number', required_for_qualified: true },
    { key: 'possession_preference', label: 'Possession', type: 'enum', options: ['ready_to_move', 'under_construction', 'resale', 'any'] },
    { key: 'purpose', label: 'Purpose', type: 'enum', options: ['end_use', 'investment', 'rental'] },
    { key: 'timeline', label: 'Timeline', type: 'string' },
  ],
  intent_types: [
    { key: 'property_search', label: 'Looking for property' },
    { key: 'callback_request', label: 'Wants a callback' },
    { key: 'site_visit', label: 'Wants site visit' },
    { key: 'brochure_request', label: 'Wants brochure' },
    { key: 'pricing_question', label: 'Asking about pricing' },
    { key: 'general_question', label: 'General enquiry' },
    { key: 'unrelated', label: 'Off-topic' },
  ],
  status_pipeline: [
    { key: 'new', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'site_visit_scheduled', label: 'Site Visit' },
    { key: 'negotiation', label: 'Negotiation' },
    { key: 'won', label: 'Won' },
    { key: 'lost', label: 'Lost' },
  ],
  inventory_table: 'real_estate_units',
  search_fields: [
    { field: 'configuration', operator: 'ilike', extract_key: 'configuration' },
    { field: 'city', operator: 'ilike', extract_key: 'city' },
    { field: 'price_min', operator: 'lte', extract_key: 'budget_max', label: 'Budget overlap' },
    { field: 'price_max', operator: 'gte', extract_key: 'budget_min' },
  ],
  reply_template_match: 'Yes, we have {{count}} option(s) matching this.',
  reply_template_no_match: "I don't see an exact match in the current inventory. What is your max budget and preferred location?",
  reply_template_missing_info: 'Sure. What budget range and preferred location are you looking at?',
  call_opening_template: 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry for a property. Is this a good time to speak?',
});

// ════════════════════════════════════════════════════════════
// 2. Education — second industry to prove generalization
// ════════════════════════════════════════════════════════════
export const EDUCATION_CONFIG: AgentConfig = buildConfig({
  industry: 'education',
  persona_name: 'Arjun',
  persona_role: 'Admissions Counsellor',
  tone: 'friendly',
  business_name: 'SkillForward Academy',
  business_description: 'We offer courses and programs to help students advance their careers.',
  qualifying_fields: [
    { key: 'course_interest', label: 'Course Interest', type: 'string', required_for_qualified: true },
    { key: 'education_level', label: 'Current Level', type: 'enum', options: ['high_school', 'undergraduate', 'graduate', 'working_professional'] },
    { key: 'preferred_mode', label: 'Mode', type: 'enum', options: ['online', 'offline', 'hybrid'] },
    { key: 'budget_max', label: 'Budget', type: 'number' },
    { key: 'timeline', label: 'Start Timeline', type: 'string' },
  ],
  intent_types: [
    { key: 'course_search', label: 'Looking for a course' },
    { key: 'callback_request', label: 'Wants a callback' },
    { key: 'enrollment', label: 'Wants to enrol' },
    { key: 'pricing_question', label: 'Asking about fees' },
    { key: 'brochure_request', label: 'Wants syllabus/brochure' },
    { key: 'general_question', label: 'General enquiry' },
    { key: 'unrelated', label: 'Off-topic' },
  ],
  status_pipeline: [
    { key: 'new', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'enrollment_scheduled', label: 'Enrolment' },
    { key: 'won', label: 'Enrolled' },
    { key: 'lost', label: 'Lost' },
  ],
  inventory_table: 'education_courses',
  search_fields: [
    { field: 'title', operator: 'ilike', extract_key: 'course_interest' },
    { field: 'price_min', operator: 'lte', extract_key: 'budget_max' },
  ],
  reply_template_match: 'Yes, we have {{count}} course(s) that might interest you.',
  reply_template_no_match: "I don't see an exact match. Could you share more about your area of interest?",
  reply_template_missing_info: "Sure. What course are you interested in and what's your preferred mode of learning?",
  call_opening_template: 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry about our courses. Is this a good time to speak?',
});