import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';

// ============================================================
// Stale Job Recovery
// On server boot, reclaim jobs stuck in 'processing' state
// from a previous crash or unclean shutdown.
// ============================================================

let rpcWarningLogged = false;

/**
 * Find jobs in 'processing' state past their lock expiry
 * and reset them to 'pending' so the worker can pick them up.
 *
 * Uses the `reclaim_stale_jobs()` RPC for atomicity when available.
 * Falls back to manual SQL update if the RPC doesn't exist.
 */
export async function recoverStaleJobs(): Promise<number> {
  // Try RPC first
  const { data, error } = await supabaseAdmin().rpc('reclaim_stale_jobs');

  if (error) {
    // PGRST202 = function not found — use manual fallback
    if (error.code === 'PGRST202' || (error.message && error.message.includes('reclaim_stale_jobs'))) {
      return await recoverStaleJobsManual();
    }
    logger.error({ err: error }, '[StaleRecovery] Failed to recover stale jobs');
    return 0;
  }

  const recovered = (data as number) ?? 0;
  if (recovered > 0) {
    logger.info({ count: recovered }, `[StaleRecovery] Recovered ${recovered} stale job(s) from previous crash`);
  }
  return recovered;
}

/**
 * Manual stale recovery — no RPC needed.
 * Resets 'processing' jobs that have been stuck longer than 90 seconds.
 */
async function recoverStaleJobsManual(): Promise<number> {
  if (!rpcWarningLogged) {
    rpcWarningLogged = true;
    logger.warn(
      '[StaleRecovery] RPC function not found. Using manual recovery. ' +
      'Apply migration 20260102_0002_queue_hardening.sql for production mode.'
    );
  }

  const staleThreshold = new Date(Date.now() - 90 * 1000).toISOString();

  const { data, error } = await supabaseAdmin()
    .from('job_queue')
    .update({
      status: 'pending',
      next_retry_at: new Date().toISOString(),
    })
    .eq('status', 'processing')
    .lt('started_at', staleThreshold)
    .select('id');

  if (error) {
    // Silently fail if table doesn't exist — non-fatal
    return 0;
  }

  const recovered = data?.length ?? 0;
  if (recovered > 0) {
    logger.info({ count: recovered }, `[StaleRecovery] Recovered ${recovered} stale job(s) [manual mode]`);
  }
  return recovered;
}

/**
 * Get queue stats for the monitoring endpoint.
 * Uses the `queue_stats()` RPC when available, falls back to manual counts.
 */
export async function getQueueStats() {
  // Try the RPC first (faster, single round-trip)
  const { data: rpcData, error } = await supabaseAdmin().rpc('queue_stats');

  if (!error && rpcData && rpcData.length > 0) {
    const s = rpcData[0];
    return {
      pending: Number(s.pending) ?? 0,
      processing: Number(s.processing) ?? 0,
      completed: Number(s.completed_today) ?? 0,
      failed: Number(s.failed) ?? 0,
      oldestPendingAgeSec: Number(s.oldest_pending_age_sec) ?? 0,
    };
  }

  // Fallback: manual counts
  const sb = supabaseAdmin();
  const [pending, processing, completed, failed] = await Promise.all([
    sb.from('job_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('job_queue').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
    sb.from('job_queue').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    sb.from('job_queue').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
  ]);

  return {
    pending: pending.count ?? 0,
    processing: processing.count ?? 0,
    completed: completed.count ?? 0,
    failed: failed.count ?? 0,
  };
}