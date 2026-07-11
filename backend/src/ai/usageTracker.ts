/**
 * LLM Usage Tracker
 *
 * In-memory counter for daily LLM API calls.
 * Resets at local midnight.
 * Provides a hard budget limit to prevent unexpected cost spikes.
 *
 * Usage: Every real API call to the LLM provider increments the counter.
 * If the daily limit is exceeded, calls are rejected with a graceful fallback.
 *
 * Config:
 *   MAX_DAILY_LLM_CALLS  (default: 500) — hard limit per day
 *   LLM_BUDGET_SOURCE    (default: 'production') — tag for which source is being counted
 */

import { logger } from '../utils/logger';

const MAX_DAILY_LLM_CALLS = parseInt(process.env.MAX_DAILY_LLM_CALLS || '500', 10);

interface DailyUsage {
  date: string; // YYYY-MM-DD
  totalCalls: number;
  bySource: Record<string, number>;
}

let usage: DailyUsage = getFreshUsageForToday();

/** Get a fresh usage object for the current day. */
function getFreshUsageForToday(): DailyUsage {
  return {
    date: new Date().toISOString().slice(0, 10),
    totalCalls: 0,
    bySource: {},
  };
}

/** Check if the date has rolled over and reset if needed. */
function maybeResetForNewDay(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (usage.date !== today) {
    logger.info({ prevDate: usage.date, newDate: today, prevTotal: usage.totalCalls }, 'LLM usage tracker rolled over to new day');
    usage = getFreshUsageForToday();
  }
}

/**
 * Increment the call counter. Called BEFORE every real API request.
 * Returns true if the call is allowed, false if budget exhausted.
 *
 * @param source - 'whatsapp' | 'eval' | 'playground' | 'call_demo' | 'other'
 */
export function recordLlmCall(source: string = 'other'): boolean {
  maybeResetForNewDay();

  if (usage.totalCalls >= MAX_DAILY_LLM_CALLS) {
    logger.error(
      {
        totalCalls: usage.totalCalls,
        limit: MAX_DAILY_LLM_CALLS,
        source,
        date: usage.date,
      },
      '🚨 DAILY LLM CALL BUDGET EXHAUSTED — blocking API call'
    );
    return false;
  }

  usage.totalCalls++;
  usage.bySource[source] = (usage.bySource[source] || 0) + 1;

  // Warn at 80% usage
  if (usage.totalCalls === Math.floor(MAX_DAILY_LLM_CALLS * 0.8)) {
    logger.warn(
      {
        totalCalls: usage.totalCalls,
        limit: MAX_DAILY_LLM_CALLS,
        percent: '80%',
      },
      '⚠️ LLM daily budget at 80% usage'
    );
  }

  return true;
}

/** Get current usage stats (for monitoring endpoint + dashboard). */
export function getLlmUsage(): {
  date: string;
  totalCalls: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  bySource: Record<string, number>;
} {
  maybeResetForNewDay();
  return {
    date: usage.date,
    totalCalls: usage.totalCalls,
    limit: MAX_DAILY_LLM_CALLS,
    remaining: Math.max(0, MAX_DAILY_LLM_CALLS - usage.totalCalls),
    percentUsed: Math.round((usage.totalCalls / MAX_DAILY_LLM_CALLS) * 100),
    bySource: { ...usage.bySource },
  };
}