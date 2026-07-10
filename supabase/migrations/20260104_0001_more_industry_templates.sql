-- ============================================================
-- Additional Industry Templates: Legal, Automotive, Salon/Spa, Insurance
-- Adds 4 more agent_templates to the preset library
-- ============================================================

INSERT INTO public.agent_templates (industry, label, description, icon, config) VALUES

-- 9. Legal Services
('legal_services', 'Legal Services', 'Legal consultations, appointments, and case enquiries', '⚖️', jsonb_build_object(
  'persona_name', 'Adv. Suresh',
  'persona_role', 'Legal Consultation Coordinator',
  'tone', 'formal',
  'business_description', 'We provide expert legal consultation and representation services.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'practice_area', 'label', 'Practice Area', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'case_type', 'label', 'Case Type', 'type', 'string'),
    jsonb_build_object('key', 'preferred_date', 'label', 'Preferred Date', 'type', 'string'),
    jsonb_build_object('key', 'location', 'label', 'Location', 'type', 'string'),
    jsonb_build_object('key', 'timeline', 'label', 'Urgency', 'type', 'string')
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'consultation_request', 'label', 'Wants consultation'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'appointment_booking', 'label', 'Wants appointment'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about fees'),
    jsonb_build_object('key', 'document_review', 'label', 'Document review'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'consultation_scheduled', 'label', 'Consultation'),
    jsonb_build_object('key', 'won', 'label', 'Engaged'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', null,
  'search_fields', jsonb_build_array(),
  'reply_template_match', 'I can help you with that.',
  'reply_template_no_match', 'Let me connect you with the right legal expert.',
  'reply_template_missing_info', 'Sure. What area of law do you need help with?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry about a legal consultation. Is this a good time to speak?'
)) ON CONFLICT (industry) DO NOTHING,

-- 10. Automotive
('automotive', 'Automotive', 'Vehicle sales, test drives, and service enquiries', '🚗', jsonb_build_object(
  'persona_name', 'Rohit',
  'persona_role', 'Automotive Sales Specialist',
  'tone', 'friendly',
  'business_description', 'We sell and service quality vehicles with the best deals and after-sales support.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'vehicle_type', 'label', 'Vehicle Type', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'brand', 'label', 'Preferred Brand', 'type', 'string'),
    jsonb_build_object('key', 'budget_max', 'label', 'Budget', 'type', 'number', 'required_for_qualified', true),
    jsonb_build_object('key', 'fuel_type', 'label', 'Fuel Type', 'type', 'enum', 'options', jsonb_build_array('petrol','diesel','electric','hybrid')),
    jsonb_build_object('key', 'transmission', 'label', 'Transmission', 'type', 'enum', 'options', jsonb_build_array('manual','automatic')),
    jsonb_build_object('key', 'timeline', 'label', 'Purchase Timeline', 'type', 'string')
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'vehicle_search', 'label', 'Looking for vehicle'),
    jsonb_build_object('key', 'test_drive', 'label', 'Wants test drive'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about pricing'),
    jsonb_build_object('key', 'service_booking', 'label', 'Service booking'),
    jsonb_build_object('key', 'brochure_request', 'label', 'Wants brochure'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'test_drive_scheduled', 'label', 'Test Drive'),
    jsonb_build_object('key', 'won', 'label', 'Sold'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', 'automotive_inventory',
  'search_fields', jsonb_build_array(
    jsonb_build_object('field', 'title', 'operator', 'ilike', 'extract_key', 'vehicle_type'),
    jsonb_build_object('field', 'price_min', 'operator', 'lte', 'extract_key', 'budget_max')
  ),
  'reply_template_match', 'Yes, we have {{count}} vehicle(s) matching your requirements.',
  'reply_template_no_match', 'I don''t see an exact match. What vehicle type and budget are you looking at?',
  'reply_template_missing_info', 'Sure. What type of vehicle are you looking for and what''s your budget?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry about a vehicle. Is this a good time to speak?'
)) ON CONFLICT (industry) DO NOTHING,

-- 11. Salon / Spa
('salon_spa', 'Salon / Spa', 'Appointments, services, and package bookings', '💅', jsonb_build_object(
  'persona_name', 'Nina',
  'persona_role', 'Salon Booking Specialist',
  'tone', 'friendly',
  'business_description', 'We offer premium salon and spa services to help you look and feel your best.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'service_type', 'label', 'Service', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'preferred_date', 'label', 'Preferred Date', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'preferred_time', 'label', 'Preferred Time', 'type', 'string'),
    jsonb_build_object('key', 'package', 'label', 'Package', 'type', 'enum', 'options', jsonb_build_array('single','monthly','quarterly','annual')),
    jsonb_build_object('key', 'gender', 'label', 'For', 'type', 'enum', 'options', jsonb_build_array('male','female','unisex'))
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'appointment_booking', 'label', 'Wants appointment'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'service_search', 'label', 'Asking about services'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about pricing'),
    jsonb_build_object('key', 'package_enquiry', 'label', 'Package enquiry'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'appointment_scheduled', 'label', 'Booked'),
    jsonb_build_object('key', 'won', 'label', 'Visited'),
    jsonb_build_object('key', 'lost', 'label', 'Cancelled')
  ),
  'inventory_table', 'salon_services',
  'search_fields', jsonb_build_array(
    jsonb_build_object('field', 'title', 'operator', 'ilike', 'extract_key', 'service_type')
  ),
  'reply_template_match', 'Yes, we have {{count}} service(s) available for you.',
  'reply_template_no_match', 'I don''t see that exact service. Could you describe what you''re looking for?',
  'reply_template_missing_info', 'Sure. What service are you interested in and when would you like to come in?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. How can I help you today?'
)) ON CONFLICT (industry) DO NOTHING,

-- 12. Insurance
('insurance', 'Insurance', 'Policy sales, quotes, and claim assistance', '🛡️', jsonb_build_object(
  'persona_name', 'Kavya',
  'persona_role', 'Insurance Advisor',
  'tone', 'professional',
  'business_description', 'We provide comprehensive insurance solutions — life, health, motor, and more.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'policy_type', 'label', 'Policy Type', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'coverage_amount', 'label', 'Coverage Amount', 'type', 'number'),
    jsonb_build_object('key', 'budget_max', 'label', 'Premium Budget', 'type', 'number', 'required_for_qualified', true),
    jsonb_build_object('key', 'age', 'label', 'Age', 'type', 'number'),
    jsonb_build_object('key', 'family_size', 'label', 'Family Size', 'type', 'number'),
    jsonb_build_object('key', 'timeline', 'label', 'Timeline', 'type', 'string')
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'policy_search', 'label', 'Looking for policy'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'quote_request', 'label', 'Wants a quote'),
    jsonb_build_object('key', 'claim_assistance', 'label', 'Claim help'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about premium'),
    jsonb_build_object('key', 'brochure_request', 'label', 'Wants policy details'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'quote_shared', 'label', 'Quote Shared'),
    jsonb_build_object('key', 'won', 'label', 'Policy Issued'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', 'insurance_plans',
  'search_fields', jsonb_build_array(
    jsonb_build_object('field', 'title', 'operator', 'ilike', 'extract_key', 'policy_type'),
    jsonb_build_object('field', 'price_min', 'operator', 'lte', 'extract_key', 'budget_max')
  ),
  'reply_template_match', 'Yes, we have {{count}} plan(s) that match your needs.',
  'reply_template_no_match', 'I don''t see an exact match. What type of policy and budget are you considering?',
  'reply_template_missing_info', 'Sure. What type of insurance are you looking for and what''s your budget?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry about insurance. Is this a good time to speak?'
)) ON CONFLICT (industry) DO NOTHING;

-- ============================================================
-- Update default agent_config seed: use neutral generic config
-- instead of forcing real_estate on every org.
-- New orgs get a minimal "setup needed" config — they pick
-- their industry from Settings → Apply Template.
-- ============================================================

-- First, update existing orgs that still have the real_estate default
-- to have a more neutral name (don't change their actual config, just the label)
UPDATE public.agent_configs
SET name = 'Default Agent (Real Estate)',
    industry = 'real_estate'
WHERE name = 'Default Agent'
  AND industry = 'real_estate';

-- Replace the auto-seed block: new orgs get a neutral generic agent
-- This function-based approach ensures new orgs start unconfigured
CREATE OR REPLACE FUNCTION public.create_default_agent_config()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.agent_configs (
    org_id, name, industry, persona_name, persona_role, tone,
    business_name, business_description,
    qualifying_fields, intent_types, status_pipeline,
    inventory_enabled, inventory_table, search_fields,
    reply_template_match, reply_template_no_match, reply_template_missing_info,
    call_opening_template, is_active
  ) VALUES (
    NEW.id,
    'Default Agent',
    'custom',
    'Assistant',
    'assistant',
    'professional',
    COALESCE(NEW.name, 'Your Business'),
    'Please select an industry template from Agent Settings to configure your AI agent.',
    '[{"key":"requirement","label":"Requirement","type":"string","required_for_qualified":true}]'::jsonb,
    '[{"key":"general_question","label":"General enquiry"},{"key":"callback_request","label":"Wants a callback"},{"key":"unrelated","label":"Off-topic"}]'::jsonb,
    '[{"key":"new","label":"New"},{"key":"contacted","label":"Contacted"},{"key":"qualified","label":"Qualified"},{"key":"won","label":"Won"},{"key":"lost","label":"Lost"}]'::jsonb,
    false,
    null,
    '[]'::jsonb,
    'I can help you with that.',
    'Let me find the right option for you.',
    'Sure, could you tell me more about what you need?',
    'Hi, this is {{persona_name}} from {{business_name}}. How can I help you today?',
    true
  )
  ON CONFLICT (org_id, name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists, create new one
DROP TRIGGER IF EXISTS trigger_create_default_agent_config ON public.organizations;
CREATE TRIGGER trigger_create_default_agent_config
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_default_agent_config();