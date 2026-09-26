import { supabaseAdmin } from '../db/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Usage & cost aggregation for the dashboard Usage view.
 *
 * Sources of truth:
 *   - ai_agent_runs       → per-run tokens_in/out + cost_usd (recorded since
 *                           2026-09-09; older rows have zeros)
 *   - org_usage_daily     → org rollup (tokens, messages, ai_runs, cost)
 *   - account_usage_daily → per-NUMBER daily counts (inbound/outbound/ai_replies)
 *   - call_sessions       → Sarvam minutes (cost computed from duration ×
 *                           SARVAM_COST_PER_MINUTE at read time)
 *
 * Cost attribution per WhatsApp number: ai_agent_runs.conversation_id →
 * customer_conversations.whatsapp_account_id. Runs without a resolvable
 * account land in an "unattributed" bucket (logged at debug).
 */

export interface UsageSummary {
  period: { days: number; from: string; to: string };
  pricing: {
    llmInputCostPer1M: number;
    llmOutputCostPer1M: number;
    sarvamCostPerMinuteInr: number;
  };
  daily: Array<{
    date: string;
    aiRuns: number;
    tokensIn: number;
    tokensOut: number;
    messagesSent: number;
    costUsd: number;
  }>;
  totals: {
    aiRuns: number;
    tokensIn: number;
    tokensOut: number;
    messagesSent: number;
    llmCostUsd: number;
  };
  accounts: Array<{
    id: string;
    label: string;
    provider: string;
    todayInbound: number;
    todayOutbound: number;
    todayAiReplies: number;
    limits: { max_ai_replies_per_day: number | null; max_messages_per_day: number | null };
    aiCost7dUsd: number;
  }>;
  sarvam: {
    calls: number;
    completed: number;
    totalMinutes: number;
    inbound: number;
    outbound: number;
    costInr: number | null;
  };
  topConversations: Array<{
    conversationId: string;
    aiReplies: number;
    limit: number;
    customerName: string | null;
    customerPhone: string | null;
    lastAt: string | null;
  }>;
  limits: Record<string, any> | null;
}

export async function getUsageSummary(orgId: string, days = 7): Promise<UsageSummary> {
  const sb = supabaseAdmin();
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const fromIso = from.toISOString();
  const today = to.toISOString().split('T')[0];

  const pricing = {
    llmInputCostPer1M: config.llm.pricing.inputCostPer1M,
    llmOutputCostPer1M: config.llm.pricing.outputCostPer1M,
    sarvamCostPerMinuteInr: config.sarvam.costPerMinuteInr,
  };

  // 1) Org daily rollup
  const { data: dailyRows } = await sb
    .from('org_usage_daily')
    .select('usage_date, ai_runs, tokens_in, tokens_out, messages_sent, cost_usd')
    .eq('org_id', orgId)
    .gte('usage_date', fromIso.split('T')[0])
    .order('usage_date', { ascending: true });

  const daily = (dailyRows ?? []).map((r: any) => ({
    date: String(r.usage_date),
    aiRuns: r.ai_runs ?? 0,
    tokensIn: r.tokens_in ?? 0,
    tokensOut: r.tokens_out ?? 0,
    messagesSent: r.messages_sent ?? 0,
    costUsd: Number(r.cost_usd ?? 0),
  }));

  const totals = daily.reduce(
    (acc, d) => ({
      aiRuns: acc.aiRuns + d.aiRuns,
      tokensIn: acc.tokensIn + d.tokensIn,
      tokensOut: acc.tokensOut + d.tokensOut,
      messagesSent: acc.messagesSent + d.messagesSent,
      llmCostUsd: Math.round((acc.llmCostUsd + d.costUsd) * 1000) / 1000,
    }),
    { aiRuns: 0, tokensIn: 0, tokensOut: 0, messagesSent: 0, llmCostUsd: 0 }
  );

  // ── accounts + per-number + sarvam + top conversations: part 2 ──
  return buildRest(orgId, sb, fromIso, today, { days, from: fromIso, to: to.toISOString() }, pricing, daily, totals);
}

