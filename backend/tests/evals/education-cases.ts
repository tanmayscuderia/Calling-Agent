/**
 * Cross-Industry Golden Cases — Education
 *
 * Proves that the template/promptEngine system generalizes beyond
 * real estate. The LLM gets a DIFFERENT config (education), different
 * prompt (generated from education template), and must extract
 * education-specific fields correctly.
 *
 * This is the real test of "is the system truly industry-agnostic?"
 */

// ── Education Extraction Cases ──

export interface EduExtractionExpectation {
  intent?: string;
  courseInterestContains?: string;
  educationLevel?: string;
  preferredMode?: string;
  budgetMaxNear?: number;
  temperature?: string;
}

export interface EduExtractionCase {
  id: string;
  input: string;
  expect: EduExtractionExpectation;
}

export const EDUCATION_EXTRACTION_CASES: EduExtractionCase[] = [
  {
    id: 'ED1-course-search',
    input: 'Hi, I want to learn data science. What courses do you have?',
    expect: {
      intent: 'course_search',
      courseInterestContains: 'data science',
    },
  },
  {
    id: 'ED2-callback',
    input: 'Please call me back tomorrow to discuss courses',
    expect: {
      intent: 'callback_request',
      temperature: 'hot',
    },
  },
  {
    id: 'ED3-budget-50k',
    input: 'My budget is 50 thousand for a Python course',
    expect: {
      budgetMaxNear: 50_000,
      courseInterestContains: 'python',
    },
  },
  {
    id: 'ED4-online-mode',
    input: 'I want an online course in digital marketing',
    expect: {
      preferredMode: 'online',
      courseInterestContains: 'digital marketing',
    },
  },
  {
    id: 'ED5-unrelated',
    input: 'What is the capital of France?',
    expect: {
      intent: 'unrelated',
      temperature: 'cold',
    },
  },
  {
    id: 'ED6-enrollment-hot',
    input: 'I want to enrol immediately, working professional, budget 1 lakh',
    expect: {
      intent: 'enrollment',
      temperature: 'hot',
      budgetMaxNear: 100_000,
      educationLevel: 'working_professional',
    },
  },
  {
    id: 'ED7-fees-question',
    input: 'How much are the fees for the full-stack development course?',
    expect: {
      intent: 'pricing_question',
      courseInterestContains: 'full-stack',
    },
  },
];

// ── Education Reply Cases ──

export interface EduReplyCase {
  id: string;
  inboundText: string;
  inventory: { name: string; mode: string; priceMin: number; priceMax: number; duration: string }[];
  leadContext?: Record<string, any>;
  expect: {
    maxWords?: number;
    hasQuestion?: boolean;
    containsAny?: string[];
    doesNotMention?: string[];
  };
}

export const EDUCATION_REPLY_CASES: EduReplyCase[] = [
  {
    id: 'ER1-course-match',
    inboundText: 'I want to learn data science, online mode, budget 80k',
    inventory: [
      { name: 'Data Science Pro', mode: 'online', priceMin: 60_000, priceMax: 90_000, duration: '6 months' },
    ],
    expect: {
      maxWords: 60,
      hasQuestion: true,
      containsAny: ['data science pro', 'data science', '6 month', '₹60', '60000', 'option'],
      doesNotMention: ['Python Basics', 'Digital Marketing'],
    },
  },
  {
    id: 'ER2-missing-info',
    inboundText: 'I want a course',
    inventory: [],
    expect: {
      maxWords: 50,
      containsAny: ['course', 'interested', 'field', 'subject', 'area'],
    },
  },
  {
    id: 'ER3-no-match',
    inboundText: 'I want a course on quantum physics under 5000 rupees',
    inventory: [
      { name: 'Data Science Pro', mode: 'online', priceMin: 60_000, priceMax: 90_000, duration: '6 months' },
    ],
    expect: {
      maxWords: 60,
      // Note: we DON'T ban mentioning Data Science Pro here — for education,
      // suggesting a career-relevant alternative when the requested niche
      // isn't available is natural sales behaviour. The containsAny check
      // validates the reply acknowledges the mismatch.
      containsAny: ['budget', 'match', 'sorry', "don't", 'options', 'unfortunately', 'explore', 'alternative', 'different'],
    },
  },
  {
    id: 'ER4-callback-request',
    inboundText: 'Call me tomorrow morning to discuss',
    inventory: [],
    leadContext: { course_interest: 'Data Science', budget_max: 80_000 },
    expect: {
      maxWords: 50,
      containsAny: ['call', 'callback', 'time', 'morning', 'slot', 'sure'],
    },
  },
];

/** Format education inventory for the LLM prompt. */
export function formatEduInventoryForPrompt(inv: EduReplyCase['inventory']): string {
  if (!inv.length) return '(no matching courses)';
  return inv
    .map((c, i) => `${i + 1}. ${c.name}, ${c.mode} — ₹${c.priceMin.toLocaleString('en-IN')}–${c.priceMax.toLocaleString('en-IN')}, ${c.duration}.`)
    .join('\n');
}