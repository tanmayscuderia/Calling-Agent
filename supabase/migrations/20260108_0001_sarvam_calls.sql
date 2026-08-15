-- =====================================================================
-- Migration 13: Sarvam Voice Calling Agent support
-- Plan: docs/SARVAM_CALLING_PLAN.md (Phase S1)
--
-- 1. Allow 'sarvam' as a call provider
-- 2. Correlation + idempotency columns/indexes on call_sessions
-- 3. Raw webhook audit table
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Relax provider CHECK to include 'sarvam'
--    (DROP + ADD: existing rows satisfy the new superset constraint)
-- ---------------------------------------------------------------------
ALTER TABLE public.call_sessions DROP CONSTRAINT IF EXISTS call_sessions_provider_check;
ALTER TABLE public.call_sessions ADD CONSTRAINT call_sessions_provider_check
  CHECK (provider IN ('browser_demo', 'sarvam', 'exotel', 'twilio', 'plivo', 'other'));

-- ---------------------------------------------------------------------
-- 2. Sarvam correlation columns
--    interaction_id: Sarvam's interaction id (analytics API lookups:
--                    transcripts / recordings fetch after the call)
--    provider_account_id: which rented number/connection placed the call
-- ---------------------------------------------------------------------
ALTER TABLE public.call_sessions ADD COLUMN IF NOT EXISTS interaction_id text;
ALTER TABLE public.call_sessions ADD COLUMN IF NOT EXISTS provider_account_id text;

-- Webhook idempotency anchor: one call_session per (org, attempt_id).
-- Sarvam retries webhook deliveries on non-200; this unique partial
-- index lets us safely detect + skip duplicate processing.
CREATE UNIQUE INDEX IF NOT EXISTS idx_call_sessions_org_external_call
  ON public.call_sessions(org_id, external_call_id)
  WHERE external_call_id IS NOT NULL;

-- Fast lookups by Sarvam interaction_id (analytics / recording fetch)
CREATE INDEX IF NOT EXISTS idx_call_sessions_interaction
  ON public.call_sessions(org_id, interaction_id);

-- ---------------------------------------------------------------------
-- 3. Raw webhook audit log
--    Every webhook delivery is stored verbatim BEFORE processing.
--    processed_at set by the queue worker on success;
--    processing_error records why a retry happened.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sarvam_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  attempt_id text,
  interaction_id text,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text
);

CREATE INDEX IF NOT EXISTS idx_sarvam_webhook_events_org
  ON public.sarvam_webhook_events(org_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sarvam_webhook_events_attempt
  ON public.sarvam_webhook_events(attempt_id);

COMMENT ON TABLE public.sarvam_webhook_events IS
  'Raw audit of every Sarvam call webhook: received → processed (or error). Single source of truth for debugging call result processing.';