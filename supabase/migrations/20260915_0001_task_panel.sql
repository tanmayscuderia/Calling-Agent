-- ============================================================
-- 20260915_0001 — Tasks Panel (upgrade lead_followups + template task types)
-- ============================================================
-- Extends lead_followups into the product's Tasks system:
--   priority, source (manual/ai_call/ai_whatsapp), created_by, call_session_id
-- Relaxes the hardcoded `type` CHECK — task types become template-driven via
-- agent_configs.task_types (validated in the app layer, per industry).
-- Adds agent_configs.task_types + auto_task_rules (industry-seeded), and
-- seeds agent_templates.config with the same sets so new orgs inherit them.
-- Idempotent: IF NOT EXISTS / IF EXISTS guards throughout.
-- ============================================================

-- ── lead_followups: new columns ──
ALTER TABLE public.lead_followups
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';
ALTER TABLE public.lead_followups
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
ALTER TABLE public.lead_followups
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;
ALTER TABLE public.lead_followups
  ADD COLUMN IF NOT EXISTS call_session_id uuid REFERENCES public.call_sessions(id) ON DELETE SET NULL;

-- Backfill source for existing AI-created rows (they all came from calls)
UPDATE public.lead_followups SET source = 'ai_call' WHERE source = 'manual' AND metadata ? 'auto';

-- Relax CHECKs: validate type/priority/source in the app layer (zod +
-- agent_configs.task_types), so industry templates can define their own types
-- (site_visit / campus_visit / interview_scheduled / …) without migrations.
ALTER TABLE public.lead_followups DROP CONSTRAINT IF EXISTS lead_followups_type_check;
ALTER TABLE public.lead_followups DROP CONSTRAINT IF EXISTS lead_followups_priority_check;
ALTER TABLE public.lead_followups DROP CONSTRAINT IF EXISTS lead_followups_source_check;
ALTER TABLE public.lead_followups
  ADD CONSTRAINT lead_followups_source_check
  CHECK (source IN ('manual', 'ai_call', 'ai_whatsapp'));

