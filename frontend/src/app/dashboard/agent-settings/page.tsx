'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

// ── Types matching backend agentTypes.ts ──
interface QualifyingField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'enum' | 'boolean';
  options?: string[];
  required_for_qualified?: boolean;
}

interface IntentType {
  key: string;
  label: string;
}

interface StatusStage {
  key: string;
  label: string;
}

interface SearchField {
  field: string;
  operator: 'ilike' | 'eq' | 'lte' | 'gte';
  extract_key: string;
  label?: string;
}

interface AgentConfig {
  id: string;
  industry: string;
  persona_name: string;
  persona_role: string;
  tone: string;
  business_name: string | null;
  business_description: string | null;
  inventory_enabled: boolean;
  inventory_table: string | null;
  reply_template_match: string | null;
  reply_template_no_match: string | null;
  reply_template_missing_info: string | null;
  call_opening_template: string | null;
  call_agent_enabled: boolean;
  system_prompt_override: string | null;
  qualifying_fields: QualifyingField[];
  intent_types: IntentType[];
  status_pipeline: StatusStage[];
  search_fields: SearchField[];
}

interface Template {
  template_id: string;
  name: string;
  industry: string;
  description: string;
  icon: string;
  inventory_table: string | null;
  inventory_enabled: boolean;
}

// ── Template placeholder reference ──
const PLACEHOLDER_LIST = [
  'persona_name', 'business_name', 'role', 'industry', 'tone',
  'business_description', 'business_location',
  'customer_name', 'customer_phone',
  'inventory_count', 'extracted_summary', 'current_time',
];

/**
 * Client-side template preview — mirrors backend fillTemplateRich.
 */
function previewTemplate(tpl: string): string {
  const sampleCtx: Record<string, string> = {
    persona_name: 'Priya',
    business_name: 'Demo Realty',
    role: 'Sales Assistant',
    industry: 'real_estate',
    tone: 'professional',
    business_description: 'Premium properties in Noida',
    business_location: 'Noida',
    customer_name: 'Rahul',
    customer_phone: '+91XXXXX',
    inventory_count: '3',
    extracted_summary: '3BHK, Noida, ₹2Cr',
    current_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  };

  let result = tpl;
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key: string, content: string) => {
      const val = sampleCtx[key];
      return val && val !== '' && val !== '0' ? content : '';
    }
  );
  for (const [key, val] of Object.entries(sampleCtx)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
  }
  return result.trim();
}

