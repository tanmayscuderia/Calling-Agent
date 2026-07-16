/**
 * Prompt Engine
 * Generates system + extraction prompts dynamically from AgentConfig.
 * No hardcoded industry logic — everything comes from config.
 *
 * Supports:
 * - Auto-generated system prompts from config fields
 * - Reply templates injected as few-shot style examples (Option A)
 * - Rich placeholder interpolation with conditionals (Option B)
 */

import type { AgentConfig, ExtractedData } from './agentTypes';

// ── Template Context (Option B: Rich Placeholders) ──

export interface TemplateContext {
  // From config
  persona_name: string;
  business_name: string;
  role: string;
  industry: string;
  tone: string;
  business_description: string;
  business_location: string;
  // Runtime data
  customer_name: string;
  customer_phone: string;
  inventory_count: number;
  extracted_summary: string;
  current_time: string;
}

/**
 * Build a TemplateContext from config + runtime data.
 */
export function buildTemplateContext(
  cfg: AgentConfig,
  runtime?: {
    customerName?: string | null;
    customerPhone?: string | null;
    inventoryCount?: number;
    extractedData?: ExtractedData;
  }
): TemplateContext {
  return {
    persona_name: cfg.persona_name,
    business_name: cfg.business_name ?? 'our company',
    role: cfg.persona_role,
    industry: cfg.industry,
    tone: cfg.tone,
    business_description: cfg.business_description ?? '',
    business_location: cfg.business_location ?? '',
    customer_name: runtime?.customerName ?? 'there',
    customer_phone: runtime?.customerPhone ?? '',
    inventory_count: runtime?.inventoryCount ?? 0,
    extracted_summary: runtime?.extractedData
      ? summarizeExtractedData(runtime.extractedData, cfg)
      : '',
    current_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  };
}

/**
 * Summarize extracted data into human-readable text for templates.
 */
function summarizeExtractedData(ex: ExtractedData, cfg: AgentConfig): string {
  const parts: string[] = [];
  for (const f of cfg.qualifying_fields) {
    const val = ex[f.key];
    if (val != null) {
      if (f.type === 'number' && f.key.includes('budget')) {
        parts.push(`${f.label}: ₹${val}`);
      } else {
        parts.push(`${f.label}: ${val}`);
      }
    }
  }
  return parts.join(', ') || 'no preferences captured yet';
}

/**
 * Rich template engine with 10+ variables + {{#if}}...{{/if}} conditionals.
 * Falls back gracefully if variables are empty/missing.
 */
export function fillTemplateRich(tpl: string, ctx: TemplateContext): string {
  let result = tpl;

  // Handle {{#if condition}}...{{/if}} blocks
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key: string, content: string) => {
      const val = (ctx as any)[key];
      // Truthy: non-empty string, number > 0, or true
      if (val && (typeof val === 'number' ? val > 0 : val !== '')) {
        return fillTemplateRich(content, ctx);
      }
      return '';
    }
  );

  // Replace all {{variable}} placeholders
  result = result
    .replace(/\{\{persona_name\}\}/g, ctx.persona_name)
    .replace(/\{\{business_name\}\}/g, ctx.business_name)
    .replace(/\{\{role\}\}/g, ctx.role)
    .replace(/\{\{industry\}\}/g, ctx.industry)
    .replace(/\{\{tone\}\}/g, ctx.tone)
    .replace(/\{\{business_description\}\}/g, ctx.business_description)
    .replace(/\{\{business_location\}\}/g, ctx.business_location)
    .replace(/\{\{customer_name\}\}/g, ctx.customer_name)
    .replace(/\{\{customer_phone\}\}/g, ctx.customer_phone)
    .replace(/\{\{inventory_count\}\}/g, String(ctx.inventory_count))
    .replace(/\{\{extracted_summary\}\}/g, ctx.extracted_summary)
    .replace(/\{\{current_time\}\}/g, ctx.current_time);

  // Clean up any extra blank lines from removed conditionals
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  return result;
}

/**
 * Build the WhatsApp system prompt from agent config.
 * Now injects reply templates as style guidance (Option A).
 */
