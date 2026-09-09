import { ParsedWhatsAppMessage } from './types';

/**
 * Parse Meta Cloud API webhook payloads into the SAME normalized shape
 * the Baileys parser produces (ParsedWhatsAppMessage), so the entire
 * downstream pipeline — lead resolution, conversations, dedup, job
 * queue, AI agent — works unchanged regardless of provider.
 *
 * Key normalization decision: Cloud API payloads identify chats by raw
 * digits (`wa_id: "919999999999"`), while the rest of this codebase
 * (conversations.external_chat_id, debug routes, JID helpers) keys on
 * Baileys-style JIDs. This parser therefore emits
 *   chatId = `${wa_id}@s.whatsapp.net`
 * so a Meta-account conversation looks identical to a Baileys one, and
 * the MetaCloudWhatsAppAdapter converts back to digits on send. A lead's
 * history also survives a future Baileys → Meta migration on the same
 * number, because lead merge is by normalized phone either way.
 *
 * Payload reference:
 *   https://developers.facebook.com/docs/graph-api/webhooks/reference/whatsapp_business_account/
 */

export interface MetaWebhookStatusEvent {
  /** Meta message id (wamid.*) this status belongs to. */
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | string;
  /** Unix seconds. */
  timestamp: string;
  recipient_id: string;
  errors?: { code: number; title: string; message?: string; error_data?: { details?: string } }[];
}

export interface MetaParsedEntry {
  /** phone_number_id from value.metadata — resolves the owning account. */
  phoneNumberId: string;
  displayPhoneNumber?: string;
  messages: ParsedWhatsAppMessage[];
  statuses: MetaWebhookStatusEvent[];
}

interface MetaWebhookMessageValue {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: Record<string, any>[];
  statuses?: MetaWebhookStatusEvent[];
}

interface MetaWebhookEntry {
  id?: string;
  changes?: { field?: string; value?: MetaWebhookMessageValue }[];
}

/** Map a Cloud API message type to our ParsedWhatsAppMessage.messageType union. */
function mapMessageType(m: Record<string, any>): ParsedWhatsAppMessage['messageType'] {
  if (m.text) return 'text';
  if (m.image) return 'image';
  if (m.video) return 'video';
  if (m.audio || m.voice) return 'audio';
  if (m.document) return 'document';
  if (m.location) return 'location';
  // Interactive button/list replies carry the user's choice as their
  // title — treat them as text so the AI agent sees a normal utterance.
  if (m.interactive?.button_reply || m.interactive?.list_reply || m.button) return 'text';
  return 'unknown';
}