async function buildRest(
  orgId: string,
  sb: ReturnType<typeof supabaseAdmin>,
  fromIso: string,
  today: string,
  period: UsageSummary['period'],
  pricing: UsageSummary['pricing'],
  daily: UsageSummary['daily'],
  totals: UsageSummary['totals']
): Promise<UsageSummary> {
  // 2) Per-number usage (today) + accounts
  const [{ data: accounts }, { data: accountToday }] = await Promise.all([
    sb.from('whatsapp_accounts').select('id, label, provider, config').eq('org_id', orgId).order('created_at'),
    sb
      .from('account_usage_daily')
      .select('account_id, inbound_count, outbound_count, ai_replies')
      .eq('org_id', orgId)
      .eq('usage_date', today),
  ]);

  const todayByAccount = new Map((accountToday ?? []).map((r: any) => [r.account_id, r]));

  // 3) Per-account AI cost over window (runs → conversations → account)
  const [{ data: runs }, { data: convAcc }] = await Promise.all([
    sb
      .from('ai_agent_runs')
      .select('conversation_id, tokens_in, tokens_out, cost_usd')
      .eq('org_id', orgId)
      .gte('created_at', fromIso)
      .limit(5000),
    sb
      .from('customer_conversations')
      .select('id, whatsapp_account_id')
      .eq('org_id', orgId),
  ]);

  const convToAccount = new Map((convAcc ?? []).map((c: any) => [c.id, c.whatsapp_account_id]));
  const costByAccount = new Map<string, number>();
  const repliesByConv = new Map<string, number>();
  let unattributedCost = 0;
  for (const run of (runs ?? []) as any[]) {
    const cost = Number(run.cost_usd ?? 0);
    const accId = convToAccount.get(run.conversation_id);
    if (accId) costByAccount.set(accId, (costByAccount.get(accId) ?? 0) + cost);
    else unattributedCost += cost;
    if (run.conversation_id) {
      repliesByConv.set(run.conversation_id, (repliesByConv.get(run.conversation_id) ?? 0) + 1);
    }
  }
  if (unattributedCost > 0) {
    logger.debug({ orgId, unattributedCost }, '[usage] some AI cost unattributed (conversation has no account)');
  }

  const accountList = (accounts ?? []).map((a: any) => {
    const t = todayByAccount.get(a.id);
    const cfgLimits = (a.config ?? {}).limits ?? {};
    return {
      id: a.id,
      label: a.label ?? 'Unnamed',
      provider: a.provider,
      todayInbound: t?.inbound_count ?? 0,
      todayOutbound: t?.outbound_count ?? 0,
      todayAiReplies: t?.ai_replies ?? 0,
      limits: {
        max_ai_replies_per_day: cfgLimits.max_ai_replies_per_day ?? null,
        max_messages_per_day: cfgLimits.max_messages_per_day ?? null,
      },
      aiCost7dUsd: Math.round((costByAccount.get(a.id) ?? 0) * 1000) / 1000,
    };
  });

  // 4) Sarvam calls in window (cost = minutes × rate; hidden when rate unset)
  const { data: calls } = await sb
    .from('call_sessions')
    .select('direction, status, duration_sec')
    .eq('org_id', orgId)
    .gte('created_at', fromIso);

  const callList = (calls ?? []) as any[];
  const totalSec = callList.reduce((s, c) => s + (c.duration_sec ?? 0), 0);
  const totalMinutes = Math.round((totalSec / 60) * 10) / 10;
  const sarvam = {
    calls: callList.length,
    completed: callList.filter((c) => c.status === 'completed').length,
    totalMinutes,
    inbound: callList.filter((c) => c.direction === 'inbound').length,
    outbound: callList.filter((c) => c.direction === 'outbound').length,
    costInr:
      config.sarvam.costPerMinuteInr > 0
        ? Math.round(totalMinutes * config.sarvam.costPerMinuteInr * 100) / 100
        : null,
  };

  // 5) Top conversations by AI replies (usage vs the 500 lifetime cap)
  const topConvIds = [...repliesByConv.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  let topConversations: UsageSummary['topConversations'] = [];
  if (topConvIds.length > 0) {
    const { data: convs } = await sb
      .from('customer_conversations')
      .select('id, customer_name, customer_phone, last_message_at')
      .eq('org_id', orgId)
      .in('id', topConvIds.map(([id]) => id));
    const convMap = new Map((convs ?? []).map((c: any) => [c.id, c]));
    topConversations = topConvIds.map(([id, count]) => {
      const c = convMap.get(id);
      return {
        conversationId: id,
        aiReplies: count,
        limit: 500,
        customerName: c?.customer_name ?? null,
        customerPhone: c?.customer_phone ?? null,
        lastAt: c?.last_message_at ?? null,
      };
    });
  }

  // 6) Org limits row
  const { data: limits } = await sb
    .from('org_usage_limits')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle();

  return {
    period,
    pricing,
    daily,
    totals,
    accounts: accountList,
    sarvam,
    topConversations,
    limits: limits ?? null,
  };
}
