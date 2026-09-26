/**
 * Unit tests for callFinalizer transcript role mapping.
 * Sarvam's analytics transcript API returns roles 'assistant'/'user'; webhook
 * transcript chips parse to 'ai'/'user'; legacy rows used 'agent'. speakerOf
 * must normalize ALL bot-side labels to agent — previously only 'agent'
 * matched, so poller-path transcripts rendered every line as "Customer:".
 */
import { describe, it, expect } from 'vitest';
import { toCallTurns, renderTranscriptText } from '../../src/sarvam/callFinalizer';

describe('transcript role mapping — Sarvam assistant/user labels', () => {
  it('renders assistant turns as Agent, user turns as Customer', () => {
    const text = renderTranscriptText([
      { role: 'assistant', text: 'नमस्ते, मैं शुभ बोल रहा हूँ' },
      { role: 'user', text: 'नोएडा में क्या options हैं?' },
    ]);
    expect(text).toBe('Agent: नमस्ते, मैं शुभ बोल रहा हूँ\nCustomer: नोएडा में क्या options हैं?');
  });

  it('maps assistant/ai/bot/Agent roles to the agent speaker for the summarizer', () => {
    const turns = toCallTurns([
      { role: 'assistant', text: 'a' },
      { role: 'ai', text: 'b' },
      { role: 'bot', text: 'c' },
      { role: 'Agent', text: 'd' },
      { role: 'user', text: 'e' },
      { role: 'customer', text: 'f' },
    ]);
    expect(turns.map((t) => t.speaker)).toEqual([
      'agent', 'agent', 'agent', 'agent', 'customer', 'customer',
    ]);
  });

  it('defaults missing/unknown roles to customer (never silently to agent)', () => {
    const turns = toCallTurns([
      { text: 'no role at all' },
      { role: 'mystery_speaker', text: 'unknown role' },
    ]);
    expect(turns.map((t) => t.speaker)).toEqual(['customer', 'customer']);
  });

  it('accepts the legacy speaker key shape too', () => {
    const turns = toCallTurns([{ speaker: 'assistant', text: 'x' }]);
    expect(turns[0]!.speaker).toBe('agent');
  });
});
