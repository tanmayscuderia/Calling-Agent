/**
 * Unit Test: metaWebhookSignature — HMAC-SHA256 verification of Meta
 * webhook POSTs (ported from wacrm).
 *
 * Contract under test:
 *   - Valid signature (sha256=hex of HMAC(rawBody, secret)) → true
 *   - Any tampering with body or signature → false
 *   - Missing header / wrong prefix → false
 *   - Missing secret → false (fail closed — never fail open)
 */
import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyMetaWebhookSignature } from '../../src/utils/metaWebhookSignature';

const SECRET = 'test-meta-app-secret';

function sign(body: string, secret = SECRET): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

const BODY = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{ id: '1', changes: [{ value: { messages: [] } }] }],
});

describe('verifyMetaWebhookSignature', () => {
  it('accepts a valid signature', () => {
    expect(verifyMetaWebhookSignature(BODY, sign(BODY), SECRET)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const sig = sign(BODY);
    const tampered = BODY.replace('entry', 'entri');
    expect(verifyMetaWebhookSignature(tampered, sig, SECRET)).toBe(false);
  });

  it('rejects a tampered signature', () => {
    const sig = sign(BODY);
    const bad = sig.slice(0, -2) + (sig.endsWith('aa') ? 'bb' : 'aa');
    expect(verifyMetaWebhookSignature(BODY, bad, SECRET)).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    expect(verifyMetaWebhookSignature(BODY, sign(BODY, 'other-secret'), SECRET)).toBe(false);
  });

  it('rejects missing header', () => {
    expect(verifyMetaWebhookSignature(BODY, null, SECRET)).toBe(false);
    expect(verifyMetaWebhookSignature(BODY, undefined, SECRET)).toBe(false);
    expect(verifyMetaWebhookSignature(BODY, '', SECRET)).toBe(false);
  });

  it('rejects wrong prefix (must be sha256=)', () => {
    const raw = crypto.createHmac('sha256', SECRET).update(BODY).digest('hex');
    expect(verifyMetaWebhookSignature(BODY, `md5=${raw}`, SECRET)).toBe(false);
  });

  it('FAILS CLOSED when the secret is missing', () => {
    // Empty override short-circuits to "no secret" regardless of local .env.
    expect(verifyMetaWebhookSignature(BODY, sign(BODY), '')).toBe(false);
  });

  it('handles unicode bodies byte-exactly', () => {
    const unicode = JSON.stringify({ text: 'आपका स्वागत है 🏠 price ₹80L' });
    expect(verifyMetaWebhookSignature(unicode, sign(unicode), SECRET)).toBe(true);
  });
});