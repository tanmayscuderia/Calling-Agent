'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

const outcomeColors: Record<string, string> = {
  interested: 'badge-green',
  not_interested: 'badge-red',
  callback_requested: 'badge-amber',
  site_visit_requested: 'badge-purple',
  booking_requested: 'badge-purple',
  wrong_number: 'badge-slate',
  follow_up_later: 'badge-blue',
  no_answer: 'badge-slate',
  busy: 'badge-amber',
  failed: 'badge-red',
};

const statusColors: Record<string, string> = {
  completed: 'badge-green',
  failed: 'badge-red',
  no_answer: 'badge-slate',
  busy: 'badge-amber',
  in_progress: 'badge-blue',
  ringing: 'badge-blue',
  initiated: 'badge-blue',
};

function formatDuration(sec: number | null | undefined): string {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    // Single fetch — the endpoint joins lead + turns server-side
    api('/api/calls')
      .then((r) => setCalls(r.calls ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Call Sessions</h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>AI call sessions — browser demo + real outbound calls via Sarvam voice agents</p>
      </div>

      <div className="stagger">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 12 }} />)
        ) : calls.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📞</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No call sessions yet</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Start an AI call demo or a real Sarvam call from any lead detail page</div>
            <Link href="/dashboard/leads" className="btn btn-primary">View Leads</Link>
          </div>
        ) : (
          calls.map((call) => {
            const turns: any[] = call.turns ?? [];
            const hasTranscript = turns.length > 0 || call.transcript;
            const isOpen = expanded === call.id;
            return (
              <div key={call.id} className="card card-hover" style={{ padding: 20, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      📞
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {call.lead?.full_name ||
                          (call.direction === 'inbound' ? call.from_number : call.to_number) ||
                          call.lead?.phone ||
                          'Unknown'}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        {new Date(call.created_at).toLocaleString()}
                        {call.duration_sec != null && <> · {formatDuration(call.duration_sec)}</>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {call.direction === 'inbound' && <span className="badge badge-green">↙ Inbound</span>}
                      {call.provider === 'sarvam' && <span className="badge badge-purple">Sarvam</span>}
                      {call.provider === 'browser_demo' && <span className="badge badge-blue">Demo</span>}
                    </div>
                    <span className={`badge ${statusColors[call.status] || 'badge-slate'}`} style={{ textTransform: 'capitalize' }}>
                      {call.status === 'ringing' ? '📞 ' : ''}{(call.status || 'unknown').replace(/_/g, ' ')}
                    </span>
                    {call.outcome && <span className={`badge ${outcomeColors[call.outcome] || 'badge-slate'}`} style={{ textTransform: 'capitalize' }}>{call.outcome.replace(/_/g, ' ')}</span>}
                  </div>
                </div>

                {call.summary && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#f8fafc', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    {call.summary}
                  </div>
                )}

                {hasTranscript && (
                  <button
                    onClick={() => setExpanded(isOpen ? null : call.id)}
                    style={{
                      marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
                      color: '#7c3aed', fontSize: 13, fontWeight: 600, padding: 0,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {isOpen ? '▾' : '▸'} {isOpen ? 'Hide transcript' : `View transcript (${turns.length} turn${turns.length === 1 ? '' : 's'})`}
                  </button>
                )}

                {isOpen && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {turns.length > 0 ? (
                      turns.map((t: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: t.speaker === 'agent' ? 'flex-end' : 'flex-start' }}>
                          <div
                            style={{
                              maxWidth: '78%', padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                              background: t.speaker === 'agent' ? '#ede9fe' : '#f1f5f9',
                              color: t.speaker === 'agent' ? '#3730a3' : '#334155',
                              borderBottomRightRadius: t.speaker === 'agent' ? 4 : 12,
                              borderBottomLeftRadius: t.speaker === 'agent' ? 12 : 4,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {t.text}
                          </div>
                        </div>
                      ))
                    ) : (
                      <pre style={{ margin: 0, padding: 12, borderRadius: 10, background: '#f8fafc', fontSize: 12.5, color: '#475569', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {call.transcript}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}