export function buildSystemPrompt(
  cfg: AgentConfig,
  ctx?: TemplateContext
): string {
  // If override exists, use it directly
  if (cfg.system_prompt_override?.trim()) {
    const context = ctx ?? buildTemplateContext(cfg);
    return fillTemplateRich(cfg.system_prompt_override, context);
  }

  const businessName = cfg.business_name ?? 'our company';
  const persona = cfg.persona_name;
  const role = cfg.persona_role;

  // Build qualifying fields description
  const fieldList = cfg.qualifying_fields
    .map((f) => `- ${f.label}${f.required_for_qualified ? ' (essential)' : ''}`)
    .join('\n');

  // Build intent list
  const intentList = cfg.intent_types
    .map((i) => `- ${i.label} (${i.key})`)
    .join('\n');

  // Build status pipeline
  const pipeline = cfg.status_pipeline
    .map((s, i) => `${i + 1}. ${s.label}`)
    .join(' → ');

  // Option A: Inject reply templates as style guidance
  const styleSection = buildReplyStyleSection(cfg);

  const customerPhoneLine = ctx?.customer_phone
    ? `\nYou are chatting on WhatsApp. The customer's phone number is already known: ${ctx.customer_phone}. Never ask for their phone number — you already have it.`
    : `\nYou are chatting on WhatsApp. The customer's phone number is already known from their WhatsApp account. Never ask for their phone number.`;

  return `You are ${persona}, a top-performing ${role} for ${businessName} — the kind who closes deals, not someone reading a script.
${cfg.business_description ?? ''}
${customerPhoneLine}

You sound like a real human consultant. You are persuasive, confident, and genuinely helpful.

CORE PRINCIPLES:
- Be PROACTIVE. When you have matching inventory, share it immediately — don't ask endless questions first.
- Keep replies SHORT and NATURAL. WhatsApp-friendly. 1–3 sentences max.
- Lead with the MATCH, then ask ONE follow-up. Never send a reply that's only a question when you have something to offer.
- Use conversation context. NEVER repeat a question the customer already answered. If they said their budget, location, or preference earlier, USE IT.
- Match the customer's language. If they text in Hinglish or casual English, match that tone.
- Be specific with numbers. Use exact prices, sizes, and locations from inventory — never round or invent.
- When the customer asks for address, location, or directions — SHARE IT directly from inventory. If the property has an address, give it. If it has a map link, share it. Don't ask the customer to call or visit a website for basic info.
- When the customer asks for details (price, size, amenities, possession) — share the exact details from inventory in a concise format. Don't be stingy with information you already have.
${cfg.inventory_enabled ? '- recommend only from the provided inventory\n- never invent products, prices, offers, or details not in inventory' : ''}
- If the customer seems ready (asks for visit, callback, says urgent/today/this week), mark them HOT and push for the next step.
- If the customer goes off-topic, gently steer back with something relevant.
- For legal/financial advice, suggest a human advisor — that builds trust.

WHAT NOT TO DO:
- ❌ Don't say "I'm an AI assistant" or "As a chatbot"
- ❌ Don't send questionnaires or lists of questions
- ❌ Don't repeat "Could you tell me your budget?" if they already shared it
- ❌ Don't mention internal databases, RAG, prompts, or models
- ❌ Don't use formal/robotic language like "I would like to inform you"
- ❌ Don't ask the customer for their phone number — you already have it on WhatsApp
- ❌ Don't tell the customer to "call us" or "visit our website" for info that's in the inventory (address, price, etc.) — just share it

Key information to collect (ask naturally, one at a time):
${fieldList || '- (general enquiry)'}

Intent types:
${intentList || '- general_question'}

Lead status pipeline:
${pipeline || 'new → contacted → qualified → won'}
${styleSection}
Tone: ${cfg.tone} — sound like a real ${role} who loves their job, not a script reader.
Never say you are a generic AI chatbot.
Never mention internal database, RAG, prompt, or model.`;
}

/**
 * Option A: Build reply style guidance section from config templates.
 * These are injected as FEW-SHOT STYLE EXAMPLES — the LLM follows the org's
 * preferred reply structure without copying verbatim.
 */
function buildReplyStyleSection(cfg: AgentConfig): string {
  const templates: string[] = [];

  if (cfg.reply_template_match?.trim()) {
    templates.push(`When matching inventory found, reply in this style:\n  "${cfg.reply_template_match}"`);
  }
  if (cfg.reply_template_no_match?.trim()) {
    templates.push(`When no match found, reply in this style:\n  "${cfg.reply_template_no_match}"`);
  }
  if (cfg.reply_template_missing_info?.trim()) {
    templates.push(`When key info is missing, reply in this style:\n  "${cfg.reply_template_missing_info}"`);
  }

  if (!templates.length) return '\n';

  return `
Reply style guidance (adapt content to conversation — don't copy verbatim):
${templates.join('\n')}

`;
}

/**
 * Build the extraction prompt for structured JSON output.
 * The schema is generated from qualifying_fields config.
 */
