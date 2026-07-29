/**
 * Base Agent — Industry-Agnostic WhatsApp AI Agent
 *
 * Replaces realEstateAgent.ts as the main message processor.
 * All industry-specific behavior comes from AgentConfig.
 *
 * Flow:
 *   1. Load org's agent config (cached)
 *   2. LLM extraction (schema from config)
 *   3. Search inventory (config-driven search_fields)
 *   4. Generate reply (config-driven prompt + inventory grounding)
 *   5. Compute lead updates (config-driven qualifying_fields)
 */

import { llm } from './llmClient';
import { getAgentConfig } from './agentConfigService';
import { buildSystemPrompt, buildExtractionPrompt, buildTemplateContext } from './promptEngine';
import { searchInventory, InventoryMatch } from './inventorySearch';
import { normalizeEmail } from '../utils/email';
import { normalizePhone } from '../utils/phone';
import type { AgentConfig, ExtractedData, GenericAgentResult } from './agentTypes';

export interface BaseAgentInput {
  orgId: string;
  lead: any;
  conversation: any;
  inboundText: string;
  recentMessages: { direction: string; body: string }[];
}

/**
 * Process an inbound WhatsApp message using the org's configured agent.
 * This is the single entry point — no industry branching.
 */
export async function respondToMessage(input: BaseAgentInput): Promise<GenericAgentResult> {
  const start = Date.now();
  const { orgId, lead, inboundText, recentMessages } = input;

  // 1. Load agent config
  const cfg = await getAgentConfig(orgId);

  // 2. LLM Extraction
  const extractionUserPrompt = buildExtractionUserPrompt(inboundText, lead, recentMessages);
  const extractionPrompt = buildExtractionPrompt(cfg);
  const { data: extracted, model: extractModel } = await llm.generateJson(
    extractionUserPrompt,
    extractionPrompt
  );
  const ex = normalizeExtracted(extracted, cfg);

  // 3. Search inventory — fetch more when customer asks for "all/more options"
  const wantsAllOptions = detectListAllIntent(inboundText);
  const searchLimit = wantsAllOptions ? 8 : 3;
  let matches: InventoryMatch[] = [];
  if (shouldSearch(ex, cfg)) {
    try {
      matches = await searchInventory(orgId, cfg, ex, lead, searchLimit);
    } catch {
      // Non-fatal — continue without inventory
    }
  }

  // 4. Generate reply
  const availableLocations = await getAvailableLocations(orgId, cfg);
  const replyUserPrompt = buildReplyUserPrompt(input, cfg, ex, matches, wantsAllOptions, availableLocations);
  const templateCtx = buildTemplateContext(cfg, {
    customerName: lead.full_name ?? lead.customer_name,
    customerPhone: lead.phone ?? lead.customer_phone,
    inventoryCount: matches.length,
    extractedData: ex,
  });
  const systemPrompt = buildSystemPrompt(cfg, templateCtx);
  const { text: reply, model: replyModel } = await llm.generateText(
    replyUserPrompt,
    systemPrompt,
    { temperature: 0.7, maxTokens: wantsAllOptions ? 800 : 550 }
  );

  const rawReply = reply?.trim() || fallbackReply(ex, matches, cfg);
  const finalReply = ensureCompleteReply(rawReply);

  // 5. Lead updates
  const leadUpdates = computeLeadUpdates(ex, matches, cfg);
  // Only hand off when the customer EXPLICITLY asks for a human/agent.
  // Site visits, callbacks, and scheduling should NOT trigger handoff —
  // the AI handles those itself and continues the conversation.
  const wantsHuman = /(?:talk|speak|chat) to (?:a |an )?(?:human|agent|person|manager|supervisor)|connect me to (?:a |an )?(?:human|agent)|human (?:agent|support|advisor)|i want a human/i.test(inboundText);
  const shouldHandoff = wantsHuman && !ex.intent?.includes('property_search');

  // 6. Quick replies
  const quickReplies = generateQuickReplies(ex, matches, lead, cfg);

  return {
    reply: finalReply,
    extractedIntent: ex.intent ?? 'general_question',
    extractedData: ex,
    matchedProperties: matches.map((m) => ({
      id: m.id,
      score: m.score,
      reason: m.reason,
      label: m.label,
      sublabel: m.sublabel,
      priceRange: m.priceRange,
      details: m.details,
    })),
    leadUpdates,
    shouldHandoff,
    model: `${extractModel}+${replyModel}`,
    latencyMs: Date.now() - start,
    mediaToSend: null,
    quickReplies,
  };
}

