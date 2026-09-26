/**
 * Unit tests for the Sarvam on_end webhook payload normalizer.
 * Focus: the minimal dashboard Body template the product actually ships with —
 * attempt_id, duration, caller_phone, call_transcript (a raw STRING chip) —
 * plus status inference when the dashboard omits a status chip (Sarvam's
 * on_end editor exposes none), and caller_phone → lead phone aliasing.
 */
import { describe, it, expect } from 'vitest';
import { normalizeSarvamPayload } from '../../src/routes/sarvamWebhook.routes';
import { sanitizeAgentVariables } from '../../src/sarvam/callResultService';

describe('normalizeSarvamPayload — minimal on_end Body template', () => {
  // The exact shape configured in the Sarvam dashboard (4 chips):
  // attempt_id=Attempt ID, duration=Call length in seconds,
  // caller_phone=caller_phone, call_transcript=Call transcript.
  const minimalBody = {
    attempt_id: 'attempt-abc-123',
    duration: 94,
    caller_phone: '+919812345678',
    call_transcript: 'AI: Hello, how can I help?\nUser: Looking for a 3BHK in Sector 66.\nAI: Sure, what is your budget?\n continuation line without label',
  };

  it('normalizes the minimal dashboard body', () => {
    const norm = normalizeSarvamPayload(minimalBody);
    expect(norm).not.toBeNull();
    expect(norm!.payload.attempt_id).toBe('attempt-abc-123');
    expect(norm!.payload.duration).toBe(94);
  });

  it('infers status=connected when the status chip is absent but a call happened', () => {
    const norm = normalizeSarvamPayload(minimalBody)!;
    expect(norm.payload.status).toBe('connected');
    expect(norm.notes.join(' ')).toMatch(/status inferred as connected/);
  });

  it('keeps status=unknown when there is no evidence of a real call', () => {
    const norm = normalizeSarvamPayload({ attempt_id: 'x' })!;
    expect(norm.payload.status).toBe('unknown');
  });

  it('prefers an explicit status field over inference', () => {
    const norm = normalizeSarvamPayload({ ...minimalBody, status: 'no_answer', duration: 0, call_transcript: '' })!;
    expect(norm.payload.status).toBe('no_answer');
  });

  it('parses the raw call_transcript string into turn rows', () => {
    const norm = normalizeSarvamPayload(minimalBody)!;
    const t = norm.payload.interaction_transcript;
    expect(t).toHaveLength(3);
    expect(t![0]).toEqual({ role: 'ai', en_text: 'Hello, how can I help?' });
    expect(t![1]).toEqual({ role: 'user', en_text: 'Looking for a 3BHK in Sector 66.' });
    // continuation line appends to the previous (AI) turn
    expect(t![2]!.en_text).toContain('Sure, what is your budget?');
    expect(t![2]!.en_text).toContain('continuation line');
    expect(t![2]!.role).toBe('ai');
    expect(norm.notes.join(' ')).toMatch(/call_transcript string parsed/);
  });

  it('hoists caller_phone into final_agent_variables', () => {
    const norm = normalizeSarvamPayload(minimalBody)!;
    expect(norm.payload.final_agent_variables).toMatchObject({ caller_phone: '+919812345678' });
  });

  it('returns null for bodies with no attempt identity at all', () => {
    expect(normalizeSarvamPayload(null)).toBeNull();
    expect(normalizeSarvamPayload({})).toBeNull();
  });

  it('still accepts the canonical full payload (interaction_transcript array wins)', () => {
    const canonical = {
      attempt_id: 'a1',
      status: 'connected',
      duration: 60,
      interaction_transcript: [{ role: 'ai', en_text: 'Hi' }],
    };
    const norm = normalizeSarvamPayload(canonical)!;
    expect(norm.payload.interaction_transcript).toEqual([{ role: 'ai', en_text: 'Hi' }]);
    expect(norm.payload.status).toBe('connected');
  });
});

describe('normalizeSarvamPayload — full 12-field on_end Body template', () => {
  // The Body template as configured in the dashboard: 12 {{...}} fields
  // (attempt_id, status, duration, phone + 8 agent output variables).
  const fullBody = {
    attempt_id: 'att-777',
    status: 'connected',
    duration: '94', // "Text" field type → numeric string
    phone: '+919812345678',
    customer_name: 'Rohit Sharma',
    city: 'Gurgaon',
    location: 'Sector 66',
    configuration: '3BHK',
    budget_min: '15000',
    budget_max: '20000',
    purpose: 'investment',
    timeline: '3 months',
  };

  it('normalizes every field of the full Body template', () => {
    const norm = normalizeSarvamPayload(fullBody)!;
    expect(norm).not.toBeNull();
    expect(norm.payload.attempt_id).toBe('att-777');
    expect(norm.payload.status).toBe('connected');
    expect(norm.payload.duration).toBe(94); // string "94" coerced
    const vars = norm.payload.final_agent_variables ?? {};
    expect(vars).toMatchObject({
      phone: '+919812345678',
      customer_name: 'Rohit Sharma',
      city: 'Gurgaon',
      location: 'Sector 66',
      configuration: '3BHK',
      budget_min: '15000',
      budget_max: '20000',
      purpose: 'investment',
      timeline: '3 months',
    });
  });

  it('coerces numeric-string duration; drops garbage duration', () => {
    expect(normalizeSarvamPayload({ attempt_id: 'a', duration: '94' })!.payload.duration).toBe(94);
    expect(normalizeSarvamPayload({ attempt_id: 'a', duration: '  120 ' })!.payload.duration).toBe(120);
    expect(normalizeSarvamPayload({ attempt_id: 'a', duration: 'n/a' })!.payload.duration).toBeUndefined();
  });

  it('skips unresolved {{...}} template placeholders (dashboard test-send fires raw template)', () => {
    const norm = normalizeSarvamPayload({
      attempt_id: 'att-test',
      status: 'connected',
      customer_name: '{{customer_name}}',
      city: '{{city}}',
      budget_max: '{{budget_max}}',
    })!;
    expect(norm.payload.final_agent_variables ?? {}).not.toHaveProperty('customer_name');
    expect(norm.payload.final_agent_variables ?? {}).not.toHaveProperty('city');
    expect(norm.payload.final_agent_variables ?? {}).not.toHaveProperty('budget_max');
  });

  it('treats unresolved {{status}} as absent → infers connected from call evidence', () => {
    const norm = normalizeSarvamPayload({
      attempt_id: 'att-real',
      status: '{{status}}', // no status chip in the picker → literal leaks through
      duration: '45',
    })!;
    expect(norm.payload.status).toBe('connected');
    expect(norm.payload.attempt_id).toBe('att-real');
    expect(norm.notes.join(' ')).toMatch(/status inferred as connected/);
  });

  it('returns null when EVERY identity field is an unresolved placeholder', () => {
    expect(normalizeSarvamPayload({ attempt_id: '{{attempt_id}}', status: '{{status}}' })).toBeNull();
  });
});

describe('sanitizeAgentVariables — caller_phone aliasing', () => {
  it('maps caller_phone to the whitelisted phone column', () => {
    const patch = sanitizeAgentVariables({ caller_phone: '+919812345678' });
    expect(patch).toEqual({ phone: '+919812345678' });
  });

  it('drops empty caller_phone values', () => {
    expect(sanitizeAgentVariables({ caller_phone: '' })).toEqual({});
    expect(sanitizeAgentVariables({ caller_phone: null })).toEqual({});
  });
});
