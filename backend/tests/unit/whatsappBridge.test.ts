/**
 * Unit Test: BaileysWhatsAppAdapter — Public API & Chat Management
 *
 * The adapter maintains an in-memory chat list, monitoring toggles, and
 * sorting logic. These methods power the WhatsApp dashboard UI:
 *   - getChats()           → list chats (sorted: monitored first, DMs before groups)
 *   - toggleChatMonitor()  → flip monitoring for a single chat
 *   - bulkToggleMonitor()  → select-all / deselect-all
 *   - getStatusSync()      → connection status for ConnectionManager
 *
 * The messages.upsert handler is a private closure inside start() and
 * requires a live Baileys socket — it's covered by the whatsappService
 * and jobHandler tests which exercise the same guard logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Baileys so we don't need the actual library at import time.
// We never call start() in these tests, so the mock just needs to exist.
vi.mock('@whiskeysockets/baileys', () => ({
  default: vi.fn(),
  useMultiFileAuthState: vi.fn(),
  fetchLatestBaileysVersion: vi.fn().mockResolvedValue({ version: [2, 3000, 0] }),
  DisconnectReason: { loggedOut: 515 },
}));

vi.mock('qrcode-terminal', () => ({
  default: { generate: vi.fn() },
}));

// Mock whatsappService dependencies (called in constructor/start)
vi.mock('../../src/whatsapp/whatsappService', () => ({
  resolveAccountId: vi.fn().mockResolvedValue('test-account-id'),
  setAccountStatus: vi.fn().mockResolvedValue(undefined),
}));

// Mock storageService (imported lazily in start(), not needed here)
vi.mock('../../src/uploads/storageService', () => ({
  uploadWhatsAppMedia: vi.fn(),
}));

import { BaileysWhatsAppAdapter } from '../../src/whatsapp/baileysClient';

const ORG_ID = 'test-org-uuid';

// ── Helpers ──────────────────────────────────────────────

function makeAdapter(): BaileysWhatsAppAdapter {
  return new BaileysWhatsAppAdapter(ORG_ID, '/tmp/test-sessions-whatsapp');
}

// ── Tests ────────────────────────────────────────────────

describe('BaileysWhatsAppAdapter — Chat Management', () => {
  let adapter: BaileysWhatsAppAdapter;

  beforeEach(() => {
    // Clear the persisted chat-store.json before each test so state doesn't bleed
    const fs = require('fs');
    const path = require('path');
    const storePath = path.join('/tmp/test-sessions-whatsapp', 'chat-store.json');
    if (fs.existsSync(storePath)) {
      fs.unlinkSync(storePath);
    }
    adapter = makeAdapter();
  });

  // ── Status ─────────────────────────────────────────────

  it('getStatusSync returns disconnected status initially', () => {
    const status = adapter.getStatusSync();
    expect(status.status).toBe('disconnected');
    expect(status.orgId).toBe(ORG_ID);
    expect(status.connectedPhone).toBeNull();
    expect(status.accountId).toBeNull();
  });

  // ── Toggle single chat ─────────────────────────────────

  it('toggleChatMonitor enables monitoring for a chat', () => {
    const result = adapter.toggleChatMonitor('919999999999@s.whatsapp.net');
    expect(result).toBe(true);
  });

  it('toggleChatMonitor toggles back off when called again', () => {
    const chatId = '919999999999@s.whatsapp.net';
    adapter.toggleChatMonitor(chatId); // on
    const result = adapter.toggleChatMonitor(chatId); // off
    expect(result).toBe(false);
  });

  // ── Bulk toggle ────────────────────────────────────────

  it('bulkToggleMonitor enables multiple chats at once', () => {
    const chatIds = [
      '919999999999@s.whatsapp.net',
      '918888888888@s.whatsapp.net',
      '120363test@g.us',
    ];
    const result = adapter.bulkToggleMonitor(chatIds, true);
    expect(result.updated).toBe(3);
  });

  it('bulkToggleMonitor disables multiple chats at once', () => {
    const chatIds = [
      '919999999999@s.whatsapp.net',
      '918888888888@s.whatsapp.net',
    ];
    adapter.bulkToggleMonitor(chatIds, true); // enable first
    const result = adapter.bulkToggleMonitor(chatIds, false);
    expect(result.updated).toBe(2);
  });

  it('bulkToggleMonitor reports 0 updated if already in target state', () => {
    const chatIds = ['919999999999@s.whatsapp.net'];
    // Never toggled before — enabling should count
    const r1 = adapter.bulkToggleMonitor(chatIds, true);
    expect(r1.updated).toBe(1);
    // Already enabled — enabling again should NOT count
    const r2 = adapter.bulkToggleMonitor(chatIds, true);
    expect(r2.updated).toBe(0);
  });

  // ── getChats sorting ───────────────────────────────────

  it('getChats returns empty array when no chats tracked', () => {
    expect(adapter.getChats()).toEqual([]);
  });

  // ── Integration: toggle + getStatus ────────────────────

  it('getStatus reflects monitored count after toggling', async () => {
    // Add two chats — one monitored, one not
    adapter.toggleChatMonitor('919999999999@s.whatsapp.net'); // monitored
    adapter.bulkToggleMonitor(['918888888888@s.whatsapp.net'], false); // unmonitored

    const status = await adapter.getStatus();
    // monitoredCount should be 1 (only the first chat is monitored)
    expect(status.monitoredCount).toBe(1);
  });
});

describe('BaileysWhatsAppAdapter — Edge Cases', () => {
  let adapter: BaileysWhatsAppAdapter;

  beforeEach(() => {
    const fs = require('fs');
    const path = require('path');
    const storePath = path.join('/tmp/test-sessions-whatsapp', 'chat-store.json');
    if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
    adapter = new BaileysWhatsAppAdapter(ORG_ID, '/tmp/test-sessions-whatsapp');
  });

  it('toggleChatMonitor with empty string returns true (adds to set)', () => {
    const result = adapter.toggleChatMonitor('');
    expect(result).toBe(true);
  });

  it('bulkToggleMonitor with empty array returns 0 updated', () => {
    const result = adapter.bulkToggleMonitor([], true);
    expect(result.updated).toBe(0);
  });

  it('getStatus includes chatsCount and monitoredCount', async () => {
    adapter.toggleChatMonitor('919999999999@s.whatsapp.net');
    const status = await adapter.getStatus();
    expect(status).toHaveProperty('chatsCount');
    expect(status).toHaveProperty('monitoredCount');
    expect(status.provider).toBe('baileys');
    expect(status.orgId).toBe(ORG_ID);
  });
});