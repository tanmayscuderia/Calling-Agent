-- ============================================================
-- Phase B: Production Queue Hardening
-- Adds: row-level locking, stale recovery, atomic dequeue RPC
-- ============================================================

-- 1) Add locking columns to job_queue for safe concurrent dequeue
ALTER TABLE public.job_queue
  ADD COLUMN IF NOT EXISTS locked_by uuid,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;

-- 2) Partial index for the dequeue query (only pending rows)
CREATE INDEX IF NOT EXISTS idx_job_queue_dequeue
ON public.job_queue(status, next_retry_at)
WHERE status = 'pending';

-- 3) Backfill next_retry_at for existing pending jobs
UPDATE public.job_queue
SET next_retry_at = scheduled_at
WHERE next_retry_at IS NULL AND status = 'pending';

-- ============================================================
-- 4) Atomic dequeue function (race-safe via FOR UPDATE SKIP LOCKED)
-- ============================================================

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
  UPDATE public.job_queue
  SET
    status = 'processing',
    locked_by = v_locked,
    locked_until = now() + interval '60 seconds',
    started_at = COALESCE(started_at, now()),
    attempts = attempts + 1
  WHERE id IN (
    SELECT j.id FROM public.job_queue j
    WHERE j.status = 'pending'
      AND (j.next_retry_at IS NULL OR j.next_retry_at <= now())
    ORDER BY j.priority DESC, j.scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING job_queue.id, job_queue.org_id, job_queue.job_type,
            job_queue.payload, job_queue.attempts, job_queue.max_attempts,
            job_queue.priority;
END;
$$;

-- ============================================================
-- 5) Complete job function
-- ============================================================

CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id uuid,
  p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.job_queue
  SET
    status = 'completed',
    result = p_result,
    completed_at = now(),
    locked_by = NULL,
    locked_until = NULL
  WHERE id = p_job_id AND status = 'processing';
END;
$$;

-- ============================================================
-- 6) Fail job function (retries with backoff or marks failed)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fail_job(
  p_job_id uuid,
  p_error text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job record;
  v_next_retry timestamptz;
BEGIN
  SELECT attempts, max_attempts INTO v_job
  FROM public.job_queue WHERE id = p_job_id;

  IF v_job.attempts >= v_job.max_attempts THEN
    UPDATE public.job_queue
    SET
      status = 'failed',
      error = p_error,
      locked_by = NULL,
      locked_until = NULL,
      completed_at = now()
    WHERE id = p_job_id;
  ELSE
    v_next_retry := now() + (interval '1 second' * power(2, v_job.attempts));
    UPDATE public.job_queue
    SET
      status = 'pending',
      error = p_error,
      locked_by = NULL,
      locked_until = NULL,
      started_at = NULL,
      next_retry_at = v_next_retry
    WHERE id = p_job_id;
  END IF;
END;
$$;

-- ============================================================
-- 7) Reclaim stale jobs (worker crashed mid-processing)
-- ============================================================

CREATE OR REPLACE FUNCTION public.reclaim_stale_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.job_queue
  SET
    status = 'pending',
    locked_by = NULL,
    locked_until = NULL,
    next_retry_at = now() + interval '5 seconds'
  WHERE status = 'processing'
    AND locked_until < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- 8) Queue stats function (for monitoring endpoint)
-- ============================================================

CREATE OR REPLACE FUNCTION public.queue_stats()
RETURNS TABLE (
  pending bigint,
  processing bigint,
  failed bigint,
  completed_today bigint,
  oldest_pending_age_sec numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending')::bigint AS pending,
    COUNT(*) FILTER (WHERE status = 'processing')::bigint AS processing,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint AS failed,
    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= date_trunc('day', now()))::bigint AS completed_today,
    COALESCE(
      MAX(EXTRACT(EPOCH FROM (now() - scheduled_at)))
        FILTER (WHERE status = 'pending'),
      0
    )::numeric AS oldest_pending_age_sec
  FROM public.job_queue;
END;
$$;