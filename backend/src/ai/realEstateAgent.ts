import { llm } from './llmClient';
import { EXTRACTION_PROMPT, realEstateSystemPrompt } from './prompts';
import { searchProperties, PropertyMatch } from '../crm/propertyService';
import { formatPriceRange } from '../utils/money';
import { logger } from '../utils/logger';

export interface AgentInput {
  orgId: string;
  lead: any;
  conversation: any;
  inboundText: string;
  recentMessages: { direction: string; body: string }[];
}

export interface ExtractedData {
  intent?: string | null;
  configuration?: string | null;
  city?: string | null;
  sector?: string | null;
  location?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  possession_preference?: string | null;
  purpose?: string | null;
  timeline?: string | null;
  lead_temperature?: string | null;
  needs_human?: boolean;
}

export interface MediaToSend {
  url: string;
  fileName?: string;
  caption?: string;
  mimeType?: string;
}

export interface AgentResult {
  reply: string;
  extractedIntent: string;
  extractedData: ExtractedData;
  matchedProperties: Array<{ projectId?: string; unitId?: string; score: number; reason: string }>;
  leadUpdates: Record<string, any>;
  shouldHandoff: boolean;
  model: string;
  latencyMs: number;
  /** Brochure or media file to send alongside the text reply */
  mediaToSend?: MediaToSend | null;
  /** Suggested quick-reply chips for the frontend conversation view */
  quickReplies?: string[];
}

export async function respondToMessage(input: AgentInput): Promise<AgentResult> {
  const start = Date.now();
  const { orgId, lead, inboundText, recentMessages } = input;

  // 1) Extraction
  const extractionUserPrompt = buildExtractionUserPrompt(inboundText, lead, recentMessages);
  const { data: extracted, model: extractModel, latencyMs: extractLatency } = await llm.generateJson(
    extractionUserPrompt,
    EXTRACTION_PROMPT
  );
  const ex: ExtractedData = normalizeExtracted(extracted);

  // 2) Merge with lead's existing preferences for search
  const searchCity = ex.city ?? lead.preferred_city ?? null;
  const searchSector = ex.sector ?? lead.preferred_sector ?? null;
  const searchConfig = ex.configuration ?? lead.configuration ?? null;
  const searchBudgetMin = ex.budget_min ?? lead.budget_min ?? null;
  const searchBudgetMax = ex.budget_max ?? lead.budget_max ?? null;
  const searchPossession = ex.possession_preference ?? lead.possession_preference ?? null;

  // 3) Search inventory
  let matches: PropertyMatch[] = [];
  if (shouldSearch(ex)) {
    matches = await searchProperties({
      orgId,
      configuration: searchConfig,
      city: searchCity,
      sector: searchSector,
      location: ex.location ?? lead.preferred_location ?? null,
      budgetMin: searchBudgetMin,
      budgetMax: searchBudgetMax,
      possessionStatus: searchPossession,
      limit: 3,
    });

    // Progressive relaxation: if nothing and we had a sector, relax sector
    if (matches.length === 0 && searchSector) {
      matches = await searchProperties({
        orgId,
        configuration: searchConfig,
        city: searchCity,
        sector: null,
        location: null,
        budgetMin: searchBudgetMin,
        budgetMax: searchBudgetMax,
        possessionStatus: searchPossession,
        limit: 3,
      });
    }
    // Relax configuration too
    if (matches.length === 0 && searchConfig) {
      matches = await searchProperties({
        orgId,
        configuration: null,
        city: searchCity,
        sector: null,
        location: null,
        budgetMin: searchBudgetMin,
        budgetMax: searchBudgetMax,
        possessionStatus: searchPossession,
        limit: 3,
      });
    }
  }

  // 4) Detect brochure request — attach media if available
  const wantsBrochure = ex.intent === 'brochure_request' || /brochure|details|pdf|catalog/i.test(inboundText);
  let mediaToSend: MediaToSend | null = null;
  if (wantsBrochure && matches.length > 0) {
    // Find first match with a brochure URL
    const withBrochure = matches.find((m) => m.brochureUrl);
    if (withBrochure?.brochureUrl) {
      mediaToSend = {
        url: withBrochure.brochureUrl,
        fileName: `${withBrochure.projectName} - Brochure.pdf`,
        caption: `Here's the brochure for ${withBrochure.projectName}, ${withBrochure.configuration ?? ''}. Let me know if you'd like a site visit!`,
        mimeType: 'application/pdf',
      };
    }
  }

  // 5) Build reply via LLM, grounded in inventory
  const replyUserPrompt = buildReplyUserPrompt(input, ex, matches, mediaToSend);
  const { text: reply, model: replyModel, latencyMs: replyLatency } = await llm.generateText(
    replyUserPrompt,
    realEstateSystemPrompt(),
    { temperature: 0.5, maxTokens: 400 }
  );

  const finalReply = reply?.trim() || fallbackReply(ex, matches);

  // 6) Lead updates
  const leadUpdates = computeLeadUpdates(ex, matches);
  const shouldHandoff = !!ex.needs_human || ex.intent === 'general_question' && /human|agent|advisor/i.test(inboundText);

  // 7) Generate quick reply suggestions
  const quickReplies = generateQuickReplies(ex, matches, lead, finalReply);

  return {
    reply: finalReply,
    extractedIntent: ex.intent ?? 'general_question',
    extractedData: ex,
    matchedProperties: matches.map((m) => ({ projectId: m.projectId, unitId: m.unitId, score: m.score, reason: m.reason })),
    leadUpdates,
    shouldHandoff,
    model: `${extractModel}+${replyModel}`,
    latencyMs: Date.now() - start,
    mediaToSend,
    quickReplies,
  };
}

