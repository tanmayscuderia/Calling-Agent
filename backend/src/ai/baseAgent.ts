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

  // 3. Search inventory
  let matches: InventoryMatch[] = [];
  if (shouldSearch(ex, cfg)) {
    try {
      matches = await searchInventory(orgId, cfg, ex, lead, 3);
    } catch {
      // Non-fatal — continue without inventory
    }
  }

  // 4. Generate reply
  const replyUserPrompt = buildReplyUserPrompt(input, cfg, ex, matches);
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
    { temperature: 0.7, maxTokens: 400 }
  );

  const finalReply = reply?.trim() || fallbackReply(ex, matches, cfg);

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
  matches: InventoryMatch[]
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

  return `IMPORTANT — USE THIS CONTEXT. Do not repeat questions or forget what was already shared above.

Inventory available for this reply (use ONLY these, do not invent):
${inv}

Customer preferences extracted:
${JSON.stringify(ex, null, 2)}

Missing key info: ${missing.join(', ') || 'none'}.

Conversation so far (use this — don't re-ask anything already answered):
${history || '(start of conversation)'}

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