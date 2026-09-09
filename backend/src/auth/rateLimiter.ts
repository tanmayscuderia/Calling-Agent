import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import { getKv } from '../kv';

// ---- Rate-limit counters ----
// Storage moved to the KV layer: in-memory by default (identical to the old
// Map), Redis-shared when REDIS_URL is set so API + worker agree on usage.
// The DB (org_usage_daily/org_usage_hourly via atomic RPCs) remains the
// source of truth — counters are an optimistic hot-path cache re-synced from
// the DB every 60s, which bounds any cross-process drift to ~1 minute.
interface OrgCounters {
  tokensToday: number;
  messagesThisHour: number;
  messagesToday: number;
  callsToday: number;
  lastRefresh: number; // timestamp of last DB sync
}
const COUNTERS_KEY = (orgId: string) => `rl:${orgId}:counters`;
const COUNTERS_TTL_MS = 10 * 60_000;
const SYNC_INTERVAL = 60 * 1000; // sync to DB every 60s

async function getCounters(orgId: string): Promise<OrgCounters> {
  const kv = await getKv();
  const key = COUNTERS_KEY(orgId);
  let c = await kv.getJson<OrgCounters>(key);
  if (!c) {
    c = { tokensToday: 0, messagesThisHour: 0, messagesToday: 0, callsToday: 0, lastRefresh: 0 };
    await kv.setJson(key, c, COUNTERS_TTL_MS);
  }

  // Refresh from DB if stale (once per minute)
  if (Date.now() - c.lastRefresh > SYNC_INTERVAL) {
    await refreshFromDB(orgId, c);
    await kv.setJson(key, c, COUNTERS_TTL_MS);
  }
  return c;
}

/** Persist counter mutations back to the shared store. */
async function saveCounters(orgId: string, c: OrgCounters): Promise<void> {
  const kv = await getKv();
  await kv.setJson(COUNTERS_KEY(orgId), c, COUNTERS_TTL_MS);
}

async function refreshFromDB(orgId: string, c: OrgCounters) {
  try {
    const sb = supabaseAdmin();
    const today = new Date().toISOString().split('T')[0];
    const hourBucket = new Date();
    hourBucket.setMinutes(0, 0, 0);

    const [dailyRes, hourlyRes] = await Promise.all([
      sb.from('org_usage_daily')
        .select('tokens_in, tokens_out, messages_sent, calls_made')
        .eq('org_id', orgId)
        .eq('usage_date', today)
        .maybeSingle(),
      sb.from('org_usage_hourly')
        .select('messages_sent')
        .eq('org_id', orgId)
        .eq('hour_bucket', hourBucket.toISOString())
        .maybeSingle(),
    ]);

    c.tokensToday = (dailyRes.data?.tokens_in || 0) + (dailyRes.data?.tokens_out || 0);
    c.messagesToday = dailyRes.data?.messages_sent || 0;
    c.callsToday = dailyRes.data?.calls_made || 0;
    c.messagesThisHour = hourlyRes.data?.messages_sent || 0;
    c.lastRefresh = Date.now();
  } catch (err) {
    logger.debug({ err, orgId }, 'rate limit DB refresh failed');
  }
}

export interface RateLimitResult {
  allowed: boolean;
  reason: string | null;
  fallbackMessage?: string;
}

export interface OrgLimits {
  max_tokens_per_day: number;
  max_messages_per_hour: number;
  max_messages_per_day: number;
  max_calls_per_day: number;
  max_ai_replies_per_conversation: number;
  max_messages_per_phone_per_day: number;
  is_locked: boolean;
  locked_reason: string | null;
}

// Cache limits (rarely change) — shared via KV, 5-min TTL
const LIMITS_KEY = (orgId: string) => `rl:${orgId}:limits`;
const LIMITS_TTL_MS = 5 * 60 * 1000;

const DEFAULT_LIMITS: OrgLimits = {
  max_tokens_per_day: 500000,
  max_messages_per_hour: 100,
  max_messages_per_day: 500,
  max_calls_per_day: 50,
  // Lifetime cap per conversation. 500 (not 10) — a real sales conversation
  // spans weeks and dozens of exchanges; a low silent cap kills deals.
  max_ai_replies_per_conversation: 500,
  max_messages_per_phone_per_day: 20,
  is_locked: false,
  locked_reason: null,
};

