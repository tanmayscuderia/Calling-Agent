/**
 * Free-text query parser for the Sarvam voice-agent inventory tool.
 *
 * The Sarvam dashboard sends the caller's demand as ONE agent-filled param
 * (`query`), e.g. "Noida sector 70 to 80, 2BHK, 8 to 10 crore". The inventory
 * engine (searchProperties/searchInventory) understands STRUCTURED filters
 * (city/sector/configuration/budget), not prose — so without this parser every
 * query degenerated to an unfiltered "top 3" result.
 *
 * Pure regex heuristics: no LLM, no DB, sub-millisecond. English + common
 * Hindi (करोड़/लाख/बीएचके/city names). Explicit params from the dashboard
 * always win over parsed values — this only FILLS GAPS.
 */

export interface ParsedQuery {
  /** e.g. ['3BHK'] or ['3BHK', '4BHK'] for "3 or 4 BHK" */
  configurations: string[];
  /** absolute ₹ */
  budgetMin?: number;
  budgetMax?: number;
  city?: string;
  /** e.g. 'Sector 70' */
  sector?: string;
  /** leftover location-ish text when nothing better matched */
  locationRaw?: string;
  /** penthouse / villa / plot / floor / commercial … */
  propertyTypes: string[];
}

// Longest-first so "greater noida" beats "noida"
const CITIES = [
  'greater noida', 'gurgaon', 'gurugram', 'noida', 'new delhi', 'delhi',
  'mumbai', 'bengaluru', 'bangalore', 'hyderabad', 'ahmedabad', 'chandigarh',
  'faridabad', 'ghaziabad', 'kolkata', 'chennai', 'lucknow', 'jaipur',
  'pune', 'thane', 'mohali', 'sonipat', 'panipat', 'indore', 'nagpur', 'surat',
];

const HINDI_CITIES: Record<string, string> = {
  'ग्रेटर नोएडा': 'Greater Noida',
  'गुड़गांव': 'Gurugram',
  'गुरुग्राम': 'Gurugram',
  'नोएडा': 'Noida',
  'नोयडा': 'Noida',
  'नई दिल्ली': 'New Delhi',
  'दिल्ली': 'Delhi',
  'मुंबई': 'Mumbai',
  'बेंगलुरु': 'Bengaluru',
  'हैदराबाद': 'Hyderabad',
  'चेन्नई': 'Chennai',
  'कोलकाता': 'Kolkata',
  'पुणे': 'Pune',
};

const TYPE_WORDS: Array<[RegExp, string]> = [
  [/\bpenthouses?\b|पेंटहाउस/i, 'Penthouse'],
  [/\bvillas?\b|विला/i, 'Villa'],
  [/\b(?:independent\s+)?floors?\b|फ़्लोर|फ्लोर/i, 'Independent Floor'],
  [/\bplots?\b|प्लॉट/i, 'Plot'],
  [/\brow\s+houses?\b/i, 'Row House'],
  [/\b(?:office|commercial|retail|shops?)\b/i, 'Commercial'],
];

const NUM = '(\\d+(?:\\.\\d+)?)';
const RANGE = `(?:${NUM}\\s*(?:-|–|to|से)\\s*(\\d+(?:\\.\\d+)?)\\s*)`;
const CR = 'cr|crores?|karod|karor|करोड़|करोड';
const LK = 'lakhs?|lac|लाख';

/** Noise stripped before the locationRaw fallback kicks in. */
const NOISE =
  /\b(propert(?:y|ies)|flat|apartments?|options?|list|show|need|want|looking|under|between|budget|price|and|or|for|in|near|at|kya|hai|chahiye|dikhao|batao|ghar)\b|में|चाहिए|दिखाओ|बताओ|मकान|फ्लैट|प्रॉपर्टी/gi;

const CR_MULT = 10_000_000;
const LK_MULT = 100_000;

