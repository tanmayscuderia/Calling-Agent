/**
 * Phone / WhatsApp JID utilities.
 */

/**
 * JID domain — 's.whatsapp.net' (1:1 chat), 'lid' (privacy Linked ID),
 * 'g.us' (group), 'newsletter' (channel), 'broadcast' (status).
 */
export function jidDomain(jid: string): string {
  if (!jid) return '';
  const at = jid.lastIndexOf('@');
  return at === -1 ? '' : jid.slice(at + 1).split(':')[0];
}

/** True for privacy Linked-ID JIDs (xxx@lid) — the digits are NOT a phone. */
export function isLidJid(jid: string): boolean {
  return jidDomain(jid) === 'lid';
}

/** Convert a WhatsApp JID like 919999999999@s.whatsapp.net to E.164-ish +91... */
export function jidToPhone(jid: string): string {
  if (!jid) return '';
  // ONLY 1:1 WhatsApp JIDs carry a real phone number. The digits inside
  // @lid (Linked IDs), @g.us (groups), @newsletter (channels) and
  // @broadcast (status) JIDs are NOT phone numbers — treating them as
  // such created garbage leads like +275101262078103.
  if (jid.includes('@') && jidDomain(jid) !== 's.whatsapp.net') return '';
  const base = jid.split('@')[0];
  // Strip group sender suffixes like 91...@s.whatsapp.net:groupstuff
  const clean = base.split(':')[0];
  if (!/^\d+$/.test(clean)) return clean;
  return clean.startsWith('+') ? clean : '+' + clean;
}

/** Normalize any user-entered phone to digits with a leading + (best-effort). */
export function normalizePhone(input: string): string {
  if (!input) return '';
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.startsWith('00') ? '+' + digits.slice(2) : '+' + digits;
}

/** Return true if a JID represents a group chat. */
export function isGroupJid(jid: string): boolean {
  return !!jid && jid.endsWith('@g.us');
}

/** Build a WhatsApp JID from a phone number string. */
export function phoneToJid(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `${digits}@s.whatsapp.net`;
}