// ── Should Search ──
function shouldSearch(ex: ExtractedData, cfg: AgentConfig): boolean {
  if (!cfg.inventory_enabled || !cfg.inventory_table) return false;

  const searchIntentIntents = [
    'property_search', 'product_search', 'course_search', 'package_search',
    'membership_search', 'pricing_question', 'brochure_request', 'site_visit',
    'booking_request', 'enrollment',
  ];

  if (ex.intent && searchIntentIntents.includes(ex.intent)) return true;

  const searchKeys = cfg.search_fields.map((sf) => sf.extract_key);
  return searchKeys.some((k) => ex[k] != null);
}

// ── Prompt Building ──
function buildExtractionUserPrompt(text: string, lead: any, recent: { direction: string; body: string }[]): string {
  const history = recent
    .slice(-6)
    .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${m.body}`)
    .join('\n');

  const leadCtx = Object.entries(lead)
    .filter(([k, v]) => v != null && !['id', 'org_id', 'created_at', 'updated_at', 'metadata', 'raw_payload'].includes(k))
    .slice(0, 10)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join('\n');

  return `Known lead context:
${leadCtx || '(none yet)'}

Conversation so far:
${history || '(none)'}

Latest customer message:
"""${text}"""`;
}

function buildReplyUserPrompt(
  input: BaseAgentInput,
  cfg: AgentConfig,
  ex: ExtractedData,
  matches: InventoryMatch[],
  wantsAllOptions: boolean,
  availableLocations: string[]
): string {
  const inv = matches.length
    ? matches
        .map((m, i) => {
          const parts = [m.label];
          if (m.sublabel) parts.push(m.sublabel);
          if (m.priceRange) parts.push(m.priceRange);
          if (m.details?.configuration) parts.push(m.details.configuration);
          if (m.details?.possessionStatus) parts.push(m.details.possessionStatus.replace(/_/g, ' '));
          // Rich details — developer, area, location
          if (m.details?.developerName) parts.push(`by ${m.details.developerName}`);
          if (m.details?.superAreaSqft) parts.push(`${m.details.superAreaSqft} sqft`);
          if (m.details?.city || m.details?.sector) {
            const locStr = [m.details?.sector, m.details?.city].filter(Boolean).join(', ');
            parts.push(locStr);
          }
          if (m.details?.address) parts.push(`address: ${m.details.address}`);
          // Compute Google Maps link from lat/lng if mapsUrl not already set
          const mapsLink = m.details?.mapsUrl
            ? m.details.mapsUrl
            : m.details?.latitude != null && m.details?.longitude != null
              ? `https://www.google.com/maps?q=${m.details.latitude},${m.details.longitude}`
              : null;
          if (mapsLink) parts.push(`map: ${mapsLink}`);
          if (m.details?.brochureUrl) parts.push('brochure available');
          return `${i + 1}. ${parts.join(' — ')}`;
        })
        .join('\n')
    : 'No matching inventory found.';

  const missing: string[] = [];
  for (const f of cfg.qualifying_fields) {
    if (!ex[f.key] && !input.lead[f.key] && !input.lead[`preferred_${f.key}`]) {
      missing.push(f.label);
    }
  }

  // Expanded history window: last 10 turns for full conversation context
  const history = input.recentMessages
    .slice(-10)
    .map((m) => `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${m.body}`)
    .join('\n');

  // ── Anti-hallucination: list available locations so AI never invents cities ──
  const locationsConstraint = availableLocations.length > 0
    ? `\nAVAILABLE LOCATIONS — only mention cities/areas from this list. Never invent locations:\n${availableLocations.join(', ')}\nIf the customer asks about a location NOT in this list, say: "We currently have options in ${availableLocations.slice(0, 5).join(', ')}. Which of these works for you?"\n`
    : '';

  // ── List-all instruction: when customer wants all options, format as a list ──
  const listAllInstruction = wantsAllOptions && matches.length > 0
    ? `\nThe customer wants to see ALL available options. List EVERY property from the inventory above using this exact format:\n\n1️⃣ *<Project Name>* — <Sector>, <City>\n   <Config> | ₹<price range> | <possession>\n   📍 <map link>\n2️⃣ *<Project Name>* — <Sector>, <City>\n   <Config> | ₹<price range> | <possession>\n\nUse actual data from the inventory for every field. Add a blank line after the list, then ONE short question.\n`
    : '';

  // ── Multi-property format hint (2+ matches but customer didn't ask for all) ──
  const multiPropertyHint = !wantsAllOptions && matches.length >= 2
    ? `\nYou have multiple matching properties. Use emoji-numbered format (1️⃣ 2️⃣ 3️⃣) for ALL of them — don't just mention one. Format each as shown in the formatting rules.\n`
    : '';

  // ── Complete sentence guardrail ──
  const completenessRule = `\nCRITICAL: Always write COMPLETE sentences. Never end mid-word or mid-sentence. Every reply must end with proper punctuation (. ! ? or an emoji).\n`;

  return `IMPORTANT — USE THIS CONTEXT. Do not repeat questions or forget what was already shared above.
${locationsConstraint}
Inventory available for this reply (use ONLY these, do not invent):
${inv}

Customer preferences extracted:
${JSON.stringify(ex, null, 2)}

Missing key info: ${missing.join(', ') || 'none'}.
${listAllInstruction}
${multiPropertyHint}
Conversation so far (use this — don't re-ask anything already answered):
${history || '(start of conversation)'}
${completenessRule}
Customer's latest message:
"""${input.inboundText}"""`;
}

