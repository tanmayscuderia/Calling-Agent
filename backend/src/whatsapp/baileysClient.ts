import makeWASocket, {
  WASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';
import { MessagingAdapter, ParsedWhatsAppMessage } from './types';
import { parseWhatsAppMessage } from './messageParser';
import { resolveAccountId, setAccountStatus } from './whatsappService';

export interface WhatsAppChat {
  id: string;
  name: string;
  isGroup: boolean;
  phone?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  monitored: boolean;
  unreadCount?: number;
}

/**
 * Baileys WhatsApp Web adapter.
 * Implements the MessagingAdapter interface so it can be swapped for
 * MetaCloudWhatsAppAdapter later without changing the message handling layer.
 *
 * Chat tracking: We listen to Baileys events directly (chats.upsert,
 * messaging-history.set, contacts.upsert) and maintain our own chats Map.
 * This captures BOTH groups and individual DMs without needing makeInMemoryStore.
 */
export class BaileysWhatsAppAdapter extends EventEmitter implements MessagingAdapter {
  private sock: WASocket | null = null;
  private sessionDir: string;
  private orgId: string;
  private accountId: string | null = null;
  private status: string = 'disconnected';
  private lastQr: string | null = null;
  private connectedPhone: string | null = null;
  private starting: boolean = false;

  // Our own chat tracking — fed by Baileys events
  private chats: Map<string, WhatsAppChat> = new Map();
  private monitoredChatIds: Set<string> = new Set();

  // Contact name lookup — populated from contacts.upsert / history sync
  private contactNames: Map<string, string> = new Map();

  // Debounced save timer for persistence
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(orgId: string, sessionDir?: string) {
    super();
    this.orgId = orgId;
    this.sessionDir = sessionDir ?? config.whatsapp.sessionDir;
    // Restore persisted chat data immediately
    this.loadFromDisk();
  }

  // ── Persistence ──────────────────────────────────────────
  // Per-account store path — avoids collision between multi-instance connections
  private get storePath(): string {
    return path.join(this.sessionDir, 'chat-store.json');
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.chats) for (const c of data.chats) this.chats.set(c.id, c);
        if (data.monitoredChatIds) for (const id of data.monitoredChatIds) this.monitoredChatIds.add(id);
        if (data.contactNames) for (const [id, name] of Object.entries(data.contactNames)) this.contactNames.set(id, name as string);
        logger.info({ chats: this.chats.size, monitored: this.monitoredChatIds.size }, 'Restored chat data from disk');
      }
    } catch (err) {
      logger.warn({ err }, 'Could not load chat-store.json — starting fresh');
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveToDisk(), 2000);
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = {
        chats: Array.from(this.chats.values()),
        monitoredChatIds: Array.from(this.monitoredChatIds),
        contactNames: Object.fromEntries(this.contactNames),
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.storePath, JSON.stringify(data, null, 2));
    } catch (err) {
      logger.warn({ err }, 'Failed to persist chat-store.json');
    }
  }

  async start(): Promise<void> {
    if (this.starting || this.sock) return;
    this.starting = true;

    try {
      this.accountId = await resolveAccountId(this.orgId);
      await setAccountStatus(this.orgId, this.accountId, 'qr_pending');

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        // printQRInTerminal is deprecated in latest Baileys — we emit QR to frontend
        logger: logger.child({ module: 'baileys' }) as any,
        browser: ['CallingAgent', 'Chrome', '1.0.0'],
        // Force full history + contact sync every connect
        syncFullHistory: true,
        markOnlineOnConnect: false,
        // ═══════════════════════════════════════════════════════
        // ROOT CAUSE FIX: By default, Baileys SKIPS the FULL history sync
        // type (shouldSyncHistoryMessage returns false for FULL). That FULL
        // sync is exactly what delivers individual DM chat history.
        // Without this override, only groups appear — never individual chats.
        // We force-process ALL sync types so DMs come through.
        // ═══════════════════════════════════════════════════════
        shouldSyncHistoryMessage: () => true,
      });

      this.sock.ev.on('creds.update', saveCreds);

      // ──────────────────────────────────────────────────────
      // HISTORY SYNC — fires right after login with ALL chats
      // This is the key event that gives us individual DMs!
      // ──────────────────────────────────────────────────────
      this.sock.ev.on('messaging-history.set', ({ chats, contacts, isLatest }: any) => {
        const chatArr = Array.isArray(chats) ? chats : [];
        // FIX: contacts is an ARRAY (Contact[]), not an object — iterate directly
        const contactArr = Array.isArray(contacts) ? contacts : [];

        logger.info(
          { chatCount: chatArr.length, contactCount: contactArr.length, isLatest },
          '📦 History sync received — populating chat list'
        );

        // Save contact names for enrichment
        for (const contact of contactArr) {
          const id = contact?.id;
          if (!id) continue;
          const name = contact?.name || contact?.notify || contact?.verifiedName;
          if (name) this.contactNames.set(id, name);
        }

        // Process all chats from history sync — includes individuals!
        for (const c of chatArr) {
          this.upsertChat(c);
        }

        // KEY FIX: Create chat entries for individual contacts that don't have a chat yet.
        // This is the main reason individual DMs never appeared!
        for (const contact of contactArr) {
          const id = contact?.id;
          if (!id) continue;
          if (id.endsWith('@s.whatsapp.net') && id !== this.connectedPhone && !this.chats.has(id)) {
            const name = contact?.name || contact?.notify || contact?.verifiedName || id.split('@')[0];
            this.upsertChat({ id, name, conversationTimestamp: undefined, unreadCount: 0 });
          }
        }

        // Enrich existing chats with contact names
        for (const [id, name] of this.contactNames) {
          const chat = this.chats.get(id);
          if (chat && (!chat.name || chat.name === chat.phone || chat.name === 'Unknown')) {
            chat.name = name;
          }
        }

        this.scheduleSave();
      });

      // ──────────────────────────────────────────────────────
      // INCREMENTAL CHAT UPDATES
      // ──────────────────────────────────────────────────────
      this.sock.ev.on('chats.upsert', (newChats: any[]) => {
        logger.info({ count: newChats.length }, '📥 chats.upsert event');
        for (const c of newChats) {
          this.upsertChat(c);
        }
        this.scheduleSave();
      });

      this.sock.ev.on('chats.update', (updates: any[]) => {
        for (const c of updates) {
          const existing = this.chats.get(c.id);
          if (existing) {
            if (c.name) existing.name = c.name;
            if (c.unreadCount !== undefined) existing.unreadCount = c.unreadCount;
            if (c.conversationTimestamp) {
              existing.lastMessageAt = new Date((c.conversationTimestamp as number) * 1000).toISOString();
            }
          }
        }
        this.scheduleSave();
      });

      // ──────────────────────────────────────────────────────
      // CONTACTS — KEY FIX: CREATE individual chat entries!
      // Previously this only updated names for EXISTING chats.
      // Now it creates chat entries for all individual contacts.
      // ──────────────────────────────────────────────────────
      this.sock.ev.on('contacts.upsert', (contacts: any[]) => {
        logger.info({ count: contacts.length }, '👤 contacts.upsert event');
        let newCount = 0;
        for (const contact of contacts) {
          const id = contact.id;
          if (!id) continue;
          const name = contact.name || contact.notify || contact.verifiedName;
          if (name) this.contactNames.set(id, name);

          // KEY FIX: For individual contacts, CREATE a chat entry even without
          // message history. This is what makes individual chats appear!
          if (id.endsWith('@s.whatsapp.net') && id !== this.connectedPhone) {
            if (!this.chats.has(id)) {
              this.upsertChat({ id, name: name || id.split('@')[0], unreadCount: 0 });
              newCount++;
            } else if (name) {
              const existing = this.chats.get(id);
              if (existing && (!existing.name || existing.name === existing.phone || existing.name === 'Unknown')) {
                existing.name = name;
              }
            }
          }
        }
        if (newCount > 0) {
          logger.info({ newChats: newCount }, '✨ Created individual chat entries from contacts');
        }
        this.scheduleSave();
      });

      this.sock.ev.on('contacts.update', (updates: any[]) => {
        for (const c of updates) {
          if (c.id && (c.name || c.notify)) {
            const name = c.name || c.notify;
            this.contactNames.set(c.id, name);
            const existing = this.chats.get(c.id);
            if (existing) {
              existing.name = name;
            } else if (c.id.endsWith('@s.whatsapp.net') && c.id !== this.connectedPhone) {
              this.upsertChat({ id: c.id, name, unreadCount: 0 });
            }
          }
        }
        this.scheduleSave();
      });

      // ──────────────────────────────────────────────────────
      // CONNECTION LIFECYCLE
      // ──────────────────────────────────────────────────────
      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.lastQr = qr;
          this.status = 'qr_pending';
          qrcode.generate(qr, { small: true });
          logger.info('QR code generated. Scan it from WhatsApp → Linked devices.');
          this.emit('qr', qr);
          await setAccountStatus(this.orgId, this.accountId!, 'qr_pending');
        }

        if (connection === 'open') {
          this.status = 'connected';
          this.starting = false;
          const me = this.sock?.user?.id ?? '';
          this.connectedPhone = me;
          logger.info({ user: me }, 'WhatsApp connected');
          this.emit('connected', me);
          await setAccountStatus(this.orgId, this.accountId!, 'connected', { phone: me });

          // Sync groups immediately. Individual DMs will arrive via
          // messaging-history.set and contacts.upsert events shortly after.
          await this.syncGroups();
        }

        if (connection === 'close') {
          this.starting = false;
          const code = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = code !== DisconnectReason.loggedOut;
          logger.warn({ code, shouldReconnect }, 'WhatsApp connection closed');
          this.status = shouldReconnect ? 'disconnected' : 'disabled';
          this.sock = null;
          if (shouldReconnect) {
            await setAccountStatus(this.orgId, this.accountId!, 'disconnected');
            setTimeout(() => this.start().catch(() => {}), 3000);
          } else {
            await setAccountStatus(this.orgId, this.accountId!, 'disabled');
          }
        }
      });

      // ──────────────────────────────────────────────────────
      // INCOMING MESSAGES
      // ──────────────────────────────────────────────────────
      this.sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
        // FIX: Process BOTH 'notify' (real-time) and 'append' (offline/backfill).
        // Previously only 'notify' was processed, so messages that arrived during
        // a reconnect were silently dropped — a common reason new numbers "didn't trigger".
        // Dedup is handled downstream by whatsappService (external_message_id unique check).
        if (type !== 'notify' && type !== 'append') return;

        logger.info({ type, count: messages?.length ?? 0 }, '📨 messages.upsert received');

        for (const msg of messages) {
          if (!msg.message) continue;
          // DEBUG: Allow self-messages when WHATSAPP_SELF_TEST=true.
          // The bot's own reply is outbound and won't re-trigger this path.
          if (msg.key.fromMe && !config.whatsapp.selfMessageTest) continue;
          if (msg.key.fromMe && config.whatsapp.selfMessageTest) {
            logger.info({ chatId: msg.key.remoteJid }, '🧪 [SELF_TEST] Processing self-message');
          }

          const parsed = parseWhatsAppMessage(msg);
          if (!parsed) continue;

          // ── MEDIA DOWNLOAD ──
          // Download and store media for non-text messages
          if (parsed.messageType !== 'text' && parsed.messageType !== 'unknown') {
            try {
              const media = await this.downloadMedia(msg);
              if (media) {
                const { uploadWhatsAppMedia } = await import('../uploads/storageService');
                const result = await uploadWhatsAppMedia({
                  orgId: this.orgId,
                  buffer: media.buffer,
                  mimeType: media.mimeType,
                  fileName: media.fileName,
                });
                parsed.mediaUrl = result.url;
                parsed.mediaMimeType = media.mimeType;
                parsed.mediaFileName = media.fileName ?? null;
                // For non-text messages with no caption, synthesize text for AI
                if (!parsed.text) {
                  parsed.text = `[${parsed.messageType}${media.fileName ? ': ' + media.fileName : ''}]`;
                }
                logger.info({ chatId: parsed.chatId, type: parsed.messageType, size: media.buffer.length }, '📥 Media downloaded and stored');
              }
            } catch (err) {
              logger.warn({ err, chatId: parsed.chatId }, 'Media download failed — continuing without media');
            }
          }

          // FIX: Previously, messages with no text (audio, stickers, contacts, reactions,
          // protocol messages) were silently dropped here with `if (!parsed.text) continue`.
          // For a new number whose FIRST message is a voice note or sticker, the bot
          // would never see it and never respond — making it seem like the number "didn't sync".
          // Now we synthesize placeholder text so the message flows through the pipeline.
          // The AI can then ask the customer to send text, or we handle it gracefully.
          if (!parsed.text || parsed.text.trim() === '') {
            if (parsed.messageType === 'audio') {
              parsed.text = '[voice note — please send your query as text]';
            } else if (parsed.messageType === 'image' || parsed.messageType === 'video') {
              parsed.text = '[media message]';
            } else if (parsed.messageType === 'document') {
              parsed.text = `[document${parsed.mediaFileName ? ': ' + parsed.mediaFileName : ''}]`;
            } else if (parsed.messageType === 'location') {
              // Location messages already have synthesized text from the parser
            } else {
              // Stickers, reactions, contacts, protocol messages, etc.
              logger.info(
                { chatId: parsed.chatId, messageType: parsed.messageType },
                '⏭️ Skipping non-text message with no synthesized content'
              );
              continue;
            }
            logger.info(
              { chatId: parsed.chatId, messageType: parsed.messageType, synthesizedText: parsed.text },
              '📝 Synthesized placeholder text for non-text message'
            );
          }

          // Update chat list with last message
          this.updateChatFromMessage(parsed);

          // Enrich with contact name from our lookup Map
          // Try chatId first (for DMs), then senderId (for group participants)
          parsed.senderName =
            this.contactNames.get(parsed.chatId) ??
            this.contactNames.get(parsed.senderId) ??
            null;

          // ── ROOT CAUSE FIX ──
          // For GROUPS: only process chats that are toggled ON in the dashboard.
          // For individual DMs: ALWAYS process — no manual toggle required.
          // Previously this check applied to ALL chats, so any number not in
          // the in-memory monitoredChatIds Set was silently dropped (the Set
          // resets on every server restart). This was the #1 reason the bot
          // "didn't reply" to new numbers.
          const isGroupChat = parsed.chatId.endsWith('@g.us');
          if (isGroupChat && !this.monitoredChatIds.has(parsed.chatId)) {
            logger.info({ chatId: parsed.chatId }, 'Skipping group message: not monitored');
            continue;
          }
          if (!isGroupChat) {
            logger.info(
              { chatId: parsed.chatId, phone: parsed.senderPhone, text: parsed.text?.slice(0, 50) },
              '📨 DM received — processing'
            );
          }

          // Allowlist (still works as a top-level safety)
          if (config.whatsapp.allowedNumbers.length > 0) {
            const num = parsed.senderPhone?.replace(/[^\d]/g, '');
            const ok = config.whatsapp.allowedNumbers.some((a: string) => a.replace(/[^\d]/g, '') === num);
            if (!ok) {
              logger.info({ from: num }, 'Ignoring message: not in allowlist');
              continue;
            }
          }

          this.emit('message', parsed);
        }
      });
    } catch (err) {
      this.starting = false;
      logger.error({ err }, 'Failed to start Baileys socket');
      throw err;
    }
  }

  /**
   * Upsert a chat entry from any Baileys chat object.
   * Handles both groups and individual chats.
   */
  private upsertChat(c: any): void {
    if (!c || !c.id) return;
    const id = c.id;
    if (id === 'status@broadcast') return;
    if (id === this.connectedPhone) return;

    const isGroup = id.endsWith('@g.us');
    const phone = !isGroup ? id.split('@')[0] : undefined;
    const contactName = this.contactNames.get(id);
    const name = c.name || c.subject || c.notify || contactName || (isGroup ? 'Group' : phone || 'Unknown');
    const existing = this.chats.get(id);

    // Default: individuals monitored, groups not
    if (!existing && !isGroup) {
      this.monitoredChatIds.add(id);
    }

    const lastMsg = c.messages
      ? Array.from(c.messages.values() as IterableIterator<any>).pop()
      : c.lastMessage;

    this.chats.set(id, {
      id,
      name,
      isGroup,
      phone,
      lastMessage: existing?.lastMessage
        ?? (lastMsg?.message ? this.extractTextFromMessage(lastMsg.message)?.slice(0, 80) : undefined),
      lastMessageAt: existing?.lastMessageAt
        ?? (c.conversationTimestamp ? new Date((c.conversationTimestamp as number) * 1000).toISOString() : undefined),
      monitored: this.monitoredChatIds.has(id),
      unreadCount: c.unreadCount ?? existing?.unreadCount ?? 0,
    });
  }

  /**
   * Extract text content from a Baileys message object for preview.
   */
  private extractTextFromMessage(msg: any): string | undefined {
    if (!msg) return undefined;
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg.videoMessage?.caption) return msg.videoMessage.caption;
    return undefined;
  }

  /**
   * Fetch all groups via API. Individual DMs are populated by events.
   */
  private async syncGroups(): Promise<void> {
    if (!this.sock) return;
    try {
      const groups = await this.sock.groupFetchAllParticipating().catch(() => ({} as any));

      for (const [id, g] of Object.entries(groups as Record<string, any>)) {
        this.chats.set(id, {
          id,
          name: g.subject || g.name || 'Group',
          isGroup: true,
          lastMessage: undefined,
          lastMessageAt: undefined,
          monitored: this.monitoredChatIds.has(id),
          unreadCount: 0,
        });
      }

      logger.info(
        { total: this.chats.size, monitored: this.monitoredChatIds.size },
        'Synced groups; individual chats will arrive via history sync events'
      );
    } catch (err) {
      logger.warn({ err }, 'Failed to sync groups');
    }
  }

  private updateChatFromMessage(parsed: ParsedWhatsAppMessage): void {
    const existing = this.chats.get(parsed.chatId);
    const isGroup = parsed.isGroup;

    // Auto-monitor new individual chats
    if (!existing && !isGroup) {
      this.monitoredChatIds.add(parsed.chatId);
    }

    const contactName = this.contactNames.get(parsed.chatId);
    const name = existing?.name ?? contactName ?? (isGroup ? 'Group' : parsed.senderPhone ?? 'Unknown');
    this.chats.set(parsed.chatId, {
      id: parsed.chatId,
      name,
      isGroup,
      phone: !isGroup ? parsed.senderPhone ?? undefined : undefined,
      lastMessage: parsed.text.slice(0, 80),
      lastMessageAt: new Date().toISOString(),
      monitored: this.monitoredChatIds.has(parsed.chatId),
      unreadCount: (existing?.unreadCount ?? 0) + 1,
    });
  }

  /**
   * Get list of all known chats for the UI.
   */
  getChats(): WhatsAppChat[] {
    return Array.from(this.chats.values())
      .sort((a, b) => {
        if (a.monitored !== b.monitored) return a.monitored ? -1 : 1;
        if (a.isGroup !== b.isGroup) return a.isGroup ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Toggle AI monitoring for ANY chat (group or individual).
   */
  toggleChatMonitor(chatId: string): boolean {
    const nowMonitored = !this.monitoredChatIds.has(chatId);
    if (nowMonitored) {
      this.monitoredChatIds.add(chatId);
    } else {
      this.monitoredChatIds.delete(chatId);
    }
    const c = this.chats.get(chatId);
    if (c) c.monitored = nowMonitored;
    logger.info({ chatId, nowMonitored }, 'Chat monitoring toggled');
    this.scheduleSave();
    return nowMonitored;
  }

  /**
   * Bulk toggle monitoring for multiple chats at once.
   * Used by the "Select All / Deselect All" UI feature.
   */
  bulkToggleMonitor(chatIds: string[], monitored: boolean): { updated: number } {
    let updated = 0;
    for (const chatId of chatIds) {
      if (monitored) {
        if (!this.monitoredChatIds.has(chatId)) updated++;
        this.monitoredChatIds.add(chatId);
      } else {
        if (this.monitoredChatIds.has(chatId)) updated++;
        this.monitoredChatIds.delete(chatId);
      }
      const c = this.chats.get(chatId);
      if (c) c.monitored = monitored;
    }
    logger.info({ count: chatIds.length, monitored, changed: updated }, 'Bulk chat monitoring toggled');
    this.scheduleSave();
    return { updated };
  }

  /**
   * Stop the connection but KEEP the session alive.
   * Use this for a "Pause" — next start() will reconnect silently.
   * Does NOT unlink the device from the phone.
   */
  async stop(): Promise<void> {
    try {
      if (this.sock) {
        // Use end() not logout() — logout() unlinks the device!
        this.sock.end(undefined);
        this.sock = null;
      }
    } catch {
      this.sock = null;
    }
    this.status = 'disconnected';
    // FIX: Do NOT clear chats — keep them for UI continuity across restarts.
    // They are persisted on disk and restored on next start().
    this.saveToDisk();
    if (this.accountId) {
      await setAccountStatus(this.orgId, this.accountId, 'disconnected');
    }
    logger.info('WhatsApp bridge stopped (session + chats preserved)');
  }

  /**
   * Delete the session and start fresh — generates a new QR code.
   * Use this when the device was unlinked/logged out and the old session
   * is stale. This is the "Re-link WhatsApp" action.
   */
  async relink(): Promise<void> {
    logger.info('Starting re-link: clearing old session and generating fresh QR');

    // 1. Close existing socket if any
    try {
      this.sock?.end(undefined);
    } catch {}
    this.sock = null;

    // 2. Delete the session directory so Baileys starts fresh
    try {
      if (fs.existsSync(this.sessionDir)) {
        const files = fs.readdirSync(this.sessionDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.sessionDir, file));
        }
        logger.info({ dir: this.sessionDir, fileCount: files.length }, 'Cleared session files');
      }
    } catch (err) {
      logger.warn({ err }, 'Could not fully clear session dir — continuing anyway');
    }

    // 3. Reset internal state — THIS is when we clear chats (new account)
    this.status = 'disconnected';
    this.lastQr = null;
    this.connectedPhone = null;
    this.chats.clear();
    this.monitoredChatIds.clear();
    this.contactNames.clear();
    this.starting = false;

    // Delete persisted chat store too (fresh account)
    try { if (fs.existsSync(this.storePath)) fs.unlinkSync(this.storePath); } catch {}

    // 4. Start fresh — will generate a new QR code
    await this.start();
    logger.info('Re-link initiated — new QR code should appear shortly');
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.sock) throw new Error('WhatsApp socket not connected');
    await this.sock.sendMessage(chatId, { text });
  }

  /**
   * Send a media file (image/document) with optional caption.
   * Supports both remote URLs and raw Buffer data.
   */
  async sendMedia(chatId: string, opts: { url?: string; buffer?: Buffer; fileName?: string; caption?: string; mimeType?: string }): Promise<void> {
    if (!this.sock) throw new Error('WhatsApp socket not connected');

    const url = opts.url;
    const buffer = opts.buffer;
    const fileName = opts.fileName ?? '';
    const caption = opts.caption;
    const mimeType = opts.mimeType ?? '';

    if (url) {
      const isDoc = mimeType.startsWith('application/') || /\.(pdf|docx?|xlsx?|pptx?)$/i.test(fileName);
      if (isDoc) {
        await this.sock.sendMessage(chatId, {
          document: { url },
          fileName: fileName || 'document',
          caption: caption || undefined,
          mimetype: mimeType,
        });
      } else {
        await this.sock.sendMessage(chatId, {
          image: { url },
          caption: caption || undefined,
          mimetype: mimeType || undefined,
        });
      }
    } else if (buffer) {
      const isDoc = mimeType.startsWith('application/') || /.(pdf|docx?|xlsx?|pptx?)$/i.test(fileName);
      if (isDoc) {
        await this.sock.sendMessage(chatId, {
          document: buffer,
          fileName: fileName || 'document.pdf',
          caption: caption || undefined,
          mimetype: mimeType,
        });
      } else {
        await this.sock.sendMessage(chatId, {
          image: buffer,
          caption: caption || undefined,
          mimetype: mimeType || undefined,
        });
      }
    } else {
      throw new Error('sendMedia requires either url or buffer');
    }

    logger.info({ chatId, fileName, mimeType, hasUrl: !!url, hasBuffer: !!buffer }, 'Media sent via WhatsApp');
  }

  /**
   * Send a location pin via WhatsApp.
   * Uses Baileys' native location message type.
   */
  async sendLocation(chatId: string, opts: { latitude: number; longitude: number; name?: string; address?: string }): Promise<void> {
    if (!this.sock) throw new Error('WhatsApp socket not connected');

    await this.sock.sendMessage(chatId, {
      location: {
        degreesLatitude: opts.latitude,
        degreesLongitude: opts.longitude,
        name: opts.name || undefined,
        address: opts.address || undefined,
      },
    });

    logger.info(
      { chatId, lat: opts.latitude, lng: opts.longitude, name: opts.name },
      '📍 Location pin sent via WhatsApp'
    );
  }

  /**
   * Download media from a raw Baileys message.
   * Returns Buffer + mimeType + fileName.
   */
  async downloadMedia(rawMsg: any): Promise<{ buffer: Buffer; mimeType: string; fileName?: string } | null> {
    if (!this.sock) return null;
    try {
      const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
      const buffer = await downloadMediaMessage(rawMsg, 'buffer', {});
      const m = rawMsg.message;
      let mimeType = 'application/octet-stream';
      let fileName: string | undefined;

      if (m.imageMessage) {
        mimeType = m.imageMessage.mimetype || 'image/jpeg';
      } else if (m.videoMessage) {
        mimeType = m.videoMessage.mimetype || 'video/mp4';
      } else if (m.audioMessage) {
        mimeType = m.audioMessage.mimetype || 'audio/ogg';
      } else if (m.documentMessage) {
        mimeType = m.documentMessage.mimetype || 'application/octet-stream';
        fileName = m.documentMessage.fileName;
      }
      return { buffer: buffer as Buffer, mimeType, fileName };
    } catch (err) {
      logger.warn({ err }, 'Failed to download WhatsApp media');
      return null;
    }
  }

  async getStatus(): Promise<any> {
    return {
      provider: 'baileys',
      status: this.status,
      connectedPhone: this.connectedPhone,
      hasQr: !!this.lastQr,
      qr: this.status === 'qr_pending' ? this.lastQr : null,
      accountId: this.accountId,
      orgId: this.orgId,
      chatsCount: this.chats.size,
      monitoredCount: this.monitoredChatIds.size,
    };
  }

  /**
   * Synchronous status — for internal lookups (no async overhead).
   * Used by ConnectionManager to find adapters by orgId.
   */
  getStatusSync(): { status: string; orgId: string; connectedPhone: string | null; accountId: string | null } {
    return {
      status: this.status,
      orgId: this.orgId,
      connectedPhone: this.connectedPhone,
      accountId: this.accountId,
    };
  }
}
