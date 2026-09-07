/**
 * Agent Config Routes — CRUD API for industry-agnostic agent configuration.
 *
 * Endpoints:
 *   GET    /api/agent/config           — get org's current config
 *   PUT    /api/agent/config           — update org's config
 *   GET    /api/agent/templates        — list available industry templates
 *   GET    /api/agent/config/call-prompt — call persona text (paste into Sarvam dashboard)
 *   POST   /api/agent/apply-template   — apply a template to this org
 *   POST   /api/agent/clear-cache      — clear config cache (dev)
 */

import { FastifyInstance } from 'fastify';
import { getOrgIdFromRequest } from '../auth/authMiddleware';
import {
  getAgentConfig,
  listTemplates,
  applyTemplate,
  updateAgentConfig,
  invalidateConfigCache,
} from '../ai/agentConfigService';
import { buildCallSystemPrompt } from '../ai/promptEngine';
import { suggestOutputVariables } from '../sarvam/callResultService';
import { logger } from '../utils/logger';
import { agentConfigSaveSchema, applyTemplateSchema, parseBody } from '../validation/schemas';

function orgId(req: any): string {
  // Auth-aware: JWT orgId wins, query-param/default fallback preserved
  return getOrgIdFromRequest(req);
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
    const parsed = parseBody(agentConfigSaveSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const body = parsed.data;

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

  // ── Call persona export (paste into Sarvam voice-agent dashboard) ──
  app.get('/api/agent/config/call-prompt', async (req) => {
    const oid = orgId(req);
    const cfg = await getAgentConfig(oid);
    return {
      orgId: oid,
      industry: cfg.industry,
      prompt: buildCallSystemPrompt(cfg),
      // Optional enrichment variables (derived from this org's qualifying
      // fields — copy into the Sarvam dashboard if you want structured
      // extraction in addition to the DeepSeek post-call summary).
      output_variables: suggestOutputVariables(cfg.qualifying_fields ?? []),
    };
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
    const parsed = parseBody(applyTemplateSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const { templateId, businessName } = parsed.data;

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