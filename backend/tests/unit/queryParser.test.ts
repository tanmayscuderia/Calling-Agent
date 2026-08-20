import { describe, it, expect } from 'vitest';
import { parseFreeTextQuery } from '../../src/sarvam/queryParser';

describe('parseFreeTextQuery', () => {
  it('extracts city + configuration + budget range from live-style queries', () => {
    const p = parseFreeTextQuery('Noida property 8 to 10 crore');
    expect(p.city).toBe('Noida');
    expect(p.budgetMin).toBe(80_000_000);
    expect(p.budgetMax).toBe(100_000_000);
  });

  it('extracts sector + BHK + city', () => {
    const p = parseFreeTextQuery('Noida sector 70 to 80, 2BHK');
    expect(p.city).toBe('Noida');
    expect(p.sector).toBe('Sector 70');
    expect(p.configurations).toEqual(['2BHK']);
  });

  it('supports spaced BHK ("4 BHK") and multi-config ("3 or 4 bhk")', () => {
    expect(parseFreeTextQuery('4 BHK in Gurgaon').configurations).toEqual(['4BHK']);
    expect(parseFreeTextQuery('3 or 4 bhk gurgaon').configurations).toEqual(['3BHK', '4BHK']);
  });

  it('prefers longest city ("greater noida" over "noida") and resolves gurgaon', () => {
    expect(parseFreeTextQuery('property in greater noida').city).toBe('Greater Noida');
    expect(parseFreeTextQuery('gurgaon me 3bhk').city).toBe('Gurgaon');
  });

  it('parses Hindi city + Hindi crore budget', () => {
    const p = parseFreeTextQuery('गुड़गांव में 8 से 10 करोड़');
    expect(p.city).toBe('Gurugram');
    expect(p.budgetMin).toBe(80_000_000);
    expect(p.budgetMax).toBe(100_000_000);
  });

  it('parses lakh shorthand and single crore cap', () => {
    expect(parseFreeTextQuery('80l budget bangalore')).toMatchObject({ budgetMax: 8_000_000 });
    expect(parseFreeTextQuery('under 2 cr mumbai')).toMatchObject({ budgetMax: 20_000_000 });
  });

  it('detects property types', () => {
    const p = parseFreeTextQuery('penthouse in mumbai');
    expect(p.propertyTypes).toContain('Penthouse');
  });

  it('returns empty for blank input and does not throw', () => {
    const p = parseFreeTextQuery('   ');
    expect(p.configurations).toEqual([]);
    expect(p.city).toBeUndefined();
    expect(p.budgetMax).toBeUndefined();
  });
});