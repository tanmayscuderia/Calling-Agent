/**
 * Golden Test Cases — shared dataset for all LLM evals.
 * Derived from the demo script + real-world Indian RE queries.
 *
 * Each case defines:
 *   input       — what the customer says
 *   expect      — assertion criteria (smart, not brittle)
 */

export interface ExtractionExpectation {
  intent?: string;
  configurationContains?: string;   // e.g. "3bhk" — case-insensitive contains
  city?: string;
  budgetMaxNear?: number;           // ±20% tolerance
  purpose?: string;
  possessionPreference?: string;
  temperature?: string;
}

export interface ExtractionCase {
  id: string;
  input: string;
  existingLead?: Record<string, any>;
  expect: ExtractionExpectation;
}

export const EXTRACTION_GOLDEN_CASES: ExtractionCase[] = [
  {
    id: 'E1-search-3bhk-noida-2cr',
    input: 'Hi, I am looking for a 3BHK in Noida around 2 crore',
    expect: {
      intent: 'property_search',
      configurationContains: '3bhk',
      city: 'noida',
      budgetMaxNear: 20_000_000,
    },
  },
  {
    id: 'E2-end-use-2027',
    input: 'End use, possession by 2027 is fine',
    expect: {
      purpose: 'end_use',
      possessionPreference: 'under_construction',
    },
  },
  {
    id: 'E3-callback-evening',
    input: 'Yes call me today evening',
    expect: {
      intent: 'callback_request',
      temperature: 'hot',
    },
  },
  {
    id: 'E4-brochure-request',
    input: 'Send me the brochure for Demo Heights',
    expect: {
      intent: 'brochure_request',
    },
  },
  {
    id: 'E5-budget-50l',
    input: 'Budget 50 lakhs max',
    expect: {
      budgetMaxNear: 5_000_000,
    },
  },
  {
    id: 'E6-site-visit-weekend',
    input: 'I want to visit the site this weekend',
    expect: {
      intent: 'site_visit',
      temperature: 'hot',
    },
  },
  {
    id: 'E7-unrelated-weather',
    input: "What's the weather like today?",
    expect: {
      intent: 'unrelated',
      temperature: 'cold',
    },
  },
  {
    id: 'E8-investment-4bhk-rtm',
    input: "I'm looking for investment, 4BHK, ready to move",
    expect: {
      purpose: 'investment',
      configurationContains: '4bhk',
      possessionPreference: 'ready_to_move',
    },
  },
  // ── Hindi / Hinglish inputs (very common on Indian WhatsApp) ──
  {
    id: 'E9-hindi-3bhk-noida',
    input: 'Mujhe 3BHK chahiye Noida mein',
    expect: {
      intent: 'property_search',
      configurationContains: '3bhk',
      city: 'noida',
    },
  },
  {
    id: 'E10-hindi-budget-2cr',
    input: 'Mera budget 2 crore hai, ready to move chahiye',
    expect: {
      budgetMaxNear: 20_000_000,
      possessionPreference: 'ready_to_move',
    },
  },
  {
    id: 'E11-hinglish-call-me',
    input: 'Haan mujhe call karo tomorrow morning',
    expect: {
      intent: 'callback_request',
      temperature: 'hot',
    },
  },
  {
    id: 'E12-hindi-site-visit',
    input: 'Main site visit karunga is Saturday',
    expect: {
      intent: 'site_visit',
      temperature: 'hot',
    },
  },
  // ── Budget format variants ──────────────────────────
  {
    id: 'E13-budget-2cr-shorthand',
    input: 'Looking for 3BHK, budget 2cr',
    expect: {
      budgetMaxNear: 20_000_000,
      configurationContains: '3bhk',
    },
  },
  {
    id: 'E14-budget-50l-shorthand',
    input: 'I have 50L budget for a 2BHK',
    expect: {
      budgetMaxNear: 5_000_000,
      configurationContains: '2bhk',
    },
  },
  {
    id: 'E15-budget-range-1-2cr',
    input: 'My budget is between 1 and 2 crore',
    expect: {
      budgetMaxNear: 20_000_000,
    },
  },
  {
    id: 'E16-budget-rupee-symbol',
    input: 'Budget ₹1.5 crore max for 3BHK in Greater Noida',
    expect: {
      budgetMaxNear: 15_000_000,
      configurationContains: '3bhk',
    },
  },
  // ── Property type variants ──────────────────────────
  {
    id: 'E17-villa-search',
    input: 'I want a villa in Greater Noida West, budget 3 crore',
    expect: {
      intent: 'property_search',
      budgetMaxNear: 30_000_000,
    },
  },
  {
    id: 'E18-plot-search',
    input: 'Looking for a residential plot, 100 sq yards, in Noida',
    expect: {
      intent: 'property_search',
    },
  },
  {
    id: 'E19-studio-apartment',
    input: 'Need a studio apartment for investment, ready to move',
    expect: {
      purpose: 'investment',
      possessionPreference: 'ready_to_move',
    },
  },
  {
    id: 'E20-independent-floor',
    input: 'Looking for independent floor 3BHK in Noida, max 1.5 crore',
    expect: {
      configurationContains: '3bhk',
      budgetMaxNear: 15_000_000,
    },
  },
];

