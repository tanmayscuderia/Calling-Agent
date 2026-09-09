/**
 * Unit Test: metaApi — Meta Cloud API client (ported from wacrm).
 *
 * global.fetch is mocked so no real Graph API calls happen. Contracts:
 *   - correct URL / method / auth / body shape
 *   - "already registered" register responses treated as success
 *   - Meta error envelopes surface their message verbatim
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  verifyPhoneNumber,
  registerPhoneNumber,
  subscribeWabaToApp,
  sendTextMessage,
  sendMediaMessage,
  sendLocationMessage,
  markMessageRead,
  getMediaUrl,
} from '../../src/whatsapp/metaApi';

const ARGS = { phoneNumberId: 'PNID_1', accessToken: 'TOKEN_1' };

function okResponse(json: any) {
  return new Response(JSON.stringify(json), { status: 200 });
}
function errResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: { message } }), { status });
}
function errResponseNoJson(status: number) {
  return new Response('not json', { status });
}

describe('metaApi', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('verifyPhoneNumber hits the metadata endpoint with fields + bearer', async () => {
    fetchMock.mockResolvedValue(
      okResponse({ id: 'PNID_1', display_phone_number: '91 98000 00000', quality_rating: 'GREEN' })
    );
    const info = await verifyPhoneNumber(ARGS);
    expect(info.display_phone_number).toContain('98000');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('graph.facebook.com/');
    expect(url).toContain('/PNID_1?fields=id,display_phone_number,verified_name,quality_rating');
    expect(init.headers.Authorization).toBe('Bearer TOKEN_1');
  });

  it('registerPhoneNumber returns success on 200', async () => {
    fetchMock.mockResolvedValue(okResponse({ success: true }));
    const res = await registerPhoneNumber({ ...ARGS, pin: '123456' });
    expect(res).toEqual({ success: true, alreadyRegistered: false });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url.endsWith('/PNID_1/register')).toBe(true);
    expect(JSON.parse(init.body)).toEqual({ messaging_product: 'whatsapp', pin: '123456' });
  });

  it('registerPhoneNumber treats "already registered" as success', async () => {
    fetchMock.mockResolvedValue(errResponse(400, 'Phone number already registered'));
    const res = await registerPhoneNumber({ ...ARGS, pin: '123456' });
    expect(res).toEqual({ success: true, alreadyRegistered: true });
  });

  it('registerPhoneNumber surfaces a wrong PIN verbatim', async () => {
    fetchMock.mockResolvedValue(errResponse(401, 'Two-step verification PIN required'));
    await expect(registerPhoneNumber({ ...ARGS, pin: '000000' })).rejects.toThrow(
      'Two-step verification PIN required'
    );
  });

  it('subscribeWabaToApp posts to subscribed_apps', async () => {
    fetchMock.mockResolvedValue(okResponse({ success: true }));
    await subscribeWabaToApp({ wabaId: 'WABA_1', accessToken: 'T' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url.endsWith('/WABA_1/subscribed_apps')).toBe(true);
    expect(init.method).toBe('POST');
  });

  it('sendTextMessage builds the Cloud API message body', async () => {
    fetchMock.mockResolvedValue(okResponse({ messages: [{ id: 'wamid.OUT9' }] }));
    const res = await sendTextMessage({
      ...ARGS,
      to: '919999999999',
      text: 'Hello!',
      contextMessageId: 'wamid.IN1',
    });
    expect(res.messageId).toBe('wamid.OUT9');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url.endsWith('/PNID_1/messages')).toBe(true);
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '919999999999',
      type: 'text',
      text: { body: 'Hello!' },
      context: { message_id: 'wamid.IN1' },
    });
  });

  it('sendMediaMessage omits caption for audio, sets filename for documents', async () => {
    // Fresh Response per call — a Response body can only be read once.
    fetchMock.mockImplementation(async () => okResponse({ messages: [{ id: 'wamid.M1' }] }));
    await sendMediaMessage({ ...ARGS, to: '919999999999', kind: 'audio', link: 'https://cdn/x.mp3', caption: 'nope' });
    await sendMediaMessage({ ...ARGS, to: '919999999999', kind: 'document', link: 'https://cdn/x.pdf', caption: 'plan', fileName: 'plan.pdf' });

    const audioBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(audioBody.type).toBe('audio');
    expect(audioBody.audio.caption).toBeUndefined();

    const docBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(docBody.document.filename).toBe('plan.pdf');
    expect(docBody.document.caption).toBe('plan');
  });

  it('sendLocationMessage sends a location payload', async () => {
    fetchMock.mockResolvedValue(okResponse({ messages: [{ id: 'wamid.L1' }] }));
    await sendLocationMessage({ ...ARGS, to: '919999999999', latitude: 28.6, longitude: 77.2, name: 'Tower A' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.type).toBe('location');
    expect(body.location).toEqual({ latitude: 28.6, longitude: 77.2, name: 'Tower A' });
  });

  it('markMessageRead posts a read status', async () => {
    fetchMock.mockResolvedValue(okResponse({ success: true }));
    await markMessageRead({ ...ARGS, messageId: 'wamid.IN1' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ messaging_product: 'whatsapp', status: 'read', message_id: 'wamid.IN1' });
  });

  it('getMediaUrl returns media metadata', async () => {
    fetchMock.mockResolvedValue(okResponse({ id: 'MEDIA_1', url: 'https://cdn.meta/x', mime_type: 'image/jpeg' }));
    const info = await getMediaUrl({ mediaId: 'MEDIA_1', accessToken: 'T' });
    expect(info.url).toContain('cdn.meta');
    expect(fetchMock.mock.calls[0][0].endsWith('/MEDIA_1')).toBe(true);
  });

  it('error responses without JSON keep the fallback message', async () => {
    fetchMock.mockResolvedValue(errResponseNoJson(504));
    await expect(sendTextMessage({ ...ARGS, to: '919999999999', text: 'x' })).rejects.toThrow(
      'Meta API error: 504'
    );
  });
});