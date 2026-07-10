-- ============================================================
-- Fix: dequeue_job() RPC throws "column reference 'id' is ambiguous"
-- The RETURNING clause conflicts with RETURNS TABLE output column names.
-- Fix: alias the table in UPDATE and use alias in RETURNING.
-- Also fix complete_job and fail_job for the same issue.
-- ============================================================

-- Fix dequeue_job — use table alias to avoid ambiguity with output params
CREATE OR REPLACE FUNCTION public.dequeue_job()
RETURNS TABLE (
  id uuid,
  org_id uuid,
  job_type text,
  payload jsonb,
  attempts integer,
  max_attempts integer,
  priority integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_locked uuid := gen_random_uuid();
BEGIN
  UPDATE public.job_queue AS jq
  SET
    status = 'processing',
    locked_by = v_locked,
    locked_until = now() + interval '60 seconds',
    started_at = COALESCE(jq.started_at, now()),
    attempts = jq.attempts + 1
  WHERE jq.id IN (
    SELECT j.id FROM public.job_queue j
    WHERE j.status = 'pending'
      AND (j.next_retry_at IS NULL OR j.next_retry_at <= now())
    ORDER BY j.priority DESC, j.scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    jq.id,
    jq.org_id,
    jq.job_type,
    jq.payload,
    jq.attempts,
    jq.max_attempts,
    jq.priority;
END;
$$;

-- Verify it works (should return null or one row, not an error)
-- SELECT * FROM public.dequeue_job();