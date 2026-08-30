import { llm } from './llmClient';
import { getAgentConfig } from './agentConfigService';
import { buildCallSystemPrompt, buildCallOpening, buildCallSummaryPrompt, CALL_SUMMARY_PROMPT_GENERIC } from './promptEngine';
import { searchInventory } from './inventorySearch';
import { formatPriceRange } from '../utils/money';

export interface CallTurn {
  speaker: 'agent' | 'customer' | 'system';
  text: string;
}

/**
 * Generate the agent's next reply in a call.
 * Now config-driven — uses the org's agent config for persona + inventory.
 */
export async function generateAgentReply(
  lead: any,
  turns: CallTurn[],
  orgId: string
): Promise<{ reply: string; model: string; latencyMs: number }> {
  const cfg = await getAgentConfig(orgId);
  const businessName = cfg.business_name ?? 'our company';

  // Pull one matching inventory item if available
  let inventoryLine = 'No specific inventory loaded yet.';
  try {
    const matches = await searchInventory(orgId, cfg, {}, lead, 1);
    if (matches.length) {
      const m = matches[0];
      const parts = [m.label];
      if (m.sublabel) parts.push(m.sublabel);
      if (m.priceRange) parts.push(m.priceRange);
      inventoryLine = `Matching option to mention if relevant: ${parts.join(', ')}.`;
    }
  } catch {
    // ignore search errors for the call flow
  }

  // Build lead context from all non-null lead fields
  const leadCtx = Object.entries(lead)
    .filter(([k, v]) => v != null && !['id', 'org_id', 'created_at', 'updated_at', 'metadata'].includes(k))
    .slice(0, 10)
    .map(([k, v]) => {
      if (k === 'budget_min' || k === 'budget_max') {
        return null; // handle separately below
      }
      return `${k.replace(/_/g, ' ')}: ${String(v)}`;
    })
    .filter(Boolean)
    .join('\n');

  const budgetLine = lead.budget_min || lead.budget_max
    ? `Budget: ${formatPriceRange(lead.budget_min, lead.budget_max)}`
    : null;

  const fullLeadCtx = [leadCtx, budgetLine].filter(Boolean).join('\n');

  const transcript = turns
    .map((t) => `${t.speaker === 'agent' ? cfg.persona_name : 'Customer'}: ${t.text}`)
    .join('\n');

  const userPrompt = `Business: ${businessName}
Lead context:
${fullLeadCtx || '(unknown lead)'}

${inventoryLine}

Call transcript so far:
${transcript || '(just started)'}

Continue the conversation as ${cfg.persona_name}. Reply with ONLY your next line (no preamble, no quotes).`;

  const systemPrompt = buildCallSystemPrompt(cfg);
  const res = await llm.generateText(userPrompt, systemPrompt, {
    temperature: 0.6,
    maxTokens: 300,
  });
  const reply = res.text.trim();
  const finalReply = reply || `Great, thank you for confirming. Could you tell me more about what you're looking for?`;
  return { reply: finalReply, model: res.model, latencyMs: res.latencyMs };
}

/**
 * Summarize a call — config-driven when orgId is known.
 *
 * Uses buildCallSummaryPrompt(cfg) so the summary extraction schema matches
 * the org's qualifying_fields (WhatsApp-grade extraction). Falls back to the
 * generic prompt when no orgId (e.g. playground without org context).
 */
export async function summarizeCall(turns: CallTurn[], orgId?: string): Promise<{
  data: any;
  raw: string;
  model: string;
  latencyMs: number;
}> {
  const cfg = orgId ? await getAgentConfig(orgId) : null;
  const personaName = cfg?.persona_name ?? 'Agent';
  const summaryPrompt = cfg ? buildCallSummaryPrompt(cfg) : CALL_SUMMARY_PROMPT_GENERIC;
  const transcript = turns
    .map((t) => `${t.speaker === 'agent' ? personaName : 'Customer'}: ${t.text}`)
    .join('\n');
  const userPrompt = `Call transcript:
${transcript}

Generate the summary JSON.`;
  return llm.generateJson(userPrompt, summaryPrompt, { temperature: 0.2 });
}

/**
 * Get the opening line for a call — config-driven.
 */
export async function openingLine(orgId: string): Promise<string> {
  const cfg = await getAgentConfig(orgId);
  return buildCallOpening(cfg);
}
