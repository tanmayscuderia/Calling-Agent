import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';

// ---- In-memory rate limit counters (fast, no DB hit for hot path) ----
interface OrgCounters {
  tokensToday: number;
  messagesThisHour: number;
  messagesToday: number;
  callsToday: number;
  lastRefresh: number; // timestamp of last DB sync
}
const orgCounters = new Map<string, OrgCounters>();
const SYNC_INTERVAL = 60 * 1000; // sync to DB every 60s

async function getCounters(orgId: string): Promise<OrgCounters> {
  let c = orgCounters.get(orgId);
  if (!c) {
    c = { tokensToday: 0, messagesThisHour: 0, messagesToday: 0, callsToday: 0, lastRefresh: 0 };
    orgCounters.set(orgId, c);
  }

  // Refresh from DB if stale (once per minute)
  if (Date.now() - c.lastRefresh > SYNC_INTERVAL) {
    await refreshFromDB(orgId, c);
  }
  return c;
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

// Cache limits (rarely change)
const limitsCache = new Map<string, { limits: OrgLimits; expires: number }>();

export async function getOrgLimits(orgId: string): Promise<OrgLimits> {
  const cached = limitsCache.get(orgId);
  if (cached && Date.now() < cached.expires) return cached.limits;

  try {
    const sb = supabaseAdmin();
    const { data } = await sb.from('org_usage_limits')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();

    const limits: OrgLimits = data || {
      max_tokens_per_day: 500000,
      max_messages_per_hour: 100,
      max_messages_per_day: 500,
      max_calls_per_day: 50,
      max_ai_replies_per_conversation: 10,
      max_messages_per_phone_per_day: 20,
      is_locked: false,
      locked_reason: null,
    };

    limitsCache.set(orgId, { limits, expires: Date.now() + 5 * 60 * 1000 });
    return limits;
  } catch {
    // Return defaults on error (fail-open for prototype)
    return {
      max_tokens_per_day: 500000,
      max_messages_per_hour: 100,
      max_messages_per_day: 500,
      max_calls_per_day: 50,
      max_ai_replies_per_conversation: 10,
      max_messages_per_phone_per_day: 20,
      is_locked: false,
      locked_reason: null,
    };
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
export async function recordMessageSent(orgId: string, phone: string): Promise<void> {
  const c = await getCounters(orgId);
  c.messagesThisHour++;
  c.messagesToday++;

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