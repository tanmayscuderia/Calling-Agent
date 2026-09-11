import { FastifyInstance } from 'fastify';
import { getUsageSummary } from '../crm/usageService';

/**
 * GET /api/usage/summary?days=7
 *
 * Usage + cost dashboard feed: org daily rollup, per-number usage and
 * limits, Sarvam minutes/cost, top conversations by AI replies.
 * `days` = lookback window (default 7, max 90).
 */
export async function usageRoutes(app: FastifyInstance) {
  app.get('/api/usage/summary', async (req) => {
    const orgId = (req as any).getOrgId?.();
    const q = req.query as Record<string, any>;
    const days = Math.min(90, Math.max(1, Number(q.days ?? 7) || 7));
    const summary = await getUsageSummary(orgId, days);
    return { ok: true, ...summary };
  });
}