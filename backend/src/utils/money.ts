/** Format a number as Indian rupees (compact, e.g. ₹1.65 Cr). */
export function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '—';
  const abs = Math.abs(amount);
  if (abs >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (abs >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** Format a price range. */
export function formatPriceRange(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return 'Price on request';
  if (min != null && max != null) return `${formatINR(min)}–${formatINR(max)}`;
  return min != null ? `from ${formatINR(min)}` : `up to ${formatINR(max)}`;
}