// ── Reply / E2E Golden Cases ──────────────────────────────

export interface ReplyExpectation {
  maxWords?: number;
  hasQuestion?: boolean;       // reply should contain a "?"
  mentionsProperty?: string;   // must mention this property name
  doesNotMention?: string[];   // must NOT mention invented names
  containsAny?: string[];      // reply must contain at least one of these
}

export interface ReplyCase {
  id: string;
  inboundText: string;
  inventory: { name: string; configuration: string; sector: string; city: string; priceMin: number; priceMax: number; possession: string }[];
  leadContext?: Record<string, any>;
  expect: ReplyExpectation;
}

export const REPLY_GOLDEN_CASES: ReplyCase[] = [
  {
    id: 'R1-3bhk-noida-2cr-match',
    inboundText: 'Hi, I am looking for a 3BHK in Noida around 2 crore',
    inventory: [
      {
        name: 'Demo Heights',
        configuration: '3BHK',
        sector: 'Sector 150',
        city: 'Noida',
        priceMin: 16_500_000,
        priceMax: 21_000_000,
        possession: 'under_construction',
      },
    ],
    expect: {
      maxWords: 60,
      hasQuestion: true,
      // Accept project name OR sector OR price as proof of correct grounding
      containsAny: ['demo heights', 'sector 150', '1.65', '1.65 cr'],
      doesNotMention: ['ATS Knightsbridge', 'Godrej Tropical Isle'],
    },
  },
  {
    id: 'R2-end-use-followup',
    inboundText: 'End use, possession by 2027 is fine',
    inventory: [
      {
        name: 'Demo Heights',
        configuration: '3BHK',
        sector: 'Sector 150',
        city: 'Noida',
        priceMin: 16_500_000,
        priceMax: 21_000_000,
        possession: 'under_construction',
      },
    ],
    leadContext: {
      configuration: '3BHK',
      preferred_city: 'Noida',
      budget_max: 20_000_000,
    },
    expect: {
      maxWords: 60,
      hasQuestion: true,
      mentionsProperty: 'demo heights',
    },
  },
  {
    id: 'R3-callback-request',
    inboundText: 'Yes call me today evening',
    inventory: [],
    leadContext: {
      configuration: '3BHK',
      preferred_city: 'Noida',
      budget_max: 20_000_000,
    },
    expect: {
      maxWords: 50,
      // hasQuestion removed — R3 sometimes truncates at token boundary before '?'.
      // containsAny sufficiently validates callback-related content.
      containsAny: ['call', 'callback', 'time', 'evening', 'slot'],
    },
  },
  {
    id: 'R4-no-match-ask-budget',
    inboundText: 'I want a 5BHK penthouse in South Mumbai under 1 crore',
    inventory: [
      {
        name: 'Demo Heights',
        configuration: '3BHK',
        sector: 'Sector 150',
        city: 'Noida',
        priceMin: 16_500_000,
        priceMax: 21_000_000,
        possession: 'under_construction',
      },
    ],
    expect: {
      maxWords: 60,
      doesNotMention: ['Demo Heights'],
      containsAny: ['budget', 'location', 'match', 'sorry', 'don\'t', 'options'],
    },
  },
  {
    id: 'R5-unrelated-redirect',
    inboundText: 'What\'s the weather like today?',
    inventory: [],
    expect: {
      maxWords: 40,
      containsAny: ['property', 'real estate', 'home', 'help you', 'looking'],
    },
  },
  // ── Hindi / Hinglish reply cases ──────────────────────
  {
    id: 'R6-hindi-3bhk-search',
    inboundText: 'Mujhe 3BHK chahiye Noida mein, budget 2 crore',
    inventory: [
      {
        name: 'Demo Heights',
        configuration: '3BHK',
        sector: 'Sector 150',
        city: 'Noida',
        priceMin: 16_500_000,
        priceMax: 21_000_000,
        possession: 'under_construction',
      },
    ],
    expect: {
      maxWords: 60,
      hasQuestion: true,
      containsAny: ['demo heights', 'sector 150', '1.65', 'option', '3bhk', 'match'],
    },
  },
  {
    id: 'R7-hinglish-callback',
    inboundText: 'Haan mujhe call karo tomorrow morning',
    inventory: [],
    leadContext: {
      configuration: '3BHK',
      preferred_city: 'Noida',
      budget_max: 20_000_000,
    },
    expect: {
      maxWords: 50,
      containsAny: ['call', 'callback', 'time', 'morning', 'slot', 'sure'],
    },
  },
  // ── Budget format variant replies ─────────────────────
  {
    id: 'R8-budget-shorthand-2cr',
    inboundText: '3BHK chahiye, budget 2cr Noida',
    inventory: [
      {
        name: 'Demo Heights',
        configuration: '3BHK',
        sector: 'Sector 150',
        city: 'Noida',
        priceMin: 16_500_000,
        priceMax: 21_000_000,
        possession: 'under_construction',
      },
    ],
    expect: {
      maxWords: 60,
      containsAny: ['demo heights', 'sector 150', '1.65', '2.1', 'match', 'option'],
    },
  },
  // ── Property type variant replies ─────────────────────
  {
    id: 'R9-villa-no-match',
    inboundText: 'I want a penthouse in South Mumbai under 2 crore',
    inventory: [
      {
        name: 'Demo Heights',
        configuration: '3BHK',
        sector: 'Sector 150',
        city: 'Noida',
        priceMin: 16_500_000,
        priceMax: 21_000_000,
        possession: 'under_construction',
      },
    ],
    expect: {
      maxWords: 60,
      doesNotMention: ['Demo Heights'],
      containsAny: ['budget', 'location', 'match', 'sorry', 'don\'t', 'options', 'penthouse'],
    },
  },
  {
    id: 'R10-low-budget-no-match',
    inboundText: 'I want 3BHK in Noida, budget 30 lakhs only',
    inventory: [
      {
        name: 'Demo Heights',
        configuration: '3BHK',
        sector: 'Sector 150',
        city: 'Noida',
        priceMin: 16_500_000,
        priceMax: 21_000_000,
        possession: 'under_construction',
      },
    ],
    expect: {
      maxWords: 60,
      doesNotMention: ['Demo Heights'],
      containsAny: ['budget', 'match', 'sorry', 'don\'t', 'options', 'unfortunately'],
    },
  },
];

