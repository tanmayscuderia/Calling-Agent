-- ============================================================
-- Multi-Tenant Production Evolution Migration
-- Adds: org usage limits, token tracking, auth context cache,
--       multi-instance WhatsApp support, industry templates
-- ============================================================

-- 1) Add industry column to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS industry text NOT NULL DEFAULT 'real_estate'
    CHECK (industry IN ('real_estate', 'hrms', 'tech_services', 'healthcare', 'education', 'generic'));

-- 2) Add per-account session dir + ownership to whatsapp_accounts
ALTER TABLE public.whatsapp_accounts
  ADD COLUMN IF NOT EXISTS session_dir text,
  ADD COLUMN IF NOT EXISTS owned_by_member_id uuid REFERENCES public.organization_members(id) ON DELETE SET NULL;

-- 3) Token tracking on ai_agent_runs
ALTER TABLE public.ai_agent_runs
  ADD COLUMN IF NOT EXISTS tokens_in integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_out integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_usd numeric(10,6) DEFAULT 0;

-- 4) Org usage limits (per-org daily/hourly budgets)
CREATE TABLE IF NOT EXISTS public.org_usage_limits (
  org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  max_tokens_per_day bigint NOT NULL DEFAULT 500000,
  max_messages_per_hour integer NOT NULL DEFAULT 100,
  max_messages_per_day integer NOT NULL DEFAULT 500,
  max_calls_per_day integer NOT NULL DEFAULT 50,
  max_ai_replies_per_conversation integer NOT NULL DEFAULT 10,
  max_messages_per_phone_per_day integer NOT NULL DEFAULT 20,
  is_locked boolean NOT NULL DEFAULT false,
  locked_reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_usage_limits_org
ON public.org_usage_limits(org_id);

-- 5) Org daily usage tracking (rolling counters, upserted each interaction)
CREATE TABLE IF NOT EXISTS public.org_usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  tokens_in bigint NOT NULL DEFAULT 0,
  tokens_out bigint NOT NULL DEFAULT 0,
  cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  messages_sent integer NOT NULL DEFAULT 0,
  messages_received integer NOT NULL DEFAULT 0,
  calls_made integer NOT NULL DEFAULT 0,
  ai_runs integer NOT NULL DEFAULT 0,
  UNIQUE(org_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_org_usage_daily_org_date
ON public.org_usage_daily(org_id, usage_date DESC);

-- 6) Hourly message rate tracking (for max_messages_per_hour enforcement)
CREATE TABLE IF NOT EXISTS public.org_usage_hourly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  hour_bucket timestamptz NOT NULL,  -- truncated to the hour
  messages_sent integer NOT NULL DEFAULT 0,
  UNIQUE(org_id, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_org_usage_hourly_org
ON public.org_usage_hourly(org_id, hour_bucket DESC);

-- 7) Per-phone daily outbound counter (anti-ban protection)
CREATE TABLE IF NOT EXISTS public.phone_message_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone text NOT NULL,
  counter_date date NOT NULL DEFAULT CURRENT_DATE,
  outbound_count integer NOT NULL DEFAULT 0,
  UNIQUE(org_id, phone, counter_date)
);

CREATE INDEX IF NOT EXISTS idx_phone_message_counters
ON public.phone_message_counters(org_id, phone, counter_date);

-- 8) Conversation AI reply counter (prevent infinite AI loops)
ALTER TABLE public.customer_conversations
  ADD COLUMN IF NOT EXISTS ai_reply_count integer NOT NULL DEFAULT 0;

-- 9) Job queue for ordered message processing (prototype: DB-backed)
CREATE TABLE IF NOT EXISTS public.job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK (job_type IN ('process_message', 'send_reply', 'make_call', 'import_csv', 'generate_summary')),
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  error text,
  result jsonb,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_pending
ON public.job_queue(org_id, status, priority DESC, scheduled_at ASC);
CREATE INDEX IF NOT EXISTS idx_job_queue_status
ON public.job_queue(status, scheduled_at ASC);

-- 10) Auth context cache table (member + org resolved from JWT, cached for speed)
CREATE TABLE IF NOT EXISTS public.auth_context_cache (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.organization_members(id) ON DELETE CASCADE,
  role text,
  full_name text,
  avatar_url text,
  permissions jsonb NOT NULL DEFAULT '{}',
  cached_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_auth_context_cache_user
ON public.auth_context_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_context_cache_expires
ON public.auth_context_cache(expires_at);

-- 11) Seed default usage limits for all existing orgs
INSERT INTO public.org_usage_limits (org_id)
SELECT id FROM public.organizations
WHERE id NOT IN (SELECT org_id FROM public.org_usage_limits)
ON CONFLICT DO NOTHING;

-- 12) Updated_at triggers for new tables
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_org_usage_limits_updated_at ON public.org_usage_limits;
CREATE TRIGGER set_org_usage_limits_updated_at
BEFORE UPDATE ON public.org_usage_limits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 13) Atomic increment RPCs (prevents race conditions on counters)
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_usage(
  p_org_id uuid,
  p_date date,
  p_tokens_in integer DEFAULT 0,
  p_tokens_out integer DEFAULT 0,
  p_cost numeric DEFAULT 0,
  p_messages_sent integer DEFAULT 0,
  p_messages_received integer DEFAULT 0,
  p_calls integer DEFAULT 0,
  p_ai_runs integer DEFAULT 0
) RETURNS void AS $$
BEGIN
  INSERT INTO public.org_usage_daily (
    org_id, usage_date, tokens_in, tokens_out, cost_usd,
    messages_sent, messages_received, calls_made, ai_runs
  ) VALUES (
    p_org_id, p_date, p_tokens_in, p_tokens_out, p_cost,
    p_messages_sent, p_messages_received, p_calls, p_ai_runs
  )
  ON CONFLICT (org_id, usage_date) DO UPDATE SET
    tokens_in = org_usage_daily.tokens_in + EXCLUDED.tokens_in,
    tokens_out = org_usage_daily.tokens_out + EXCLUDED.tokens_out,
    cost_usd = org_usage_daily.cost_usd + EXCLUDED.cost_usd,
    messages_sent = org_usage_daily.messages_sent + EXCLUDED.messages_sent,
    messages_received = org_usage_daily.messages_received + EXCLUDED.messages_received,
    calls_made = org_usage_daily.calls_made + EXCLUDED.calls_made,
    ai_runs = org_usage_daily.ai_runs + EXCLUDED.ai_runs;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_hourly_messages(
  p_org_id uuid,
  p_hour_bucket timestamptz,
  p_count integer DEFAULT 1
) RETURNS void AS $$
BEGIN
  INSERT INTO public.org_usage_hourly (org_id, hour_bucket, messages_sent)
  VALUES (p_org_id, p_hour_bucket, p_count)
  ON CONFLICT (org_id, hour_bucket) DO UPDATE SET
    messages_sent = org_usage_hourly.messages_sent + EXCLUDED.messages_sent;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_phone_counter(
  p_org_id uuid,
  p_phone text,
  p_counter_date date,
  p_count integer DEFAULT 1
) RETURNS void AS $$
BEGIN
  INSERT INTO public.phone_message_counters (org_id, phone, counter_date, outbound_count)
  VALUES (p_org_id, p_phone, p_counter_date, p_count)
  ON CONFLICT (org_id, phone, counter_date) DO UPDATE SET
    outbound_count = phone_message_counters.outbound_count + EXCLUDED.outbound_count;
END;
$$ LANGUAGE plpgsql;