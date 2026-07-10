'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/api/leads'),
      api('/api/conversations'),
      api('/api/inventory/projects'),
      api('/api/followups?status=pending').catch(() => ({ followups: [] })),
    ])
      .then(([leadsRes, convRes, projRes, followupsRes]) => {
        const leads = leadsRes.leads ?? [];
        const conversations = convRes.conversations ?? [];
        const projects = projRes.projects ?? [];
        const followups = followupsRes.followups ?? [];
        setStats({
          totalLeads: leads.length,
          hotLeads: leads.filter((l: any) => l.temperature === 'hot').length,
          openConversations: conversations.filter((c: any) => c.status === 'open').length,
          properties: projects.length,
          pendingFollowups: followups.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Leads', value: stats?.totalLeads ?? 0, color: '#2563eb', bg: '#dbeafe', icon: '👥' },
    { label: 'Hot Leads', value: stats?.hotLeads ?? 0, color: '#dc2626', bg: '#fee2e2', icon: '🔥' },
    { label: 'Open Conversations', value: stats?.openConversations ?? 0, color: '#16a34a', bg: '#dcfce7', icon: '💬' },
    { label: 'Properties', value: stats?.properties ?? 0, color: '#7c3aed', bg: '#ede9fe', icon: '🏠' },
    { label: 'Pending Follow-ups', value: stats?.pendingFollowups ?? 0, color: '#d97706', bg: '#fef3c7', icon: '📋' },
  ];

  return (
    <div className="stagger" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
          Dashboard Overview
        </h1>
        <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>
          Real estate WhatsApp AI agent — lead qualification & calling demo
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {stat.icon}
              </div>
            </div>
            <div className="tnum" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 4, letterSpacing: '-0.03em' }}>
              {loading ? '—' : stat.value}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        <Link href="/dashboard/whatsapp" className="card card-hover" style={{ padding: 24, display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📱</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Connect WhatsApp</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Scan QR to start monitoring</div>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/upload" className="card card-hover" style={{ padding: 24, display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📤</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Upload Inventory</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Import property CSV</div>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/playground" className="card card-hover" style={{ padding: 24, display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🧪</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>AI Playground</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Test AI replies without a phone</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Demo Flow</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { step: '1', title: 'Upload Inventory', desc: 'CSV import properties', color: '#2563eb' },
            { step: '2', title: 'Connect WhatsApp', desc: 'Scan QR in terminal', color: '#16a34a' },
            { step: '3', title: 'AI Auto-Replies', desc: 'Lead qualification', color: '#d97706' },
            { step: '4', title: 'Call Demo', desc: 'AI calling agent Priya', color: '#7c3aed' },
          ].map((item, i) => (
            <div key={item.step} className="anim-in" style={{ flex: 1, padding: 16, borderRadius: 12, background: '#f8fafc', border: `2px solid ${item.color}15`, animationDelay: `${i * 100}ms` }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: item.color, color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{item.step}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}