function parseBudget(text: string): { min?: number; max?: number } {
  // CR/LK are alternations: always wrap as (?:CR) when composing, or the `|`
  // binds top-level and "करोड़" alone matches with NO capture groups → NaN.
  // Use (?![a-z]) instead of \b after units: \b misbehaves after Devanagari.
  const NOT_LETTER = '(?![a-z])';
  // Range with crore: "8-10 crore", "8 to 10 करोड़"
  let m = text.match(new RegExp(`${RANGE}(?:${CR})${NOT_LETTER}`, 'i'));
  if (m) return { min: Number(m[1]) * CR_MULT, max: Number(m[2]) * CR_MULT };
  // Range with lakh: "80-90 lakh"
  m = text.match(new RegExp(`${RANGE}(?:${LK})${NOT_LETTER}`, 'i'));
  if (m) return { min: Number(m[1]) * LK_MULT, max: Number(m[2]) * LK_MULT };
  // Single crore (incl. shorthand "8cr", "1.5cr")
  m = text.match(new RegExp(`${NUM}\\s*(?:${CR})${NOT_LETTER}`, 'i'));
  if (m) return { max: Number(m[1]) * CR_MULT };
  // Single lakh (incl. "80l", "80L")
  m = text.match(new RegExp(`${NUM}\\s*(?:${LK})${NOT_LETTER}`, 'i'));
  if (m) return { max: Number(m[1]) * LK_MULT };
  m = text.match(new RegExp(`${NUM}\\s*l\\b`, 'i'));
  if (m) return { max: Number(m[1]) * LK_MULT };
  return {};
}

export function parseFreeTextQuery(raw: string): ParsedQuery {
  const out: ParsedQuery = { configurations: [], propertyTypes: [] };
  if (!raw || !raw.trim()) return out;
  const text = raw.trim();

  // ── Configuration: "3BHK", "3 BHK", "4 bhk", "3 बीएचके", "3 or 4 bhk" ──
  // "3 or 4 bhk" needs a dedicated two-group match (a single-number regex
  // cannot span the "or"), so try the pair pattern first.
  const configurations: string[] = [];
  const pair = text.match(/([1-6])\s*(?:or|and|ya|और|-|–|to)\s*([1-6])\s*(?:bhk|b\.h\.k\.?|बीएचके)/i);
  if (pair) {
    for (const n of [pair[1], pair[2]]) {
      const cfg = `${n}BHK`;
      if (!configurations.includes(cfg)) configurations.push(cfg);
    }
  }
  const cfgRe = /([1-6])\s*(?:bhk|b\.h\.k\.?|बीएचके)/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cfgRe.exec(text)) !== null) {
    const cfg = `${cm[1]}BHK`;
    if (!configurations.includes(cfg)) configurations.push(cfg);
  }
  out.configurations = configurations;

  // ── Budget (₹ absolute) ──
  const budget = parseBudget(text);
  if (budget.min != null) out.budgetMin = budget.min;
  if (budget.max != null) out.budgetMax = budget.max;

  // ── Sector: "sector 70", "sector 70 to 80" (range → first) ──
  const sm = text.match(/sector\s*[-:]?\s*(\d{1,3})/i);
  if (sm) out.sector = `Sector ${Number(sm[1])}`;

  // ── City (English list + Hindi map), longest-first ──
  const lower = text.toLowerCase();
  for (const c of CITIES) {
    if (lower.includes(c)) {
      out.city = c.replace(/\b\w/g, (ch) => ch.toUpperCase());
      break;
    }
  }
  if (!out.city) {
    for (const [hindi, canonical] of Object.entries(HINDI_CITIES)) {
      if (text.includes(hindi)) {
        out.city = canonical;
        break;
      }
    }
  }

  // ── Property types ──
  for (const [re, label] of TYPE_WORDS) {
    if (re.test(text) && !out.propertyTypes.includes(label)) out.propertyTypes.push(label);
  }

  // ── Location fallback: whatever readable words remain ──
  if (!out.city && !out.sector) {
    let rest = text.replace(cfgRe, ' ');
    rest = rest.replace(new RegExp(NUM, 'g'), ' ');
    rest = rest.replace(/sector|crore|crores|lakhs?|lac|cr\b|l\b/gi, ' ');
    for (const [re] of TYPE_WORDS) rest = rest.replace(re, ' ');
    rest = rest.replace(NOISE, ' ');
    const words = rest
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    if (words.length > 0 && words.length <= 3) out.locationRaw = words.join(' ');
  }

  return out;
}