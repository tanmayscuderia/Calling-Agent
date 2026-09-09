import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root first, then backend dir as fallback
// __dirname = backend/src → ../../.env = project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to cwd

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) {
    // For prototype, we don't hard-crash; services will log warnings.
    // Hard-required keys are checked where they're used.
  }
  return v ?? '';
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  cookieSecret: required('COOKIE_SECRET', 'calling-agent-dev-secret-change-in-prod-32+chars'),

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: required('SUPABASE_ANON_KEY'),
  },

  // Prototype is single-org; default org from env.
  defaultOrgId: required('DEFAULT_ORG_ID', '00000000-0000-0000-0000-000000000001'),
  defaultMemberId: required(
    'DEFAULT_MEMBER_ID',
    '00000000-0000-0000-0000-000000000010'
  ),

  llm: {
    // DeepSeek is the default provider (OpenAI-compatible endpoint).
    // Docs: https://api-docs.deepseek.com
    provider: (process.env.LLM_PROVIDER ?? 'deepseek').toLowerCase(),
    openai: {
      apiKey: required('OPENAI_API_KEY'),
      model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    },
    deepseek: {
      apiKey: required('DEEPSEEK_API_KEY'),
      // LOCKED to deepseek-v4-flash for maximum speed across all tasks.
      // v4-pro is not used — flash is fast and cheap for WhatsApp replies.
      model: 'deepseek-v4-flash',
      // DeepSeek base URL has no /v1 suffix per docs
      baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
    },
  },

  sarvam: {
    // Sarvam Voice Agents — real AI phone calls (docs/SARVAM_CALLING_PLAN.md)
    // Empty apiKey = feature off; start-real returns 'Sarvam not configured'.
    apiKey: required('SARVAM_API_KEY'),
    orgId: required('SARVAM_ORG_ID'),
    workspaceId: required('SARVAM_WORKSPACE_ID'),
    appId: required('SARVAM_APP_ID'),
    appVersion: Number(process.env.SARVAM_APP_VERSION ?? 1),
    connectionId: required('SARVAM_CONNECTION_ID'),
    agentPhoneNumber: required('SARVAM_AGENT_PHONE_NUMBER'),
    // Random 32+ char secret embedded in the webhook URL path — it IS the auth
    // for /webhooks/sarvam/:secret (Sarvam doesn't sign payloads).
    webhookSecret: required('SARVAM_WEBHOOK_SECRET', 'dev-sarvam-webhook-secret-change-me-32chars'),
    // Shared secret for Sarvam HTTP tools (X-Tool-Secret header on /api/tools/sarvam/*).
    toolSecret: required('SARVAM_TOOL_SECRET', process.env.SARVAM_WEBHOOK_SECRET ?? 'dev-sarvam-webhook-secret-change-me-32chars'),
    // Public HTTPS base URL of this backend (ngrok in dev, domain in prod) —
    // used to build the webhook URL we register with Sarvam.
    publicUrl: required('PUBLIC_BASE_URL', 'http://localhost:4000'),
    baseUrl: process.env.SARVAM_BASE_URL ?? 'https://apps.sarvam.ai',
    // Calling hours guard (IST). Outside this window start-real rejects.
    callingHoursStart: Number(process.env.SARVAM_CALLING_HOURS_START ?? 9),
    callingHoursEnd: Number(process.env.SARVAM_CALLING_HOURS_END ?? 21),
    // Toggle the calling-hours guard. Default ON — real PSTN calls cost money
    // and regulators (TRAI-style DND norms) restrict telemarketing hours.
    // Set SARVAM_ENFORCE_CALLING_HOURS=false ONLY for out-of-hours testing.
    callingHoursEnforced: (process.env.SARVAM_ENFORCE_CALLING_HOURS ?? 'true').toLowerCase() === 'true',
    // ── Inbound calls (Phase S5) ──
    // Sarvam-approved number customers dial to reach the AI agent.
    // Empty = inbound webhook branch treats payload as outbound-only.
    inboundNumber: process.env.SARVAM_INBOUND_NUMBER ?? '',
    // Org to attribute inbound webhooks to when the payload carries no
    // orgId metadata (dashboard-configured webhooks can't echo per-request
    // metadata the way our outbound requests do). Falls back to oldest org.
    defaultOrgId: process.env.SARVAM_DEFAULT_ORG_ID ?? '',
    // Fallback poller: periodically pull the Sarvam attempts API for
    // inbound calls the result webhook may have missed (local dev behind
    // no public URL, dropped deliveries). Off by default.
    inboundPollerEnabled: (process.env.SARVAM_INBOUND_POLLER ?? 'false').toLowerCase() === 'true',
    inboundPollIntervalSec: Number(process.env.SARVAM_INBOUND_POLL_INTERVAL ?? 120),
  },

  whatsapp: {
    provider: (process.env.WHATSAPP_PROVIDER ?? 'baileys').toLowerCase(),
    sessionDir: process.env.WHATSAPP_SESSION_DIR ?? '.sessions/whatsapp',
    autoReply: (process.env.AI_AUTO_REPLY ?? 'true').toLowerCase() === 'true',
    ignoreGroups: (process.env.AI_IGNORE_GROUPS ?? 'true').toLowerCase() === 'true',
    allowedNumbers: (process.env.AI_ALLOWED_NUMBERS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    businessName: process.env.AI_BUSINESS_NAME ?? 'Demo Realty',
    // DEBUG: Allow processing self-messages for testing without a second phone.
    // The AI reply is outbound so it won't re-trigger (Baileys doesn't emit
    // outgoing as "notify" type). Safe for single-chat testing.
    selfMessageTest: (process.env.WHATSAPP_SELF_TEST ?? 'false').toLowerCase() === 'true',
    // Boot all connected WhatsApp accounts on server start (multi-instance)
    autoBootConnections: (process.env.WHATSAPP_AUTO_BOOT ?? 'true').toLowerCase() === 'true',
  },

  // ── Meta Cloud API (official WhatsApp Business API) ──
  // Dual-provider support: whatsapp_accounts rows carry provider
  // 'baileys' (WhatsApp Web bridge) or 'meta_cloud_api' (official).
  // Meta accounts are stateless — no socket, inbound arrives via
  // signed webhooks (routes/whatsappWebhook.routes.ts).
  meta: {
    // App Secret (Meta → App Settings → Basic). Verifies the
    // HMAC-SHA256 signature on every webhook POST. REQUIRED for the
    // webhook: with it missing, every POST is rejected (fail-closed —
    // ported from wacrm, where falling open was deemed unsafe).
    appSecret: process.env.META_APP_SECRET ?? '',
    // Graph API version pin.
    apiVersion: process.env.META_API_VERSION ?? 'v21.0',
    // AES-256-GCM key (64 hex chars = 32 bytes) used to encrypt Meta
    // access tokens / verify tokens at rest in whatsapp_accounts.config.
    // Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    // Empty = meta account creation fails with a clear error (tokens
    // are never stored plaintext).
    encryptionKey: process.env.ENCRYPTION_KEY ?? '',
    // Optional fallback verify token for GET webhook subscription
    // (hub.verify_token) when no account row matches. Handy for
    // single-number setups where Meta's dashboard wants one token.
    webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN ?? '',
    // Per-call timeout for Graph API requests (ms).
    requestTimeoutMs: Number(process.env.META_REQUEST_TIMEOUT_MS ?? 30000),
  },

  // Process topology: run the job-queue worker inside the API process
  // (single-container default), or externalized to `src/worker.ts`
  // (docker-compose / production). See server.ts + worker.ts.
  workerInProcess: (process.env.WORKER_IN_PROCESS ?? 'true').toLowerCase() !== 'false',
} as const;

export type AppConfig = typeof config;