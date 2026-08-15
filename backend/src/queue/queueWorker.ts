import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import { processMessageJob, processSendReplyJob, processSendLocationJob, processSummaryJob } from './jobHandler';
import { processCallResultJob } from '../sarvam/callResultService';

// ============================================================
// Production Queue Worker
// Polls job_queue every 2s, processes up to 5 jobs concurrently.
// Uses RPC functions when available (migration 20260102_0002),
// falls back to manual SQL queries if RPCs not yet applied.
// ============================================================

const POLL_INTERVAL_MS = 2000;
const FALLBACK_POLL_INTERVAL_MS = 10000; // slower poll when in fallback mode
const MAX_CONCURRENT_JOBS = 5;

interface QueueJob {
  id: string;
  org_id: string;
  job_type: string;
  payload: any;
  attempts: number;
  max_attempts: number;
  priority: number;
}

let running = false;
let activeJobs = 0;
let pollTimer: NodeJS.Timeout | null = null;
let rpcAvailable = true; // will be set to false if RPCs are missing
let rpcWarningLogged = false;

/** Start the queue worker (idempotent — safe to call multiple times) */
export function startQueueWorker(): void {
  if (running) return;
  running = true;
  logger.info('[Queue] Worker started');
  poll();
}

/** Stop the queue worker */
export function stopQueueWorker(): void {
  running = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  logger.info('[Queue] Worker stopped');
}

/** Get worker stats (for monitoring endpoint) */
export function getWorkerStats() {
  return {
    running,
    activeJobs,
    maxConcurrent: MAX_CONCURRENT_JOBS,
    mode: rpcAvailable ? 'rpc' : 'fallback',
  };
}

/** Main poll loop */
async function poll(): Promise<void> {
  while (running) {
    try {
      // Only dequeue if we have capacity
      while (activeJobs < MAX_CONCURRENT_JOBS) {
        const job = await dequeue();
        if (!job) break;

        activeJobs++;
        // Fire and forget — don't block the poll loop
        processJob(job).finally(() => { activeJobs--; });
      }
    } catch (err) {
      logger.error({ err }, '[Queue] Poll error');
    }

    // Wait before next poll — slower when in fallback mode
    await sleep(rpcAvailable ? POLL_INTERVAL_MS : FALLBACK_POLL_INTERVAL_MS);
  }
}

/** Dequeue one job atomically (RPC with manual fallback) */
async function dequeue(): Promise<QueueJob | null> {
  if (rpcAvailable) {
    const { data, error } = await supabaseAdmin().rpc('dequeue_job');

    if (error) {
      // ANY RPC error (function missing, SQL ambiguity, schema cache) → switch to fallback.
      // Previously only PGRST202 triggered fallback; SQL errors like 42702 (ambiguous
      // column) would silently return null forever, stalling the entire queue.
      switchToFallback('dequeue_job');
      logger.warn({ errCode: error.code, errMsg: error.message }, '[Queue] Dequeue RPC error — falling back to manual mode');
      return await dequeueManual();
    }

    // RPC returns array (RETURNS TABLE)
    if (!data || data.length === 0) return null;
    return data[0] as QueueJob;
  }

  // Fallback path — manual dequeue without RPC
  return await dequeueManual();
}

/**
 * Manual dequeue using standard SQL queries.
 * Less safe for concurrent workers (no SKIP LOCKED), but works
 * fine for a single-worker prototype without the hardening migration.
 */
async function dequeueManual(): Promise<QueueJob | null> {
  const sb = supabaseAdmin();

  // Step 1: Find the oldest pending job
  const { data: jobs, error: findErr } = await sb
    .from('job_queue')
    .select('id, org_id, job_type, payload, attempts, max_attempts, priority, scheduled_at')
    .eq('status', 'pending')
    .or('next_retry_at.is.null,next_retry_at.lte.' + new Date().toISOString())
    .order('priority', { ascending: false })
    .order('scheduled_at', { ascending: true })
    .limit(1);

  if (findErr) {
    // If table doesn't exist, switch to fallback and suppress
    if (findErr.code === 'PGRST205' || (findErr.message && findErr.message.includes('job_queue'))) {
      if (!rpcWarningLogged) {
        logger.warn('[Queue] job_queue table not found. Queue worker running in standby mode. Apply migrations to enable.');
        rpcWarningLogged = true;
      }
      return null;
    }
    logger.error({ err: findErr }, '[Queue] Dequeue manual query error');
    return null;
  }

  if (!jobs || jobs.length === 0) return null;

  const job = jobs[0];

  // Step 2: Atomically claim it (optimistic lock on status)
  const { data: claimed, error: claimErr } = await sb
    .from('job_queue')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      attempts: (job.attempts ?? 0) + 1,
    })
    .eq('id', job.id)
    .eq('status', 'pending')
    .select();

  if (claimErr || !claimed || claimed.length === 0) {
    // Someone else got it (or it changed) — skip
    return null;
  }

  return {
    id: job.id,
    org_id: job.org_id,
    job_type: job.job_type,
    payload: job.payload,
    attempts: (job.attempts ?? 0) + 1,
    max_attempts: job.max_attempts ?? 3,
    priority: job.priority ?? 5,
  } as QueueJob;
}

