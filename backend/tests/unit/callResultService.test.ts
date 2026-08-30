/**
 * Unit Test: Sarvam callResultService — webhook → call_sessions processing
 *
 * processCallResultJob() is the async path after a Sarvam webhook lands.
 * Critical guards:
 *   1. Unknown attempt_id must NOT throw (Sarvam test pings) — skip + mark processed.
 *   2. Duplicate webhooks (call already terminal) must NOT rewrite turns/summaries.
 *   3. Connected call → status 'completed' + turns inserted + summary applied to lead.
 *   4. Failed/no_answer call → terminal status + failure reason surfaced, no LLM call.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (vi.mock factories are hoisted above const decls) ──

  const { mock, summarizeCallMock, updateLeadMock, createFollowupMock, findOrCreateLeadMock, listAttemptsMock } = vi.hoisted(() => {
  interface MockQueryResult {
    data: any | null;
    error: any | null;
  }

  const tableResults: Record<string, MockQueryResult> = {};
  const tableSequences: Record<string, MockQueryResult[]> = {};
  const insertCalls: Record<string, any[][]> = {};
  const updatePatches: Record<string, any[]> = {};

  function makeChain(table: string): any {
    // Sequences let a test serve a different result per terminal call
    // (e.g. dedupe lookup → null, then insert().select().single() → new row).
    const nextResult = (): MockQueryResult =>
      (tableSequences[table]?.length ? tableSequences[table].shift()! : tableResults[table]) ??
      { data: null, error: null };

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((rows: any) => {
        (insertCalls[table] ??= []).push(Array.isArray(rows) ? rows : [rows]);
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => Promise.resolve(nextResult())),
          }),
        };
      }),
      update: vi.fn().mockImplementation((patch: any) => {
        (updatePatches[table] ??= []).push(patch);
        return chain;
      }),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(nextResult())),
      single: vi.fn().mockImplementation(() => Promise.resolve(nextResult())),
    };
    return chain;
  }

  const sb: any = { from: vi.fn((t: string) => makeChain(t)) };
  return {
    mock: { sb, tableResults, tableSequences, insertCalls, updatePatches },
    summarizeCallMock: vi.fn(),
    updateLeadMock: vi.fn().mockResolvedValue({}),
    createFollowupMock: vi.fn().mockResolvedValue({}),
    findOrCreateLeadMock: vi.fn().mockResolvedValue({ id: 'lead-9' }),
    listAttemptsMock: vi.fn(),
  };
});

vi.mock('../../src/db/supabase', () => ({ supabaseAdmin: () => mock.sb }));
vi.mock('../../src/ai/callAgent', () => ({ summarizeCall: summarizeCallMock }));
vi.mock('../../src/crm/leadService', () => ({
  updateLead: updateLeadMock,
  createFollowup: createFollowupMock,
  findOrCreateLead: findOrCreateLeadMock,
}));
vi.mock('../../src/sarvam/sarvamClient', () => ({
  listAttempts: listAttemptsMock,
}));

import { processCallResultJob, ingestInboundAttempt } from '../../src/sarvam/callResultService';
import { config } from '../../src/config';

const ORG = 'org-1';

function setTable(table: string, data: any, error: any = null) {
  mock.tableResults[table] = { data, error };
}

/** Serve one result per terminal call, in order (falls back to setTable). */
function setSequence(table: string, ...results: any[]) {
  mock.tableSequences[table] = results.map((data) => ({ data, error: null }));
}

beforeEach(() => {
  vi.clearAllMocks();
  summarizeCallMock.mockReset();
  updateLeadMock.mockReset().mockResolvedValue({});
  createFollowupMock.mockReset().mockResolvedValue({});
  findOrCreateLeadMock.mockReset().mockResolvedValue({ id: 'lead-9' });
  listAttemptsMock.mockReset();
  (config.sarvam as any).inboundNumber = ''; // inbound disabled unless a test opts in
  // Reset call-tracking arrays (clearAllMocks doesn't touch plain objects)
  for (const k of Object.keys(mock.tableResults)) delete mock.tableResults[k];
  for (const k of Object.keys(mock.tableSequences)) delete mock.tableSequences[k];
  for (const k of Object.keys(mock.insertCalls)) delete mock.insertCalls[k];
  for (const k of Object.keys(mock.updatePatches)) delete mock.updatePatches[k];
  mock.tableResults['call_sessions'] = { data: null, error: null };
  mock.tableResults['call_session_turns'] = { data: null, error: null };
  mock.tableResults['sarvam_webhook_events'] = { data: null, error: null };
});