export async function getOrgLimits(orgId: string): Promise<OrgLimits> {
  const kv = await getKv();
  const key = LIMITS_KEY(orgId);
  const cached = await kv.getJson<OrgLimits>(key);
  if (cached) return cached;

  try {
    const sb = supabaseAdmin();
    const { data } = await sb.from('org_usage_limits')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();

    const limits: OrgLimits = data || DEFAULT_LIMITS;

    await kv.setJson(key, limits, LIMITS_TTL_MS);
    return limits;
  } catch {
    // Return defaults on error (fail-open for prototype) — NOT cached
    return DEFAULT_LIMITS;
  }
}

/** Check if LLM call is allowed (token budget + org lock) */
export async function checkLLMAllowed(orgId: string): Promise<RateLimitResult> {
  const [limits, counters] = await Promise.all([getOrgLimits(orgId), getCounters(orgId)]);

  if (limits.is_locked) {
    return {
      allowed: false,
      reason: `Org locked: ${limits.locked_reason || 'unknown reason'}`,
      fallbackMessage: 'Our team will get back to you shortly. Thank you for your patience!',
    };
  }

  if (counters.tokensToday >= limits.max_tokens_per_day) {
    return {
      allowed: false,
      reason: 'Daily token budget exceeded',
      fallbackMessage: 'I have received your message. Our team will respond to you shortly.',
    };
  }

  return { allowed: true, reason: null };
}

/** Check if outbound message is allowed (hourly + daily + per-phone limits) */
export async function checkMessageAllowed(
  orgId: string,
  phone: string
): Promise<RateLimitResult> {
  const [limits, counters] = await Promise.all([getOrgLimits(orgId), getCounters(orgId)]);

  if (limits.is_locked) {
    return { allowed: false, reason: 'Org locked' };
  }

  if (counters.messagesThisHour >= limits.max_messages_per_hour) {
    return { allowed: false, reason: 'Hourly message limit reached' };
  }

  if (counters.messagesToday >= limits.max_messages_per_day) {
    return { allowed: false, reason: 'Daily message limit reached' };
  }

  // Per-phone daily check
  const sb = supabaseAdmin();
  const today = new Date().toISOString().split('T')[0];
  const { data: phoneCounter } = await sb.from('phone_message_counters')
    .select('outbound_count')
    .eq('org_id', orgId)
    .eq('phone', phone)
    .eq('counter_date', today)
    .maybeSingle();

  if (phoneCounter && phoneCounter.outbound_count >= limits.max_messages_per_phone_per_day) {
    return { allowed: false, reason: 'Per-phone daily limit reached (anti-ban protection)' };
  }

  return { allowed: true, reason: null };
}

/** Check if conversation AI reply limit is hit */
export async function checkConversationAILimit(
  orgId: string,
  conversationAiReplyCount: number
): Promise<RateLimitResult> {
  const limits = await getOrgLimits(orgId);
  if (conversationAiReplyCount >= limits.max_ai_replies_per_conversation) {
    return {
      allowed: false,
      reason: 'Conversation AI reply limit reached — forcing human handoff',
      fallbackMessage: 'I am connecting you with our team for further assistance. Please hold.',
    };
  }
  return { allowed: true, reason: null };
}

/** Record token usage after an LLM call */
export async function recordTokenUsage(
  orgId: string,
  tokensIn: number,
  tokensOut: number,
  costUsd: number = 0
): Promise<void> {
  const c = await getCounters(orgId);
  c.tokensToday += tokensIn + tokensOut;
  await saveCounters(orgId, c);

  // Async DB update (fire-and-forget) via atomic RPC
  setImmediate(async () => {
    try {
      const sb = supabaseAdmin();
      const today = new Date().toISOString().split('T')[0];
      await sb.rpc('increment_usage', {
        p_org_id: orgId,
        p_date: today,
        p_tokens_in: tokensIn,
        p_tokens_out: tokensOut,
        p_cost: costUsd,
        p_ai_runs: 1,
      });
    } catch (err) {
      logger.debug({ err }, 'token usage DB update failed');
    }
  });
}

