/**
 * Email normalization and validation utilities.
 */

/** Normalize an email: lowercase, trim, strip dots in Gmail-style addresses. */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;

  // Basic email regex
  const match = trimmed.match(/^([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})$/);
  if (!match) return null;

  return `${match[1]}@${match[2]}`;
}

/** Check if a string looks like a valid email. */
export function isValidEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) !== null;
}