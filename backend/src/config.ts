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
} as const;

export type AppConfig = typeof config;