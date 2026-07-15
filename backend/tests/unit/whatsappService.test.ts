/**
 * Unit Test: whatsappService — Message Pipeline Guards
 *
 * The whatsappService.handleIncomingMessage() function is the CRITICAL path:
 * every inbound WhatsApp message goes through it. A bug here means:
 *   - Duplicate messages create duplicate leads
 *   - AI replies when it shouldn't (blocked conversations, manual disable)
 *   - Human handoff is incorrectly cleared or never cleared
 *   - The AI gets disabled permanently when it shouldn't be
 *
 * We mock Supabase + dependent services so these tests run instantly
 * with zero DB or LLM calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase Mock Builder ────────────────────────────────

interface MockQueryResult {
  data: any | null;
  error: any | null;
}

function createMockSupabase(defaultResult: MockQueryResult = { data: null, error: null }) {
  let currentResult: MockQueryResult = { ...defaultResult };

  function makeChain(): any {
    const r = currentResult;
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(r),
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
      maybeSingle: vi.fn().mockResolvedValue(r),
      single: vi.fn().mockResolvedValue(r),
    };
    return chain;
  }

  const supabaseMock: any = {
    from: vi.fn(() => makeChain()),
    _setResult: (r: MockQueryResult) => {
      currentResult = r;
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
    whatsapp: {
      provider: 'baileys',
      autoReply: true,
      ignoreGroups: true,
      allowedNumbers: [],
      selfMessageTest: false,
    },
    llm: { provider: 'deepseek' },
  },
}));

vi.mock('../../src/crm/leadService', () => ({
  findOrCreateLead: vi.fn().mockResolvedValue({
    id: 'lead-1',
    org_id: 'test-org-id',
    phone: '+919999999999',
    status: 'new',
    full_name: null,
  }),
  updateLead: vi.fn().mockResolvedValue(undefined),
  computeStatus: vi.fn().mockReturnValue('contacted'),
}));

vi.mock('../../src/crm/conversationService', () => ({
  findOrCreateConversation: vi.fn().mockResolvedValue({
    id: 'conv-1',
    org_id: 'test-org-id',
    lead_id: 'lead-1',
    status: 'open',
    ai_enabled: true,
    human_handoff: false,
  }),
  insertMessage: vi.fn().mockResolvedValue({ id: 'msg-1' }),
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

// Import AFTER mocks
import { handleIncomingMessage } from '../../src/whatsapp/whatsappService';

// ── Helpers ──────────────────────────────────────────────

function makeParsedMessage(overrides: any = {}) {
  return {
    externalMessageId: 'MSG-' + Date.now(),
    chatId: '919999999999@s.whatsapp.net',
    senderId: '919999999999@s.whatsapp.net',
    senderPhone: '+919999999999',
    senderName: null,
    isGroup: false,
    text: 'I want a 3BHK in Noida',
    messageType: 'text',
    raw: {},
    receivedAt: new Date().toISOString(),
    ...overrides,
  };
}

const noopSend = vi.fn().mockResolvedValue(undefined);

// accountId is passed in options to bypass resolveAccountId (which would
// call the real Supabase and need its own mock chain).
const OPTS = { accountId: 'test-account-id' };

// ── Tests ────────────────────────────────────────────────

describe('whatsappService.handleIncomingMessage — Guards', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();

    // Reset conversation mock to default (AI enabled, open, no handoff)
    const { findOrCreateConversation } = await import('../../src/crm/conversationService');
    (findOrCreateConversation as any).mockResolvedValue({
      id: 'conv-1',
      org_id: 'test-org-id',
      lead_id: 'lead-1',
      status: 'open',
      ai_enabled: true,
      human_handoff: false,
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

  it('returns AI reply on happy path (AI enabled, auto-reply on)', async () => {
    mockSupabase._setResult({ data: null, error: null });

    const result = await handleIncomingMessage(makeParsedMessage(), noopSend, OPTS);

    expect(result.reply).toBeTruthy();
    expect(result.leadId).toBe('lead-1');
    expect(result.conversationId).toBe('conv-1');
  });

  // ── Dedup ──────────────────────────────────────────────

  it('skips processing when message is a duplicate (external_message_id exists)', async () => {
    mockSupabase._setResult({ data: { id: 'existing-msg' }, error: null });

    const result = await handleIncomingMessage(
      makeParsedMessage({ externalMessageId: 'DUP-123' }),
      noopSend,
      OPTS
    );

    expect(result.reply).toBe('');
    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).not.toHaveBeenCalled();
  });

  // ── Blocked Conversation ───────────────────────────────

  it('skips AI when conversation status is blocked', async () => {
    mockSupabase._setResult({ data: null, error: null });
    const { findOrCreateConversation } = await import('../../src/crm/conversationService');
    (findOrCreateConversation as any).mockResolvedValue({
      id: 'conv-1',
      status: 'blocked',
      ai_enabled: true,
      human_handoff: false,
    });

    const result = await handleIncomingMessage(makeParsedMessage(), noopSend, OPTS);

    expect(result.reply).toBe('');
    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).not.toHaveBeenCalled();
  });

  // ── AI Manually Disabled ───────────────────────────────

  it('skips AI when ai_enabled is false (manual disable)', async () => {
    mockSupabase._setResult({ data: null, error: null });
    const { findOrCreateConversation } = await import('../../src/crm/conversationService');
    (findOrCreateConversation as any).mockResolvedValue({
      id: 'conv-1',
      status: 'open',
      ai_enabled: false,
      human_handoff: false,
    });

    const result = await handleIncomingMessage(makeParsedMessage(), noopSend, OPTS);

    expect(result.reply).toBe('');
    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).not.toHaveBeenCalled();
  });

  // ── Handoff Logic ──────────────────────────────────────

  it('clears stale human_handoff and resumes AI when customer sends new message', async () => {
    mockSupabase._setResult({ data: null, error: null });
    const { findOrCreateConversation } = await import('../../src/crm/conversationService');
    (findOrCreateConversation as any).mockResolvedValue({
      id: 'conv-1',
      status: 'pending_human',
      ai_enabled: true,
      human_handoff: true, // stale handoff
    });

    const result = await handleIncomingMessage(makeParsedMessage(), noopSend, OPTS);

    const { respondToMessage } = await import('../../src/ai/baseAgent');
    expect(respondToMessage).toHaveBeenCalled();
    expect(result.reply).toBeTruthy();

    const { updateConversation } = await import('../../src/crm/conversationService');
    expect(updateConversation).toHaveBeenCalledWith(
      'test-org-id',
      'conv-1',
      expect.objectContaining({ human_handoff: false, status: 'open' })
    );
  });

  // ── Handoff does NOT kill AI ───────────────────────────

  it('does NOT disable ai_enabled when AI requests handoff (regression guard)', async () => {
    mockSupabase._setResult({ data: null, error: null });
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

    await handleIncomingMessage(makeParsedMessage(), noopSend, OPTS);

    const { updateConversation } = await import('../../src/crm/conversationService');
    const handoffCall = (updateConversation as any).mock.calls.find(
      (call: any[]) => call[2]?.human_handoff === true
    );
    expect(handoffCall).toBeTruthy();
    expect(handoffCall[2]).not.toHaveProperty('ai_enabled', false);
  });

  // ── skipDelivery option ────────────────────────────────

  it('does not call sendMessageFn when skipDelivery is true', async () => {
    mockSupabase._setResult({ data: null, error: null });

    await handleIncomingMessage(makeParsedMessage(), noopSend, {
      ...OPTS,
      skipDelivery: true,
    });

    expect(noopSend).not.toHaveBeenCalled();
  });

  it('calls sendMessageFn when skipDelivery is false/undefined', async () => {
    mockSupabase._setResult({ data: null, error: null });

    await handleIncomingMessage(makeParsedMessage(), noopSend, OPTS);

    expect(noopSend).toHaveBeenCalledWith(
      '919999999999@s.whatsapp.net',
      expect.any(String)
    );
  });

  // ── Lead update ────────────────────────────────────────

  it('updates lead temperature and status after AI response', async () => {
    mockSupabase._setResult({ data: null, error: null });

    await handleIncomingMessage(makeParsedMessage(), noopSend, OPTS);

    const { updateLead } = await import('../../src/crm/leadService');
    expect(updateLead).toHaveBeenCalledWith(
      'test-org-id',
      'lead-1',
      expect.objectContaining({
        temperature: 'warm',
        status: 'contacted',
        last_contacted_at: expect.any(String),
      })
    );
  });
});