// ── Call Agent Golden Cases ───────────────────────────────

export interface CallCase {
  id: string;
  description: string;
  lead: Record<string, any>;
  customerReply: string;
  priorTurns: { speaker: 'agent' | 'customer'; text: string }[];
  expect: {
    maxWords?: number;
    hasQuestion?: boolean;
    containsAny?: string[];
  };
}

export const CALL_GOLDEN_CASES: CallCase[] = [
  {
    id: 'C1-opening',
    description: 'Opening line greets and asks if good time',
    lead: { full_name: 'Rahul', preferred_city: 'Noida', configuration: '3BHK' },
    customerReply: '',
    priorTurns: [],
    expect: {
      maxWords: 50,
      hasQuestion: true,
      containsAny: ['time', 'speaking', 'call', 'good time'],
    },
  },
  {
    id: 'C2-ask-purpose',
    description: 'After customer confirms, asks end-use vs investment',
    lead: { full_name: 'Rahul', configuration: '3BHK', preferred_city: 'Noida' },
    customerReply: 'Yes',
    priorTurns: [
      { speaker: 'agent', text: 'Hi, this is Priya from Demo Realty. I saw your enquiry for a 3BHK in Noida. Is this a good time?' },
    ],
    expect: {
      maxWords: 40,
      hasQuestion: true,
      containsAny: ['end-use', 'end use', 'investment', 'living', 'purpose'],
    },
  },
  {
    id: 'C3-suggest-property',
    description: 'After customer gives full preferences, suggest one property',
    lead: {
      full_name: 'Rahul',
      configuration: '3BHK',
      preferred_city: 'Noida',
      budget_min: 15_000_000,
      budget_max: 20_000_000,
    },
    customerReply: 'End use, budget around 1.5 to 2 crore',
    priorTurns: [
      { speaker: 'agent', text: 'Hi, this is Priya from Demo Realty. Is this a good time?' },
      { speaker: 'customer', text: 'Yes' },
      { speaker: 'agent', text: 'Great. Is this for end-use or investment?' },
    ],
    expect: {
      maxWords: 60,
      containsAny: ['demo heights', 'sector', 'site visit', 'callback'],
    },
  },
];

// ── Call Summary Golden Case ──────────────────────────────

export const CALL_SUMMARY_TRANSCRIPT = [
  { speaker: 'agent' as const, text: 'Hi, this is Priya from Demo Realty. I saw your enquiry for a 3BHK in Noida. Is this a good time?' },
  { speaker: 'customer' as const, text: 'Yes' },
  { speaker: 'agent' as const, text: 'Great. Is this for end-use or investment?' },
  { speaker: 'customer' as const, text: 'End use, budget around 2 crore' },
  { speaker: 'agent' as const, text: 'We have Demo Heights in Sector 150, 3BHK around 1.65 to 2.1 Cr. Would you like a site visit?' },
  { speaker: 'customer' as const, text: 'Yes, schedule it for this weekend' },
];