// ── Normalize extracted data ──
function normalizeExtracted(e: any, cfg: AgentConfig): ExtractedData {
  if (!e || typeof e !== 'object') return {};
  const out: ExtractedData = {
    intent: e.intent ?? null,
    lead_temperature: e.lead_temperature ?? null,
    needs_human: !!e.needs_human,
    // Universal contact fields — extracted for every industry
    customer_email: e.customer_email ?? null,
    customer_phone: e.customer_phone ?? null,
  };

  for (const f of cfg.qualifying_fields) {
    const val = e[f.key];
    if (f.type === 'number') {
      out[f.key] = val != null ? toNum(val) : null;
    } else {
      out[f.key] = val ?? null;
    }
  }

  return out;
}

function toNum(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ── Lead Updates ──
function computeLeadUpdates(ex: ExtractedData, matches: InventoryMatch[], cfg: AgentConfig): Record<string, any> {
  const updates: Record<string, any> = {};

  for (const f of cfg.qualifying_fields) {
    const val = ex[f.key];
    if (val == null) continue;

    if (f.key === 'city') {
      updates.preferred_city = val;
    } else if (f.key === 'sector') {
      updates.preferred_sector = val;
    } else if (f.key === 'location') {
      updates.preferred_location = val;
    } else if (['budget_min', 'budget_max', 'configuration', 'purpose', 'timeline', 'possession_preference'].includes(f.key)) {
      updates[f.key] = val;
    } else {
      if (!updates.metadata) updates.metadata = {};
      updates.metadata[f.key] = val;
    }
  }

  if (ex.lead_temperature && ex.lead_temperature !== 'unknown') {
    updates.temperature = ex.lead_temperature;
  }

  // Backfill email/phone extracted from conversation (universal for all industries)
  const email = normalizeEmail(ex.customer_email);
  const phone = normalizePhone(ex.customer_phone);
  if (email) updates.email = email;
  if (phone) {
    if (!updates.metadata) updates.metadata = {};
    updates.metadata.secondary_phone = phone;
  }

  if (matches.length) {
    updates.ai_summary = `${matches.length} match(es): ${matches
      .slice(0, 2)
      .map((m) => m.label)
      .join(', ')}`;
  }

  return updates;
}

// ── Fallback Reply ──
function fallbackReply(ex: ExtractedData, matches: InventoryMatch[], cfg: AgentConfig): string {
  if (matches.length && cfg.reply_template_match) {
    return cfg.reply_template_match.replace('{{count}}', String(matches.length));
  }
  if (!matches.length && hasSomeInfo(ex, cfg)) {
    return cfg.reply_template_no_match ?? `I don't see an exact match. Could you share more details?`;
  }
  return cfg.reply_template_missing_info ?? `Sure, could you tell me more about what you're looking for?`;
}

function hasSomeInfo(ex: ExtractedData, cfg: AgentConfig): boolean {
  return cfg.qualifying_fields.some((f) => ex[f.key] != null);
}

// ── Quick Replies ──
function generateQuickReplies(ex: ExtractedData, matches: InventoryMatch[], lead: any, cfg: AgentConfig): string[] {
  const chips: string[] = [];

  if (matches.length > 0) {
    chips.push('📅 Book / Schedule');
    chips.push('📄 Share details');
    if (matches.length > 1) chips.push('👀 Show more options');
  }

  for (const f of cfg.qualifying_fields) {
    if (chips.length >= 5) break;
    if (!ex[f.key] && !lead[f.key] && !lead[`preferred_${f.key}`]) {
      if (f.type === 'enum' && f.options) {
        chips.push(...f.options.slice(0, 2).map((o) => `${f.label}: ${o}`));
      }
    }
  }

  if (ex.intent === 'callback_request' || /callback|call me/i.test(ex.intent ?? '')) {
    chips.push('Today evening');
    chips.push('Tomorrow morning');
  }

  return chips.slice(0, 5);
}

// ── List-All Intent Detection ──
// Detects when customer asks to see all/more options (not just the top 3)
function detectListAllIntent(text: string): boolean {
  const t = text.toLowerCase();
  const patterns = [
    /show (?:me )?(?:all|every|more)\b/,
    /\ball (?:the )?(?:options|properties|projects|listings|flats|apartments|homes)\b/,
    /\bwhat (?:else|other) (?:do you|have|are)\b/,
    /\blist (?:all|every|out)\b/,
    /\bmore options\b/,
    /\baur (?:options|variants|choices)\b/,  // Hinglish
    /\bsaare?\b/,  // Hinglish "all"
    /\bkaun kaun (?:se|sa)\b/,  // Hinglish "which ones"
    /\bentire (?:list|inventory|catalog)\b/,
    /\beverything (?:you|available|that)\b/,
  ];
  return patterns.some((p) => p.test(t));
}

// ── Available Locations Fetcher ──
// Fetches distinct cities from inventory to prevent city hallucination.
// Cached for 5 minutes to avoid hitting DB on every message.
const locationsCache = new Map<string, { cities: string[]; ts: number }>();
const LOCATIONS_CACHE_TTL = 300_000; // 5 minutes

async function getAvailableLocations(orgId: string, cfg: AgentConfig): Promise<string[]> {
  if (!cfg.inventory_enabled || !cfg.inventory_table) return [];

  // Check cache
  const cached = locationsCache.get(orgId);
  if (cached && Date.now() - cached.ts < LOCATIONS_CACHE_TTL) {
    return cached.cities;
  }

  try {
    const { supabaseAdmin } = await import('../db/supabase');
    // For real estate, query projects table for distinct cities + sectors
    if (cfg.inventory_table === 'real_estate_units') {
      const { data, error } = await supabaseAdmin()
        .from('real_estate_projects')
        .select('city, sector')
        .eq('org_id', orgId)
        .eq('status', 'active');

      if (error || !data) return [];

      const locs = new Set<string>();
      for (const row of data) {
        if (row.city) locs.add(row.city);
        if (row.sector) locs.add(row.sector);
      }
      const cities = [...locs].filter(Boolean);
      locationsCache.set(orgId, { cities, ts: Date.now() });
      return cities;
    }

    // Generic: try common location columns
    const { data, error } = await supabaseAdmin()
      .from(cfg.inventory_table)
      .select('city, location')
      .eq('org_id', orgId)
      .limit(100);

    if (error || !data) return [];

    const locs = new Set<string>();
    for (const row of data) {
      if (row.city) locs.add(row.city);
      if (row.location) locs.add(row.location);
    }
    const cities = [...locs].filter(Boolean);
    locationsCache.set(orgId, { cities, ts: Date.now() });
    return cities;
  } catch {
    return [];
  }
}

/** Invalidate locations cache when inventory changes (upload/edit/delete) */
export function clearLocationsCache(): void {
  locationsCache.clear();
}

// ── Complete Reply Guard ──
// Detects and fixes truncated replies (ending mid-word or without punctuation)
function ensureCompleteReply(reply: string): string {
  if (!reply) return reply;
  const trimmed = reply.trim();

  // If reply ends with proper punctuation or emoji, it's fine
  const lastChar = trimmed.slice(-1);
  const endsOk = /[.!?…)\]]/.test(lastChar) ||
    /\p{Emoji}/u.test(lastChar) ||
    lastChar === '\n';
  if (endsOk) return trimmed;

  // If reply is very short and ends abruptly (likely truncated by maxTokens)
  // Try to find the last complete sentence
  const sentenceEnd = Math.max(
    trimmed.lastIndexOf('. '),
    trimmed.lastIndexOf('! '),
    trimmed.lastIndexOf('? '),
    trimmed.lastIndexOf('.\n'),
    trimmed.lastIndexOf('!\n'),
    trimmed.lastIndexOf('?\n'),
  );

  if (sentenceEnd > 20) {
    // Trim to last complete sentence + its punctuation
    return trimmed.slice(0, sentenceEnd + 1).trim();
  }

  // Last resort: add ellipsis to indicate continuation wasn't intentional
  // But only if it looks like it was cut mid-word (no space before end)
  const lastWord = trimmed.split(/\s+/).pop() ?? '';
  const looksTruncated = lastWord.length > 0 && !/^[A-Z0-9]+$/.test(lastWord);

  if (looksTruncated && trimmed.length > 30) {
    // Re-trim to last space before the incomplete word
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > 20) {
      return trimmed.slice(0, lastSpace).trim() + '...';
    }
  }

  return trimmed;
}
