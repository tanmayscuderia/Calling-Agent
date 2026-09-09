/**
 * Meta WhatsApp Cloud API helpers.
 *
 * Ported from wacrm (src/lib/whatsapp/meta-api.ts) — trimmed to what the
 * Calling Agent needs today (account verification/registration, sending,
 * media URL resolution, read receipts). Template-management helpers
 * (submit/edit/delete/sync) are intentionally NOT ported yet; add them
 * when broadcasts/templates become a feature.
 *
 * Every function takes a single options object (named parameters) instead
 * of positional arguments — same rationale as upstream: a typo surfaces
 * immediately as a TypeScript error instead of a runtime rejection from
 * Meta.
 *
 * Media note: unlike Baileys (which downloads media over the socket),
 * Cloud API media requires a second authorized GET against a signed URL.
 * `getMediaUrl` returns that URL; callers that want bytes can pass it to
 * `downloadMedia`.
 */
import { config } from '../config';

const apiBase = () => `https://graph.facebook.com/${config.meta.apiVersion}`;

export interface MetaSendResult {
  messageId: string;
}

export interface MetaPhoneInfo {
  id: string;
  display_phone_number: string;
  verified_name?: string;
  quality_rating?: string;
}

interface MetaErrorResponse {
  error?: { message?: string; code?: number; type?: string; error_subcode?: number };
}

function timeoutSignal(): AbortSignal | undefined {
  const ms = config.meta.requestTimeoutMs;
  return ms > 0 ? AbortSignal.timeout(ms) : undefined;
}

async function throwMetaError(response: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const data = (await response.json()) as MetaErrorResponse;
    if (data.error?.message) message = data.error.message;
  } catch {
    // response body wasn't JSON — keep the fallback
  }
  throw new Error(message);
}

// ============================================================
// Phone number / account
// ============================================================

export interface VerifyPhoneNumberArgs {
  phoneNumberId: string;
  accessToken: string;
}

/**
 * Verify a Meta phone number ID by fetching its public metadata
 * (display_phone_number, verified_name, quality_rating).
 */
