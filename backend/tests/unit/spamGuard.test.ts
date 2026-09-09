/**
 * Unit Test: spamGuard — pure heuristic logic (Stage 1).
 *
 * These functions decide when the Stage 2 LLM referee is invoked, so the
 * thresholds must be LIBERAL: a real customer firing rapid-fire questions
 * ("price? kya hai? show me") must NEVER trip them. Only actual flooding
 * and copy-paste spam should.
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeForCompare,
  bigramJaccard,
  isNearDuplicate,
  evaluateSignals,
} from '../../src/whatsapp/spamGuard';

describe('normalizeForCompare', () => {
  it('strips punctuation, emoji and whitespace', () => {
    expect(normalizeForCompare('Price?! 🏠 ₹2Cr')).toBe('price2cr');
  });

  it('keeps Hinglish + Devanagari consistently (matras stripped — fine, transform is stable)', () => {
    // The transform only needs to be CONSISTENT for duplicate detection,
    // not linguistically perfect: 'क्या हाल है?' → 'कयहलह' every time.
    expect(normalizeForCompare('क्या हाल है?')).toBe('कयहलह');
    expect(normalizeForCompare('क्या हाल है')).toBe('कयहलह');
  });
});

describe('isNearDuplicate', () => {
  it('detects near-identical texts (punctuation/emoji differences ignored)', () => {
    expect(isNearDuplicate('price?', 'Price!! 😡')).toBe(true);
    expect(isNearDuplicate('bhai price batao', 'bhai price batao na')).toBe(true);
  });

  it('does NOT flag different genuine questions', () => {
    expect(isNearDuplicate('2BHK ka price kya hai?', 'Greater Noida West mein villa available hai?')).toBe(false);
    expect(isNearDuplicate('Ravet mein kab tak aaoge?', 'Koi partner builder hai wahan?')).toBe(false);
  });
});

describe('evaluateSignals', () => {
  it('passes a chatty-but-genuine burst well under limits', () => {
    // 14 rapid messages in 5 min, all GENUINELY different questions —
    // liberal by design: a real customer firing quick questions is normal.
    const texts = [
      '2BHK ka price kya hai?', 'Sector 76 mein available hai?', 'possession kab tak hai?',
      'brochure bhej do please', 'site visit kab kar sakte hain?', 'loan ka option hai?',
      'corner unit hai kya?', 'furnishing included hai?', 'maintenance kitna hai?',
      'parking milégi?', 'gym aur pool hai?', 'builder kaun sa hai?',
      'negotiation ho sakta hai?', 'registry charges kitne?'
    ];
    const res = evaluateSignals(14, 14, [...texts]);
    expect(res.tripped).toBe(false);
  });

  it('trips on burst at ≥15 messages in the window', () => {
    const res = evaluateSignals(15, 15, ['hi']);
    expect(res.tripped).toBe(true);
    expect(res.signals).toContain('burst');
  });

  it('trips on daily flood at ≥100 messages/day', () => {
    const res = evaluateSignals(3, 100, ['hi']);
    expect(res.tripped).toBe(true);
    expect(res.signals).toContain('daily_flood');
  });

  it('trips repetition: 3+ of the last 4 near-identical', () => {
    const res = evaluateSignals(
      2,
      2,
      ['kya haal hai bhai', 'price batao', 'PRICE BATAO!!', 'price batao???', 'price batao']
    );
    expect(res.tripped).toBe(true);
    expect(res.signals).toContain('repetition');
  });

  it('does NOT trip repetition when questions differ', () => {
    const res = evaluateSignals(
      2,
      2,
      ['2BHK ka price?', 'Sector 76 mein availability?', 'possession kab tak?', 'brochure bhejo', 'site visit kab?']
    );
    expect(res.signals).not.toContain('repetition');
  });

  it('needs at least 3 messages before repetition can trip', () => {
    const res = evaluateSignals(2, 2, ['price?', 'price?']);
    expect(res.signals).not.toContain('repetition');
  });

  it('can trip on multiple signals at once', () => {
    const texts = ['same text here', 'same text here', 'same text here', 'same text here', 'same text here'];
    const res = evaluateSignals(15, 100, texts);
    expect(res.signals).toContain('burst');
    expect(res.signals).toContain('daily_flood');
    expect(res.signals).toContain('repetition');
  });
});