-- ── Indexes for the Tasks panel filters ──
CREATE INDEX IF NOT EXISTS idx_lead_followups_org_assignee
  ON public.lead_followups(org_id, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_lead_followups_org_source
  ON public.lead_followups(org_id, source);
CREATE INDEX IF NOT EXISTS idx_lead_followups_org_priority
  ON public.lead_followups(org_id, priority) WHERE status = 'pending';

-- ── agent_configs: template-driven task types + auto-task rules ──
ALTER TABLE public.agent_configs
  ADD COLUMN IF NOT EXISTS task_types jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.agent_configs
  ADD COLUMN IF NOT EXISTS auto_task_rules jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ============================================================
-- Seed task_types + auto_task_rules per industry.
-- agent_templates.config gets them too, so applying a template to a new
-- org carries the industry's task system with it.
-- ============================================================

-- real_estate
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"site_visit","label":"Site Visit","icon":"🏢"},{"key":"email","label":"Email","icon":"✉️"},
  {"key":"meeting","label":"Meeting","icon":"📅"},{"key":"docs_collection","label":"Documents","icon":"📄"},
  {"key":"loan_followup","label":"Loan Follow-up","icon":"🏦"},{"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"site_visit_requested","type":"site_visit","title":"Schedule site visit — {lead}","priority":"urgent","due_offset_hours":48},
  {"outcome":"booking_requested","type":"meeting","title":"Close booking — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'real_estate';

-- education
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"campus_visit","label":"Campus Visit","icon":"🎓"},{"key":"email","label":"Email","icon":"✉️"},
  {"key":"meeting","label":"Meeting","icon":"📅"},{"key":"application_followup","label":"Application","icon":"📝"},
  {"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"site_visit_requested","type":"campus_visit","title":"Schedule campus visit — {lead}","priority":"urgent","due_offset_hours":48},
  {"outcome":"booking_requested","type":"application_followup","title":"Process application — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'education';

-- healthcare
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"appointment_followup","label":"Appointment","icon":"🩺"},{"key":"email","label":"Email","icon":"✉️"},
  {"key":"insurance_verification","label":"Insurance Verify","icon":"🏥"},{"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"site_visit_requested","type":"appointment_followup","title":"Book appointment — {lead}","priority":"urgent","due_offset_hours":48},
  {"outcome":"booking_requested","type":"appointment_followup","title":"Confirm appointment — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'healthcare';

-- d2c_retail
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"email","label":"Email","icon":"✉️"},{"key":"delivery_followup","label":"Delivery","icon":"📦"},
  {"key":"return_exchange","label":"Return/Exchange","icon":"🔄"},{"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"booking_requested","type":"delivery_followup","title":"Process order — {lead}","priority":"high","due_offset_hours":24}]}'::jsonb
WHERE industry = 'd2c_retail';

-- legal_services
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"email","label":"Email","icon":"✉️"},{"key":"meeting","label":"Consultation","icon":"⚖️"},
  {"key":"consultation_followup","label":"Consult Follow-up","icon":"⚖️"},{"key":"docs_collection","label":"Documents","icon":"📄"},
  {"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"site_visit_requested","type":"meeting","title":"Schedule consultation — {lead}","priority":"urgent","due_offset_hours":48},
  {"outcome":"booking_requested","type":"consultation_followup","title":"Prepare case — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'legal_services';

-- travel_hospitality
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"email","label":"Email","icon":"✉️"},{"key":"booking_followup","label":"Booking","icon":"✈️"},
  {"key":"itinerary_share","label":"Itinerary","icon":"🗺️"},{"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"booking_requested","type":"booking_followup","title":"Confirm booking — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'travel_hospitality';

-- financial_services
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"email","label":"Email","icon":"✉️"},{"key":"meeting","label":"Meeting","icon":"📅"},
  {"key":"kyc_docs","label":"KYC Documents","icon":"🪪"},{"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"site_visit_requested","type":"meeting","title":"Schedule meeting — {lead}","priority":"urgent","due_offset_hours":48},
  {"outcome":"booking_requested","type":"kyc_docs","title":"Collect KYC — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'financial_services';

-- automotive
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"test_drive","label":"Test Drive","icon":"🚗"},{"key":"email","label":"Email","icon":"✉️"},
  {"key":"service_followup","label":"Service Follow-up","icon":"🔧"},{"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"site_visit_requested","type":"test_drive","title":"Schedule test drive — {lead}","priority":"urgent","due_offset_hours":48},
  {"outcome":"booking_requested","type":"service_followup","title":"Process booking — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'automotive';

-- restaurant
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"email","label":"Email","icon":"✉️"},{"key":"reservation_followup","label":"Reservation","icon":"🍽️"},
  {"key":"feedback_call","label":"Feedback Call","icon":"⭐"},{"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"booking_requested","type":"reservation_followup","title":"Confirm reservation — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'restaurant';

-- salon_spa
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"appointment_followup","label":"Appointment","icon":"💆"},{"key":"email","label":"Email","icon":"✉️"},
  {"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"booking_requested","type":"appointment_followup","title":"Confirm appointment — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'salon_spa';

-- fitness_gym
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"trial_session","label":"Trial Session","icon":"💪"},{"key":"email","label":"Email","icon":"✉️"},
  {"key":"membership_followup","label":"Membership","icon":"🎟️"},{"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"site_visit_requested","type":"trial_session","title":"Schedule trial — {lead}","priority":"urgent","due_offset_hours":48},
  {"outcome":"booking_requested","type":"membership_followup","title":"Process membership — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'fitness_gym';

-- insurance
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"email","label":"Email","icon":"✉️"},{"key":"policy_renewal","label":"Policy Renewal","icon":"📋"},
  {"key":"claim_followup","label":"Claim Follow-up","icon":"🛡️"},{"key":"meeting","label":"Meeting","icon":"📅"},
  {"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"site_visit_requested","type":"meeting","title":"Schedule meeting — {lead}","priority":"urgent","due_offset_hours":48},
  {"outcome":"booking_requested","type":"policy_renewal","title":"Process policy — {lead}","priority":"urgent","due_offset_hours":24}]}'::jsonb
WHERE industry = 'insurance';

-- custom (minimal editable starter set)
UPDATE public.agent_templates SET config = config || '{"task_types":[
  {"key":"call","label":"Call","icon":"📞"},{"key":"whatsapp","label":"WhatsApp","icon":"💬"},
  {"key":"email","label":"Email","icon":"✉️"},{"key":"meeting","label":"Meeting","icon":"📅"},
  {"key":"task","label":"Task","icon":"✅"},{"key":"other","label":"Other","icon":"📌"}],
 "auto_task_rules":[
  {"outcome":"callback_requested","type":"call","title":"Call back {lead}","priority":"high","due_offset_hours":24},
  {"outcome":"booking_requested","type":"task","title":"Action required — {lead}","priority":"high","due_offset_hours":24}]}'::jsonb
WHERE industry = 'custom';

-- Existing per-org configs inherit their industry's sets
UPDATE public.agent_configs c
SET task_types = t.config -> 'task_types',
    auto_task_rules = t.config -> 'auto_task_rules'
FROM public.agent_templates t
WHERE t.industry = c.industry
  AND (c.task_types = '[]'::jsonb OR c.auto_task_rules = '[]'::jsonb);



