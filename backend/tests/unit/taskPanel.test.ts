/**
 * Unit tests for the Tasks panel auto-task mapping.
 * mapAutoTask turns an AI call outcome + the org's agent_configs.auto_task_rules
 * into a lead_followups task payload (industry-template-driven types/titles).
 */
import { describe, it, expect } from 'vitest';
import { mapAutoTask, type AutoTaskRule } from '../../src/crm/leadService';

const realEstateRules: AutoTaskRule[] = [
  { outcome: 'callback_requested', type: 'call', title: 'Call back {lead}', priority: 'high', due_offset_hours: 24 },
  { outcome: 'site_visit_requested', type: 'site_visit', title: 'Schedule site visit — {lead}', priority: 'urgent', due_offset_hours: 48 },
  { outcome: 'booking_requested', type: 'meeting', title: 'Close booking — {lead}', priority: 'urgent', due_offset_hours: 24 },
];

describe('mapAutoTask — AI outcome → task payload', () => {
  it('maps a matching outcome to the rule type/title/priority', () => {
    const t = mapAutoTask('site_visit_requested', realEstateRules, 'Rohit Sharma');
    expect(t).toMatchObject({
      type: 'site_visit',
      title: 'Schedule site visit — Rohit Sharma',
      priority: 'urgent',
      due_offset_hours: 48,
    });
  });

  it('substitutes {lead} with the lead name in the title', () => {
    const t = mapAutoTask('callback_requested', realEstateRules, 'Varun Bharadwaj', 'cs-123');
    expect(t!.title).toBe('Call back Varun Bharadwaj');
    expect(t!.call_session_id).toBe('cs-123');
  });

  it('falls back to "the customer" when the lead has no name', () => {
    const t = mapAutoTask('callback_requested', realEstateRules, null);
    expect(t!.title).toBe('Call back the customer');
  });

  it('returns null when no rule matches the outcome', () => {
    expect(mapAutoTask('price_negotiation', realEstateRules, 'X')).toBeNull();
  });

  it('returns null for missing outcome/rules', () => {
    expect(mapAutoTask(undefined, realEstateRules, 'X')).toBeNull();
    expect(mapAutoTask('callback_requested', null, 'X')).toBeNull();
    expect(mapAutoTask('callback_requested', [], 'X')).toBeNull();
  });

  it('defaults priority to medium and due offset to 24h when the rule omits them', () => {
    const t = mapAutoTask('callback_requested', [{ outcome: 'callback_requested', type: 'call', title: 'Ring {lead}' }], 'X');
    expect(t).toMatchObject({ priority: 'medium', due_offset_hours: 24, type: 'call' });
  });

  it('uses the industry template rules it is given (education campus_visit)', () => {
    const education: AutoTaskRule[] = [
      { outcome: 'site_visit_requested', type: 'campus_visit', title: 'Schedule campus visit — {lead}', priority: 'urgent', due_offset_hours: 48 },
    ];
    const t = mapAutoTask('site_visit_requested', education, 'Aditi');
    expect(t!.type).toBe('campus_visit');
  });
});
