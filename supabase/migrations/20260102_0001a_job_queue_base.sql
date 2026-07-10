-- ============================================================
-- Job Queue Base Table
-- Durable background job processing for the WhatsApp AI pipeline.
-- Jobs: process_message, send_reply, generate_summary
-- ============================================================

CREATE TABLE IF NOT EXISTS public.job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority integer NOT NULL DEFAULT 5,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status_scheduled
  ON public.job_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_org
  ON public.job_queue(org_id, created_at DESC);

-- updated_at trigger
DROP TRIGGER IF EXISTS set_job_queue_updated_at ON public.job_queue;
CREATE TRIGGER set_job_queue_updated_at
  BEFORE UPDATE ON public.job_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();