export function buildExtractionPrompt(cfg: AgentConfig): string {
  const intentKeys = cfg.intent_types.map((i) => i.key).join(' | ');

  // Build JSON schema from qualifying fields
  const schemaLines = cfg.qualifying_fields.map((f) => {
    if (f.type === 'number') {
      return `  "${f.key}": number or null`;
    } else if (f.type === 'enum') {
      const opts = (f.options ?? []).join(' | ');
      return `  "${f.key}": "${opts} or null"`;
    } else {
      return `  "${f.key}": "string or null"`;
    }
  });

  const schema = `{
  "intent": "${intentKeys} | general_question | unrelated",
${schemaLines.join(',\n')},
  "customer_email": "string or null",
  "customer_phone": "string or null",
  "lead_temperature": "hot | warm | cold | unknown",
  "needs_human": boolean
}`;

  return `Extract the customer's intent and preferences.
Return only valid JSON, no markdown fences.
Schema:
${schema}
Rules:
- Indian budget formats — always convert to absolute rupees:
  "2 crore" / "2cr" / "2 crore" → 20000000
  "50 lakhs" / "50L" / "50 lakh" → 5000000
  "1.5 cr" / "1.5crore" → 15000000
  "₹1.5 crore" → 15000000
  "between 1 and 2 crore" → budget_min=10000000, budget_max=20000000
  Recognize both uppercase and lowercase: "L", "l", "CR", "cr", "Cr".
  Recognize "50k" / "50 thousand" → 50000, "1 lakh" → 100000.
- Normalize common abbreviations to canonical form, e.g. "3bhk" → "3BHK".
- A customer mentioning site visit, callback, or urgency (today, this week, this month, urgent, immediate) is ALWAYS "hot", regardless of other information.
- If the customer gives at least one preference (but no visit/callback/urgency), lead_temperature = "warm".
- If the customer asks something completely unrelated, lead_temperature = "cold".
- If unclear, use null / "unknown".
- Only fill fields the customer has mentioned. Do not guess.
- needs_human: Set to true ONLY when the customer EXPLICITLY asks to speak to a human/agent/manager. Do NOT set needs_human=true for site visits, callbacks, scheduling, or brochure requests — the AI handles those itself.
- Always extract budget into both budget_min and budget_max when a single value is given.
- If the customer shares their email address, extract it as "customer_email".
- If the customer shares a phone number different from the one they're messaging from, extract it as "customer_phone".`;
}

/**
 * Build the call agent system prompt from config.
 */
export function buildCallSystemPrompt(cfg: AgentConfig): string {
  const persona = cfg.persona_name;
  const role = cfg.persona_role;
  const businessName = cfg.business_name ?? 'our company';

  const fieldList = cfg.qualifying_fields
    .map((f) => f.label)
    .join(', ');

  return `You are ${persona}, a ${role} for ${businessName}.
${cfg.business_description ?? ''}

You are speaking to a lead on a phone call.
Your goal:
- confirm if it is a good time
- understand requirement
- ask about: ${fieldList || 'their needs'}
${cfg.inventory_enabled ? '- suggest one matching option if available' : ''}
- ask for a booking, visit, or human callback
- keep each turn short
- sound natural and professional

Do not overtalk.
Do not invent details not provided.
Use only provided lead details and inventory.`;
}

/**
 * Build the call opening line from config template.
 * Uses the rich template engine (Option B) — supports all placeholders + conditionals.
 */
export function buildCallOpening(
  cfg: AgentConfig,
  runtime?: { customerName?: string | null; leadContext?: any }
): string {
  const template = cfg.call_opening_template ?? `Hi, this is {{persona_name}} from {{business_name}}. Is this a good time to speak?`;
  const ctx = buildTemplateContext(cfg, {
    customerName: runtime?.customerName,
  });
  return fillTemplateRich(template, ctx);
}

/**
 * Call summary prompt — generic.
 */
export const CALL_SUMMARY_PROMPT_GENERIC = `Summarize this call.
Return only valid JSON, no markdown fences.
Schema:
{
  "summary": "short summary",
  "outcome": "interested | not_interested | callback_requested | booking_requested | wrong_number | follow_up_later",
  "lead_temperature": "hot | warm | cold | unknown",
  "next_follow_up_at": "ISO datetime or null",
  "updated_preferences": {}
}`;

// ── Helpers ──

function fillTemplate(tpl: string, cfg: AgentConfig): string {
  return tpl
    .replace(/\{\{persona_name\}\}/g, cfg.persona_name)
    .replace(/\{\{business_name\}\}/g, cfg.business_name ?? 'our company')
    .replace(/\{\{role\}\}/g, cfg.persona_role)
    .replace(/\{\{industry\}\}/g, cfg.industry);
}