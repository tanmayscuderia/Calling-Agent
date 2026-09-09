/**
 * Unit Test: metaEncryption — AES-256-GCM token encryption.
 *
 * Ported from wacrm's encryption.test.ts. Verifies:
 *   - encrypt/decrypt round-trip (GCM)
 *   - unique ciphertext per call (random IV)
 *   - legacy CBC rows still decrypt (backward compat)
 *   - tampered ciphertext FAILS HARD (GCM auth tag)
 *   - format detection + key validation errors
 */
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isLegacyFormat } from '../../src/utils/metaEncryption';
import crypto from 'crypto';

// Fixed 64-hex test key (32 bytes) — never use in production.
const TEST_KEY = 'a'.repeat(64);
const LEGACY_CBC_KEY_HEX = 'b'.repeat(64);

function encryptLegacyCbc(plaintext: string, keyHex: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(keyHex, 'hex'), iv);
  let enc = cipher.update(plaintext, 'utf8', 'hex');
  enc += cipher.final('hex');
  return `${iv.toString('hex')}:${enc}`;
}

describe('metaEncryption', () => {
  it('recovers the original plaintext (GCM round-trip)', () => {
    const secret = 'EAAG-secret-system-user-token-1234567890';
    const enc = encrypt(secret, TEST_KEY);
    expect(enc.split(':').length).toBe(3);
    expect(decrypt(enc, TEST_KEY)).toBe(secret);
  });

  it('produces different ciphertext each call (random IV)', () => {
    expect(encrypt('same', TEST_KEY)).not.toBe(encrypt('same', TEST_KEY));
  });

  it('decrypts legacy CBC ciphertexts (backward compat)', () => {
    const secret = 'old-cbc-token';
    const legacy = encryptLegacyCbc(secret, LEGACY_CBC_KEY_HEX);
    expect(isLegacyFormat(legacy)).toBe(true);
    expect(decrypt(legacy, LEGACY_CBC_KEY_HEX)).toBe(secret);
  });

  it('isLegacyFormat: false for GCM, true for CBC, false for junk', () => {
    expect(isLegacyFormat(encrypt('x', TEST_KEY))).toBe(false);
    expect(isLegacyFormat('aabb:ccdd')).toBe(true);
    expect(isLegacyFormat('no-colons')).toBe(false);
  });

  it('fails HARD on tampered ciphertext (GCM auth tag)', () => {
    const enc = encrypt('do-not-mutate', TEST_KEY);
    const parts = enc.split(':');
    // Flip one hex char in the ciphertext body.
    const flipped = parts[1][0] === '0' ? '1' + parts[1].slice(1) : '0' + parts[1].slice(1);
    const tampered = `${parts[0]}:${flipped}:${parts[2]}`;
    expect(() => decrypt(tampered, TEST_KEY)).toThrow();
  });

  it('rejects tampered auth tag', () => {
    const enc = encrypt('x', TEST_KEY);
    const parts = enc.split(':');
    const badTag = `${parts[0]}:${parts[1]}:${'f'.repeat(32)}`;
    expect(() => decrypt(badTag, TEST_KEY)).toThrow();
  });

  it('rejects wrong key', () => {
    const enc = encrypt('x', TEST_KEY);
    expect(() => decrypt(enc, 'c'.repeat(64))).toThrow();
  });

  it('rejects malformed / short keys', () => {
    expect(() => encrypt('x', 'tooshort')).toThrow(/64 hex/);
    // Empty override short-circuits to "no key" regardless of local .env.
    expect(() => encrypt('x', '')).toThrow(/ENCRYPTION_KEY/);
    expect(() => decrypt('not:even:real:stuff', TEST_KEY)).toThrow(/unrecognised format/);
  });
});