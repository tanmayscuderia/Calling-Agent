'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const avatarColors = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2'];

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  agent: 'Agent',
  member: 'Member',
};

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/members')
      .then((r) => setMembers(r.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' }}>Team</h1>
        <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>
          Organization members who can be assigned to leads and follow-ups
        </p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Title</th>
                <th>Phone</th>
                <th>WhatsApp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton" style={{ height: 36, width: 180 }} /></td>
                    <td><div className="skeleton" style={{ height: 20, width: 60 }} /></td>
                    <td><div className="skeleton" style={{ height: 20, width: 80 }} /></td>
                    <td><div className="skeleton" style={{ height: 20, width: 100 }} /></td>
                    <td><div className="skeleton" style={{ height: 20, width: 100 }} /></td>
                    <td><div className="skeleton" style={{ height: 24, width: 60, borderRadius: 999 }} /></td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <div style={{ padding: 48, textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No team members yet</h3>
                      <p style={{ fontSize: 14, color: '#64748b', margin: 0, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                        Team members added to your organization will appear here. They can be assigned to leads and follow-ups.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((m, i) => (
                  <tr key={m.id} className="anim-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                          {(m.full_name || m.initials || '?')[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{m.full_name || 'Unknown'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-slate" style={{ textTransform: 'capitalize' }}>
                        {roleLabels[m.role] || m.role || 'Member'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>{m.title || '—'}</td>
                    <td style={{ fontSize: 13, color: '#475569' }}>{m.mobile_number || '—'}</td>
                    <td style={{ fontSize: 13, color: '#475569' }}>{m.whatsapp_number || '—'}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: m.status === 'active' ? '#dcfce7' : '#f1f5f9',
                          color: m.status === 'active' ? '#16a34a' : '#64748b',
                          textTransform: 'capitalize',
                        }}
                      >
                        {m.status || 'unknown'}
                      </span>
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