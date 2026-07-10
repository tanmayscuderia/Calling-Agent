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

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [lead, setLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCall, setShowCall] = useState(false);
  const [handoff, setHandoff] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api(`/api/leads/${id}`),
      api(`/api/leads/${id}/messages`),
      api(`/api/leads/${id}/calls`),
    ])
      .then(([l, m, c]) => {
        setLead(l.lead);
        setMessages(m.messages ?? []);
        setCalls(c.calls ?? []);
        setMatches(l.matches ?? []);
        setHandoff(l.lead?.metadata?.human_handoff ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const doHandoff = async () => {
    await api(`/api/leads/${id}`, { method: 'PATCH', body: { metadata: { human_handoff: !handoff } } });
    setHandoff(!handoff);
  };

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />;

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Breadcrumb + header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/leads" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← Back to Leads</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Lead Profile */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 16px' }}>Lead Profile</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 20, borderRadius: 14, background: '#2563eb' }}>
              {(lead?.full_name || '?')[0]}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{lead?.full_name || 'Unknown Lead'}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>{lead?.phone || lead?.whatsapp_number || 'No phone'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>{lead?.status?.replace(/_/g, ' ') || 'new'}</span>
            <span className="badge" style={{ background: lead?.temperature === 'hot' ? '#fee2e2' : lead?.temperature === 'warm' ? '#fef3c7' : '#dbeafe', color: lead?.temperature === 'hot' ? '#dc2626' : lead?.temperature === 'warm' ? '#d97706' : '#2563eb', textTransform: 'capitalize' }}>
              {lead?.temperature || 'unknown'}
            </span>
          </div>
        </div>

        {/* Preferences */}
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

      {/* AI Summary */}
      {lead?.ai_summary && (
        <div className="card" style={{ padding: 24, marginBottom: 20, borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>AI Summary</h3>
          </div>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>{lead.ai_summary}</p>
        </div>
      )}

      {/* Property Matches */}
      {matches.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 16px' }}>Recommended Properties</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            {matches.map((m, i) => (
              <div key={m.id} className="anim-in" style={{ flex: 1, padding: 16, borderRadius: 12, background: '#f8fafc', animationDelay: `${i * 80}ms` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {Math.round((m.match_score ?? 0) * 100)}%
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>match</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{m.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation History */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 16px' }}>Conversation History ({messages.length})</h3>
        <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>No messages yet</div>
          ) : messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'inbound' ? 'flex-start' : 'flex-end' }}>
              <div
                style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: msg.direction === 'inbound' ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                  background: msg.direction === 'inbound' ? '#f1f5f9' : '#2563eb',
                  color: msg.direction === 'inbound' ? '#0f172a' : 'white',
                  fontSize: 14,
                }}
              >
                {msg.body}
                {msg.ai_generated && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>🤖</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call Sessions */}
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

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setShowCall(true)}>
          📞 Start AI Call Demo
        </button>
        <button className="btn btn-secondary" onClick={doHandoff}>
          {handoff ? '🤖 Re-enable AI' : '👤 Human Handoff'}
        </button>
        <Link href="/dashboard/conversations" className="btn btn-ghost">💬 Open Conversation</Link>
      </div>

      {showCall && <CallDemoModal leadId={id} leadName={lead?.full_name} onClose={() => { setShowCall(false); load(); }} />}
    </div>
  );
}