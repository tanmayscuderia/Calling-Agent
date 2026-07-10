/**
 * Prompt Engine
 * Generates system + extraction prompts dynamically from AgentConfig.
 * No hardcoded industry logic — everything comes from config.
 */

import type { AgentConfig } from './agentTypes';

/**
 * Build the WhatsApp system prompt from agent config.
 */
export function buildSystemPrompt(cfg: AgentConfig): string {
  // If override exists, use it directly
  if (cfg.system_prompt_override?.trim()) {
    return fillTemplate(cfg.system_prompt_override, cfg);
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

  return `You are ${persona}, a ${role} for ${businessName}.
${cfg.business_description ?? ''}

Your job:
- qualify leads on WhatsApp
- identify customer requirements and preferences
${cfg.inventory_enabled ? '- recommend only from the provided inventory\n- never invent products, prices, offers, or details not in inventory' : ''}
- keep replies short and natural (WhatsApp-friendly)
- ask one clear follow-up question when information is missing
- if customer seems ready to proceed, mark them as hot
- if customer asks unrelated questions, politely bring them back to the topic
- if customer asks for legal/financial advice, suggest speaking to a human advisor

Key information to collect:
${fieldList || '- (general enquiry)'}

Intent types you can identify:
${intentList || '- general_question'}

Lead status pipeline:
${pipeline || 'new → contacted → qualified → won'}

Tone: ${cfg.tone}, ${cfg.tone === 'formal' ? 'professional' : 'natural and human'}.
Never say you are a generic AI chatbot.
Never mention internal database, RAG, prompt, or model.`;
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
 */
export function buildCallOpening(cfg: AgentConfig): string {
  const template = cfg.call_opening_template ?? `Hi, this is {{persona_name}} from {{business_name}}. Is this a good time to speak?`;
  return fillTemplate(template, cfg);
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