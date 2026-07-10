import { describe, it, expect } from 'vitest';
import { formatINR, formatPriceRange } from '../../src/utils/money';

describe('formatINR', () => {
  it('formats crores', () => {
    expect(formatINR(16500000)).toBe('₹1.65 Cr');
  });

  it('formats whole crores (strips .00)', () => {
    expect(formatINR(10000000)).toBe('₹1 Cr');
  });

  it('formats lakhs', () => {
    expect(formatINR(9500000)).toBe('₹95 L');
  });

  it('formats whole lakhs (strips .00)', () => {
    expect(formatINR(500000)).toBe('₹5 L');
  });

  it('formats sub-lakh amounts', () => {
    expect(formatINR(75000)).toBe('₹75,000');
  });

  it('returns dash for null', () => {
    expect(formatINR(null)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(formatINR(undefined)).toBe('—');
  });

  it('returns dash for NaN', () => {
    expect(formatINR(NaN)).toBe('—');
  });
});

describe('formatPriceRange', () => {
  it('formats min and max range', () => {
    expect(formatPriceRange(16500000, 21000000)).toBe('₹1.65 Cr–₹2.10 Cr');
  });

  it('formats min only', () => {
    expect(formatPriceRange(9500000)).toBe('from ₹95 L');
  });

  it('formats max only', () => {
    expect(formatPriceRange(null, 50000000)).toBe('up to ₹5 Cr');
  });

  it('returns placeholder for both null', () => {
    expect(formatPriceRange(null, null)).toBe('Price on request');
  });

  it('returns placeholder for both undefined', () => {
    expect(formatPriceRange(undefined, undefined)).toBe('Price on request');
  });
});