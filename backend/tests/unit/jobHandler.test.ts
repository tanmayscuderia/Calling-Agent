/**
 * Unit Test: jobHandler — Queue Processing Guards
 *
 * The processMessageJob() function is the async path that runs after a
 * WhatsApp message is enqueued. It's the SECOND line of defense after
 * whatsappService — between enqueue and execution, the conversation
 * state may have changed (AI disabled, human took over, etc).
 *
 * Critical regression to guard: handoff should NEVER set ai_enabled=false.
 * That would permanently kill the bot for that number.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase Mock Builder ────────────────────────────────

interface MockQueryResult {
  data: any | null;
  error: any | null;
}

function createMockSupabase() {
  // Per-table results so different queries return different data
  const tableResults: Record<string, MockQueryResult> = {};

  function makeChain(table: string): any {
    const getResult = () => tableResults[table] ?? { data: null, error: null };

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(getResult()),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      }),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(getResult()),
      single: vi.fn().mockResolvedValue(getResult()),
    };
    return chain;
  }

  const supabaseMock: any = {
    from: vi.fn((table: string) => makeChain(table)),
    _setTableResult: (table: string, result: MockQueryResult) => {
      tableResults[table] = result;
    },
  };

  return supabaseMock;
}

// ── Mocks ────────────────────────────────────────────────

let mockSupabase: any;

vi.mock('../../src/db/supabase', () => ({
  supabaseAdmin: () => mockSupabase,
}));

vi.mock('../../src/config', () => ({
  config: {
    defaultOrgId: 'test-org-id',
    whatsapp: { autoReply: true, ignoreGroups: true, allowedNumbers: [] },
    llm: { provider: 'deepseek' },
  },
}));

vi.mock('../../src/crm/leadService', () => ({
  findOrCreateLead: vi.fn(),
  updateLead: vi.fn().mockResolvedValue(undefined),
  computeStatus: vi.fn().mockReturnValue('contacted'),
}));

vi.mock('../../src/crm/conversationService', () => ({
  findOrCreateConversation: vi.fn(),
  insertMessage: vi.fn().mockResolvedValue({ id: 'msg-out-1' }),
  recentMessagesForAgent: vi.fn().mockResolvedValue([]),
  updateConversation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/ai/baseAgent', () => ({
  respondToMessage: vi.fn().mockResolvedValue({
    reply: 'Sure! What budget are you looking at?',
    extractedIntent: 'property_search',
    extractedData: { configuration: '3BHK', lead_temperature: 'warm' },
    matchedProperties: [],
    leadUpdates: {},
    shouldHandoff: false,
    model: 'deepseek-v4-flash',
    latencyMs: 500,
    quickReplies: [],
  }),
}));

vi.mock('../../src/ai/agentConfigService', () => ({
  getAgentConfig: vi.fn().mockResolvedValue({ industry: 'real_estate' }),
}));

vi.mock('../../src/ai/llmClient', () => ({
  llm: { activeModel: 'deepseek-v4-flash', generateText: vi.fn(), generateJson: vi.fn() },
}));

vi.mock('../../src/whatsapp/whatsappService', () => ({
  resolveAccountId: vi.fn().mockResolvedValue('test-account-id'),
}));

vi.mock('../../src/whatsapp/connectionManager', () => ({
  waManager: {
    getAdapter: vi.fn().mockReturnValue({
      sendMessage: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Import AFTER mocks
import { processMessageJob } from '../../src/queue/jobHandler';

// ── Helpers ──────────────────────────────────────────────

const ORG_ID = 'test-org-id';

function makePayload(overrides: any = {}) {
  return {
    orgId: ORG_ID,
    leadId: 'lead-1',
    conversationId: 'conv-1',
    messageId: 'msg-in-1',
    inboundText: 'I want a 3BHK in Noida',
    chatId: '919999999999@s.whatsapp.net',
    senderPhone: '+919999999999',
    externalMessageId: 'EXT-123',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────

describe('processMessageJob — Guards', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();

    // Default: lead + conversation exist, AI enabled, open, no handoff
    mockSupabase._setTableResult('crm_leads', {
      data: { id: 'lead-1', org_id: ORG_ID, status: 'new', phone: '+919999999999' },
      error: null,
    });
    mockSupabase._setTableResult('customer_conversations', {
      data: {
        id: 'conv-1',
        org_id: ORG_ID,
        lead_id: 'lead-1',
        status: 'open',
        ai_enabled: true,
        human_handoff: false,
      },
      error: null,
    });
    mockSupabase._setTableResult('ai_agent_runs', {
      data: { id: 'ai-run-1' },
      error: null,
    });

    // Reset AI mock to default (no handoff)
    const { respondToMessage } = await import('../../src/ai/baseAgent');
    (respondToMessage as any).mockResolvedValue({
      reply: 'Sure! What budget are you looking at?',
      extractedIntent: 'property_search',
      extractedData: { configuration: '3BHK', lead_temperature: 'warm' },
      matchedProperties: [],
      leadUpdates: {},
      shouldHandoff: false,
      model: 'deepseek-v4-flash',
      latencyMs: 500,
      quickReplies: [],
    });
  });

  // ── Happy Path ─────────────────────────────────────────

  it('processes message on happy path (AI enabled, open, no handoff)', async () => {
    await processMessageJob(ORG_ID, makePayload());

    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).toHaveBeenCalledTimes(1);
  });

  // ── Lead Not Found ─────────────────────────────────────

  it('skips processing when lead is not found', async () => {
    mockSupabase._setTableResult('crm_leads', { data: null, error: null });

    await processMessageJob(ORG_ID, makePayload());

    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).not.toHaveBeenCalled();
  });

  // ── Conversation Not Found ─────────────────────────────

  it('skips processing when conversation is not found', async () => {
    mockSupabase._setTableResult('customer_conversations', { data: null, error: null });

    await processMessageJob(ORG_ID, makePayload());

    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).not.toHaveBeenCalled();
  });

  // ── AI Disabled ────────────────────────────────────────

  it('skips processing when ai_enabled is false', async () => {
    mockSupabase._setTableResult('customer_conversations', {
      data: { id: 'conv-1', status: 'open', ai_enabled: false, human_handoff: false },
      error: null,
    });

    await processMessageJob(ORG_ID, makePayload());

    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).not.toHaveBeenCalled();
  });

  // ── Human Handoff Auto-Clear on New Inbound ───────────
  // A conversation stuck in human_handoff=true / pending_human should
  // NOT silently drop messages. A new inbound means the customer is
  // re-engaging, so handoff is cleared and AI resumes.

  it('clears human_handoff and processes when customer re-engages', async () => {
    mockSupabase._setTableResult('customer_conversations', {
      data: {
        id: 'conv-1',
        org_id: ORG_ID,
        lead_id: 'lead-1',
        status: 'pending_human',
        ai_enabled: true,
        human_handoff: true,
      },
      error: null,
    });

    await processMessageJob(ORG_ID, makePayload());

    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).toHaveBeenCalledTimes(1);
  });

  // ── Blocked Conversation ───────────────────────────────

  it('skips processing when conversation status is blocked', async () => {
    mockSupabase._setTableResult('customer_conversations', {
      data: { id: 'conv-1', status: 'blocked', ai_enabled: true, human_handoff: false },
      error: null,
    });

    await processMessageJob(ORG_ID, makePayload());

    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).not.toHaveBeenCalled();
  });

  // ── REGRESSION: Handoff does NOT kill AI ───────────────

  it('does NOT set ai_enabled=false when AI requests handoff', async () => {
    const { respondToMessage } = await import('../../src/ai/baseAgent');
    (respondToMessage as any).mockResolvedValue({
      reply: 'I will have a human agent contact you.',
      extractedIntent: 'callback_request',
      extractedData: { needs_human: true, lead_temperature: 'hot' },
      matchedProperties: [],
      leadUpdates: {},
      shouldHandoff: true,
      model: 'deepseek-v4-flash',
      latencyMs: 300,
      quickReplies: [],
    });

    await processMessageJob(ORG_ID, makePayload());

    const { updateConversation } = await import('../../src/crm/conversationService');
    const handoffCall = (updateConversation as any).mock.calls.find(
      (call: any[]) => call[2]?.human_handoff === true
    );

    expect(handoffCall).toBeTruthy();
    // Critical: ai_enabled must NOT be set to false
    expect(handoffCall[2]).not.toHaveProperty('ai_enabled');
    expect(handoffCall[2]).not.toHaveProperty('ai_enabled', false);
    // human_handoff and status should be set
    expect(handoffCall[2].human_handoff).toBe(true);
    expect(handoffCall[2].status).toBe('pending_human');
  });

  // ── Lead update ────────────────────────────────────────

  it('updates lead with temperature and status after AI response', async () => {
    await processMessageJob(ORG_ID, makePayload());

    const { updateLead } = await import('../../src/crm/leadService');
    expect(updateLead).toHaveBeenCalledWith(
      ORG_ID,
      'lead-1',
      expect.objectContaining({
        temperature: 'warm',
        status: 'contacted',
        last_contacted_at: expect.any(String),
      })
    );
  });
});