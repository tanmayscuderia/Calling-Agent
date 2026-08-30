/**
 * Standalone queue-worker process.
 *
 * Splits the job poller out of the API server (2026-08-30):
 *   - API (`src/server.ts`) no longer needs to restart WhatsApp connections
 *     or drop in-flight HTTP requests just to pick up new job code.
 *   - Worker can be scaled/restarted independently; both share the same
 *     `job_queue` table (SKIP LOCKED makes concurrent workers safe).
 *
 * Run: npm run worker (dev, watch) / npm run start:worker (built)
 * Docker compose runs this as its own service.
 * The API keeps in-process worker behavior unless WORKER_IN_PROCESS=false.
 */
import { config } from './config';
import { logger } from './utils/logger';
import { startQueueWorker, stopQueueWorker } from './queue/queueWorker';
import { recoverStaleJobs } from './queue/staleRecovery';

async function start() {
  logger.info('[Worker] Starting queue worker process');

  // Recover jobs a crashed worker left in 'processing' (non-fatal on boot)
  await recoverStaleJobs().catch((err: unknown) => {
    logger.error({ err }, '[Worker] Stale job recovery failed (non-fatal)');
  });

  startQueueWorker();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, '[Worker] Shutting down gracefully...');
    try {
      stopQueueWorker();
      logger.info('[Worker] Closed');
    } catch (err) {
      logger.error({ err }, '[Worker] Error during shutdown');
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();