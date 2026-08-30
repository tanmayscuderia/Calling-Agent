-- ============================================================
-- Phase A: Industry-Agnostic Platform
-- agent_configs (per-org) + agent_templates (preset library)
-- ============================================================

-- ── agent_configs: per-org agent configuration ──
CREATE TABLE IF NOT EXISTS public.agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  name text NOT NULL DEFAULT 'Default Agent',
  industry text NOT NULL DEFAULT 'real_estate'
    CHECK (industry IN (
      'real_estate', 'education', 'healthcare', 'd2c_retail',
      'legal_services', 'travel_hospitality', 'financial_services',
      'automotive', 'restaurant', 'salon_spa', 'fitness_gym',
      'insurance', 'custom'
    )),

  -- AI Personality
  persona_name text NOT NULL DEFAULT 'Assistant',
  persona_role text NOT NULL DEFAULT 'assistant',
  tone text NOT NULL DEFAULT 'professional'
    CHECK (tone IN ('professional', 'friendly', 'casual', 'formal', 'energetic')),

  -- Business Context
  business_name text,
  business_description text,
  business_location text,

  -- System Prompt Override (optional)
  system_prompt_override text,

  -- Qualifying Fields (JSON schema)
  qualifying_fields jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Intent Types
  intent_types jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Lead Status Pipeline
  status_pipeline jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Inventory Search Config
  inventory_enabled boolean NOT NULL DEFAULT true,
  inventory_table text,
  search_fields jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Reply Templates
  reply_template_match text,
  reply_template_no_match text,
  reply_template_missing_info text,

  -- Call Agent Config
  call_agent_enabled boolean NOT NULL DEFAULT true,
  call_opening_template text,

  -- Metadata
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_org_id
ON public.agent_configs(org_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_org_active
ON public.agent_configs(org_id, is_active);

-- ── agent_templates: preset library (global, read-only) ──
CREATE TABLE IF NOT EXISTS public.agent_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  icon text DEFAULT '🏢',

  config jsonb NOT NULL DEFAULT '{}'::jsonb,

  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Trigger: updated_at ──
DROP TRIGGER IF EXISTS set_agent_configs_updated_at ON public.agent_configs;
CREATE TRIGGER set_agent_configs_updated_at
BEFORE UPDATE ON public.agent_configs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Seed 8 Industry Templates
-- ============================================================

INSERT INTO public.agent_templates (industry, label, description, icon, config) VALUES
-- 1. Real Estate
('real_estate', 'Real Estate', 'Property sales, rentals, and lead qualification', '🏢', jsonb_build_object(
  'persona_name', 'Priya',
  'persona_role', 'Real Estate Sales Assistant',
  'tone', 'professional',
  'business_description', 'We help customers find their dream property — residential and commercial.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'configuration', 'label', 'Configuration', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'city', 'label', 'City', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'sector', 'label', 'Area/Sector', 'type', 'string'),
    jsonb_build_object('key', 'budget_min', 'label', 'Budget Min', 'type', 'number'),
    jsonb_build_object('key', 'budget_max', 'label', 'Budget Max', 'type', 'number', 'required_for_qualified', true),
    jsonb_build_object('key', 'possession_preference', 'label', 'Possession', 'type', 'enum', 'options', jsonb_build_array('ready_to_move','under_construction','resale','any')),
    jsonb_build_object('key', 'purpose', 'label', 'Purpose', 'type', 'enum', 'options', jsonb_build_array('end_use','investment','rental')),
    jsonb_build_object('key', 'timeline', 'label', 'Timeline', 'type', 'string')
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'property_search', 'label', 'Looking for property'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'site_visit', 'label', 'Wants site visit'),
    jsonb_build_object('key', 'brochure_request', 'label', 'Wants brochure'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about pricing'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'site_visit_scheduled', 'label', 'Site Visit'),
    jsonb_build_object('key', 'negotiation', 'label', 'Negotiation'),
    jsonb_build_object('key', 'won', 'label', 'Won'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', 'real_estate_units',
  'search_fields', jsonb_build_array(
    jsonb_build_object('field', 'configuration', 'operator', 'ilike', 'extract_key', 'configuration'),
    jsonb_build_object('field', 'city', 'operator', 'ilike', 'extract_key', 'city'),
    jsonb_build_object('field', 'price_min', 'operator', 'lte', 'extract_key', 'budget_max', 'label', 'Budget overlap'),
    jsonb_build_object('field', 'price_max', 'operator', 'gte', 'extract_key', 'budget_min')
  ),
  'reply_template_match', 'Yes, we have {{count}} option(s) matching this.',
  'reply_template_no_match', 'I don''t see an exact match in the current inventory. What is your max budget and preferred location?',
  'reply_template_missing_info', 'Sure. What budget range and preferred location are you looking at?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry for a property. Is this a good time to speak?'
)) ON CONFLICT (industry) DO NOTHING,

-- 2. Education
('education', 'Education', 'Course admissions, enrolment, and counselling', '🎓', jsonb_build_object(
  'persona_name', 'Arjun',
  'persona_role', 'Admissions Counsellor',
  'tone', 'friendly',
  'business_description', 'We offer courses and programs to help students advance their careers.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'course_interest', 'label', 'Course Interest', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'education_level', 'label', 'Current Level', 'type', 'enum', 'options', jsonb_build_array('high_school','undergraduate','graduate','working_professional')),
    jsonb_build_object('key', 'preferred_mode', 'label', 'Mode', 'type', 'enum', 'options', jsonb_build_array('online','offline','hybrid')),
    jsonb_build_object('key', 'budget_max', 'label', 'Budget', 'type', 'number'),
    jsonb_build_object('key', 'timeline', 'label', 'Start Timeline', 'type', 'string')
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'course_search', 'label', 'Looking for a course'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'enrollment', 'label', 'Wants to enrol'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about fees'),
    jsonb_build_object('key', 'brochure_request', 'label', 'Wants syllabus/brochure'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'enrollment_scheduled', 'label', 'Enrolment'),
    jsonb_build_object('key', 'won', 'label', 'Enrolled'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', 'education_courses',
  'search_fields', jsonb_build_array(
    jsonb_build_object('field', 'title', 'operator', 'ilike', 'extract_key', 'course_interest'),
    jsonb_build_object('field', 'price_min', 'operator', 'lte', 'extract_key', 'budget_max')
  ),
  'reply_template_match', 'Yes, we have {{count}} course(s) that might interest you.',
  'reply_template_no_match', 'I don''t see an exact match. Could you share more about your area of interest?',
  'reply_template_missing_info', 'Sure. What course are you interested in and what''s your preferred mode of learning?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry about our courses. Is this a good time to speak?'
)) ON CONFLICT (industry) DO NOTHING,

-- 3. Healthcare
('healthcare', 'Healthcare', 'Appointment booking, consultations, and patient enquiries', '🏥', jsonb_build_object(
  'persona_name', 'Dr. Anjali',
  'persona_role', 'Appointment Coordinator',
  'tone', 'professional',
  'business_description', 'We provide quality healthcare services and consultations.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'department', 'label', 'Department', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'symptoms', 'label', 'Symptoms/Reason', 'type', 'string'),
    jsonb_build_object('key', 'preferred_date', 'label', 'Preferred Date', 'type', 'string'),
    jsonb_build_object('key', 'insurance', 'label', 'Insurance', 'type', 'string'),
    jsonb_build_object('key', 'timeline', 'label', 'Urgency', 'type', 'string')
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'appointment_booking', 'label', 'Wants appointment'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'consultation_request', 'label', 'Wants consultation'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about fees'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'appointment_scheduled', 'label', 'Appointment'),
    jsonb_build_object('key', 'won', 'label', 'Consulted'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', null,
  'search_fields', jsonb_build_array(),
  'reply_template_match', 'I can help you with that.',
  'reply_template_no_match', 'Let me connect you with the right department.',
  'reply_template_missing_info', 'Sure. Which department do you need and when would you like to come in?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. How can I help you today?'
)) ON CONFLICT (industry) DO NOTHING,

-- 4. D2C Retail
('d2c_retail', 'D2C Retail', 'Product sales, orders, and customer support', '🛍️', jsonb_build_object(
  'persona_name', 'Riya',
  'persona_role', 'Customer Support Specialist',
  'tone', 'friendly',
  'business_description', 'We sell quality products delivered to your doorstep.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'product', 'label', 'Product', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'size', 'label', 'Size', 'type', 'string'),
    jsonb_build_object('key', 'color', 'label', 'Color', 'type', 'string'),
    jsonb_build_object('key', 'quantity', 'label', 'Quantity', 'type', 'number'),
    jsonb_build_object('key', 'pincode', 'label', 'Delivery Pincode', 'type', 'string')
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'product_search', 'label', 'Looking for product'),
    jsonb_build_object('key', 'order_status', 'label', 'Order status'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about pricing'),
    jsonb_build_object('key', 'return_request', 'label', 'Return/Exchange'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'order_placed', 'label', 'Order Placed'),
    jsonb_build_object('key', 'won', 'label', 'Delivered'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', 'products',
  'search_fields', jsonb_build_array(
    jsonb_build_object('field', 'title', 'operator', 'ilike', 'extract_key', 'product')
  ),
  'reply_template_match', 'Yes, we have {{count}} product(s) matching your request.',
  'reply_template_no_match', 'I don''t see an exact match. Could you describe what you''re looking for?',
  'reply_template_missing_info', 'Sure. What product are you looking for?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. How can I help you today?'
)) ON CONFLICT (industry) DO NOTHING,

-- 5. Travel & Hospitality
('travel_hospitality', 'Travel & Hospitality', 'Travel packages, bookings, and itinerary planning', '✈️', jsonb_build_object(
  'persona_name', 'Kabir',
  'persona_role', 'Travel Consultant',
  'tone', 'energetic',
  'business_description', 'We craft memorable travel experiences and packages.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'destination', 'label', 'Destination', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'dates', 'label', 'Travel Dates', 'type', 'string'),
    jsonb_build_object('key', 'travelers', 'label', 'Number of Travelers', 'type', 'number'),
    jsonb_build_object('key', 'budget_max', 'label', 'Budget', 'type', 'number'),
    jsonb_build_object('key', 'trip_type', 'label', 'Trip Type', 'type', 'enum', 'options', jsonb_build_array('leisure','adventure','family','honeymoon','business'))
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'package_search', 'label', 'Looking for packages'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'booking_request', 'label', 'Wants to book'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about pricing'),
    jsonb_build_object('key', 'brochure_request', 'label', 'Wants itinerary'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'booking_scheduled', 'label', 'Booking'),
    jsonb_build_object('key', 'won', 'label', 'Booked'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', 'travel_packages',
  'search_fields', jsonb_build_array(
    jsonb_build_object('field', 'title', 'operator', 'ilike', 'extract_key', 'destination'),
    jsonb_build_object('field', 'price_min', 'operator', 'lte', 'extract_key', 'budget_max')
  ),
  'reply_template_match', 'Great news! We have {{count}} package(s) that match.',
  'reply_template_no_match', 'I don''t see an exact match. What destination and dates are you considering?',
  'reply_template_missing_info', 'Sure. Where would you like to travel and what''s your budget?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry about travel. Is this a good time?'
)) ON CONFLICT (industry) DO NOTHING,

-- 6. Financial Services
('financial_services', 'Financial Services', 'Loans, investments, and financial advisory', '💰', jsonb_build_object(
  'persona_name', 'Meera',
  'persona_role', 'Financial Advisor',
  'tone', 'formal',
  'business_description', 'We provide loans, investment products, and financial planning services.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'service_type', 'label', 'Service Type', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'amount', 'label', 'Amount', 'type', 'number'),
    jsonb_build_object('key', 'risk_profile', 'label', 'Risk Profile', 'type', 'enum', 'options', jsonb_build_array('conservative','moderate','aggressive')),
    jsonb_build_object('key', 'budget_max', 'label', 'Budget', 'type', 'number'),
    jsonb_build_object('key', 'timeline', 'label', 'Timeline', 'type', 'string')
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'product_search', 'label', 'Looking for service'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'consultation_request', 'label', 'Wants consultation'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about rates'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'consultation_scheduled', 'label', 'Consultation'),
    jsonb_build_object('key', 'won', 'label', 'Onboarded'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', 'financial_products',
  'search_fields', jsonb_build_array(
    jsonb_build_object('field', 'title', 'operator', 'ilike', 'extract_key', 'service_type'),
    jsonb_build_object('field', 'price_min', 'operator', 'lte', 'extract_key', 'budget_max')
  ),
  'reply_template_match', 'Yes, we have {{count}} option(s) for you.',
  'reply_template_no_match', 'I don''t see an exact match. Could you share more about your requirements?',
  'reply_template_missing_info', 'Sure. What financial service are you interested in?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. I saw your enquiry. Is this a good time to speak?'
)) ON CONFLICT (industry) DO NOTHING,

-- 7. Restaurant
('restaurant', 'Restaurant', 'Table reservations, food orders, and enquiries', '🍽️', jsonb_build_object(
  'persona_name', 'Vikram',
  'persona_role', 'Reservations Coordinator',
  'tone', 'friendly',
  'business_description', 'We serve delicious food in a great ambiance.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'party_size', 'label', 'Party Size', 'type', 'number', 'required_for_qualified', true),
    jsonb_build_object('key', 'date', 'label', 'Date', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'time', 'label', 'Time', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'occasion', 'label', 'Occasion', 'type', 'string'),
    jsonb_build_object('key', 'seating', 'label', 'Seating Preference', 'type', 'enum', 'options', jsonb_build_array('indoor','outdoor','private'))
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'reservation', 'label', 'Wants reservation'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'menu_enquiry', 'label', 'Menu enquiry'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about pricing'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'reservation_scheduled', 'label', 'Reserved'),
    jsonb_build_object('key', 'won', 'label', 'Visited'),
    jsonb_build_object('key', 'lost', 'label', 'Cancelled')
  ),
  'inventory_table', null,
  'search_fields', jsonb_build_array(),
  'reply_template_match', 'I can arrange that for you.',
  'reply_template_no_match', 'Let me check availability for you.',
  'reply_template_missing_info', 'Sure. For how many guests and what date/time?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. How can I help you today?'
)) ON CONFLICT (industry) DO NOTHING,

-- 8. Fitness/Gym
('fitness_gym', 'Fitness / Gym', 'Memberships, personal training, and class bookings', '💪', jsonb_build_object(
  'persona_name', 'Tara',
  'persona_role', 'Membership Advisor',
  'tone', 'energetic',
  'business_description', 'We help you achieve your fitness goals with world-class facilities.',
  'qualifying_fields', jsonb_build_array(
    jsonb_build_object('key', 'goal', 'label', 'Fitness Goal', 'type', 'string', 'required_for_qualified', true),
    jsonb_build_object('key', 'plan_type', 'label', 'Plan Type', 'type', 'enum', 'options', jsonb_build_array('monthly','quarterly','annual','personal_training')),
    jsonb_build_object('key', 'preferred_time', 'label', 'Preferred Time', 'type', 'string'),
    jsonb_build_object('key', 'budget_max', 'label', 'Budget', 'type', 'number'),
    jsonb_build_object('key', 'location', 'label', 'Preferred Location', 'type', 'string')
  ),
  'intent_types', jsonb_build_array(
    jsonb_build_object('key', 'membership_search', 'label', 'Looking for membership'),
    jsonb_build_object('key', 'callback_request', 'label', 'Wants a callback'),
    jsonb_build_object('key', 'trial_request', 'label', 'Wants trial'),
    jsonb_build_object('key', 'pricing_question', 'label', 'Asking about pricing'),
    jsonb_build_object('key', 'brochure_request', 'label', 'Wants details'),
    jsonb_build_object('key', 'general_question', 'label', 'General enquiry'),
    jsonb_build_object('key', 'unrelated', 'label', 'Off-topic')
  ),
  'status_pipeline', jsonb_build_array(
    jsonb_build_object('key', 'new', 'label', 'New'),
    jsonb_build_object('key', 'contacted', 'label', 'Contacted'),
    jsonb_build_object('key', 'qualified', 'label', 'Qualified'),
    jsonb_build_object('key', 'trial_scheduled', 'label', 'Trial'),
    jsonb_build_object('key', 'won', 'label', 'Joined'),
    jsonb_build_object('key', 'lost', 'label', 'Lost')
  ),
  'inventory_table', 'gym_plans',
  'search_fields', jsonb_build_array(
    jsonb_build_object('field', 'title', 'operator', 'ilike', 'extract_key', 'plan_type'),
    jsonb_build_object('field', 'price_min', 'operator', 'lte', 'extract_key', 'budget_max')
  ),
  'reply_template_match', 'Great! We have {{count}} plan(s) that suit you.',
  'reply_template_no_match', 'I don''t see an exact match. What''s your fitness goal?',
  'reply_template_missing_info', 'Sure. What are your fitness goals?',
  'call_opening_template', 'Hi, this is {{persona_name}} from {{business_name}}. Ready to crush your fitness goals?'
)) ON CONFLICT (industry) DO NOTHING;

-- ============================================================
-- Auto-create default agent_config for existing orgs
-- (copies real_estate template config)
-- ============================================================
INSERT INTO public.agent_configs (org_id, name, industry, persona_name, persona_role, tone, business_name, business_description, qualifying_fields, intent_types, status_pipeline, inventory_table, search_fields, reply_template_match, reply_template_no_match, reply_template_missing_info, call_opening_template)
SELECT
  o.id,
  'Default Agent',
  'real_estate',
  t.config->>'persona_name',
  t.config->>'persona_role',
  t.config->>'tone',
  'Demo Realty',
  t.config->>'business_description',
  t.config->'qualifying_fields',
  t.config->'intent_types',
  t.config->'status_pipeline',
  t.config->>'inventory_table',
  t.config->'search_fields',
  t.config->>'reply_template_match',
  t.config->>'reply_template_no_match',
  t.config->>'reply_template_missing_info',
  t.config->>'call_opening_template'
FROM public.organizations o
CROSS JOIN public.agent_templates t
WHERE t.industry = 'real_estate'
AND NOT EXISTS (
  SELECT 1 FROM public.agent_configs ac
  WHERE ac.org_id = o.id AND ac.is_active = true
)
ON CONFLICT (org_id, name) DO NOTHING;
