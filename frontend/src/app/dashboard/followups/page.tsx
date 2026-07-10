'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    api('/api/followups')
      .then((res) => setFollowups(res.followups ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = followups.filter((f) => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  // Sort: overdue first, then by scheduled date
  const sorted = [...filtered].sort((a, b) => {
    if (!a.scheduled_at) return 1;
    if (!b.scheduled_at) return -1;
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });

  const isOverdue = (scheduledAt: string | null) => {
    if (!scheduledAt) return false;
    return new Date(scheduledAt).getTime() < Date.now();
  };

  const typeIcon: Record<string, string> = {
    call: '📞',
    whatsapp: '💬',
    site_visit: '🏢',
    email: '✉️',
    meeting: '📅',
    other: '📌',
  };

  const tempColor: Record<string, string> = {
    hot: '#dc2626',
    warm: '#d97706',
    cold: '#2563eb',
    unknown: '#64748b',
  };

  return (
    <div className="stagger" style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
          Follow-ups
        </h1>
        <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>
          Upcoming and recent follow-up tasks across all leads
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
        {(['pending', 'completed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: filter === f ? 600 : 500,
              color: filter === f ? '#2563eb' : '#64748b',
              background: 'none',
              border: 'none',
              borderBottom: filter === f ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f} {f === 'pending' && followups.filter((x) => x.status === 'pending').length > 0 && (
              <span style={{ marginLeft: 4, fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 6 }}>
                {followups.filter((x) => x.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>No {filter} follow-ups</h3>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Follow-ups are created automatically when leads ask for callbacks or site visits
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((f, i) => {
            const overdue = f.status === 'pending' && isOverdue(f.scheduled_at);
            return (
              <div
                key={f.id}
                className="card anim-in"
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  animationDelay: `${i * 40}ms`,
                  borderLeft: overdue ? '3px solid #dc2626' : f.status === 'completed' ? '3px solid #16a34a' : '3px solid transparent',
                }}
              >
                {/* Type icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {typeIcon[f.type] || '📌'}
                </div>

                {/* Lead info + task */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    {f.lead ? (
                      <Link href={`/dashboard/leads/${f.lead.id}`} style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>
                        {f.lead.full_name || f.lead.phone || 'Unknown Lead'}
                      </Link>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Unknown Lead</span>
                    )}
                    {f.lead?.temperature && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `${tempColor[f.lead.temperature]}15`, color: tempColor[f.lead.temperature], fontWeight: 600, textTransform: 'capitalize' }}>
                        {f.lead.temperature}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.title || f.notes || `${f.type} follow-up`}
                  </div>
                </div>

                {/* Scheduled time */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {f.scheduled_at ? (
                    <>
                      <div className="tnum" style={{ fontSize: 13, fontWeight: 600, color: overdue ? '#dc2626' : '#334155' }}>
                        {new Date(f.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="tnum" style={{ fontSize: 12, color: overdue ? '#dc2626' : '#94a3b8' }}>
                        {new Date(f.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>No date</span>
                  )}
                  {overdue && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>Overdue</div>}
                  {f.status === 'completed' && <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>✓ Done</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}