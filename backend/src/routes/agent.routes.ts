/**
 * Agent Config Routes — CRUD API for industry-agnostic agent configuration.
 *
 * Endpoints:
 *   GET    /api/agent/config           — get org's current config
 *   PUT    /api/agent/config           — update org's config
 *   GET    /api/agent/templates        — list available industry templates
 *   POST   /api/agent/apply-template   — apply a template to this org
 *   POST   /api/agent/clear-cache      — clear config cache (dev)
 */

import { FastifyInstance } from 'fastify';
import { config } from '../config';
import {
  getAgentConfig,
  listTemplates,
  applyTemplate,
  updateAgentConfig,
  invalidateConfigCache,
} from '../ai/agentConfigService';
import { logger } from '../utils/logger';

function orgId(req: any): string {
  return (req.query as any).orgId || config.defaultOrgId;
}

export async function agentRoutes(app: FastifyInstance) {
  // ── Get current config ──
  app.get('/api/agent/config', async (req) => {
    const oid = orgId(req);
    const cfg = await getAgentConfig(oid);
    return { config: cfg };
  });

  // ── Update config ──
  app.put('/api/agent/config', async (req, reply) => {
    const oid = orgId(req);
    const body = req.body as any;
    if (!body || typeof body !== 'object') {
      return reply.code(400).send({ error: 'Body must be a JSON object' });
    }

    // If configId provided, use updateAgentConfig; otherwise load current and update it
    const current = await getAgentConfig(oid);
    if (!current.id || current.id === 'fallback' || current.id.startsWith('template-')) {
      // No DB config yet — apply the current industry template first, then update
      const applied = await applyTemplate(oid, current.industry, body.business_name);
      if (Object.keys(body).length > 0) {
        const updated = await updateAgentConfig(oid, applied.id, body);
        return { config: updated };
      }
      return { config: applied };
    }

    const updated = await updateAgentConfig(oid, current.id, body);
    logger.info({ orgId: oid, fields: Object.keys(body) }, '[Agent] Config updated');
    return { config: updated };
  });

  // ── List templates ──
  app.get('/api/agent/templates', async () => {
    const templates = await listTemplates();
    return {
      templates: templates.map((t: any) => ({
        template_id: t.industry,
        name: t.label ?? t.name,
        industry: t.industry,
        description: t.description ?? '',
        icon: t.icon ?? t.config?.icon ?? '🏢',
        inventory_table: t.config?.inventory_table ?? null,
        inventory_enabled: !!t.config?.inventory_table,
      })),
    };
  });

  // ── Apply template ──
  app.post('/api/agent/apply-template', async (req, reply) => {
    const oid = orgId(req);
    const { templateId, businessName } = req.body as any;
    if (!templateId) return reply.code(400).send({ error: 'templateId required' });

    try {
      const cfg = await applyTemplate(oid, templateId, businessName);
      return { config: cfg, applied: templateId };
    } catch (e: any) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // ── Clear cache (dev) ──
  app.post('/api/agent/clear-cache', async (req) => {
    const oid = orgId(req);
    invalidateConfigCache(oid);
    return { ok: true };
  });
}