describe('processCallResultJob — Sarvam webhook → call_sessions', () => {
  it('skips unknown attempt_id without throwing and marks event processed', async () => {
    setTable('call_sessions', null); // no matching call_session

    await expect(
      processCallResultJob(ORG, {
        webhookEventId: 'evt-1',
        payload: { attempt_id: 'att-unknown', status: 'connected' } as any,
      })
    ).resolves.toBeUndefined();

    // Webhook event marked processed, nothing else touched
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1);
    expect(mock.updatePatches['call_sessions']).toBeUndefined();
    expect(summarizeCallMock).not.toHaveBeenCalled();
  });

  it('skips duplicate webhook when call already terminal (no re-processing)', async () => {
    setTable('call_sessions', { id: 'call-1', lead_id: 'lead-1', status: 'completed' });

    await processCallResultJob(ORG, {
      webhookEventId: 'evt-2',
      payload: {
        attempt_id: 'att-1',
        status: 'connected',
        interaction_transcript: [{ role: 'agent', en_text: 'hello' }],
      } as any,
    });

    expect(summarizeCallMock).not.toHaveBeenCalled();
    expect(mock.insertCalls['call_session_turns']).toBeUndefined(); // no duplicate turns
    expect(mock.updatePatches['call_sessions']).toBeUndefined(); // no re-update
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1); // still acked
  });

  it('processes connected call: completed status + transcript turns + summary applied to lead', async () => {
    setTable('call_sessions', { id: 'call-1', lead_id: 'lead-1', status: 'in_progress' });
    summarizeCallMock.mockResolvedValue({
      data: {
        summary: 'Lead wants 3BHK in Noida',
        outcome: 'site_visit_requested',
        lead_temperature: 'hot',
        updated_preferences: { preferred_city: 'Noida' },
        next_follow_up_at: null,
      },
    });

    await processCallResultJob(ORG, {
      webhookEventId: 'evt-3',
      payload: {
        attempt_id: 'att-1',
        status: 'connected',
        duration: 125.4,
        interaction_id: 'ix-9',
        interaction_transcript: [
          { role: 'agent', en_text: 'Hi, is this about the 3BHK?' },
          { role: 'user', en_text: 'Yes, in Noida' },
        ],
      } as any,
    });

    // Summary called with mapped turns
    expect(summarizeCallMock).toHaveBeenCalledWith(
      [
        { speaker: 'agent', text: 'Hi, is this about the 3BHK?' },
        { speaker: 'customer', text: 'Yes, in Noida' },
      ],
      ORG
    );

    // call_sessions patched terminal + metadata
    const patch = mock.updatePatches['call_sessions'][0];
    expect(patch.status).toBe('completed');
    expect(patch.interaction_id).toBe('ix-9');
    expect(patch.duration_sec).toBe(125);
    expect(patch.summary).toBe('Lead wants 3BHK in Noida');
    expect(patch.outcome).toBe('site_visit_requested');
    expect(patch.transcript).toContain('Agent: Hi, is this about the 3BHK?');

    // Turns persisted
    expect(mock.insertCalls['call_session_turns'][0]).toHaveLength(2);

    // Lead enriched + follow-up created (site visit)
    expect(updateLeadMock).toHaveBeenCalled();
    expect(createFollowupMock).toHaveBeenCalledWith(
      ORG,
      'lead-1',
      expect.objectContaining({ type: 'site_visit', status: 'pending' })
    );

    // Event acked
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1);
  });

  it('processes failed call without LLM summary and surfaces failure reason', async () => {
    setTable('call_sessions', { id: 'call-2', lead_id: 'lead-2', status: 'in_progress' });

    await processCallResultJob(ORG, {
      webhookEventId: 'evt-4',
      payload: {
        attempt_id: 'att-2',
        status: 'failed',
        failure_reason: 'number_not_reachable',
      } as any,
    });

    expect(summarizeCallMock).not.toHaveBeenCalled();
    const patch = mock.updatePatches['call_sessions'][0];
    expect(patch.status).toBe('failed');
    expect(patch.outcome).toBe('failed');
    expect(patch.summary).toBe('Call failed: number_not_reachable');
    expect(patch.failure_reason).toBe('number_not_reachable');
    expect(updateLeadMock).not.toHaveBeenCalled();
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1);
  });

  it('maps no_answer to terminal no_answer status', async () => {
    setTable('call_sessions', { id: 'call-3', lead_id: null, status: 'in_progress' });

    await processCallResultJob(ORG, {
      webhookEventId: 'evt-5',
      payload: { attempt_id: 'att-3', status: 'no_answer' } as any,
    });

    const patch = mock.updatePatches['call_sessions'][0];
    expect(patch.status).toBe('no_answer');
    expect(patch.outcome).toBe('no_answer');
  });

  it('does not lose the call record when summarizeCall throws', async () => {
    setTable('call_sessions', { id: 'call-4', lead_id: 'lead-4', status: 'in_progress' });
    summarizeCallMock.mockRejectedValue(new Error('LLM down'));

    await expect(
      processCallResultJob(ORG, {
        webhookEventId: 'evt-6',
        payload: {
          attempt_id: 'att-4',
          status: 'connected',
          interaction_transcript: [{ role: 'agent', en_text: 'hi' }],
        } as any,
      })
    ).resolves.toBeUndefined();

    const patch = mock.updatePatches['call_sessions'][0];
    expect(patch.status).toBe('completed'); // still terminal
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1);
  });
});
// ── sanitizeAgentVariables / suggestOutputVariables ──
import { sanitizeAgentVariables, suggestOutputVariables } from '../../src/sarvam/callResultService';

