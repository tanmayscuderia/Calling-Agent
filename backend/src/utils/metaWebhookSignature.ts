/**
 * Verify the HMAC-SHA256 signature Meta attaches to webhook POSTs.
 *
 * Ported from wacrm (src/lib/whatsapp/webhook-signature.ts), adapted to
 * this repo's config + logger, with one addition: an explicit secret
 * argument (defaulting to config.meta.appSecret) so tests don't need
 * env fiddling.
 *
 * Meta signs the raw request body with your App Secret and sends the
 * result in the `x-hub-signature-256: sha256=<hex>` header. Without
 * verification, anyone who knows our webhook URL can POST fabricated
 * messages and inject fake leads / trigger AI replies.
 *
 * Reference:
 *   https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verify-payloads
 *
 * Contract:
 *   `META_APP_SECRET` is **required**. If it's missing we fail closed —
 *   every request is rejected until the operator configures the secret.
 *   (A fall-open version is unsafe: anyone who forgets the env var
 *   would be running a fully spoofable webhook.)
 */
import crypto from 'crypto';
import { config } from '../config';
import { logger } from './logger';

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secretOverride?: string
): boolean {
  const secret = secretOverride ?? config.meta.appSecret;
  if (!secret) {
    logger.error(
      '[meta-webhook] META_APP_SECRET is not set — rejecting request. ' +
        'Configure the env var (Meta → App Settings → Basic → App Secret) ' +
        'to enable signature verification.'
    );
    return false;
  }

  if (!signatureHeader) return false;
  if (!signatureHeader.startsWith('sha256=')) return false;

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  // Bail if lengths differ — timingSafeEqual throws otherwise.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}