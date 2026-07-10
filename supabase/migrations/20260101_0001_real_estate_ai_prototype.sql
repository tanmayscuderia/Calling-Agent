-- =====================================================================
-- Real Estate WhatsApp AI Prototype schema
-- Adds CRM, WhatsApp, AI-agent, and call-agent tables.
-- All tables org-scoped; uses CREATE TABLE IF NOT EXISTS; text CHECK.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Real estate projects (inventory)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.real_estate_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  developer_name text,
  location text,
  city text,
  sector text,
  address text,
  project_type text DEFAULT 'residential',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out', 'archived')),
  possession_date date,
  rera_number text,
  description text,
  amenities text[] DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES public.organization_members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_real_estate_projects_org_id
  ON public.real_estate_projects(org_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_projects_location
  ON public.real_estate_projects(org_id, city, sector);

-- ---------------------------------------------------------------------
-- Real estate units (inventory)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.real_estate_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.real_estate_projects(id) ON DELETE CASCADE,
  title text,
  configuration text,
  unit_type text DEFAULT 'apartment',
  tower text,
  floor text,
  carpet_area_sqft numeric,
  builtup_area_sqft numeric,
  super_area_sqft numeric,
  price_min numeric,
  price_max numeric,
  currency text NOT NULL DEFAULT 'INR',
  availability_status text NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'reserved', 'sold', 'inactive')),
  facing text,
  furnishing text,
  parking text,
  possession_status text,
  description text,
  media_urls text[] DEFAULT '{}',
  brochure_url text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_real_estate_units_org_id
  ON public.real_estate_units(org_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_units_project_id
  ON public.real_estate_units(project_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_units_search
  ON public.real_estate_units(org_id, configuration, availability_status, price_min, price_max);

-- ---------------------------------------------------------------------
-- Import batches (CSV/PDF uploads)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.real_estate_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'csv'
    CHECK (source_type IN ('csv', 'pdf', 'manual', 'website', 'api')),
  file_name text,
  storage_path text,
  status text NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  total_rows integer DEFAULT 0,
  success_rows integer DEFAULT 0,
  failed_rows integer DEFAULT 0,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}',
  uploaded_by uuid REFERENCES public.organization_members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_real_estate_import_batches_org_id
  ON public.real_estate_import_batches(org_id, created_at DESC);

-- ---------------------------------------------------------------------
-- CRM leads
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  whatsapp_number text,
  email text,
  source text NOT NULL DEFAULT 'whatsapp',
  source_detail text,
  lead_type text DEFAULT 'buyer'
    CHECK (lead_type IN ('buyer', 'seller', 'tenant', 'landlord', 'investor', 'unknown')),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'site_visit_scheduled', 'negotiation', 'won', 'lost', 'junk')),
  temperature text DEFAULT 'unknown'
    CHECK (temperature IN ('hot', 'warm', 'cold', 'unknown')),
  preferred_location text,
  preferred_city text,
  preferred_sector text,
  configuration text,
  budget_min numeric,
  budget_max numeric,
  possession_preference text,
  purpose text,
  timeline text,
  assigned_to uuid REFERENCES public.organization_members(id),
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  ai_summary text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_id
  ON public.crm_leads(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_phone
  ON public.crm_leads(org_id, phone);
CREATE INDEX IF NOT EXISTS idx_crm_leads_whatsapp
  ON public.crm_leads(org_id, whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status
  ON public.crm_leads(org_id, status, temperature);
CREATE INDEX IF NOT EXISTS idx_crm_leads_followup
  ON public.crm_leads(org_id, next_follow_up_at);

-- ---------------------------------------------------------------------
-- Lead -> property matches
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_lead_property_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.real_estate_projects(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.real_estate_units(id) ON DELETE SET NULL,
  match_score numeric,
  reason text,
  shown_to_customer boolean NOT NULL DEFAULT false,
  customer_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_lead_property_matches_lead
  ON public.crm_lead_property_matches(lead_id);

-- ---------------------------------------------------------------------
-- WhatsApp accounts (provider-agnostic)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  label text NOT NULL,
  phone_number text,
  provider text NOT NULL DEFAULT 'baileys'
    CHECK (provider IN ('baileys', 'meta_cloud_api', 'gupshup', 'wati', 'twilio', 'other')),
  status text NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('connected', 'disconnected', 'qr_pending', 'error', 'disabled')),
  session_ref text,
  last_connected_at timestamptz,
  last_error text,
  config jsonb NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_org_id
  ON public.whatsapp_accounts(org_id);

-- ---------------------------------------------------------------------
-- Customer conversations (channel-agnostic inbox)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp', 'telegram', 'web', 'phone', 'email')),
  whatsapp_account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
  external_chat_id text NOT NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending_human', 'closed', 'blocked')),
  ai_enabled boolean NOT NULL DEFAULT true,
  human_handoff boolean NOT NULL DEFAULT false,
  last_message_at timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, channel, external_chat_id)
);
CREATE INDEX IF NOT EXISTS idx_customer_conversations_org_id
  ON public.customer_conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_customer_conversations_lead_id
  ON public.customer_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_customer_conversations_last_message
  ON public.customer_conversations(org_id, last_message_at DESC);

