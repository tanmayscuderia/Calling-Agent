-- =====================================================================
-- Migration 14: Sarvam calling — schema alignment fixes
-- Plan: docs/SARVAM_CALLING_PLAN.md
--
-- Root cause: live DB constraints predate Sarvam integration and 20260108
-- may not have fully applied. This migration is fully idempotent (safe to
-- re-run) and guarantees every constraint/column the Sarvam code relies on:
--
--   1. Re-assert 20260108 (provider CHECK, columns, index, webhook table)
--   2. job_queue.job_type CHECK += 'process_call_result' (webhook enqueues it)
--      + 'send_location' (already used by location feature — latent bug)
--   3. call_sessions.status CHECK += 'no_answer', 'busy' (Sarvam statuses)
--   4. call_sessions += failure_reason, lead_temperature (result processing)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Re-assert migration 20260108 (all statements idempotent)
-- ---------------------------------------------------------------------
ALTER TABLE public.call_sessions DROP CONSTRAINT IF EXISTS call_sessions_provider_check;
ALTER TABLE public.call_sessions ADD CONSTRAINT call_sessions_provider_check
  CHECK (provider IN ('browser_demo', 'sarvam', 'exotel', 'twilio', 'plivo', 'other'));

ALTER TABLE public.call_sessions ADD COLUMN IF NOT EXISTS interaction_id text;
ALTER TABLE public.call_sessions ADD COLUMN IF NOT EXISTS provider_account_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_call_sessions_org_external_call
  ON public.call_sessions(org_id, external_call_id)
  WHERE external_call_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_call_sessions_interaction
  ON public.call_sessions(org_id, interaction_id);

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

-- ---------------------------------------------------------------------
-- 2. job_queue.job_type CHECK — add 'process_call_result' (Sarvam webhook)
--    and 'send_location' (used by location reply flow; was missing).
-- ---------------------------------------------------------------------
ALTER TABLE public.job_queue DROP CONSTRAINT IF EXISTS job_queue_job_type_check;
ALTER TABLE public.job_queue ADD CONSTRAINT job_queue_job_type_check
  CHECK (job_type IN (
    'process_message', 'send_reply', 'send_location', 'make_call',
    'import_csv', 'generate_summary', 'process_call_result'
  ));

-- ---------------------------------------------------------------------
-- 3. call_sessions.status CHECK — add 'no_answer' and 'busy'
--    (Sarvam webhook terminal statuses mapped by callResultService)
-- ---------------------------------------------------------------------
ALTER TABLE public.call_sessions DROP CONSTRAINT IF EXISTS call_sessions_status_check;
ALTER TABLE public.call_sessions ADD CONSTRAINT call_sessions_status_check
  CHECK (status IN (
    'created', 'ringing', 'in_progress', 'no_answer', 'busy',
    'completed', 'failed', 'missed', 'cancelled'
  ));

-- ---------------------------------------------------------------------
-- 4. call_sessions — result-processing columns
--    failure_reason: Sarvam failure_reason for failed/no-answer calls
--    lead_temperature: LLM-assigned temperature snapshot at call end
-- ---------------------------------------------------------------------
ALTER TABLE public.call_sessions ADD COLUMN IF NOT EXISTS failure_reason text;
ALTER TABLE public.call_sessions ADD COLUMN IF NOT EXISTS lead_temperature text;

-- Verification (run manually to confirm):
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conname IN ('job_queue_job_type_check', 'call_sessions_status_check',
--                      'call_sessions_provider_check');
--   \d public.sarvam_webhook_events