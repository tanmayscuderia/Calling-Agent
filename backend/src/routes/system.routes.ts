/**
 * System monitoring routes.
 * - GET /api/system/llm-usage — current daily LLM call usage + budget
 * - GET /api/system/stats — LLM concurrency + queue stats
 * - GET /api/system/queue-health — job queue health + manual stale recovery
 * - POST /api/system/queue/recover — force-reclaim stale processing jobs
 * - GET /api/system/health-detailed — overall system health
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getLlmUsage } from '../ai/usageTracker';
import { getLlmStats } from '../ai/llmClient';
import { getQueueStats, recoverStaleJobs } from '../queue/staleRecovery';
import { logger } from '../utils/logger';

export default async function systemRoutes(app: FastifyInstance) {
  /**
   * GET /api/system/llm-usage
   * Returns today's LLM API call count, limit, and breakdown by source.
   */
  app.get('/api/system/llm-usage', async (req: FastifyRequest, reply: FastifyReply) => {
    const usage = getLlmUsage();
    const stats = getLlmStats();
    return {
      ...usage,
      concurrency: stats,
    };
  });

  /**
   * GET /api/system/queue-health
   * Returns job queue stats and allows manual stale recovery.
   * Query params: ?recover=true to trigger stale job recovery.
   */
  app.get('/api/system/queue-health', async (req: FastifyRequest, reply: FastifyReply) => {
    const { recover } = req.query as any;
    const stats = await getQueueStats();

    let recovered = 0;
    if (recover === 'true' || recover === '1') {
      recovered = await recoverStaleJobs();
      logger.info({ recovered, stats }, '[queue-health] Manual stale recovery triggered');
    }

    // Determine health status
    let status = 'healthy';
    const diagnoses: string[] = [];
    if (stats.processing > 5) {
      status = 'degraded';
      diagnoses.push(`${stats.processing} jobs in processing state — possible worker stall.`);
    }
    if (stats.failed > 0) {
      status = stats.failed > 10 ? 'critical' : 'degraded';
      diagnoses.push(`${stats.failed} failed jobs need attention.`);
    }
    if (stats.pending > 50) {
      status = 'degraded';
      diagnoses.push(`${stats.pending} pending jobs — queue backing up.`);
    }
    if (diagnoses.length === 0) {
      diagnoses.push('Queue is processing normally.');
    }

    return {
      status,
      ...stats,
      recovered,
      diagnoses,
      recoverEndpoint: 'GET /api/system/queue-health?recover=true',
    };
  });

  /**
   * POST /api/system/queue/recover
   * Force-reclaim stale processing jobs. Alias for the query-param version.
   */
  app.post('/api/system/queue/recover', async (req: FastifyRequest, reply: FastifyReply) => {
    const recovered = await recoverStaleJobs();
    const stats = await getQueueStats();
    logger.info({ recovered, stats }, '[queue-recover] Stale job recovery completed');
    return { ok: true, recovered, stats };
  });

  /**
   * GET /api/system/health-detailed
   * Returns overall system health including LLM budget status.
   */
  app.get('/api/system/health-detailed', async (req: FastifyRequest, reply: FastifyReply) => {
    const usage = getLlmUsage();
    const stats = getLlmStats();
    const budgetExhausted = usage.remaining === 0;
    return {
      status: budgetExhausted ? 'degraded' : 'healthy',
      llm: {
        provider: process.env.LLM_PROVIDER || 'deepseek',
        model: process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || 'unknown',
        budgetExhausted,
        ...usage,
        concurrency: stats,
      },
    };
  });
}