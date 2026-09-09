import { describe, it, expect } from 'vitest';
import { jidToPhone, normalizePhone, isGroupJid, phoneToJid } from '../../src/utils/phone';

describe('jidToPhone', () => {
  it('converts standard WhatsApp JID to E.164', () => {
    expect(jidToPhone('919999999999@s.whatsapp.net')).toBe('+919999999999');
  });

  it('strips group sender suffix', () => {
    expect(jidToPhone('919999999999@s.whatsapp.net:groupstuff')).toBe('+919999999999');
  });

  it('handles empty string', () => {
    expect(jidToPhone('')).toBe('');
  });

  it('handles JID without @', () => {
    expect(jidToPhone('919999999999')).toBe('+919999999999');
  });

  it('returns raw for non-digit base', () => {
    expect(jidToPhone('abc@s.whatsapp.net')).toBe('abc');
  });

  it('returns EMPTY for privacy LID JIDs — the digits are NOT a phone', () => {
    expect(jidToPhone('275101262078103@lid')).toBe('');
    expect(jidToPhone('252780317024353@lid')).toBe('');
  });

  it('returns EMPTY for newsletters, status broadcasts and groups', () => {
    expect(jidToPhone('120363168402828787@newsletter')).toBe('');
    expect(jidToPhone('status@broadcast')).toBe('');
    expect(jidToPhone('120363419202785729@g.us')).toBe('');
  });
});

describe('normalizePhone', () => {
  it('normalizes +91 format', () => {
    expect(normalizePhone('+91 99999 99999')).toBe('+919999999999');
  });

  it('normalizes 00 international prefix', () => {
    expect(normalizePhone('00919999999999')).toBe('+919999999999');
  });

  it('normalizes plain digits', () => {
    expect(normalizePhone('919999999999')).toBe('+919999999999');
  });

  it('handles empty string', () => {
    expect(normalizePhone('')).toBe('');
  });

  it('handles no digits', () => {
    expect(normalizePhone('abc')).toBe('');
  });

  it('strips spaces, dashes, parens', () => {
    expect(normalizePhone('+1 (234) 567-8900')).toBe('+12345678900');
  });
});

describe('isGroupJid', () => {
  it('returns true for group JIDs', () => {
    expect(isGroupJid('120363xxx@g.us')).toBe(true);
  });

  it('returns false for individual JIDs', () => {
    expect(isGroupJid('919999999999@s.whatsapp.net')).toBe(false);
  });

  it('returns false for empty', () => {
    expect(isGroupJid('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isGroupJid(null as any)).toBe(false);
  });
});

describe('phoneToJid', () => {
  it('builds WhatsApp JID from phone', () => {
    expect(phoneToJid('+919999999999')).toBe('919999999999@s.whatsapp.net');
  });

  it('strips non-digits', () => {
    expect(phoneToJid('+91 999 999 9999')).toBe('919999999999@s.whatsapp.net');
  });

  it('handles plain digits', () => {
    expect(phoneToJid('919999999999')).toBe('919999999999@s.whatsapp.net');
  });
});