describe('sanitizeAgentVariables', () => {
  it('maps known aliases to real columns', () => {
    const out = sanitizeAgentVariables({
      customer_name: 'Rohit',
      city: 'Noida',
      location: 'Sector 150',
      budget: '₹2,10,00,000',
    });
    expect(out.full_name).toBe('Rohit');
    expect(out.preferred_city).toBe('Noida');
    expect(out.preferred_location).toBe('Sector 150');
    expect(out.budget_max).toBe(21000000);
  });

  it('drops unknown/invalid columns (checklist 6-variable case must not break lead update)', () => {
    const out = sanitizeAgentVariables({
      customer_name: 'A',
      disposition: 'interested',        // not a crm_leads column
      lead_temperature: 'hot',          // maps to temperature — not patchable here
      preferred_location: 'Sohna',
      budget_max: 9000000,
      configuration: '2BHK',
      some_random_key: 'x',
    });
    expect(Object.keys(out).sort()).toEqual(['budget_max', 'configuration', 'full_name', 'preferred_location']);
  });

  it('coerces numeric strings for budget fields and skips unparseable ones', () => {
    const out = sanitizeAgentVariables({ budget_max: '1.65 Cr', budget_min: 'cheap' });
    // '1.65 Cr' → strips ₹, commas, cr → 1.65 (best-effort; numeric string accepted)
    expect(typeof out.budget_max).toBe('number');
    expect(out.budget_min).toBeUndefined();
  });

  it('handles null/empty values and nullish input', () => {
    expect(sanitizeAgentVariables(null)).toEqual({});
    expect(sanitizeAgentVariables(undefined)).toEqual({});
    expect(sanitizeAgentVariables({ configuration: '', preferred_city: null })).toEqual({});
  });
});

describe('suggestOutputVariables', () => {
  it('returns only patchable columns, aliased and deduped', () => {
    const out = suggestOutputVariables([
      { key: 'configuration', type: 'string' },
      { key: 'city', type: 'string' },
      { key: 'budget_max', type: 'number' },
      { key: 'budget', type: 'number' },      // alias of budget_max → dedup
      { key: 'name', type: 'string' },        // alias → full_name
      { key: 'site_visit', type: 'boolean' }, // not a lead column → dropped
    ]);
    expect(out.sort()).toEqual(['budget_max', 'configuration', 'full_name', 'preferred_city']);
  });

  it('returns empty array for empty fields', () => {
    expect(suggestOutputVariables([])).toEqual([]);
  });
});

// ── Inbound calls (Phase S5) ───────────────────────────────────────────

const inboundAttempt = {
  attempt_id: 'att-in-1',
  user_identifier: '+919000000000',
  interaction_id: 'ix-in-1',
  connectivity_status: 'connected',
  duration_in_seconds: 61,
  start_datetime: '2026-01-01T10:00:00Z',
  agent_variables: null,
  failure_reason: null,
  audio_url: null,
};