/** Record an outbound message (increment counters via atomic RPCs) */
// ============================================================
// Per-number (per whatsapp_account) daily limits
// ============================================================
// An org runs MANY numbers; org-level limits bound the whole business,
// these bound EACH NUMBER (cost control + anti-ban: Meta quality rating
// and WhatsApp spam heuristics both watch per-number volume).
//
// Limits: whatsapp_accounts.config.limits JSONB (optional) —
//   { "max_ai_replies_per_day": 200, "max_messages_per_day": 300 }
// Unset fields fall back to generous defaults. Counters live in
// account_usage_daily (one row per account per day).

export interface AccountLimits {
  max_ai_replies_per_day: number;
  max_messages_per_day: number;
}

const ACCOUNT_LIMITS_KEY = (accountId: string) => `rl:acc:${accountId}:limits`;
const ACCOUNT_LIMITS_TTL_MS = 5 * 60 * 1000;
const ACCOUNT_DEFAULT_LIMITS: AccountLimits = {
  max_ai_replies_per_day: 300,
  max_messages_per_day: 400,
};

export async function getAccountLimits(orgId: string, accountId: string): Promise<AccountLimits> {
  const kv = await getKv();
  const key = ACCOUNT_LIMITS_KEY(accountId);
  const cached = await kv.getJson<AccountLimits>(key);
  if (cached) return cached;

  try {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from('whatsapp_accounts')
      .select('config')
      .eq('id', accountId)
      .maybeSingle();
    const cfg = ((data?.config ?? {}) as any).limits ?? {};
    const limits: AccountLimits = {
      max_ai_replies_per_day: Number(cfg.max_ai_replies_per_day) || ACCOUNT_DEFAULT_LIMITS.max_ai_replies_per_day,
      max_messages_per_day: Number(cfg.max_messages_per_day) || ACCOUNT_DEFAULT_LIMITS.max_messages_per_day,
    };
    await kv.setJson(key, limits, ACCOUNT_LIMITS_TTL_MS);
    return limits;
  } catch {
    return { ...ACCOUNT_DEFAULT_LIMITS };
  }
}

/** Read-or-create today's counter row for an account. Fails open (zeros) if the table is missing. */
async function getAccountUsage(orgId: string, accountId: string): Promise<{ outbound: number; aiReplies: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabaseAdmin()
      .from('account_usage_daily')
      .select('outbound_count, ai_replies')
      .eq('account_id', accountId)
      .eq('usage_date', today)
      .maybeSingle();
    return { outbound: data?.outbound_count ?? 0, aiReplies: data?.ai_replies ?? 0 };
  } catch {
    return { outbound: 0, aiReplies: 0 };
  }
}

/** Per-number daily gate — checked before the AI reply is generated. Fails open. */
export async function checkAccountDailyLimit(orgId: string, accountId: string | null): Promise<RateLimitResult> {
  if (!accountId) return { allowed: true, reason: null };
  try {
    const [limits, usage] = await Promise.all([getAccountLimits(orgId, accountId), getAccountUsage(orgId, accountId)]);
    if (usage.aiReplies >= limits.max_ai_replies_per_day) {
      return { allowed: false, reason: `Per-number daily AI reply limit reached (${limits.max_ai_replies_per_day})` };
    }
    if (usage.outbound >= limits.max_messages_per_day) {
      return { allowed: false, reason: `Per-number daily message limit reached (${limits.max_messages_per_day})` };
    }
    return { allowed: true, reason: null };
  } catch {
    return { allowed: true, reason: null }; // fail open
  }
}