export function shouldSearch(ex: ExtractedData): boolean {
  const intents = ['property_search', 'pricing_question', 'brochure_request', 'site_visit'];
  if (intents.includes(ex.intent ?? '')) return true;
  // also search if any preference is present
  return !!(ex.configuration || ex.budget_max || ex.city || ex.sector || ex.location);
}

function buildExtractionUserPrompt(text: string, lead: any, recent: { direction: string; body: string }[]): string {
  const history = recent
    .slice(-6)
    .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${m.body}`)
    .join('\n');
  const leadCtx = [
    lead.full_name ? `Name: ${lead.full_name}` : null,
    lead.preferred_city ? `City: ${lead.preferred_city}` : null,
    lead.preferred_sector ? `Sector: ${lead.preferred_sector}` : null,
    lead.configuration ? `Configuration: ${lead.configuration}` : null,
    lead.budget_min || lead.budget_max ? `Budget: ${lead.budget_min ?? '?'} - ${lead.budget_max ?? '?'}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `Known lead context:
${leadCtx || '(none yet)'}

Conversation so far:
${history || '(none)'}

Latest customer message:
"""${text}"""`;
}

function buildReplyUserPrompt(
  input: AgentInput,
  ex: ExtractedData,
  matches: PropertyMatch[],
  mediaToSend?: MediaToSend | null
): string {
  const inv = matches.length
    ? matches
        .map(
          (m, i) =>
            `${i + 1}. ${m.projectName}, ${[m.sector, m.city].filter(Boolean).join(' / ') || 'Noida'} — ${m.configuration ?? ''}, ${formatPriceRange(
              m.priceMin ?? undefined,
              m.priceMax ?? undefined
            )}, ${m.possessionStatus ?? 'possession TBD'}.`
        )
        .join('\n')
    : 'No matching inventory found.';

  const missing = [];
  if (!ex.configuration && !input.lead.configuration) missing.push('configuration (e.g. 2BHK/3BHK)');
  if (!ex.budget_max && !input.lead.budget_max) missing.push('budget');
  if (!ex.city && !ex.sector && !input.lead.preferred_city && !input.lead.preferred_sector) missing.push('preferred location');

  const history = input.recentMessages
    .slice(-4)
    .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${m.body}`)
    .join('\n');

  return `Inventory available for this reply (use ONLY these, do not invent):
${inv}

Customer preferences extracted:
${JSON.stringify({ ...ex }, null, 2)}

Missing key info: ${missing.join(', ') || 'none'}.
${mediaToSend ? `\n\nNOTE: A brochure PDF for ${mediaToSend.fileName} is being attached alongside your text reply. Do NOT say you are sending a link or typing out a URL — just say something like "I've attached the brochure for your reference" and continue the conversation naturally.` : ''}

Conversation so far:
${history || '(start)'}

Customer's latest message:
"""${input.inboundText}"""`;

}

export function normalizeExtracted(e: any): ExtractedData {
  if (!e || typeof e !== 'object') return {};
  return {
    intent: e.intent ?? null,
    configuration: e.configuration ?? null,
    city: e.city ?? null,
    sector: e.sector ?? null,
    location: e.location ?? null,
    budget_min: toNum(e.budget_min),
    budget_max: toNum(e.budget_max),
    possession_preference: e.possession_preference ?? null,
    purpose: e.purpose ?? null,
    timeline: e.timeline ?? null,
    lead_temperature: e.lead_temperature ?? null,
    needs_human: !!e.needs_human,
  };
}

export function toNum(v: any): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export function computeLeadUpdates(ex: ExtractedData, matches: PropertyMatch[]): Record<string, any> {
  const updates: Record<string, any> = {};
  if (ex.city) updates.preferred_city = ex.city;
  if (ex.sector) updates.preferred_sector = ex.sector;
  if (ex.location) updates.preferred_location = ex.location;
  if (ex.configuration) updates.configuration = ex.configuration;
  if (ex.budget_min != null) updates.budget_min = ex.budget_min;
  if (ex.budget_max != null) updates.budget_max = ex.budget_max;
  if (ex.possession_preference) updates.possession_preference = ex.possession_preference;
  if (ex.purpose) updates.purpose = ex.purpose;
  if (ex.timeline) updates.timeline = ex.timeline;
  if (ex.lead_temperature && ex.lead_temperature !== 'unknown') updates.temperature = ex.lead_temperature;
  if (matches.length) {
    updates.ai_summary = `${matches.length} match(es): ${matches
      .slice(0, 2)
      .map((m) => `${m.projectName} (${m.configuration ?? ''})`)
      .join(', ')}`;
  }
  return updates;
}

export function fallbackReply(ex: ExtractedData, matches: PropertyMatch[]): string {
  if (matches.length) {
    const m = matches[0];
    return `Yes, we have ${matches.length} option(s) matching this.\nBest match:\n${m.projectName}, ${m.sector ?? ''} ${m.city ?? ''} — ${m.configuration ?? ''}, approx ${formatPriceRange(
      m.priceMin ?? undefined,
      m.priceMax ?? undefined
    )}, ${m.possessionStatus ?? ''}.\nAre you looking for a site visit or should I share more details here?`;
  }
  if (!ex.budget_max && !ex.city && !ex.configuration) {
    return `Sure. What budget range and preferred sector/location are you looking at?`;
  }
  return `I don't see an exact match in the current inventory. What is your max budget and preferred location? I can check the closest options.`;
}

