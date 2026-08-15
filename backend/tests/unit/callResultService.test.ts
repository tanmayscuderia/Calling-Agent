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

const { mock, summarizeCallMock, updateLeadMock, createFollowupMock } = vi.hoisted(() => {
  interface MockQueryResult {
    data: any | null;
    error: any | null;
  }

  const tableResults: Record<string, MockQueryResult> = {};
  const insertCalls: Record<string, any[][]> = {};
  const updatePatches: Record<string, any[]> = {};

  function makeChain(table: string): any {
    const getResult = () => tableResults[table] ?? { data: null, error: null };

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((rows: any) => {
        (insertCalls[table] ??= []).push(Array.isArray(rows) ? rows : [rows]);
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(getResult()),
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
      maybeSingle: vi.fn().mockResolvedValue(getResult()),
      single: vi.fn().mockResolvedValue(getResult()),
    };
    return chain;
  }

  const sb: any = { from: vi.fn((t: string) => makeChain(t)) };
  return {
    mock: { sb, tableResults, insertCalls, updatePatches },
    summarizeCallMock: vi.fn(),
    updateLeadMock: vi.fn().mockResolvedValue({}),
    createFollowupMock: vi.fn().mockResolvedValue({}),
  };
});

vi.mock('../../src/db/supabase', () => ({ supabaseAdmin: () => mock.sb }));
vi.mock('../../src/ai/callAgent', () => ({ summarizeCall: summarizeCallMock }));
vi.mock('../../src/crm/leadService', () => ({
  updateLead: updateLeadMock,
  createFollowup: createFollowupMock,
}));

import { processCallResultJob } from '../../src/sarvam/callResultService';

const ORG = 'org-1';

function setTable(table: string, data: any, error: any = null) {
  mock.tableResults[table] = { data, error };
}

beforeEach(() => {
  vi.clearAllMocks();
  summarizeCallMock.mockReset();
  updateLeadMock.mockReset().mockResolvedValue({});
  createFollowupMock.mockReset().mockResolvedValue({});
  // Reset call-tracking arrays (clearAllMocks doesn't touch plain objects)
  for (const k of Object.keys(mock.tableResults)) delete mock.tableResults[k];
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