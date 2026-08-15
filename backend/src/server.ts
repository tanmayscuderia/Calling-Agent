import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { config } from './config';
import { logger } from './utils/logger';
import { authMiddleware } from './auth/authMiddleware';
import { waManager } from './whatsapp/connectionManager';
import { startQueueWorker, stopQueueWorker } from './queue/queueWorker';
import { recoverStaleJobs } from './queue/staleRecovery';

import { healthRoutes } from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import { inventoryRoutes } from './routes/inventory.routes';
import { uploadRoutes } from './routes/upload.routes';
import { leadsRoutes } from './routes/leads.routes';
import { conversationsRoutes } from './routes/conversations.routes';
import { whatsappRoutes } from './routes/whatsapp.routes';
import { callsRoutes } from './routes/calls.routes';
import { sarvamWebhookRoutes } from './routes/sarvamWebhook.routes';
import { aiRoutes } from './routes/ai.routes';
import { agentRoutes } from './routes/agent.routes';
import { membersRoutes } from './routes/members.routes';
import systemRoutes from './routes/system.routes';

async function start() {
  const app = Fastify({ logger: false });

  // Cookie plugin must be registered BEFORE CORS so cookies are parsed
  await app.register(cookie, {
    secret: config.cookieSecret, // signs cookies for tamper protection
  });

  await app.register(cors, {
    origin: [config.frontendOrigin, 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // ← Critical: allows httpOnly cookies cross-origin
  });
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  // Auth middleware — runs on ALL requests, attaches req.authContext + req.getOrgId()
  // Falls back to prototype mode (config.defaultOrgId) if no JWT is present.
  app.addHook('preHandler', authMiddleware);

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(inventoryRoutes);
  await app.register(uploadRoutes);
  await app.register(leadsRoutes);
  await app.register(conversationsRoutes);
  await app.register(whatsappRoutes);
  await app.register(callsRoutes);
  await app.register(sarvamWebhookRoutes);
  await app.register(aiRoutes);
  await app.register(agentRoutes);
  await app.register(membersRoutes);
  await app.register(systemRoutes);

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', async (req) => {
    const orgId = (req.query as any).orgId || config.defaultOrgId;
    const { supabaseAdmin } = await import('./db/supabase');
    const sb = supabaseAdmin();

    const [leads, hot, convos, aiRuns, calls, units] = await Promise.all([
      sb.from('crm_leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
      sb.from('crm_leads').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('temperature', 'hot'),
      sb.from('customer_conversations').select('id', { count: 'exact', head: true }).eq('org_id', orgId).neq('status', 'closed'),
      sb.from('ai_agent_runs').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      sb.from('call_sessions').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'completed'),
      sb.from('real_estate_units').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('availability_status', 'available'),
    ]);

    return {
      totalLeads: leads.count ?? 0,
      hotLeads: hot.count ?? 0,
      openConversations: convos.count ?? 0,
      aiRepliesToday: aiRuns.count ?? 0,
      callsCompleted: calls.count ?? 0,
      propertiesAvailable: units.count ?? 0,
    };
  });

  app.get('/', async () => ({
    name: 'Calling Agent API',
    version: '1.0.0',
    health: '/health',
    endpoints: [
      '/api/whatsapp/*',
      '/api/inventory/*',
      '/api/upload/*',
      '/api/leads/*',
      '/api/conversations/*',
      '/api/calls/*',
      '/api/ai/*',
      '/api/agent/*',
      '/api/members',
      '/api/dashboard/stats',
    ],
  }));

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`Backend listening on http://0.0.0.0:${config.port}`);
    logger.info(`LLM provider: ${config.llm.provider} (model: ${config.llm.provider === 'openai' ? config.llm.openai.model : config.llm.deepseek.model})`);
    logger.info(`WhatsApp auto-reply: ${config.whatsapp.autoReply ? 'ON' : 'OFF'} | ignoreGroups: ${config.whatsapp.ignoreGroups}`);

    // Recover stale jobs from a previous crash (if any)
    await recoverStaleJobs().catch((err: unknown) => {
      logger.error({ err }, '[Server] Stale job recovery failed (non-fatal)');
    });

    // Start the async queue worker (polls job_queue every 2s)
    startQueueWorker();

    // Boot all connected WhatsApp accounts (multi-instance)
    if (config.whatsapp.autoBootConnections) {
      waManager.bootAll().catch((err) => {
        logger.error({ err }, '[Server] WhatsApp connection manager boot failed (non-fatal)');
      });
    }
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully...');
    try {
      stopQueueWorker();
      // Note: waManager doesn't expose stopAll yet, individual adapters handle cleanup
      await app.close();
      logger.info('Server closed');
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