/** Process a single job with error handling */
async function processJob(job: QueueJob): Promise<void> {
  const startedAt = Date.now();
  logger.info({ jobId: job.id, type: job.job_type, attempt: job.attempts }, '[Queue] Processing job');

  try {
    let result: any = {};

    switch (job.job_type) {
      case 'process_message':
        await processMessageJob(job.org_id, job.payload);
        break;
      case 'send_reply':
        await processSendReplyJob(job.org_id, job.payload);
        break;
      case 'send_location':
        await processSendLocationJob(job.org_id, job.payload);
        break;
      case 'generate_summary':
        await processSummaryJob(job.org_id, job.payload);
        break;
      case 'process_call_result':
        await processCallResultJob(job.org_id, job.payload);
        break;
      default:
        logger.warn({ jobType: job.job_type }, '[Queue] Unknown job type, marking complete');
    }

    await completeJob(job.id, result);
    logger.info({ jobId: job.id, type: job.job_type, ms: Date.now() - startedAt }, '[Queue] Job completed');
  } catch (err: any) {
    logger.error({ jobId: job.id, type: job.job_type, err: err.message }, '[Queue] Job failed');
    await failJob(job.id, err.message || String(err));
  }
}

/** Mark job as completed (RPC with manual fallback) */
async function completeJob(jobId: string, result: any): Promise<void> {
  if (rpcAvailable) {
    const { error } = await supabaseAdmin().rpc('complete_job', {
      p_job_id: jobId,
      p_result: result,
    });
    if (error) {
      // Any RPC error → switch to fallback (don't lose the job completion)
      switchToFallback('complete_job');
      logger.warn({ errCode: error.code, jobId }, '[Queue] complete_job RPC error — falling back to manual');
    } else {
      return; // success
    }
  }

  // Fallback — manual update
  const { error } = await supabaseAdmin()
    .from('job_queue')
    .update({
      status: 'completed',
      result: result,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'processing');

  if (error) logger.error({ err: error, jobId }, '[Queue] Failed to mark job complete (manual)');
}

/** Mark job as failed (will retry if attempts < max_attempts) */
async function failJob(jobId: string, errorMessage: string): Promise<void> {
  const truncatedError = errorMessage.substring(0, 2000);

  if (rpcAvailable) {
    const { error } = await supabaseAdmin().rpc('fail_job', {
      p_job_id: jobId,
      p_error: truncatedError,
    });
    if (error) {
      // Any RPC error → switch to fallback (don't lose retry logic)
      switchToFallback('fail_job');
      logger.warn({ errCode: error.code, jobId }, '[Queue] fail_job RPC error — falling back to manual');
    } else {
      return; // success
    }
  }

  // Fallback — manual retry logic with backoff
  const sb = supabaseAdmin();
  const { data: job } = await sb
    .from('job_queue')
    .select('attempts, max_attempts')
    .eq('id', jobId)
    .single();

  if (!job) return;

  if ((job.attempts ?? 0) >= (job.max_attempts ?? 3)) {
    // Max attempts reached — mark failed
    await sb
      .from('job_queue')
      .update({ status: 'failed', error: truncatedError, completed_at: new Date().toISOString() })
      .eq('id', jobId);
  } else {
    // Retry with exponential backoff
    const delaySec = Math.pow(2, job.attempts ?? 1);
    const retryAt = new Date(Date.now() + delaySec * 1000).toISOString();
    await sb
      .from('job_queue')
      .update({
        status: 'pending',
        error: truncatedError,
        next_retry_at: retryAt,
      })
      .eq('id', jobId);
  }
}

/** Switch to fallback mode (log once, slow down polling) */
function switchToFallback(funcName: string): void {
  if (!rpcWarningLogged) {
    rpcWarningLogged = true;
    rpcAvailable = false;
    logger.warn(
      `[Queue] RPC function '${funcName}' failed or not found in database. ` +
      `Switching to fallback mode (manual SQL queries). ` +
      `To fix RPC mode, apply migration: 20260105_0001_fix_dequeue_rpc_ambiguous.sql`
    );
  }
}

/** Sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}