describe('ingestInboundAttempt — analytics attempt → inbound call_session', () => {
  it('creates inbound session, finds/creates lead by caller phone, finalizes, acks event', async () => {
    // dedupe lookup → null; insert().select().single() → new session
    setSequence('call_sessions', null, { id: 'call-in-1', lead_id: 'lead-9' });
    summarizeCallMock.mockResolvedValue({
      data: { summary: 'Caller wants pricing', outcome: 'interested', lead_temperature: 'warm', updated_preferences: {} },
    });

    const result = await ingestInboundAttempt(ORG, inboundAttempt, {
      webhookEventId: 'evt-in-1',
      payload: {
        attempt_id: 'att-in-1',
        status: 'connected',
        duration: 61,
        interaction_transcript: [
          { role: 'agent', en_text: 'Hello! How can I help?' },
          { role: 'user', en_text: 'Tell me pricing' },
        ],
      } as any,
    });

    expect(result).toBe('processed');

    // Lead resolved by caller phone (WhatsApp-inbound parity)
    expect(findOrCreateLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: ORG, phone: '+919000000000', source: 'inbound_call' })
    );

    // Inbound session shape
    const row = mock.insertCalls['call_sessions'][0][0];
    expect(row.direction).toBe('inbound');
    expect(row.provider).toBe('sarvam');
    expect(row.external_call_id).toBe('att-in-1');
    expect(row.from_number).toBe('+919000000000');
    expect(row.lead_id).toBe('lead-9');

    // Finalized: terminal status + interaction_id + summary-driven lead patch
    const patch = mock.updatePatches['call_sessions'][0];
    expect(patch.status).toBe('completed');
    expect(patch.interaction_id).toBe('ix-in-1');
    expect(updateLeadMock).toHaveBeenCalledWith(ORG, 'lead-9', expect.objectContaining({ temperature: 'warm' }));

    // Event acked by id
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1);
  });

  it('returns duplicate and skips insert when attempt already ingested', async () => {
    setTable('call_sessions', { id: 'existing-call' }); // dedupe lookup hits

    const result = await ingestInboundAttempt(ORG, inboundAttempt, { webhookEventId: 'evt-in-2' });

    expect(result).toBe('duplicate');
    expect(mock.insertCalls['call_sessions']).toBeUndefined();
    expect(summarizeCallMock).not.toHaveBeenCalled();
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1); // still acked
  });

  it('returns no_caller when analytics record has no user_identifier', async () => {
    setSequence('call_sessions', null);

    const result = await ingestInboundAttempt(ORG, { ...inboundAttempt, user_identifier: null }, { webhookEventId: 'evt-in-3' });

    expect(result).toBe('no_caller');
    expect(findOrCreateLeadMock).not.toHaveBeenCalled();
    expect(mock.insertCalls['call_sessions']).toBeUndefined();
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1); // acked so webhook stops retrying
  });
});

describe('processCallResultJob — inbound resolution for unknown attempts', () => {
  it('resolves unknown attempt as inbound via analytics and processes it', async () => {
    (config.sarvam as any).inboundNumber = '+917965854149'; // enable inbound branch
    listAttemptsMock.mockResolvedValue({
      items: [{ ...inboundAttempt, attempt_id: 'att-unk', channel_direction: 'inbound' }],
    });
    // initial lookup → null; ingest dedupe → null; ingest insert → session
    setSequence('call_sessions', null, null, { id: 'call-in-2', lead_id: 'lead-9' });
    summarizeCallMock.mockResolvedValue({ data: { summary: 'S', outcome: 'interested' } });

    await processCallResultJob(ORG, {
      webhookEventId: 'evt-in-9',
      payload: {
        attempt_id: 'att-unk',
        status: 'connected',
        interaction_transcript: [{ role: 'user', en_text: 'hi' }],
      } as any,
    });

    expect(listAttemptsMock).toHaveBeenCalled();
    expect(mock.insertCalls['call_sessions'][0][0].direction).toBe('inbound');
    expect(mock.insertCalls['call_sessions'][0][0].to_number).toBe('+917965854149');
    expect(summarizeCallMock).toHaveBeenCalled();
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1);
  });

  it('falls through to skip when the unknown attempt is outbound', async () => {
    (config.sarvam as any).inboundNumber = '+917965854149';
    listAttemptsMock.mockResolvedValue({
      items: [{ ...inboundAttempt, channel_direction: 'outbound' }],
    });
    setSequence('call_sessions', null);

    await processCallResultJob(ORG, {
      webhookEventId: 'evt-in-10',
      payload: { attempt_id: 'att-out', status: 'connected' } as any,
    });

    expect(mock.insertCalls['call_sessions']).toBeUndefined();
    expect(summarizeCallMock).not.toHaveBeenCalled();
    expect(mock.updatePatches['sarvam_webhook_events']).toHaveLength(1); // skip path still acks
  });
});
