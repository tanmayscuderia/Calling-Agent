'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

const avatarColors = ['#2563eb', '#7c3aed', '#dc2626', '#d97706', '#16a34a', '#0891b2', '#db2777'];

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function tempBadge(temp?: string) {
  if (temp === 'hot') return 'badge badge-red';
  if (temp === 'warm') return 'badge badge-amber';
  if (temp === 'cold') return 'badge badge-blue';
  return 'badge badge-slate';
}

function statusBadge(status?: string) {
  const map: Record<string, string> = {
    new: 'badge-slate', contacted: 'badge-blue', qualified: 'badge-purple',
    site_visit_scheduled: 'badge-amber', won: 'badge-green', lost: 'badge-red', junk: 'badge-slate',
  };
  return `badge ${map[status ?? 'new'] ?? 'badge-slate'}`;
}

function fmtMoney(n?: number) {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
  return `₹${n}`;
}

function timeAgo(iso?: string) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const load = () => {
    setLoading(true);
    const query: Record<string, string> = {};
    if (filterStatus) query.status = filterStatus;
    api('/api/leads', { query })
      .then((r) => setLeads(r.leads ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Leads</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>CRM leads from WhatsApp and manual entry</p>
        </div>
        <Link href="/dashboard/conversations" className="btn btn-secondary">View Conversations</Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Filter:</span>
        <select className="input" style={{ width: 'auto', minHeight: 36 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="site_visit_scheduled">Site Visit</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8' }}>{leads.length} leads</span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Requirement</th>
                <th>Budget</th>
                <th>Temperature</th>
                <th>Status</th>
                <th>Last Contact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton" style={{ height: 36, width: 180 }} /></td>
                    <td><div className="skeleton" style={{ height: 20, width: 100 }} /></td>
                    <td><div className="skeleton" style={{ height: 20, width: 60 }} /></td>
                    <td><div className="skeleton" style={{ height: 24, width: 60, borderRadius: 999 }} /></td>
                    <td><div className="skeleton" style={{ height: 24, width: 70, borderRadius: 999 }} /></td>
                    <td><div className="skeleton" style={{ height: 20, width: 70 }} /></td>
                    <td></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <div style={{ padding: 48, textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No leads yet</h3>
                      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                        Leads are created automatically when customers message on WhatsApp. Connect your WhatsApp bridge and upload inventory first.
                      </p>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <Link href="/dashboard/whatsapp" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                          📱 Connect WhatsApp
                        </Link>
                        <Link href="/dashboard/playground" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                          🧪 Try AI Playground
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, i) => (
                  <tr key={lead.id} className="anim-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                          {getInitials(lead.full_name || lead.phone)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.full_name || 'Unknown'}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{lead.phone || lead.whatsapp_number || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {lead.configuration && <span style={{ fontWeight: 600 }}>{lead.configuration}</span>}
                        {lead.preferred_city && <span style={{ color: '#64748b' }}> · {lead.preferred_city}</span>}
                        {lead.preferred_sector && <span style={{ color: '#64748b' }}> · {lead.preferred_sector}</span>}
                        {!lead.configuration && !lead.preferred_city && <span style={{ color: '#94a3b8' }}>Not specified</span>}
                      </div>
                    </td>
                    <td className="tnum" style={{ fontSize: 13, fontWeight: 500 }}>
                      {lead.budget_min || lead.budget_max
                        ? `${fmtMoney(lead.budget_min)}–${fmtMoney(lead.budget_max)}`
                        : '—'}
                    </td>
                    <td><span className={tempBadge(lead.temperature)} style={{ textTransform: 'capitalize' }}>{lead.temperature || 'unknown'}</span></td>
                    <td><span className={statusBadge(lead.status)} style={{ textTransform: 'capitalize' }}>{(lead.status || 'new').replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>{timeAgo(lead.last_contacted_at)}</td>
                    <td>
                      <Link href={`/dashboard/leads/${lead.id}`} className="btn btn-ghost" style={{ padding: '4px 12px', minHeight: 32, fontSize: 13 }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}