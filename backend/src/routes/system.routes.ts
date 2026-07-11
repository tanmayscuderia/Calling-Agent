/**
 * System monitoring routes.
 * - GET /api/system/llm-usage — current daily LLM call usage + budget
 * - GET /api/system/stats — LLM concurrency + queue stats
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getLlmUsage } from '../ai/usageTracker';
import { getLlmStats } from '../ai/llmClient';

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