export default function AgentSettingsPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Editable form state — all fields
  const [form, setForm] = useState({
    persona_name: '',
    persona_role: '',
    tone: 'professional',
    business_name: '',
    business_description: '',
    call_opening_template: '',
    reply_template_match: '',
    reply_template_no_match: '',
    reply_template_missing_info: '',
    system_prompt_override: '',
    inventory_enabled: false,
    inventory_table: '',
    qualifying_fields: [] as QualifyingField[],
    intent_types: [] as IntentType[],
    status_pipeline: [] as StatusStage[],
    search_fields: [] as SearchField[],
  });

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, tmplRes] = await Promise.all([
        api<{ config: AgentConfig }>('/api/agent/config'),
        api<{ templates: Template[] }>('/api/agent/templates'),
      ]);
      setConfig(cfgRes.config);
      setTemplates(tmplRes.templates);
      setForm({
        persona_name: cfgRes.config.persona_name || '',
        persona_role: cfgRes.config.persona_role || '',
        tone: cfgRes.config.tone || 'professional',
        business_name: cfgRes.config.business_name || '',
        business_description: cfgRes.config.business_description || '',
        call_opening_template: cfgRes.config.call_opening_template || '',
        reply_template_match: cfgRes.config.reply_template_match || '',
        reply_template_no_match: cfgRes.config.reply_template_no_match || '',
        reply_template_missing_info: cfgRes.config.reply_template_missing_info || '',
        system_prompt_override: cfgRes.config.system_prompt_override || '',
        inventory_enabled: cfgRes.config.inventory_enabled ?? false,
        inventory_table: cfgRes.config.inventory_table || '',
        qualifying_fields: cfgRes.config.qualifying_fields || [],
        intent_types: cfgRes.config.intent_types || [],
        status_pipeline: cfgRes.config.status_pipeline || [],
        search_fields: cfgRes.config.search_fields || [],
      });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        ...form,
        inventory_table: form.inventory_enabled ? form.inventory_table || null : null,
      };
      const res = await api<{ config: AgentConfig }>('/api/agent/config', {
        method: 'PUT',
        body: payload,
      });
      setConfig(res.config);
      setMsg({ type: 'success', text: 'Agent settings saved!' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async (industry: string) => {
    if (!confirm(`Apply "${industry}" template? This will replace your current agent configuration.`)) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await api<{ config: AgentConfig }>('/api/agent/apply-template', {
        method: 'POST',
        body: { templateId: industry },
      });
      setConfig(res.config);
      setForm({
        persona_name: res.config.persona_name || '',
        persona_role: res.config.persona_role || '',
        tone: res.config.tone || 'professional',
        business_name: res.config.business_name || '',
        business_description: res.config.business_description || '',
        call_opening_template: res.config.call_opening_template || '',
        reply_template_match: res.config.reply_template_match || '',
        reply_template_no_match: res.config.reply_template_no_match || '',
        reply_template_missing_info: res.config.reply_template_missing_info || '',
        system_prompt_override: res.config.system_prompt_override || '',
        inventory_enabled: res.config.inventory_enabled ?? false,
        inventory_table: res.config.inventory_table || '',
        qualifying_fields: res.config.qualifying_fields || [],
        intent_types: res.config.intent_types || [],
        status_pipeline: res.config.status_pipeline || [],
        search_fields: res.config.search_fields || [],
      });
      setMsg({ type: 'success', text: `${industry} template applied!` });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: '#64748b' }}>Loading agent settings…</div>;
  }

  const cardStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#334155',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
  };

  const btnSmall: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: 'white',
    color: '#334155',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  };

  const btnDanger: React.CSSProperties = {
    ...btnSmall,
    borderColor: '#fca5a5',
    background: '#fef2f2',
    color: '#dc2626',
  };

  const btnAdd: React.CSSProperties = {
    ...btnSmall,
    borderColor: '#93c5fd',
    background: '#eff6ff',
    color: '#2563eb',
  };

  // ── Array item helpers ──
  const addField = () => update('qualifying_fields', [...form.qualifying_fields, { key: '', label: '', type: 'string', required_for_qualified: false }]);
  const removeField = (i: number) => update('qualifying_fields', form.qualifying_fields.filter((_, idx) => idx !== i));
  const editField = (i: number, patch: Partial<QualifyingField>) =>
    update('qualifying_fields', form.qualifying_fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const addIntent = () => update('intent_types', [...form.intent_types, { key: '', label: '' }]);
  const removeIntent = (i: number) => update('intent_types', form.intent_types.filter((_, idx) => idx !== i));
  const editIntent = (i: number, patch: Partial<IntentType>) =>
    update('intent_types', form.intent_types.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const addStatus = () => update('status_pipeline', [...form.status_pipeline, { key: '', label: '' }]);
  const removeStatus = (i: number) => update('status_pipeline', form.status_pipeline.filter((_, idx) => idx !== i));
  const moveStatus = (i: number, dir: -1 | 1) => {
    const arr = [...form.status_pipeline];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update('status_pipeline', arr);
  };
  const editStatus = (i: number, patch: Partial<StatusStage>) =>
    update('status_pipeline', form.status_pipeline.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const addSearchField = () => update('search_fields', [...form.search_fields, { field: '', operator: 'ilike', extract_key: '' }]);
  const removeSearchField = (i: number) => update('search_fields', form.search_fields.filter((_, idx) => idx !== i));
  const editSearchField = (i: number, patch: Partial<SearchField>) =>
    update('search_fields', form.search_fields.map((sf, idx) => (idx === i ? { ...sf, ...patch } : sf)));

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Agent Settings</h1>
        <p style={{ fontSize: 14, color: '#64748b' }}>
          Fully customize your AI agent. Pick a template to start, then edit any field — qualifying questions, intents, lead statuses, inventory search, and more.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: msg.type === 'success' ? '#166534' : '#991b1b',
            fontSize: 13,
          }}
        >
          {msg.text}
        </div>
      )}

      {/* ── Industry Templates ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Industry Templates</h2>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          Apply a template to instantly configure your agent for a specific industry. You can then customize any field below.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
          {templates.map((t) => {
            const isActive = config?.industry === t.industry;
            return (
              <button
                key={t.template_id}
                onClick={() => applyTemplate(t.template_id)}
                disabled={saving}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `2px solid ${isActive ? '#2563eb' : '#e2e8f0'}`,
                  background: isActive ? '#eff6ff' : 'white',
                  cursor: saving ? 'wait' : 'pointer',
                  textAlign: 'left' as const,
                  transition: 'all 150ms ease',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon || '🏢'}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#2563eb' : '#334155' }}>{t.name}</div>
                {t.description && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>{t.description}</div>
                )}
                {t.inventory_enabled && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>📦 Inventory</div>}
                {isActive && <div style={{ fontSize: 10, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>✓ ACTIVE</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Persona & Business ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Persona & Business</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Agent Name</label>
            <input style={inputStyle} value={form.persona_name} onChange={(e) => update('persona_name', e.target.value)} placeholder="e.g. Priya" />
          </div>
          <div>
            <label style={labelStyle}>Agent Role</label>
            <input style={inputStyle} value={form.persona_role} onChange={(e) => update('persona_role', e.target.value)} placeholder="e.g. Sales Assistant" />
          </div>
          <div>
            <label style={labelStyle}>Business Name</label>
            <input style={inputStyle} value={form.business_name} onChange={(e) => update('business_name', e.target.value)} placeholder="e.g. Demo Realty" />
          </div>
          <div>
            <label style={labelStyle}>Tone</label>
            <select style={inputStyle} value={form.tone} onChange={(e) => update('tone', e.target.value)}>
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="energetic">Energetic</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Business Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }}
              value={form.business_description}
              onChange={(e) => update('business_description', e.target.value)}
              placeholder="Brief description of your business for the AI to use…"
            />
          </div>
        </div>
      </div>

      {/* ── Qualifying Fields ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Qualifying Fields</h2>
          <button style={btnAdd} onClick={addField}>+ Add Field</button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          These are the data points the AI collects from customers. Fields marked "essential" are required to qualify a lead.
        </p>
        {form.qualifying_fields.length === 0 && (
          <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No fields yet. Click "Add Field" to start.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {form.qualifying_fields.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={f.key}
                onChange={(e) => editField(i, { key: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                placeholder="field_key"
              />
              <input
                style={{ ...inputStyle, flex: 1.2 }}
                value={f.label}
                onChange={(e) => editField(i, { label: e.target.value })}
                placeholder="Display Label"
              />
              <select style={{ ...inputStyle, width: 100 }} value={f.type} onChange={(e) => editField(i, { type: e.target.value as any })}>
                <option value="string">Text</option>
                <option value="number">Number</option>
                <option value="enum">Enum</option>
                <option value="boolean">Boolean</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                <input type="checkbox" checked={f.required_for_qualified ?? false} onChange={(e) => editField(i, { required_for_qualified: e.target.checked })} />
                Essential
              </label>
              <button style={btnDanger} onClick={() => removeField(i)}>✕</button>
              {f.type === 'enum' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <input
                    style={{ ...inputStyle, marginTop: 4 }}
                    value={(f.options || []).join(', ')}
                    onChange={(e) => editField(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    placeholder="option1, option2, option3"
                  />
                </div>
              )}
            </div>
          ))}
          {form.qualifying_fields.some((f) => f.type === 'enum') &&
            form.qualifying_fields.map((f, i) =>
              f.type === 'enum' ? (
                <div key={`opts-${i}`} style={{ marginLeft: 8, fontSize: 11, color: '#64748b' }}>
                  <strong>{f.key}</strong> options: {(f.options || []).join(', ') || '(none set)'}
                </div>
              ) : null
            )}
        </div>
      </div>

      {/* ── Intent Types ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Intent Types</h2>
          <button style={btnAdd} onClick={addIntent}>+ Add Intent</button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          The AI uses these categories to classify what the customer wants. Keys are sent to the extraction prompt.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {form.intent_types.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={it.key}
                onChange={(e) => editIntent(i, { key: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                placeholder="intent_key"
              />
              <input
                style={{ ...inputStyle, flex: 1.5 }}
                value={it.label}
                onChange={(e) => editIntent(i, { label: e.target.value })}
                placeholder="Human-readable label"
              />
              <button style={btnDanger} onClick={() => removeIntent(i)}>✕</button>
            </div>
          ))}
          {form.intent_types.length === 0 && (
            <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No intents. The AI will use "general_question" as fallback.</p>
          )}
        </div>
      </div>

      {/* ── Status Pipeline ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Lead Status Pipeline</h2>
          <button style={btnAdd} onClick={addStatus}>+ Add Stage</button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          The stages a lead moves through. Use ↑↓ to reorder. The AI auto-progresses leads based on conversation.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {form.status_pipeline.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <button style={{ ...btnSmall, padding: '2px 8px', fontSize: 10 }} onClick={() => moveStatus(i, -1)} disabled={i === 0}>↑</button>
                <button style={{ ...btnSmall, padding: '2px 8px', fontSize: 10 }} onClick={() => moveStatus(i, 1)} disabled={i === form.status_pipeline.length - 1}>↓</button>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', minWidth: 20 }}>{i + 1}.</div>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={s.key}
                onChange={(e) => editStatus(i, { key: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                placeholder="stage_key"
              />
              <input
                style={{ ...inputStyle, flex: 1.5 }}
                value={s.label}
                onChange={(e) => editStatus(i, { label: e.target.value })}
                placeholder="Display Label"
              />
              <button style={btnDanger} onClick={() => removeStatus(i)}>✕</button>
            </div>
          ))}
          {form.status_pipeline.length === 0 && (
            <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No stages. Default: new → contacted → qualified → won</p>
          )}
        </div>
      </div>

      {/* ── Reply Templates & Style Guidance ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Reply Templates & Style Guidance</h2>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
          These templates serve two purposes: (1) fallback replies when the LLM is unavailable, and (2) <strong>style guidance injected into the LLM prompt</strong> so the AI follows your preferred reply format.
        </p>
        <div style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, marginBottom: 16, lineHeight: 1.8 }}>
          <strong>Placeholders:</strong>{' '}
          {PLACEHOLDER_LIST.map((p) => (
            <code key={p} style={{ background: '#e0e7ff', padding: '1px 5px', borderRadius: 3, marginRight: 4, fontSize: 10, cursor: 'pointer' }} onClick={() => navigator.clipboard?.writeText(`{{${p}}}`)} title="Click to copy">{`{{${p}}}`}</code>
          ))}
          <br />
          <strong>Conditionals:</strong>{' '}
          <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>{'{{#if variable}}...{{/if}}'}</code>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>When properties match</label>
            <textarea style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} value={form.reply_template_match} onChange={(e) => update('reply_template_match', e.target.value)} placeholder={'{{#if inventory_count}}Yes, we have {{inventory_count}} option(s). Best: {{extracted_summary}}.{{/if}}'} />
            {form.reply_template_match && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, fontStyle: 'italic' }}>Preview: {previewTemplate(form.reply_template_match)}</div>}
          </div>
          <div>
            <label style={labelStyle}>When no match found</label>
            <textarea style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} value={form.reply_template_no_match} onChange={(e) => update('reply_template_no_match', e.target.value)} placeholder="I don't see an exact match. What is your max budget?" />
          </div>
          <div>
            <label style={labelStyle}>When key info is missing</label>
            <textarea style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} value={form.reply_template_missing_info} onChange={(e) => update('reply_template_missing_info', e.target.value)} placeholder="Sure. What budget range are you looking at?" />
          </div>
        </div>
      </div>

      {/* ── Inventory Settings ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Inventory Search</h2>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          Enable inventory search so the AI can recommend products/services. Configure which inventory table to search and how to match fields.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.inventory_enabled} onChange={(e) => update('inventory_enabled', e.target.checked)} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Enable inventory search</span>
        </label>
        {form.inventory_enabled && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Inventory Table Name</label>
              <input
                style={inputStyle}
                value={form.inventory_table}
                onChange={(e) => update('inventory_table', e.target.value)}
                placeholder="e.g. real_estate_units"
              />
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                The Supabase table to search. Must have <code>org_id</code> column.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Search Field Mappings</label>
                <button style={btnAdd} onClick={addSearchField}>+ Add Mapping</button>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                Maps extracted data fields → inventory table columns for filtering.
              </p>
              {form.search_fields.map((sf, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={sf.extract_key}
                    onChange={(e) => editSearchField(i, { extract_key: e.target.value })}
                    placeholder="extract_key"
                  />
                  <select style={{ ...inputStyle, width: 90 }} value={sf.operator} onChange={(e) => editSearchField(i, { operator: e.target.value as any })}>
                    <option value="ilike">ilike</option>
                    <option value="eq">=</option>
                    <option value="lte">≤</option>
                    <option value="gte">≥</option>
                  </select>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={sf.field}
                    onChange={(e) => editSearchField(i, { field: e.target.value })}
                    placeholder="db_column"
                  />
                  <button style={btnDanger} onClick={() => removeSearchField(i)}>✕</button>
                </div>
              ))}
              {form.search_fields.length === 0 && (
                <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No mappings. Inventory search will return all items.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Call Settings ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Call Agent</h2>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
          Opening line for the AI calling agent demo. All placeholders above are supported, plus conditionals.
        </p>
        <div>
          <label style={labelStyle}>Call Opening Line</label>
          <textarea
            style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }}
            value={form.call_opening_template}
            onChange={(e) => update('call_opening_template', e.target.value)}
            placeholder={'Hi {{customer_name}}, this is {{persona_name}} from {{business_name}}.{{#if business_location}} We are in {{business_location}}.{{/if}} Is this a good time?'}
          />
          {form.call_opening_template && (
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, fontStyle: 'italic' }}>
              Preview: {previewTemplate(form.call_opening_template)}
            </div>
          )}
        </div>
      </div>

      {/* ── Advanced: System Prompt Override ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Advanced ⚙️</h2>
          <button style={btnSmall} onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>
        {showAdvanced && (
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>System Prompt Override</label>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
              If set, this replaces the auto-generated system prompt entirely. Leave empty to use the auto-generated prompt.
              All placeholders above are supported. When set, reply templates are NOT injected as style guidance (the override takes full precedence).
            </p>
            <textarea
              style={{ ...inputStyle, minHeight: 120, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
              value={form.system_prompt_override}
              onChange={(e) => update('system_prompt_override', e.target.value)}
              placeholder="Leave empty to auto-generate from settings above…"
            />
          </div>
        )}
      </div>

      {/* ── Save / Reset ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            border: 'none',
            background: saving ? '#94a3b8' : '#2563eb',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          onClick={load}
          disabled={saving}
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#334155',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}