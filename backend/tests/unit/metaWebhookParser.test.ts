/**
 * Unit Test: metaWebhookParser — Meta Cloud API payload → ParsedWhatsAppMessage.
 *
 * The parser is the adapter boundary between Meta's webhook payloads and
 * the (provider-agnostic) message pipeline. Contracts under test:
 *   - chatId is emitted as a Baileys-style JID (`<wa_id>@s.whatsapp.net`)
 *     so conversations/debug routes/lead merge work unchanged
 *   - senderPhone keeps the leading '+' (jidToPhone format)
 *   - contact profile.name → senderName
 *   - every Cloud API message type maps into our type union
 *   - statuses pass through; unknown/foreign payloads return [] (never throw)
 */
import { describe, it, expect } from 'vitest';
import { parseMetaWebhookPayload } from '../../src/whatsapp/metaWebhookParser';

const PHONE_NUMBER_ID = 'PNID_123';

function payloadWith(messages: any[], contacts: any[] = [], statuses: any[] = []) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA_1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '919800000000', phone_number_id: PHONE_NUMBER_ID },
              contacts,
              messages,
              statuses,
            },
          },
        ],
      },
    ],
  };
}

describe('parseMetaWebhookPayload', () => {
  it('parses a plain text message with contact name', () => {
    const body = payloadWith(
      [
        {
          from: '919999999999',
          id: 'wamid.TEXT1',
          timestamp: '1725000000',
          type: 'text',
          text: { body: '2BHK under 80L?' },
        },
      ],
      [{ wa_id: '919999999999', profile: { name: 'Ravi Kumar' } }]
    );

    const entries = parseMetaWebhookPayload(body);
    expect(entries.length).toBe(1);
    expect(entries[0].phoneNumberId).toBe(PHONE_NUMBER_ID);
    expect(entries[0].messages.length).toBe(1);

    const msg = entries[0].messages[0];
    expect(msg.externalMessageId).toBe('wamid.TEXT1');
    expect(msg.chatId).toBe('919999999999@s.whatsapp.net'); // JID-canonical
    expect(msg.senderPhone).toBe('+919999999999');
    expect(msg.senderName).toBe('Ravi Kumar');
    expect(msg.isGroup).toBe(false);
    expect(msg.messageType).toBe('text');
    expect(msg.text).toBe('2BHK under 80L?');
    expect(msg.receivedAt).toBe(new Date(1725000000 * 1000).toISOString());
  });

  it('parses an image message (mime + media id on raw)', () => {
    const body = payloadWith([
      {
        from: '919999999999',
        id: 'wamid.IMG1',
        timestamp: '1725000001',
        type: 'image',
        image: { id: 'MEDIA_1', mime_type: 'image/jpeg', caption: 'this one?' },
      },
    ]);
    const msg = parseMetaWebhookPayload(body)[0].messages[0];
    expect(msg.messageType).toBe('image');
    expect(msg.text).toBe('this one?');
    expect(msg.mediaMimeType).toBe('image/jpeg');
    expect(msg.mediaUrl).toBeNull(); // filled later by the media pipeline
    expect((msg.raw as any).__mediaId).toBe('MEDIA_1');
  });

  it('parses document / location / audio', () => {
    const body = payloadWith([
      {
        from: '919999999999',
        id: 'wamid.DOC1',
        timestamp: '1725000002',
        type: 'document',
        document: { id: 'MEDIA_2', mime_type: 'application/pdf', filename: 'floorplan.pdf' },
      },
      {
        from: '919999999999',
        id: 'wamid.LOC1',
        timestamp: '1725000003',
        type: 'location',
        location: { latitude: 28.6, longitude: 77.2 },
      },
      {
        from: '919999999999',
        id: 'wamid.AUD1',
        timestamp: '1725000004',
        type: 'audio',
        audio: { id: 'MEDIA_3', mime_type: 'audio/ogg' },
      },
    ]);
    const [doc, loc, aud] = parseMetaWebhookPayload(body)[0].messages;
    expect(doc.messageType).toBe('document');
    expect(doc.mediaFileName).toBe('floorplan.pdf');
    expect(loc.messageType).toBe('location');
    expect(loc.text).toContain('28.6');
    expect(aud.messageType).toBe('audio');
  });

  it('parses interactive button replies as text', () => {
    const body = payloadWith([
      {
        from: '919999999999',
        id: 'wamid.BTN1',
        timestamp: '1725000005',
        type: 'interactive',
        interactive: { type: 'button_reply', button_reply: { id: 'visit', title: 'Book site visit' } },
      },
    ]);
    const msg = parseMetaWebhookPayload(body)[0].messages[0];
    expect(msg.messageType).toBe('text');
    expect(msg.text).toBe('Book site visit');
  });

  it('passes statuses through untouched', () => {
    const body = payloadWith(
      [],
      [],
      [{ id: 'wamid.OUT1', status: 'delivered', timestamp: '1725000006', recipient_id: '919999999999' }]
    );
    const entry = parseMetaWebhookPayload(body)[0];
    expect(entry.messages.length).toBe(0);
    expect(entry.statuses.length).toBe(1);
    expect(entry.statuses[0].status).toBe('delivered');
  });

  it('returns [] for foreign / malformed payloads (never throws)', () => {
    expect(parseMetaWebhookPayload(null)).toEqual([]);
    expect(parseMetaWebhookPayload({})).toEqual([]);
    expect(parseMetaWebhookPayload({ object: 'page', entry: [] })).toEqual([]);
    expect(parseMetaWebhookPayload({ object: 'whatsapp_business_account' })).toEqual([]);
    expect(parseMetaWebhookPayload({ object: 'whatsapp_business_account', entry: [{}] })).toEqual([]);
  });

  it('skips messages missing id or from, keeps the rest', () => {
    const body = payloadWith([
      { id: 'wamid.OK', from: '919999999999', timestamp: '1725000007', type: 'text', text: { body: 'hi' } },
      { id: 'wamid.NO_FROM', timestamp: '1725000007', type: 'text', text: { body: 'x' } },
      { from: '919999999999', timestamp: '1725000007', type: 'text', text: { body: 'no id' } },
    ]);
    const msgs = parseMetaWebhookPayload(body)[0].messages;
    expect(msgs.length).toBe(1);
    expect(msgs[0].externalMessageId).toBe('wamid.OK');
  });
});