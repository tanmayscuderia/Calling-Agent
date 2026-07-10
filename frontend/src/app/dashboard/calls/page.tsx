'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/leads')
      .then(async (r) => {
        const leads = r.leads ?? [];
        const callsWithLeads = await Promise.all(
          (leads.slice(0, 10)).map((l: any) =>
            api(`/api/leads/${l.id}/calls`).then((cr) => (cr.calls ?? []).map((c: any) => ({ ...c, lead: l }))).catch(() => [])
          )
        );
        setCalls(callsWithLeads.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const outcomeColors: Record<string, string> = {
    interested: 'badge-green',
    not_interested: 'badge-red',
    callback_requested: 'badge-amber',
    site_visit_requested: 'badge-purple',
    wrong_number: 'badge-slate',
    follow_up_later: 'badge-blue',
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Call Sessions</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>AI calling agent demo — browser-based with speech synthesis</p>
      </div>

      <div className="stagger">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 12 }} />)
        ) : calls.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📞</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No call sessions yet</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Start an AI call demo from any lead detail page</div>
            <Link href="/dashboard/leads" className="btn btn-primary">View Leads</Link>
          </div>
        ) : (
          calls.map((call) => (
            <div key={call.id} className="card card-hover" style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    📞
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{call.lead?.full_name || call.lead?.phone || 'Unknown'}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{new Date(call.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className={`badge ${call.status === 'completed' ? 'badge-green' : 'badge-slate'}`} style={{ textTransform: 'capitalize' }}>{call.status}</span>
                  {call.outcome && <span className={`badge ${outcomeColors[call.outcome] || 'badge-slate'}`} style={{ textTransform: 'capitalize' }}>{call.outcome.replace(/_/g, ' ')}</span>}
                </div>
              </div>
              {call.summary && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#f8fafc', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                  {call.summary}
                </div>
              )}
              {call.duration_sec != null && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>Duration: {call.duration_sec}s</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}