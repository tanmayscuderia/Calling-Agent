import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';
import { llm } from '../ai/llmClient';

/**
 * Two-stage spam/abuse guard — the judgment layer between dumb cutoffs
 * and silent cost bleed.
 *
 * Stage 1 (free heuristics, run in the enqueue path):
 *   - Burst:      ≥ 15 inbound messages from one phone within 5 minutes
 *   - Daily flood: ≥ 100 inbound messages from one phone in a day
 *   - Repetition:  ≥ 3 of the previous 4 messages near-identical to the latest
 * Real sales conversations are CHATTY (a customer firing 5 quick questions
 * is normal) — these thresholds are deliberately liberal. Heuristics only
 * *flag*; they never block by themselves.
 *
 * Stage 2 (DeepSeek referee, run in the worker ONLY when Stage 1 tripped):
 *   Classifies the recent exchange as genuine / spam / abuse / bot_loop.
 *   - genuine       → reply normally
 *   - spam / abuse  → AI goes silent for the conversation (human_handoff +
 *                     pending_human), verdict stored for the dashboard
 *   - ambiguous     → reply normally, logged for review
 * Referee failures are fail-open: an LLM outage must never mute real leads.
 */

// ── Tunables (liberal by design) ──
export const BURST_LIMIT = 15;
export const BURST_WINDOW_MS = 5 * 60 * 1000;
export const DAILY_LIMIT = 100;
export const DUP_OF_LAST = 3; // ≥3 of the previous 4 messages
export const DUP_THRESHOLD = 0.8; // bigram Jaccard similarity
export const REFEREE_MIN_CONFIDENCE = 0.6;

/** Lowercase, strip everything except letters + digits (unicode-aware). */
export function normalizeForCompare(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

/** Jaccard similarity over character bigrams (0 = nothing shared, 1 = identical). */
export function bigramJaccard(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Near-duplicate = normalized Jaccard ≥ threshold (catches "price?" vs "price!"). */
export function isNearDuplicate(a: string, b: string): boolean {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (!na && !nb) return true;
  if (!na || !nb) return false;
  return bigramJaccard(na, nb) >= DUP_THRESHOLD;
}

export interface HeuristicSignals {
  tripped: boolean;
  signals: string[];
}

/**
 * Pure evaluation — no IO. Unit-testable.
 * @param burstCount   inbound messages from this phone in the last 5 min (incl. current)
 * @param dailyCount   inbound messages from this phone today (incl. current)
 * @param recentTexts  last N inbound texts of the conversation, OLDEST → NEWEST
 *                     (the newest one is the message being evaluated)
 */
export function evaluateSignals(
  burstCount: number,
  dailyCount: number,
  recentTexts: string[]
): HeuristicSignals {
  const signals: string[] = [];
  if (burstCount >= BURST_LIMIT) signals.push('burst');
  if (dailyCount >= DAILY_LIMIT) signals.push('daily_flood');

  if (recentTexts.length >= 3) {
    const latest = normalizeForCompare(recentTexts[recentTexts.length - 1]);
    const previous = recentTexts.slice(0, -1).slice(-4).map(normalizeForCompare);
    const dups = previous.filter((p) => isNearDuplicate(latest, p)).length;
    if (dups >= DUP_OF_LAST) signals.push('repetition');
  }

  return { tripped: signals.length > 0, signals };
}

/** DB-backed heuristic run: counts + recent texts for this conversation/phone. */
export async function runSpamHeuristics(
  orgId: string,
  conversationId: string,
  phone: string | null,
  latestText: string
): Promise<HeuristicSignals & { recentTexts: string[] }> {
  try {
    const sb = supabaseAdmin();
    const since = new Date(Date.now() - BURST_WINDOW_MS).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [burstRes, dailyRes, recentRes] = await Promise.all([
      sb
        .from('customer_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .eq('direction', 'inbound')
        .gte('created_at', since),
      phone
        ? sb
            .from('customer_messages')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('direction', 'inbound')
            .eq('sender_phone', phone)
            .gte('created_at', todayStart.toISOString())
        : Promise.resolve({ count: 0, error: null }),
      sb
        .from('customer_messages')
        .select('body')
        .eq('conversation_id', conversationId)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const burstCount = (burstRes.count ?? 0) + 1; // include the current message
    const dailyCount = ((dailyRes as any).count ?? 0) + 1;
    const recentTexts = (recentRes.data ?? [])
      .map((r: any) => r.body)
      .filter(Boolean)
      .reverse(); // oldest → newest
    if (latestText && recentTexts[recentTexts.length - 1] !== latestText) {
      recentTexts.push(latestText);
    }

    const result = evaluateSignals(burstCount, dailyCount, recentTexts);
    if (result.tripped) {
      logger.warn({ orgId, conversationId, signals: result.signals }, '[spam-guard] Stage 1 tripped — referee will adjudicate');
    }
    return { ...result, recentTexts };
  } catch (err: any) {
    // Heuristics must never block the pipeline — fail open.
    logger.warn({ err: err?.message }, '[spam-guard] heuristics failed — failing open');
    return { tripped: false, signals: [], recentTexts: [] };
  }
}

export type AbuseLabel = 'genuine' | 'spam' | 'abuse' | 'bot_loop';

export interface AbuseVerdict {
  label: AbuseLabel;
  confidence: number;
}

/**
 * Stage 2 — DeepSeek referee. ONLY called when Stage 1 tripped.
 * Fail-open: on any error the verdict is "genuine" (a real lead must never
 * be muted because of an LLM outage — cost is already bounded by the
 * daily token budget).
 */
export async function classifyWithReferee(texts: string[]): Promise<AbuseVerdict> {
  const system =
    'You are a message-quality referee for a real-estate sales WhatsApp assistant. ' +
    'Classify the recent exchange as exactly one of: "genuine" (a real customer asking real questions, ' +
    'even if rude, repetitive, rapid-fire, or Hinglish), "spam" (promotions, links, ads, irrelevant solicitation), ' +
    '"abuse" (slurs, threats, sexual harassment), "bot_loop" (someone deliberately testing/trolling the bot with junk). ' +
    'Reply with JSON only: {"label":"genuine|spam|abuse|bot_loop","confidence":0.0-1.0}. ' +
    'When in doubt, choose "genuine" with lower confidence — a real lead must never be muted.';

  const transcript = texts.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const user = `Classify this recent message exchange:\n\n${transcript}`;

  try {
    const { data } = await llm.generateJson(user, system, { temperature: 0.1 });
    const label = String(data?.label ?? 'genuine').toLowerCase();
    const confidence = Math.max(0, Math.min(1, Number(data?.confidence ?? 0)));
    if (!['genuine', 'spam', 'abuse', 'bot_loop'].includes(label)) {
      return { label: 'genuine', confidence: 0 };
    }
    return { label: label as AbuseLabel, confidence };
  } catch (err: any) {
    logger.warn({ err: err?.message }, '[spam-guard] referee failed — failing open');
    return { label: 'genuine', confidence: 0 };
  }
}
