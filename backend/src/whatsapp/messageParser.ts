import { ParsedWhatsAppMessage } from './types';
import { jidToPhone, isGroupJid } from '../utils/phone';

/**
 * Parse a raw Baileys message into our normalized shape.
 * Extracts media metadata (mime type, filename) so the service layer
 * can download and store media files via downloadWhatsAppMedia().
 */
export function parseWhatsAppMessage(msg: any): ParsedWhatsAppMessage | null {
  if (!msg) return null;
  const chatId: string = msg.key?.remoteJid ?? '';
  const externalMessageId: string = msg.key?.id ?? '';
  const isGroup = isGroupJid(chatId);
  const senderId: string = isGroup ? msg.key?.participant ?? chatId : chatId;

  // Extract text from various message types
  let text = '';
  let messageType: ParsedWhatsAppMessage['messageType'] = 'unknown';
  let mediaMimeType: string | null = null;
  let mediaFileName: string | null = null;

  const m = msg.message;
  if (!m) return null;

  if (m.conversation) {
    text = m.conversation;
    messageType = 'text';
  } else if (m.extendedTextMessage?.text) {
    text = m.extendedTextMessage.text;
    messageType = 'text';
  } else if (m.imageMessage) {
    text = m.imageMessage.caption ?? '';
    messageType = 'image';
    mediaMimeType = m.imageMessage.mimetype ?? 'image/jpeg';
  } else if (m.videoMessage) {
    text = m.videoMessage.caption ?? '';
    messageType = 'video';
    mediaMimeType = m.videoMessage.mimetype ?? 'video/mp4';
  } else if (m.audioMessage) {
    text = '';
    messageType = 'audio';
    mediaMimeType = m.audioMessage.mimetype ?? 'audio/ogg';
  } else if (m.documentMessage) {
    text = m.documentMessage.caption ?? '';
    messageType = 'document';
    mediaMimeType = m.documentMessage.mimetype ?? 'application/octet-stream';
    mediaFileName = m.documentMessage.fileName ?? null;
  } else if (m.locationMessage) {
    const lat = m.locationMessage.degreesLatitude;
    const lon = m.locationMessage.degreesLongitude;
    text = lat && lon ? `Location: ${lat}, ${lon}` : '';
    messageType = 'location';
  } else if (m.stickerMessage) {
    messageType = 'unknown';
    text = ''; // Will be synthesized by baileysClient as [sticker]
  } else if (m.reactionMessage) {
    messageType = 'unknown';
    text = ''; // Will be synthesized by baileysClient as [reaction]
  } else if (m.contactMessage) {
    messageType = 'unknown';
    text = m.contactMessage.displayName ? `[contact: ${m.contactMessage.displayName}]` : '';
  } else if (m.contactsArrayMessage) {
    const names = (m.contactsArrayMessage.contacts || []).map((c: any) => c.displayName).filter(Boolean);
    messageType = 'unknown';
    text = names.length ? `[contacts: ${names.join(', ')}]` : '';
  } else if (m.pollCreationMessage || m.pollCreationMessageV3) {
    const poll = m.pollCreationMessage || m.pollCreationMessageV3;
    messageType = 'unknown';
    text = poll?.name ? `[poll: ${poll.name}]` : '[poll]';
  } else if (m.viewOnceMessage || m.viewOnceMessageV2) {
    // View-once images/videos — treat as media
    const inner = m.viewOnceMessage?.message || m.viewOnceMessageV2?.message || {};
    if (inner.imageMessage) {
      text = inner.imageMessage.caption ?? '';
      messageType = 'image';
      mediaMimeType = inner.imageMessage.mimetype ?? 'image/jpeg';
    } else if (inner.videoMessage) {
      text = inner.videoMessage.caption ?? '';
      messageType = 'video';
      mediaMimeType = inner.videoMessage.mimetype ?? 'video/mp4';
    } else {
      messageType = 'unknown';
      text = '[view-once message]';
    }
  } else if (m.ephemeralMessage) {
    messageType = 'unknown';
    text = '[ephemeral message]';
  } else if (m.protocolMessage) {
    messageType = 'unknown';
    text = ''; // Protocol messages (revoke, etc.) — skip silently
  } else {
    // Unknown message type — log it so we can add support
    const allKeys = Object.keys(m);
    // Don't return null — let the caller decide. Set as unknown with a marker.
    messageType = 'unknown';
    text = '';
    // Attach the raw keys so the caller can log what we missed
    (msg as any).__unhandledKeys = allKeys;
  }

  return {
    externalMessageId,
    chatId,
    senderId,
    senderPhone: jidToPhone(isGroup ? (msg.key?.participant ?? chatId) : chatId),
    isGroup,
    text,
    messageType,
    mediaUrl: null, // Filled by whatsappService after download
    mediaMimeType,
    mediaFileName,
    raw: msg,
    receivedAt: new Date(Math.max(0, (msg.messageTimestamp ?? 0) * 1000)).toISOString(),
  };
}