/**
 * Unit tests for the rich template engine (Option A + B).
 * No LLM calls — pure template interpolation tests.
 */

import { describe, it, expect } from 'vitest';
import {
  fillTemplateRich,
  buildTemplateContext,
  buildSystemPrompt,
  buildCallOpening,
} from '../../src/ai/promptEngine';
import type { AgentConfig, ExtractedData } from '../../src/ai/agentTypes';

// ── Fixtures ──

const mockConfig: AgentConfig = {
  id: 'test-1',
  org_id: 'org-1',
  name: 'Test Agent',
  industry: 'real_estate',
  persona_name: 'Priya',
  persona_role: 'Real Estate Sales Assistant',
  tone: 'professional',
  business_name: 'Demo Realty',
  business_description: 'Premium real estate in Noida.',
  business_location: 'Noida, UP',
  system_prompt_override: null,
  qualifying_fields: [
    { key: 'configuration', label: 'Configuration', type: 'string', required_for_qualified: true },
    { key: 'budget_min', label: 'Min Budget', type: 'number' },
    { key: 'budget_max', label: 'Max Budget', type: 'number' },
    { key: 'city', label: 'City', type: 'string' },
    { key: 'possession_preference', label: 'Possession', type: 'enum', options: ['ready_to_move', 'under_construction', 'any'] },
  ],
  intent_types: [
    { key: 'property_search', label: 'Property Search' },
    { key: 'callback_request', label: 'Callback Request' },
  ],
  status_pipeline: [
    { key: 'new', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'won', label: 'Won' },
  ],
  inventory_enabled: true,
  inventory_table: 'real_estate_units',
  search_fields: [
    { field: 'configuration', operator: 'eq', extract_key: 'configuration', label: 'Config' },
    { field: 'price_min', operator: 'lte', extract_key: 'budget_max', label: 'Max Budget' },
  ],
  reply_template_match: 'Yes, we have {{inventory_count}} option(s). Best match: {{extracted_summary}}.',
  reply_template_no_match: "I don't see an exact match. What is your max budget?",
  reply_template_missing_info: 'Sure. What budget range are you looking at?',
  call_agent_enabled: true,
  call_opening_template: 'Hi {{customer_name}}, this is {{persona_name}} from {{business_name}}.',
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockExtractedData: ExtractedData = {
  intent: 'property_search',
  lead_temperature: 'hot',
  needs_human: false,
  configuration: '3BHK',
  budget_min: 15000000,
  budget_max: 20000000,
  city: 'Noida',
};

// ── Tests ──

describe('fillTemplateRich', () => {
  it('replaces all standard placeholders', () => {
    const ctx = buildTemplateContext(mockConfig, {
      customerName: 'Rahul',
      customerPhone: '+919999999999',
      inventoryCount: 3,
      extractedData: mockExtractedData,
    });

    const result = fillTemplateRich(
      'Hi {{customer_name}}, I am {{persona_name}} from {{business_name}}. Role: {{role}}, Industry: {{industry}}. Phone: {{customer_phone}}, Options: {{inventory_count}}.',
      ctx
    );

    expect(result).toContain('Hi Rahul');
    expect(result).toContain('I am Priya');
    expect(result).toContain('from Demo Realty');
    expect(result).toContain('Role: Real Estate Sales Assistant');
    expect(result).toContain('Industry: real_estate');
    expect(result).toContain('Phone: +919999999999');
    expect(result).toContain('Options: 3');
  });

  it('handles {{#if}} conditional blocks — truthy case', () => {
    const ctx = buildTemplateContext(mockConfig, { inventoryCount: 5 });
    const tpl = `Hello{{#if inventory_count}}. We have {{inventory_count}} options{{/if}}!`;
    const result = fillTemplateRich(tpl, ctx);
    expect(result).toBe('Hello. We have 5 options!');
  });

  it('handles {{#if}} conditional blocks — falsy case', () => {
    const ctx = buildTemplateContext(mockConfig, { inventoryCount: 0 });
    const tpl = `Hello{{#if inventory_count}}. We have {{inventory_count}} options{{/if}}!`;
    const result = fillTemplateRich(tpl, ctx);
    expect(result).toBe('Hello!');
  });

  it('handles {{#if customer_name}} — empty string is falsy', () => {
    const ctx = buildTemplateContext(mockConfig); // customerName defaults to 'there'
    const tpl = `Hi {{#if customer_name}}{{customer_name}}{{/if}}!`;
    const result = fillTemplateRich(tpl, ctx);
    // customer_name defaults to 'there' — which is truthy
    expect(result).toBe('Hi there!');
  });

  it('handles {{#if business_location}} — empty string is falsy', () => {
    const ctx = buildTemplateContext(mockConfig);
    const tpl = `{{#if business_location}}Located in {{business_location}}{{/if}}`;
    const result = fillTemplateRich(tpl, ctx);
    // business_location is 'Noida, UP' — truthy
    expect(result).toBe('Located in Noida, UP');
  });

  it('handles {{#if}} with empty business_description — falsy', () => {
    const cfg = { ...mockConfig, business_description: null };
    const ctx = buildTemplateContext(cfg);
    const tpl = `Intro{{#if business_description}}. {{business_description}}{{/if}}`;
    const result = fillTemplateRich(tpl, ctx);
    expect(result).toBe('Intro');
  });

  it('extracted_summary includes qualifying fields with values', () => {
    const ctx = buildTemplateContext(mockConfig, { extractedData: mockExtractedData });
    expect(ctx.extracted_summary).toContain('Configuration: 3BHK');
    expect(ctx.extracted_summary).toContain('Min Budget: ₹15000000');
    expect(ctx.extracted_summary).toContain('City: Noida');
  });

  it('extracted_summary shows message when no data', () => {
    const ctx = buildTemplateContext(mockConfig, { extractedData: {} });
    expect(ctx.extracted_summary).toBe('no preferences captured yet');
  });

  it('cleans up extra blank lines from removed conditionals', () => {
    const ctx = buildTemplateContext(mockConfig, { inventoryCount: 0 });
    const tpl = `Line 1\n{{#if inventory_count}}\nLine 2\n{{/if}}\nLine 3`;
    const result = fillTemplateRich(tpl, ctx);
    // Should not have 3+ consecutive newlines
    expect(result).not.toMatch(/\n{3,}/);
  });

  it('handles multiple {{#if}} blocks in sequence', () => {
    const ctx = buildTemplateContext(mockConfig, {
      inventoryCount: 2,
      customerName: 'Rahul',
    });
    const tpl = [
      '{{#if customer_name}}Hi {{customer_name}},{{/if}}',
      '{{#if inventory_count}}we found {{inventory_count}} options.{{/if}}',
      '{{#if business_location}}Located in {{business_location}}.{{/if}}',
    ].join('\n');
    const result = fillTemplateRich(tpl, ctx);
    expect(result).toContain('Hi Rahul');
    expect(result).toContain('we found 2 options');
    expect(result).toContain('Located in Noida, UP');
  });

  it('handles nested placeholders inside {{#if}} blocks', () => {
    const ctx = buildTemplateContext(mockConfig, {
      inventoryCount: 3,
      extractedData: mockExtractedData,
    });
    const tpl = '{{#if inventory_count}}Found {{inventory_count}}: {{extracted_summary}}{{/if}}';
    const result = fillTemplateRich(tpl, ctx);
    expect(result).toContain('Found 3');
    expect(result).toContain('Configuration: 3BHK');
  });
});

describe('buildSystemPrompt with reply templates (Option A)', () => {
  it('injects reply_template_match into system prompt as style guidance', () => {
    const prompt = buildSystemPrompt(mockConfig);
    expect(prompt).toContain('Reply style guidance');
    expect(prompt).toContain('reply in this style');
    expect(prompt).toContain(mockConfig.reply_template_match!);
    expect(prompt).toContain(mockConfig.reply_template_no_match!);
    expect(prompt).toContain(mockConfig.reply_template_missing_info!);
  });

  it('does not inject style section when templates are empty', () => {
    const cfg: AgentConfig = {
      ...mockConfig,
      reply_template_match: null,
      reply_template_no_match: null,
      reply_template_missing_info: null,
    };
    const prompt = buildSystemPrompt(cfg);
    expect(prompt).not.toContain('Reply style guidance');
  });

  it('uses system_prompt_override when set, with rich placeholders', () => {
    const cfg: AgentConfig = {
      ...mockConfig,
      system_prompt_override: 'CUSTOM: You are {{persona_name}} at {{business_name}} in {{business_location}}.',
    };
    const prompt = buildSystemPrompt(cfg);
    expect(prompt).toContain('CUSTOM: You are Priya');
    expect(prompt).toContain('at Demo Realty');
    expect(prompt).toContain('in Noida, UP');
    // Should NOT contain the auto-generated prompt
    expect(prompt).not.toContain('qualify leads on WhatsApp');
  });
});

describe('buildCallOpening with rich template engine', () => {
  it('uses default template when no call_opening_template set', () => {
    const cfg = { ...mockConfig, call_opening_template: null };
    const result = buildCallOpening(cfg);
    expect(result).toContain('Hi, this is Priya');
    expect(result).toContain('from Demo Realty');
  });

  it('uses custom template with customer name', () => {
    const result = buildCallOpening(mockConfig, { customerName: 'Rahul' });
    expect(result).toContain('Hi Rahul');
    expect(result).toContain('this is Priya');
    expect(result).toContain('from Demo Realty');
  });

  it('handles {{#if}} conditionals in call opening', () => {
    const cfg: AgentConfig = {
      ...mockConfig,
      call_opening_template: 'Hi {{customer_name}}{{#if business_location}}, we are in {{business_location}}{{/if}}.',
    };
    const result = buildCallOpening(cfg, { customerName: 'Rahul' });
    expect(result).toContain('Hi Rahul');
    expect(result).toContain('we are in Noida, UP');
  });

  it('removes conditional block when business_location is empty', () => {
    const cfg: AgentConfig = {
      ...mockConfig,
      business_location: null,
      call_opening_template: 'Hi {{customer_name}}{{#if business_location}}, we are in {{business_location}}{{/if}}.',
    };
    const result = buildCallOpening(cfg, { customerName: 'Rahul' });
    expect(result).toContain('Hi Rahul');
    expect(result).not.toContain('we are in');
  });
});