-- ---------------------------------------------------------------------
-- Customer messages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.customer_conversations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  external_message_id text,
  sender_id text,
  sender_phone text,
  receiver_id text,
  message_type text NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'button', 'unknown')),
  body text,
  media_url text,
  media_mime_type text,
  ai_generated boolean NOT NULL DEFAULT false,
  ai_model text,
  ai_confidence numeric,
  raw_payload jsonb NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customer_messages_conversation
  ON public.customer_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_customer_messages_org_created
  ON public.customer_messages(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_messages_lead
  ON public.customer_messages(lead_id);

-- ---------------------------------------------------------------------
-- AI agent runs (observability for every AI decision)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.customer_conversations(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.customer_messages(id) ON DELETE SET NULL,
  agent_type text NOT NULL DEFAULT 'real_estate_whatsapp'
    CHECK (agent_type IN ('real_estate_whatsapp', 'calling_agent', 'lead_qualifier', 'knowledge_search', 'other')),
  model text,
  input_text text,
  output_text text,
  extracted_intent text,
  extracted_data jsonb NOT NULL DEFAULT '{}',
  tool_calls jsonb NOT NULL DEFAULT '[]',
  decision text,
  confidence numeric,
  latency_ms integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_org_id
  ON public.ai_agent_runs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_conversation
  ON public.ai_agent_runs(conversation_id);

-- ---------------------------------------------------------------------
-- Call sessions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.customer_conversations(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'browser_demo'
    CHECK (provider IN ('browser_demo', 'exotel', 'twilio', 'plivo', 'other')),
  external_call_id text,
  direction text NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('inbound', 'outbound')),
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'ringing', 'in_progress', 'completed', 'failed', 'missed', 'cancelled')),
  from_number text,
  to_number text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_sec integer,
  transcript text,
  summary text,
  outcome text,
  recording_url text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_call_sessions_org_id
  ON public.call_sessions(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_sessions_lead_id
  ON public.call_sessions(lead_id);

-- ---------------------------------------------------------------------
-- Call session turns
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.call_session_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  call_session_id uuid NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  speaker text NOT NULL CHECK (speaker IN ('agent', 'customer', 'system')),
  text text NOT NULL,
  audio_url text,
  sequence_index integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_call_session_turns_session
  ON public.call_session_turns(call_session_id, sequence_index ASC);

-- ---------------------------------------------------------------------
-- Lead follow-ups
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'call'
    CHECK (type IN ('call', 'whatsapp', 'site_visit', 'email', 'meeting', 'other')),
  title text,
  notes text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'missed', 'cancelled')),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_followups_org_scheduled
  ON public.lead_followups(org_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lead_followups_lead
  ON public.lead_followups(lead_id);

-- ---------------------------------------------------------------------
-- Knowledge document chunks (for future RAG; safe to add now)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_chunks_document
  ON public.knowledge_document_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_knowledge_document_chunks_org
  ON public.knowledge_document_chunks(org_id);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_real_estate_projects_updated_at ON public.real_estate_projects;
CREATE TRIGGER set_real_estate_projects_updated_at
  BEFORE UPDATE ON public.real_estate_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_real_estate_units_updated_at ON public.real_estate_units;
CREATE TRIGGER set_real_estate_units_updated_at
  BEFORE UPDATE ON public.real_estate_units
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_crm_leads_updated_at ON public.crm_leads;
CREATE TRIGGER set_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_customer_conversations_updated_at ON public.customer_conversations;
CREATE TRIGGER set_customer_conversations_updated_at
  BEFORE UPDATE ON public.customer_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_call_sessions_updated_at ON public.call_sessions;
CREATE TRIGGER set_call_sessions_updated_at
  BEFORE UPDATE ON public.call_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_lead_followups_updated_at ON public.lead_followups;
CREATE TRIGGER set_lead_followups_updated_at
  BEFORE UPDATE ON public.lead_followups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();