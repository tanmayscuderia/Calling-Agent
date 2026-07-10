/**
 * Unit Test: messageParser.parseWhatsAppMessage()
 *
 * This parses raw Baileys message objects into our normalized shape.
 * Every inbound WhatsApp message goes through this — if it fails or
 * extracts the wrong text, the AI agent gets garbage input.
 *
 * This is a pure function — no DB calls.
 */
import { describe, it, expect } from 'vitest';
import { parseWhatsAppMessage } from '../../src/whatsapp/messageParser';

// ── Helpers ──────────────────────────────────────────────

function makeBaseMsg(overrides: any = {}) {
  return {
    key: {
      remoteJid: '919999999999@s.whatsapp.net',
      id: 'MSG123',
      fromMe: false,
      ...overrides.key,
    },
    message: { conversation: 'Hello' },
    messageTimestamp: 1700000000,
    ...overrides,
  };
}

function makeGroupMsg(overrides: any = {}) {
  return {
    key: {
      remoteJid: '120363123456789@g.us',
      id: 'MSG123',
      fromMe: false,
      participant: '919999999999@s.whatsapp.net',
      ...overrides.key,
    },
    message: { conversation: 'Hello group' },
    messageTimestamp: 1700000000,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────

describe('parseWhatsAppMessage', () => {
  // ── Null / edge cases ──────────────────────────────────

  it('returns null for null input', () => {
    expect(parseWhatsAppMessage(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseWhatsAppMessage(undefined)).toBeNull();
  });

  it('returns null when message field is missing', () => {
    expect(parseWhatsAppMessage({ key: { remoteJid: '919@s.whatsapp.net', id: 'X' } })).toBeNull();
  });

  // ── Text message (conversation) ────────────────────────

  it('parses basic text message (conversation type)', () => {
    const msg = makeBaseMsg({ message: { conversation: 'Hi, I want a 3BHK' } });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.text).toBe('Hi, I want a 3BHK');
    expect(parsed!.messageType).toBe('text');
    expect(parsed!.externalMessageId).toBe('MSG123');
    expect(parsed!.chatId).toBe('919999999999@s.whatsapp.net');
  });

  it('parses extendedTextMessage (replies, links)', () => {
    const msg = makeBaseMsg({
      message: { extendedTextMessage: { text: 'Check this property: https://example.com' } },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.text).toBe('Check this property: https://example.com');
    expect(parsed!.messageType).toBe('text');
  });

  // ── Media types ────────────────────────────────────────

  it('parses image message with caption', () => {
    const msg = makeBaseMsg({
      message: {
        imageMessage: {
          caption: 'Is this available?',
          mimetype: 'image/jpeg',
        },
      },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.messageType).toBe('image');
    expect(parsed!.text).toBe('Is this available?');
    expect(parsed!.mediaMimeType).toBe('image/jpeg');
  });

  it('parses image message without caption (empty text)', () => {
    const msg = makeBaseMsg({
      message: { imageMessage: { mimetype: 'image/png' } },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.messageType).toBe('image');
    expect(parsed!.text).toBe('');
  });

  it('parses video message with caption', () => {
    const msg = makeBaseMsg({
      message: {
        videoMessage: {
          caption: 'Property tour video',
          mimetype: 'video/mp4',
        },
      },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.messageType).toBe('video');
    expect(parsed!.text).toBe('Property tour video');
    expect(parsed!.mediaMimeType).toBe('video/mp4');
  });

  it('parses audio message (no text)', () => {
    const msg = makeBaseMsg({
      message: { audioMessage: { mimetype: 'audio/ogg' } },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.messageType).toBe('audio');
    expect(parsed!.text).toBe('');
    expect(parsed!.mediaMimeType).toBe('audio/ogg');
  });

  it('parses document message with filename', () => {
    const msg = makeBaseMsg({
      message: {
        documentMessage: {
          caption: 'Here is my ID proof',
          mimetype: 'application/pdf',
          fileName: 'id_proof.pdf',
        },
      },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.messageType).toBe('document');
    expect(parsed!.text).toBe('Here is my ID proof');
    expect(parsed!.mediaMimeType).toBe('application/pdf');
    expect(parsed!.mediaFileName).toBe('id_proof.pdf');
  });

  it('parses location message', () => {
    const msg = makeBaseMsg({
      message: {
        locationMessage: {
          degreesLatitude: 28.5355,
          degreesLongitude: 77.391,
        },
      },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.messageType).toBe('location');
    expect(parsed!.text).toContain('28.5355');
    expect(parsed!.text).toContain('77.391');
  });

  // ── Phone number extraction ───────────────────────────

  it('extracts phone from direct JID', () => {
    const msg = makeBaseMsg();
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed!.senderPhone).toBe('+919999999999');
  });

  // ── Group message handling ─────────────────────────────

  it('detects group messages and extracts participant phone', () => {
    const msg = makeGroupMsg();
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.isGroup).toBe(true);
    expect(parsed!.senderId).toBe('919999999999@s.whatsapp.net');
    expect(parsed!.senderPhone).toBe('+919999999999');
  });

  it('uses group JID as sender when participant is missing', () => {
    // Build manually — makeGroupMsg's spread would clobber the key object
    const msg = {
      key: {
        remoteJid: '120363123456789@g.us',
        id: 'MSG123',
        fromMe: false,
        // participant intentionally omitted
      },
      message: { conversation: 'Hello group' },
      messageTimestamp: 1700000000,
    };
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.isGroup).toBe(true);
    // Falls back to chatId
    expect(parsed!.senderId).toBe('120363123456789@g.us');
  });

  // ── Timestamp ──────────────────────────────────────────

  it('converts messageTimestamp to ISO string', () => {
    const msg = makeBaseMsg({ messageTimestamp: 1700000000 });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.receivedAt).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it('handles missing messageTimestamp (epoch)', () => {
    const msg = makeBaseMsg({ messageTimestamp: undefined });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    // Should produce epoch
    expect(parsed!.receivedAt).toBe(new Date(0).toISOString());
  });

  // ── Unknown message types ──────────────────────────────

  it('handles unknown message type gracefully', () => {
    const msg = makeBaseMsg({
      message: { someNewMessageType: { data: 'whatever' } },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed).not.toBeNull();
    expect(parsed!.messageType).toBe('unknown');
    expect(parsed!.text).toBe('');
  });

  // ── Default media type defaults ────────────────────────

  it('defaults image mimetype to image/jpeg when missing', () => {
    const msg = makeBaseMsg({
      message: { imageMessage: {} },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed!.mediaMimeType).toBe('image/jpeg');
  });

  it('defaults audio mimetype to audio/ogg when missing', () => {
    const msg = makeBaseMsg({
      message: { audioMessage: {} },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed!.mediaMimeType).toBe('audio/ogg');
  });

  it('defaults document mimetype to application/octet-stream', () => {
    const msg = makeBaseMsg({
      message: { documentMessage: { caption: 'test' } },
    });
    const parsed = parseWhatsAppMessage(msg);
    expect(parsed!.mediaMimeType).toBe('application/octet-stream');
  });
});