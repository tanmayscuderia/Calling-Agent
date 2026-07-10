/**
 * Phone / WhatsApp JID utilities.
 */

/** Convert a WhatsApp JID like 919999999999@s.whatsapp.net to E.164-ish +91... */
export function jidToPhone(jid: string): string {
  if (!jid) return '';
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