/** Extract the human-readable body + media metadata for one message. */
function extractBody(m: Record<string, any>): {
  text: string;
  mediaMimeType: string | null;
  mediaFileName: string | null;
  mediaId: string | null;
} {
  if (m.text?.body) {
    return { text: String(m.text.body), mediaMimeType: null, mediaFileName: null, mediaId: null };
  }
  if (m.image) {
    return { text: m.image.caption ?? '', mediaMimeType: m.image.mime_type ?? 'image/jpeg', mediaFileName: null, mediaId: m.image.id ?? null };
  }
  if (m.video) {
    return { text: m.video.caption ?? '', mediaMimeType: m.video.mime_type ?? 'video/mp4', mediaFileName: null, mediaId: m.video.id ?? null };
  }
  if (m.audio || m.voice) {
    const a = m.audio ?? m.voice;
    return { text: '', mediaMimeType: a.mime_type ?? 'audio/ogg', mediaFileName: null, mediaId: a.id ?? null };
  }
  if (m.document) {
    return {
      text: m.document.caption ?? '',
      mediaMimeType: m.document.mime_type ?? 'application/octet-stream',
      mediaFileName: m.document.filename ?? null,
      mediaId: m.document.id ?? null,
    };
  }
  if (m.location) {
    const { latitude, longitude } = m.location;
    return { text: latitude && longitude ? `Location: ${latitude}, ${longitude}` : '', mediaMimeType: null, mediaFileName: null, mediaId: null };
  }
  if (m.interactive?.button_reply) {
    return { text: String(m.interactive.button_reply.title ?? ''), mediaMimeType: null, mediaFileName: null, mediaId: null };
  }
  if (m.interactive?.list_reply) {
    return { text: String(m.interactive.list_reply.title ?? ''), mediaMimeType: null, mediaFileName: null, mediaId: null };
  }
  if (m.button?.text) {
    return { text: String(m.button.text), mediaMimeType: null, mediaFileName: null, mediaId: null };
  }
  if (m.reaction?.emoji) {
    return { text: `[reaction: ${m.reaction.emoji}]`, mediaMimeType: null, mediaFileName: null, mediaId: null };
  }
  if (m.sticker) {
    return { text: '[sticker]', mediaMimeType: m.sticker.mime_type ?? null, mediaFileName: null, mediaId: m.sticker.id ?? null };
  }
  if (m.contacts) {
    const names = (m.contacts ?? [])
      .map((c: any) => c?.name?.formatted_name)
      .filter(Boolean);
    return { text: names.length ? `[contacts: ${names.join(', ')}]` : '[contact]', mediaMimeType: null, mediaFileName: null, mediaId: null };
  }
  if (m.type === 'system' || m.system) {
    return { text: '[system]', mediaMimeType: null, mediaFileName: null, mediaId: null };
  }
  if (m.type === 'unsupported' || m.errors) {
    return { text: '[unsupported message]', mediaMimeType: null, mediaFileName: null, mediaId: null };
  }
  return { text: '', mediaMimeType: null, mediaFileName: null, mediaId: null };
}

/**
 * Parse a full webhook body into per-account entries.
 * Never throws on unexpected shapes — unknown parts are skipped (the
 * webhook route always 200s Meta; a malformed event must not trigger
 * delivery-retry storms).
 */
export function parseMetaWebhookPayload(body: any): MetaParsedEntry[] {
  if (!body || body.object !== 'whatsapp_business_account' || !Array.isArray(body.entry)) {
    return [];
  }

  const entries: MetaParsedEntry[] = [];

  for (const entry of body.entry as MetaWebhookEntry[]) {
    for (const change of entry.changes ?? []) {
      const value = change?.value;
      if (!value) continue;

      const phoneNumberId = value.metadata?.phone_number_id ?? '';
      const displayPhoneNumber = value.metadata?.display_phone_number;

      // Contact name lookup (profile.name), keyed by wa_id.
      const contactNames = new Map<string, string>();
      for (const c of value.contacts ?? []) {
        if (c?.wa_id && c?.profile?.name) contactNames.set(c.wa_id, c.profile.name);
      }

      const messages: ParsedWhatsAppMessage[] = [];
      for (const m of value.messages ?? []) {
        const from: string = m.from ?? '';
        if (!from || !m.id) continue;

        const senderName = contactNames.get(from) ?? null;
        const { text, mediaMimeType, mediaFileName, mediaId } = extractBody(m);
        const type = mapMessageType(m);

        messages.push({
          externalMessageId: String(m.id),
          // JID-canonical chatId — see module docstring.
          chatId: `${from}@s.whatsapp.net`,
          senderId: from,
          senderPhone: `+${from}`,
          senderName,
          isGroup: false, // Cloud API is 1:1 (no group support)
          text,
          messageType: type,
          // Meta gives us a media id, not a URL. Attached to the raw
          // payload; the actual download is a separate authorized call
          // (metaApi.getMediaUrl) — left null here to mirror the
          // Baileys path, where the service layer fills it in.
          mediaUrl: null,
          mediaMimeType,
          mediaFileName,
          raw: { ...m, __mediaId: mediaId, __phoneNumberId: phoneNumberId },
          receivedAt: new Date(
            Math.max(0, Number(m.timestamp ?? 0) * 1000) || Date.now()
          ).toISOString(),
        });
      }

      entries.push({
        phoneNumberId,
        displayPhoneNumber,
        messages,
        statuses: Array.isArray(value.statuses) ? value.statuses : [],
      });
    }
  }

  return entries;
}