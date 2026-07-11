'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { m } from 'framer-motion';
import { staggerContainer, staggerItem, cardHover, buttonTap, EASE } from '@/lib/animations';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [llmUsage, setLlmUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/api/leads'),
      api('/api/conversations'),
      api('/api/inventory/projects'),
      api('/api/followups?status=pending').catch(() => ({ followups: [] })),
      api('/api/system/llm-usage').catch(() => null),
    ])
      .then(([leadsRes, convRes, projRes, followupsRes, usageRes]) => {
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
        if (usageRes) setLlmUsage(usageRes);
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

  const quickActions = [
    { href: '/dashboard/whatsapp', icon: '📱', bg: '#dcfce7', title: 'Connect WhatsApp', desc: 'Scan QR to start monitoring' },
    { href: '/dashboard/upload', icon: '📤', bg: '#ede9fe', title: 'Upload Inventory', desc: 'Import property CSV' },
    { href: '/dashboard/playground', icon: '🧪', bg: '#fef3c7', title: 'AI Playground', desc: 'Test AI replies without a phone' },
  ];

  const demoSteps = [
    { step: '1', title: 'Upload Inventory', desc: 'CSV import properties', color: '#2563eb' },
    { step: '2', title: 'Connect WhatsApp', desc: 'Scan QR in terminal', color: '#16a34a' },
    { step: '3', title: 'AI Auto-Replies', desc: 'Lead qualification', color: '#d97706' },
    { step: '4', title: 'Call Demo', desc: 'AI calling agent Priya', color: '#7c3aed' },
  ];

  return (
    <m.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={{ maxWidth: 1100 }}
    >
      {/* Header */}
      <m.div variants={staggerItem} style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
          Dashboard Overview
        </h1>
        <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>
           Real estate WhatsApp AI agent — lead qualification & calling demo
         </p>

        {/* LLM Usage Badge */}
        {llmUsage && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              padding: '6px 14px',
              borderRadius: 20,
              background: llmUsage.percentUsed >= 80 ? '#fef2f2' : llmUsage.percentUsed >= 50 ? '#fffbeb' : '#f0fdf4',
              border: `1px solid ${llmUsage.percentUsed >= 80 ? '#fecaca' : llmUsage.percentUsed >= 50 ? '#fde68a' : '#bbf7d0'}`,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 14 }}>
              {llmUsage.percentUsed >= 80 ? '🔴' : llmUsage.percentUsed >= 50 ? '🟡' : '🟢'}
            </span>
            <span className="tnum">
              LLM: {llmUsage.totalCalls}/{llmUsage.limit} calls today
            </span>
            {llmUsage.totalCalls > 0 && llmUsage.bySource && (
              <span style={{ color: '#64748b', fontWeight: 500 }}>
                ({Object.entries(llmUsage.bySource).map(([k, v]) => `${k}: ${v}`).join(', ')})
              </span>
            )}
          </m.div>
        )}
       </m.div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map((stat) => (
          <m.div key={stat.label} variants={staggerItem}>
            <m.div
              className="stat-card"
              {...cardHover}
              style={{ cursor: 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <m.div
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}
                >
                  {stat.icon}
                </m.div>
              </div>
              <m.div
                className="tnum"
                style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 4, letterSpacing: '-0.03em' }}
              >
                {loading ? (
                  <m.span
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    —
                  </m.span>
                ) : (
                  stat.value
                )}
              </m.div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
            </m.div>
          </m.div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        {quickActions.map((action) => (
          <m.div key={action.href} variants={staggerItem}>
            <m.div {...cardHover}>
              <Link href={action.href} className="card" style={{ padding: 24, display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <m.div
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{ width: 48, height: 48, borderRadius: 12, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}
                  >
                    {action.icon}
                  </m.div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{action.title}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{action.desc}</div>
                  </div>
                </div>
              </Link>
            </m.div>
          </m.div>
        ))}
      </div>

      {/* Demo flow */}
      <m.div variants={staggerItem} className="card" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Demo Flow</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {demoSteps.map((item, i) => (
            <m.div
              key={item.step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.35, ease: EASE }}
              whileHover={{ y: -2 }}
              style={{ flex: 1, padding: 16, borderRadius: 12, background: '#f8fafc', border: `2px solid ${item.color}15` }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: item.color, color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{item.step}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
            </m.div>
          ))}
        </div>
      </m.div>
    </m.div>
  );
}