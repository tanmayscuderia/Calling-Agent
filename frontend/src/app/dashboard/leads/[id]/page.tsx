'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CallDemoModal from '@/components/CallDemoModal';

function fmtMoney(n?: number) {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
  return `₹${n}`;
}

function fmtDateTimeLocal(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [lead, setLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCall, setShowCall] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [togglingAi, setTogglingAi] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api(`/api/leads/${id}`),
      api(`/api/leads/${id}/messages`),
      api(`/api/leads/${id}/calls`),
      api(`/api/leads/${id}/followups`).catch(() => ({ followups: [] })),
      api(`/api/members`).catch(() => ({ members: [] })),
      api(`/api/conversations?limit=100`).catch(() => ({ conversations: [] })),
    ])
      .then(([l, m, c, f, memData, convData]) => {
        setLead(l.lead);
        setMessages(m.messages ?? []);
        setCalls(c.calls ?? []);
        setMatches(l.matches ?? []);
        setFollowups(f.followups ?? []);
        setMembers(memData.members ?? []);
        const conv = (convData.conversations ?? []).find((cv: any) => cv.lead_id === id);
        setConversation(conv);
        setAiEnabled(conv?.ai_enabled ?? true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const toggleAi = async () => {
    if (!conversation) return;
    setTogglingAi(true);
    try {
      await api(`/api/conversations/${conversation.id}`, {
        method: 'PATCH',
        body: { ai_enabled: !aiEnabled, human_handoff: false },
      });
      setAiEnabled(!aiEnabled);
    } catch (e) {
      console.error('Failed to toggle AI:', e);
    } finally {
      setTogglingAi(false);
    }
  };

  const assignMember = async (memberId: string) => {
    setAssigning(true);
    try {
      const updated = await api(`/api/leads/${id}`, { method: 'PATCH', body: { assigned_to: memberId || null } });
      setLead(updated.lead || { ...lead, assigned_to: memberId || null });
    } catch (e) {
      console.error('Failed to assign:', e);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Link href="/dashboard/leads" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← Back to Leads</Link>
        {conversation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderRadius: 12, background: aiEnabled ? '#dcfce7' : '#fee2e2', border: `1px solid ${aiEnabled ? '#86efac' : '#fca5a5'}` }}>
            <span style={{ fontSize: 16 }}>{aiEnabled ? '🤖' : '🚫'}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: aiEnabled ? '#16a34a' : '#dc2626' }}>{aiEnabled ? 'AI Replies: ON' : 'AI Replies: OFF'}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{aiEnabled ? 'AI is handling this conversation' : 'AI is paused — human must reply'}</div>
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} disabled={togglingAi} onClick={toggleAi}>{togglingAi ? '...' : aiEnabled ? 'Pause AI' : 'Resume AI'}</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 16px' }}>Lead Profile</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 20, borderRadius: 14, background: '#2563eb' }}>{(lead?.full_name || '?')[0]}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{lead?.full_name || 'Unknown Lead'}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>{lead?.phone || lead?.whatsapp_number || 'No phone'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>{lead?.status?.replace(/_/g, ' ') || 'new'}</span>
            <span className="badge" style={{ background: lead?.temperature === 'hot' ? '#fee2e2' : lead?.temperature === 'warm' ? '#fef3c7' : '#dbeafe', color: lead?.temperature === 'hot' ? '#dc2626' : lead?.temperature === 'warm' ? '#d97706' : '#2563eb', textTransform: 'capitalize' }}>{lead?.temperature || 'unknown'}</span>
          </div>
          <div style={{ paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Assigned To</label>
            <select className="input" value={lead?.assigned_to || ''} disabled={assigning} onChange={(e) => assignMember(e.target.value)} style={{ width: '100%' }}>
              <option value="">Unassigned</option>
              {members.map((m) => (<option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>))}
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 16px' }}>Preferences (AI Extracted)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Configuration', value: lead?.configuration },
              { label: 'City', value: lead?.preferred_city },
              { label: 'Sector', value: lead?.preferred_sector },
              { label: 'Budget', value: lead?.budget_min || lead?.budget_max ? `${fmtMoney(lead?.budget_min)}–${fmtMoney(lead?.budget_max)}` : null },
              { label: 'Purpose', value: lead?.purpose },
              { label: 'Timeline', value: lead?.timeline },
            ].map((item) => (
              <div key={item.label} style={{ padding: 12, borderRadius: 10, background: '#f8fafc' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lead?.ai_summary && (
        <div className="card" style={{ padding: 24, marginBottom: 20, borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>AI Summary</h3>
          </div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>{lead.ai_summary}</p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 16px' }}>Recommended Properties</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {matches.map((m, i) => (
              <div key={m.id} className="anim-in" style={{ flex: '1 1 200px', padding: 16, borderRadius: 12, background: '#f8fafc', animationDelay: `${i * 80}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{Math.round((m.match_score ?? 0) * 100)}%</div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>match</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{m.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 16px' }}>Conversation History ({messages.length})</h3>
        <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>No messages yet</div>
          ) : messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'inbound' ? 'flex-start' : 'flex-end' }}>
              <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: msg.direction === 'inbound' ? '14px 14px 14px 4px' : '14px 14px 4px 14px', background: msg.direction === 'inbound' ? '#f1f5f9' : '#2563eb', color: msg.direction === 'inbound' ? '#0f172a' : 'white', fontSize: 14 }}>
                {msg.body}
                {msg.ai_generated && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>🤖</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Follow-ups ({followups.length})</h3>
          <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setShowFollowupModal(true)}>+ Schedule</button>
        </div>
        {followups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>No follow-ups scheduled</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {followups.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: '#f8fafc' }}>
                <span style={{ fontSize: 18 }}>{f.type === 'site_visit' ? '🏠' : f.type === 'call' ? '📞' : f.type === 'whatsapp' ? '💬' : '📅'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.title || f.type?.replace(/_/g, ' ')}</div>
                  {f.notes && <div style={{ fontSize: 12, color: '#64748b' }}>{f.notes}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{fmtDateTimeLocal(f.scheduled_at)}</div>
                  <span className={`badge ${f.status === 'completed' ? 'badge-green' : f.status === 'missed' ? 'badge-red' : 'badge-amber'}`} style={{ textTransform: 'capitalize', fontSize: 10 }}>{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {calls.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 16px' }}>Call Sessions ({calls.length})</h3>
          {calls.map((call) => (
            <div key={call.id} style={{ padding: 12, borderRadius: 10, background: '#f8fafc', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📞</span>
                  <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>{call.status}</span>
                  {call.outcome && <span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>{call.outcome.replace(/_/g, ' ')}</span>}
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{call.duration_sec ? `${call.duration_sec}s` : ''}</span>
              </div>
              {call.summary && <p style={{ fontSize: 13, color: '#475569', margin: '8px 0 0' }}>{call.summary}</p>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setShowCall(true)}>📞 Start AI Call Demo</button>
        <button className="btn btn-secondary" onClick={() => setShowFollowupModal(true)}>📅 Schedule Follow-up</button>
        <Link href="/dashboard/conversations" className="btn btn-ghost">💬 Open Conversation</Link>
      </div>

      {showCall && <CallDemoModal leadId={id} leadName={lead?.full_name} onClose={() => { setShowCall(false); load(); }} />}
      {showFollowupModal && <FollowupModal leadId={id} members={members} onClose={() => setShowFollowupModal(false)} onSaved={() => { setShowFollowupModal(false); load(); }} />}
    </div>
  );
}

function FollowupModal({ leadId, members, onClose, onSaved }: { leadId: string; members: any[]; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState('call');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api(`/api/leads/${leadId}/followups`, {
        method: 'POST',
        body: { type, title: title || undefined, notes: notes || undefined, scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined, assigned_to: assignedTo || undefined },
      });
      onSaved();
    } catch (e) {
      console.error('Failed to save followup:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 28 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>Schedule Follow-up</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="call">📞 Call</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="site_visit">🏠 Site Visit</option>
              <option value="email">✉️ Email</option>
              <option value="meeting">📅 Meeting</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Title (optional)</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call back about 3BHK site visit" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Scheduled At</label>
            <input className="input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Assign To (optional)</label>
            <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Auto</option>
              {members.map((m) => (<option key={m.id} value={m.id}>{m.full_name}</option>))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn btn-primary" disabled={saving || !scheduledAt} onClick={save}>{saving ? 'Saving...' : 'Schedule'}</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
