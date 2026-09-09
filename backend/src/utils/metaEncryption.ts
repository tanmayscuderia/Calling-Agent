/**
 * Meta token encryption (AES-256-GCM).
 *
 * Ported from wacrm (src/lib/whatsapp/encryption.ts) with one change:
 * the key is an explicit argument (defaulting to config.meta.encryptionKey)
 * so tests don't need env fiddling and call sites are explicit about
 * which key they use.
 *
 * Format — GCM (current):
 *   `<iv-hex>:<ciphertext-hex>:<authTag-hex>`      (two colons)
 *
 * Format — CBC (legacy, decrypt-only):
 *   `<iv-hex>:<ciphertext-hex>`                    (one colon)
 *
 * Why GCM instead of CBC:
 *   CBC without a MAC is unauthenticated — an attacker who can write
 *   rows to `whatsapp_accounts` (directly, via an RLS bug, or by
 *   modifying a DB backup) can flip ciphertext bits without the
 *   decrypt throwing. GCM appends a 16-byte authentication tag; any
 *   tampering fails the decrypt hard.
 *
 * Backward compatibility:
 *   `decrypt()` auto-detects the format by counting parts, so legacy
 *   rows keep working. `encrypt()` output is always GCM.
 */
import crypto from 'crypto';
import { config } from '../config';

const GCM_IV_LENGTH = 12; // NIST-recommended IV length for GCM
const CBC_IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/** Resolve + validate the AES key. Throws with an actionable message. */
function getKey(keyHex?: string): Buffer {
  const hex = keyHex ?? config.meta.encryptionKey;
  if (!hex) {
    throw new Error(
      'ENCRYPTION_KEY is not set — Meta access tokens cannot be stored. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes for AES-256-GCM)');
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(text: string, keyHex?: string): string {
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(keyHex), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

export function decrypt(encryptedText: string, keyHex?: string): string {
  const parts = encryptedText.split(':');

  if (parts.length === 3) {
    // GCM — current format.
    const [ivHex, ctHex, tagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    if (iv.length !== GCM_IV_LENGTH) {
      throw new Error(`Encrypted token has unexpected GCM IV length ${iv.length}`);
    }
    const authTag = Buffer.from(tagHex, 'hex');
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Encrypted token has unexpected GCM auth-tag length ${authTag.length}`);
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(keyHex), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ctHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  if (parts.length === 2) {
    // CBC — legacy. Read-only; `encrypt()` never produces this shape.
    const [ivHex, ctHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    if (iv.length !== CBC_IV_LENGTH) {
      throw new Error(`Encrypted token has unexpected CBC IV length ${iv.length}`);
    }
    const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(keyHex), iv);
    let decrypted = decipher.update(ctHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  throw new Error(
    `Encrypted token has unrecognised format (expected 1 or 2 colons, got ${parts.length - 1})`
  );
}

/**
 * Cheap format detector — call sites use this to decide whether to
 * write a refreshed GCM ciphertext back to the database after a
 * successful legacy decrypt. Purely a structural check.
 */
export function isLegacyFormat(encryptedText: string): boolean {
  return encryptedText.split(':').length === 2;
}