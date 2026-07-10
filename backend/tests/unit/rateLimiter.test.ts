/**
 * Unit Test: rateLimiter
 *
 * Tests all rate-limiting / abuse-protection logic:
 * - Org lock (is_locked)
 * - Token budget (daily)
 * - Message limits (hourly, daily, per-phone)
 * - Call limits
 * - Conversation AI reply limit
 *
 * NOTE: rateLimiter uses module-level caches (orgCounters, limitsCache)
 * that persist for the process lifetime. We use unique orgId per test
 * to avoid cross-test contamination.
 *
 * Supabase is mocked so we can control usage data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock data store ──────────────────────────────────────

let mockLimits: any = null;
let mockDailyUsage: any = null;
let mockHourlyUsage: any = null;
let mockPhoneCounter: any = null;
let currentMockOrg: string | null = null;

vi.mock('../../src/db/supabase', () => ({
  supabaseAdmin: () => ({
    from(tbl: string) {
      const query: any = {
        select() { return query; },
        eq(col: string, val: any) {
          // For org_usage_limits, only return limits for the current org
          if (col === 'org_id') currentMockOrg = val;
          return query;
        },
        maybeSingle() { return Promise.resolve({ data: getMockData(tbl), error: null }); },
        rpc() { return Promise.resolve({ data: null, error: null }); },
      };
      return query;
    },
    rpc() { return Promise.resolve({ data: null, error: null }); },
  }),
}));

function getMockData(tbl: string): any {
  switch (tbl) {
    case 'org_usage_limits': return mockLimits;
    case 'org_usage_daily': return mockDailyUsage;
    case 'org_usage_hourly': return mockHourlyUsage;
    case 'phone_message_counters': return mockPhoneCounter;
    default: return null;
  }
}

// Import AFTER mock
import {
  checkLLMAllowed,
  checkMessageAllowed,
  checkCallAllowed,
  checkConversationAILimit,
  recordTokenUsage,
  getUsageSummary,
  getOrgLimits,
} from '../../src/auth/rateLimiter';

const PHONE = '+919999999999';

function defaultLimits() {
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

// Unique org ID generator — each call gets a fresh org so caches don't bleed
let orgCounter = 0;
function freshOrg() {
  return `org-test-${++orgCounter}`;
}

// Reset ALL mocks before every test to prevent cross-test contamination
beforeEach(() => {
  mockLimits = null;
  mockDailyUsage = null;
  mockHourlyUsage = null;
  mockPhoneCounter = null;
});

// ── Tests ────────────────────────────────────────────────

describe('rateLimiter', () => {

  // ── checkLLMAllowed ───────────────────────────────────

  describe('checkLLMAllowed', () => {
    it('allows when under token budget and not locked', async () => {
      const org = freshOrg();
      mockDailyUsage = { tokens_in: 1000, tokens_out: 500, messages_sent: 5, calls_made: 2 };
      const result = await checkLLMAllowed(org);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('blocks when org is locked', async () => {
      const org = freshOrg();
      mockLimits = { ...defaultLimits(), is_locked: true, locked_reason: 'Payment overdue' };
      const result = await checkLLMAllowed(org);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Org locked');
      expect(result.reason).toContain('Payment overdue');
      expect(result.fallbackMessage).toBeTruthy();
    });

    it('blocks when daily token budget exceeded', async () => {
      const org = freshOrg();
      mockDailyUsage = { tokens_in: 400000, tokens_out: 200000, messages_sent: 5, calls_made: 2 };
      const result = await checkLLMAllowed(org);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('token budget');
      expect(result.fallbackMessage).toBeTruthy();
    });

    it('uses default limits when DB returns null', async () => {
      const org = freshOrg();
      mockLimits = null;
      mockDailyUsage = null;
      const result = await checkLLMAllowed(org);
      // Defaults: 500K tokens, 0 used → allowed
      expect(result.allowed).toBe(true);
    });
  });

  // ── checkMessageAllowed ───────────────────────────────

  describe('checkMessageAllowed', () => {
    it('allows when under all limits', async () => {
      const org = freshOrg();
      const result = await checkMessageAllowed(org, PHONE);
      expect(result.allowed).toBe(true);
    });

    it('blocks when org is locked', async () => {
      const org = freshOrg();
      mockLimits = { ...defaultLimits(), is_locked: true };
      const result = await checkMessageAllowed(org, PHONE);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Org locked');
    });

    it('blocks when hourly message limit reached', async () => {
      const org = freshOrg();
      mockHourlyUsage = { messages_sent: 100 };
      const result = await checkMessageAllowed(org, PHONE);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Hourly');
    });

    it('blocks when daily message limit reached', async () => {
      const org = freshOrg();
      mockDailyUsage = { tokens_in: 0, tokens_out: 0, messages_sent: 500, calls_made: 0 };
      const result = await checkMessageAllowed(org, PHONE);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily');
    });

    it('blocks when per-phone daily limit reached (anti-ban)', async () => {
      const org = freshOrg();
      mockPhoneCounter = { outbound_count: 20 };
      const result = await checkMessageAllowed(org, PHONE);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Per-phone');
      expect(result.reason).toContain('anti-ban');
    });

    it('allows when per-phone counter is below limit', async () => {
      const org = freshOrg();
      mockPhoneCounter = { outbound_count: 5 };
      const result = await checkMessageAllowed(org, PHONE);
      expect(result.allowed).toBe(true);
    });
  });

  // ── checkCallAllowed ──────────────────────────────────

  describe('checkCallAllowed', () => {
    it('allows when under call limit', async () => {
      const org = freshOrg();
      const result = await checkCallAllowed(org);
      expect(result.allowed).toBe(true);
    });

    it('blocks when org is locked', async () => {
      const org = freshOrg();
      mockLimits = { ...defaultLimits(), is_locked: true };
      const result = await checkCallAllowed(org);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Org locked');
    });

    it('blocks when daily call limit reached', async () => {
      const org = freshOrg();
      mockDailyUsage = { tokens_in: 0, tokens_out: 0, messages_sent: 0, calls_made: 50 };
      const result = await checkCallAllowed(org);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('call limit');
    });
  });

  // ── checkConversationAILimit ──────────────────────────

  describe('checkConversationAILimit', () => {
    it('allows when AI replies below limit', async () => {
      const org = freshOrg();
      const result = await checkConversationAILimit(org, 5);
      expect(result.allowed).toBe(true);
    });

    it('blocks at max_ai_replies_per_conversation (default 10)', async () => {
      const org = freshOrg();
      const result = await checkConversationAILimit(org, 10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Conversation AI reply limit');
      expect(result.fallbackMessage).toContain('connecting you with our team');
    });

    it('allows at 9 (just under limit)', async () => {
      const org = freshOrg();
      const result = await checkConversationAILimit(org, 9);
      expect(result.allowed).toBe(true);
    });

    it('uses custom limit from org_usage_limits', async () => {
      const org = freshOrg();
      mockLimits = { ...defaultLimits(), max_ai_replies_per_conversation: 3 };
      const result = await checkConversationAILimit(org, 3);
      expect(result.allowed).toBe(false);
    });
  });

  // ── getOrgLimits ──────────────────────────────────────

  describe('getOrgLimits', () => {
    it('returns defaults when no limits in DB', async () => {
      const org = freshOrg();
      mockLimits = null;
      const limits = await getOrgLimits(org);
      expect(limits.max_tokens_per_day).toBe(500000);
      expect(limits.max_messages_per_hour).toBe(100);
      expect(limits.is_locked).toBe(false);
    });

    it('returns DB limits when present', async () => {
      const org = freshOrg();
      mockLimits = { ...defaultLimits(), max_tokens_per_day: 1000000, is_locked: true };
      const limits = await getOrgLimits(org);
      expect(limits.max_tokens_per_day).toBe(1000000);
      expect(limits.is_locked).toBe(true);
    });
  });

  // ── recordTokenUsage ──────────────────────────────────

  describe('recordTokenUsage', () => {
    it('increments in-memory token counter', async () => {
      const org = freshOrg();
      await recordTokenUsage(org, 500, 300);
      const summary = await getUsageSummary(org);
      expect(summary.tokensUsedToday).toBe(800);
    });

    it('accumulates across multiple calls', async () => {
      const org = freshOrg();
      await recordTokenUsage(org, 100, 50);
      await recordTokenUsage(org, 200, 100);
      const summary = await getUsageSummary(org);
      expect(summary.tokensUsedToday).toBe(450);
    });
  });

  // ── getUsageSummary ───────────────────────────────────

  describe('getUsageSummary', () => {
    it('returns structured summary with limits and usage', async () => {
      const org = freshOrg();
      const summary = await getUsageSummary(org);
      expect(summary).toHaveProperty('tokensUsedToday');
      expect(summary).toHaveProperty('tokensLimit');
      expect(summary).toHaveProperty('messagesSentToday');
      expect(summary).toHaveProperty('messagesDailyLimit');
      expect(summary).toHaveProperty('callsToday');
      expect(summary).toHaveProperty('callsLimit');
      expect(summary).toHaveProperty('isLocked');
      expect(summary).toHaveProperty('percentTokenBudget');
    });

    it('calculates percentTokenBudget correctly', async () => {
      const org = freshOrg();
      await recordTokenUsage(org, 250000, 0); // 250K of 500K = 50%
      const summary = await getUsageSummary(org);
      expect(summary.percentTokenBudget).toBe(50);
    });
  });
});