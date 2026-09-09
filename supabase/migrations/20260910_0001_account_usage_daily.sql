-- ============================================================================
-- 20260910_0001: Per-number (per whatsapp_account) daily usage counters
--
-- An org can connect MANY WhatsApp numbers (Baileys + Meta Cloud API rows
-- in whatsapp_accounts). Org-level limits bound the whole business; this
-- table bounds EACH NUMBER so one hot number can't eat the org's entire
-- budget — and per-number volume is also anti-ban armor (Meta quality
-- rating and WhatsApp's spam heuristics both watch per-number volume).
--
-- Optional per-number overrides live in whatsapp_accounts.config.limits
-- (JSONB — no schema needed):
--   { "limits": { "max_ai_replies_per_day": 200, "max_messages_per_day": 300 } }
-- Unset fields fall back to the org's limits.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT current_date,
  inbound_count integer NOT NULL DEFAULT 0,
  outbound_count integer NOT NULL DEFAULT 0,
  ai_replies integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_account_usage_daily_account
  ON public.account_usage_daily(account_id, usage_date);