export function generateQuickReplies(ex: ExtractedData, matches: PropertyMatch[], lead: any, reply: string): string[] {
  const chips: string[] = [];

  // Priority 1: Callback time slots (if callback intent, these are most relevant)
  if (ex.intent === 'callback_request' || /callback|call me/i.test(reply)) {
    chips.push('Today evening');
    chips.push('Tomorrow morning');
  }

  // Priority 2: Property actions (if matches found)
  if (matches.length > 0) {
    chips.push('📅 Schedule a site visit');
    chips.push('📄 Share brochure');
    if (matches.length > 1) chips.push('🏡 Show more options');
  }

  // Priority 3: Missing configuration
  if (!ex.configuration && !lead.configuration) {
    chips.push('2BHK');
    chips.push('3BHK');
    chips.push('4BHK');
  }

  // Priority 4: Missing budget
  if (!ex.budget_max && !lead.budget_max) {
    chips.push('Budget: ₹1-1.5 Cr');
    chips.push('Budget: ₹1.5-2.5 Cr');
    chips.push('Budget: ₹3 Cr+');
  }

  // Priority 5: Missing location
  if (!ex.city && !ex.sector && !lead.preferred_city) {
    chips.push('Noida Sector 150');
    chips.push('Noida Sector 76');
    chips.push('Greater Noida West');
  }

  return chips.slice(0, 5);
}