export async function verifyPhoneNumber(
  args: VerifyPhoneNumberArgs
): Promise<MetaPhoneInfo> {
  const { phoneNumberId, accessToken } = args;
  const url = `${apiBase()}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: timeoutSignal(),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
  return response.json();
}

// ============================================================
// Cloud API registration (subscription for inbound webhooks)
// ============================================================
//
// Saving a phone_number_id + access_token is NOT enough to receive
// inbound events from Meta. Two extra calls are required:
//
//   POST /{phone_number_id}/register
//     Subscribes the number for THIS app's webhook. Requires a
//     6-digit 2FA PIN the user previously set in Meta WhatsApp
//     Manager → Two-step verification. Without /register, inbound
//     events are routed to whichever app last claimed the number.
//
//   POST /{waba_id}/subscribed_apps
//     Subscribes the WABA itself to this app. Required exactly
//     once per WABA, but idempotent so calling on every save is
//     safe and cheap.
//
// Both calls are no-ops when already done — Meta returns success and
// the helpers below treat that as success.

export interface RegisterPhoneNumberArgs {
  phoneNumberId: string;
  accessToken: string;
  /** 6-digit PIN from Meta WhatsApp Manager → Two-step verification. */
  pin: string;
}

export interface RegisterPhoneNumberResult {
  success: boolean;
  /**
   * True when Meta indicated the number was already registered to
   * THIS app — same outcome as a fresh registration from the
   * caller's POV, surfaced separately for logging clarity.
   */
  alreadyRegistered: boolean;
}

export async function registerPhoneNumber(
  args: RegisterPhoneNumberArgs
): Promise<RegisterPhoneNumberResult> {
  const { phoneNumberId, accessToken, pin } = args;
  const url = `${apiBase()}/${phoneNumberId}/register`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
    signal: timeoutSignal(),
  });

  if (response.ok) {
    return { success: true, alreadyRegistered: false };
  }

  // Meta returns an error envelope with a code. The text "already
  // registered" appears when the number is already subscribed to this
  // app — that's success from the caller's perspective.
  let data: { error?: { message?: string } } = {};
  try {
    data = await response.json();
  } catch {
    /* keep empty */
  }
  const message = data.error?.message ?? `Meta API error: ${response.status}`;
  if (/already.*registered/i.test(message)) {
    return { success: true, alreadyRegistered: true };
  }
  throw new Error(message);
}

// ============================================================
// Subscriptions (diagnostics)
// ============================================================

export interface SubscribeWabaToAppArgs {
  wabaId: string;
  accessToken: string;
}

/**
 * Subscribe the WABA to this Meta app's webhook. Idempotent — Meta
 * returns success even when the subscription already exists.
 */
export async function subscribeWabaToApp(
  args: SubscribeWabaToAppArgs
): Promise<void> {
  const { wabaId, accessToken } = args;
  const url = `${apiBase()}/${wabaId}/subscribed_apps`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: timeoutSignal(),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
}

export interface GetSubscribedAppsArgs {
  wabaId: string;
  accessToken: string;
}

export interface SubscribedApp {
  whatsapp_business_api_data?: {
    id?: string;
    name?: string;
    link?: string;
  };
}

/**
 * Diagnostic — fetch the list of apps currently subscribed to this
 * WABA. The dashboard uses this to confirm OUR app is in the list
 * (Verify Registration button).
 */
export async function getSubscribedApps(
  args: GetSubscribedAppsArgs
): Promise<SubscribedApp[]> {
  const { wabaId, accessToken } = args;
  const url = `${apiBase()}/${wabaId}/subscribed_apps`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: timeoutSignal(),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
  const data = (await response.json()) as { data?: SubscribedApp[] };
  return data.data ?? [];
}

// ============================================================
// Sending
// ============================================================

export interface SendTextMessageArgs {
  phoneNumberId: string;
  accessToken: string;
  /** Recipient phone digits (no '+', no JID suffix). */
  to: string;
  text: string;
  /**
   * Meta's message_id of the message being replied to. Adds a `context`
   * field so WhatsApp renders the new message as a reply with a quote.
   */
  contextMessageId?: string;
}

/**
 * Send a free-form WhatsApp text message.
 * Only works inside the 24-hour customer service window.
 */
export async function sendTextMessage(
  args: SendTextMessageArgs
): Promise<MetaSendResult> {
  const { phoneNumberId, accessToken, to, text, contextMessageId } = args;
  const url = `${apiBase()}/${phoneNumberId}/messages`;
  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: text },
  };
  if (contextMessageId) {
    body.context = { message_id: contextMessageId };
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal: timeoutSignal(),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
  const data = await response.json();
  return { messageId: data.messages[0].id };
}

export type MediaKind = 'image' | 'video' | 'document' | 'audio';

export interface SendMediaMessageArgs {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  kind: MediaKind;
  /** Public URL Meta fetches at send time. */
  link: string;
  /**
   * Optional caption — Meta caps at 1024 chars. Images/videos/documents
   * accept it; audio does NOT.
   */
  caption?: string;
  /** Document-only. Shown in the recipient's chat. */
  fileName?: string;
}

/** Send an image/video/document/audio by public link. */
export async function sendMediaMessage(
  args: SendMediaMessageArgs
): Promise<MetaSendResult> {
  const { phoneNumberId, accessToken, to, kind, link, caption, fileName } = args;
  const url = `${apiBase()}/${phoneNumberId}/messages`;
  const media: Record<string, unknown> = { link };
  // Audio rejects caption; documents need a filename.
  if (caption && kind !== 'audio') media.caption = caption;
  if (kind === 'document') media.filename = fileName ?? 'file';
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: kind,
    [kind]: media,
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal: timeoutSignal(),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
  const data = await response.json();
  return { messageId: data.messages[0].id };
}

export interface SendLocationMessageArgs {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

/** Send a location pin. */
export async function sendLocationMessage(
  args: SendLocationMessageArgs
): Promise<MetaSendResult> {
  const { phoneNumberId, accessToken, to, latitude, longitude, name, address } = args;
  const url = `${apiBase()}/${phoneNumberId}/messages`;
  const location: Record<string, unknown> = { latitude, longitude };
  if (name) location.name = name;
  if (address) location.address = address;
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'location',
    location,
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal: timeoutSignal(),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
  const data = await response.json();
  return { messageId: data.messages[0].id };
}

export interface MarkMessageReadArgs {
  phoneNumberId: string;
  accessToken: string;
  /** Meta message id (wamid.*) of the INBOUND message to mark read. */
  messageId: string;
}

/**
 * Blue-tick an inbound message. Best-effort — callers should catch.
 */
export async function markMessageRead(args: MarkMessageReadArgs): Promise<void> {
  const { phoneNumberId, accessToken, messageId } = args;
  const url = `${apiBase()}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
    signal: timeoutSignal(),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
}

// ============================================================
// Inbound media
// ============================================================

export interface GetMediaUrlArgs {
  mediaId: string;
  accessToken: string;
}

export interface MetaMediaInfo {
  id: string;
  url: string;
  mime_type: string;
  sha256?: string;
  file_size?: number;
  filename?: string;
}

/**
 * Resolve the download URL for an inbound media item. The URL is
 * short-lived and requires the same Bearer token to fetch.
 */
export async function getMediaUrl(args: GetMediaUrlArgs): Promise<MetaMediaInfo> {
  const { mediaId, accessToken } = args;
  const url = `${apiBase()}/${mediaId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: timeoutSignal(),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta API error: ${response.status}`);
  }
  return response.json();
}

export interface DownloadMediaArgs {
  /** URL returned by getMediaUrl (short-lived). */
  url: string;
  accessToken: string;
}

/** Download inbound media bytes (to mirror the Baileys media pipeline). */
export async function downloadMedia(
  args: DownloadMediaArgs
): Promise<{ buffer: Buffer; contentType: string }> {
  const { url, accessToken } = args;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: timeoutSignal(),
  });
  if (!response.ok) {
    await throwMetaError(response, `Meta media download failed: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    buffer,
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
  };
}