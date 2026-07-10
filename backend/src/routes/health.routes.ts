import { FastifyInstance } from 'fastify';
import { getWorkerStats } from '../queue/queueWorker';
import { getQueueStats } from '../queue/staleRecovery';
import { getLlmStats } from '../ai/llmClient';
import { waManager } from '../whatsapp/connectionManager';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }));

  /**
   * System status endpoint — gives full visibility into queue, LLM, and WhatsApp.
   * Useful for demos (shows the system is "live" and processing).
   */
  app.get('/api/system/status', async () => {
    const [queueStats] = await Promise.all([
      getQueueStats().catch(() => null),
    ]);

    return {
      ts: new Date().toISOString(),
      queue: {
        worker: getWorkerStats(),
        jobs: queueStats,
      },
      llm: getLlmStats(),
      whatsapp: {
        activeConnections: waManager.size(),
      },
    };
  });
}