/** Fire-and-forget daily activity increment for a number (upsert today's row). */
export async function recordAccountActivity(
  orgId: string,
  accountId: string,
  delta: { inbound?: number; outbound?: number; ai_replies?: number }
): Promise<void> {
  if (!accountId) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const sb = supabaseAdmin();
    const { data: row } = await sb
      .from('account_usage_daily')
      .select('id, inbound_count, outbound_count, ai_replies')
      .eq('account_id', accountId)
      .eq('usage_date', today)
      .maybeSingle();
    if (row) {
      await sb
        .from('account_usage_daily')
        .update({
          inbound_count: (row.inbound_count ?? 0) + (delta.inbound ?? 0),
          outbound_count: (row.outbound_count ?? 0) + (delta.outbound ?? 0),
          ai_replies: (row.ai_replies ?? 0) + (delta.ai_replies ?? 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    } else {
      await sb.from('account_usage_daily').insert({
        org_id: orgId,
        account_id: accountId,
        usage_date: today,
        inbound_count: delta.inbound ?? 0,
        outbound_count: delta.outbound ?? 0,
        ai_replies: delta.ai_replies ?? 0,
      });
    }
  } catch (err: any) {
    // Counters must never break the reply pipeline (table may not exist yet).
    logger.debug({ err: err?.message }, 'account usage increment failed (non-fatal)');
  }
}

/** Record an outbound message (increment counters via atomic RPCs) */
export async function recordMessageSent(orgId: string, phone: string): Promise<void> {
  const c = await getCounters(orgId);
  c.messagesThisHour++;
  c.messagesToday++;
  await saveCounters(orgId, c);

  setImmediate(async () => {
    try {
      const sb = supabaseAdmin();
      const today = new Date().toISOString().split('T')[0];
      const hourBucket = new Date();
      hourBucket.setMinutes(0, 0, 0);

      // Atomic increments (no race conditions)
      await Promise.all([
        sb.rpc('increment_usage', {
          p_org_id: orgId,
          p_date: today,
          p_messages_sent: 1,
        }),
        sb.rpc('increment_hourly_messages', {
          p_org_id: orgId,
          p_hour_bucket: hourBucket.toISOString(),
          p_count: 1,
        }),
        sb.rpc('increment_phone_counter', {
          p_org_id: orgId,
          p_phone: phone,
          p_counter_date: today,
          p_count: 1,
        }),
      ]);
    } catch (err) {
      logger.debug({ err }, 'message counter DB update failed');
    }
  });
}

/** Record a call (atomic increment) */
export async function recordCall(orgId: string): Promise<void> {
  const c = await getCounters(orgId);
  c.callsToday++;
  await saveCounters(orgId, c);

  setImmediate(async () => {
    try {
      const sb = supabaseAdmin();
      const today = new Date().toISOString().split('T')[0];
      await sb.rpc('increment_usage', {
        p_org_id: orgId,
        p_date: today,
        p_calls: 1,
      });
    } catch (err) {
      logger.debug({ err }, 'call counter DB update failed');
    }
  });
}

/** Check if outbound call is allowed */
export async function checkCallAllowed(orgId: string): Promise<RateLimitResult> {
  const [limits, counters] = await Promise.all([getOrgLimits(orgId), getCounters(orgId)]);
  if (limits.is_locked) return { allowed: false, reason: 'Org locked' };
  if (counters.callsToday >= limits.max_calls_per_day) {
    return { allowed: false, reason: 'Daily call limit reached' };
  }
  return { allowed: true, reason: null };
}

/** Get dashboard usage summary for an org */
export async function getUsageSummary(orgId: string) {
  const [limits, counters] = await Promise.all([getOrgLimits(orgId), getCounters(orgId)]);
  return {
    tokensUsedToday: counters.tokensToday,
    tokensLimit: limits.max_tokens_per_day,
    messagesSentToday: counters.messagesToday,
    messagesDailyLimit: limits.max_messages_per_day,
    messagesThisHour: counters.messagesThisHour,
    messagesHourlyLimit: limits.max_messages_per_hour,
    callsToday: counters.callsToday,
    callsLimit: limits.max_calls_per_day,
    isLocked: limits.is_locked,
    lockedReason: limits.locked_reason,
    percentTokenBudget: limits.max_tokens_per_day > 0
      ? Math.round((counters.tokensToday / limits.max_tokens_per_day) * 100)
      : 0,
  };
}