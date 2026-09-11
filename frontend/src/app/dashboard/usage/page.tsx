'use client';

/**
 * Usage & Cost dashboard — what the org has consumed and what it costs.
 *
 * Data: GET /api/usage/summary?days=N
 *   - LLM cost is ESTIMATED from token counts × env-configured rates
 *     (LLM_INPUT_COST_PER_1M / LLM_OUTPUT_COST_PER_1M, USD)
 *   - Sarvam cost = call minutes × SARVAM_COST_PER_MINUTE (INR, hidden
 *     when the rate is unset)
 *   - Per-number rows come from account_usage_daily (today) + ai_agent_runs
 *     (7-day cost attribution via conversations)
 */

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface UsageSummary {
  ok: boolean;
  period: { days: number; from: string; to: string };
  pricing: { llmInputCostPer1M: number; llmOutputCostPer1M: number; sarvamCostPerMinuteInr: number };
  daily: Array<{ date: string; aiRuns: number; tokensIn: number; tokensOut: number; messagesSent: number; costUsd: number }>;
  totals: { aiRuns: number; tokensIn: number; tokensOut: number; messagesSent: number; llmCostUsd: number };
  accounts: Array<{
    id: string;
    label: string;
    provider: string;
    todayInbound: number;
    todayOutbound: number;
    todayAiReplies: number;
    limits: { max_ai_replies_per_day: number | null; max_messages_per_day: number | null };
    aiCost7dUsd: number;
  }>;
  sarvam: { calls: number; completed: number; totalMinutes: number; inbound: number; outbound: number; costInr: number | null };
  topConversations: Array<{ conversationId: string; aiReplies: number; limit: number; customerName: string | null; customerPhone: string | null }>;
  limits: Record<string, any> | null;
}

const card: React.CSSProperties = { background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 18 };
const statValue: React.CSSProperties = { fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' };
const statLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' };

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={statLabel}>{label}</div>
      <div style={{ ...statValue, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetchSummary = useCallback(
    async (d: number) => {
      setLoading(true);
      try {
        const r = await api(`/api/usage/summary?days=${d}`);
        setSummary(r);
        setOffline(false);
      } catch (e: any) {
        if (e?.message === 'BACKEND_UNREACHABLE') setOffline(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSummary(days);
  }, [days, fetchSummary]);

  const t = summary?.totals;
  const s = summary?.sarvam;

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Usage & Cost</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            LLM tokens & estimated cost (DeepSeek), Sarvam call minutes, and per-number activity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: days === d ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: days === d ? '#2563eb' : 'white',
                color: days === d ? 'white' : '#475569',
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {offline && (
        <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: '4px solid #dc2626', fontSize: 13, color: '#dc2626' }}>
          Backend not reachable — start it with <code style={{ background: '#0f172a', color: '#e2e8f0', padding: '2px 8px', borderRadius: 6 }}>cd backend && npm run dev</code>
        </div>
      )}

      {loading || !summary ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading usage…</div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <StatCard label={`AI Replies (${days}d)`} value={String(t?.aiRuns ?? 0)} sub={`${t?.messagesSent ?? 0} messages sent`} accent="#2563eb" />
            <StatCard label={`LLM Cost (${days}d)`} value={`$${(t?.llmCostUsd ?? 0).toFixed(3)}`} sub={`est. · $${summary?.pricing.llmInputCostPer1M}/$${summary?.pricing.llmOutputCostPer1M} per 1M tok`} accent="#7c3aed" />
            <StatCard
              label={`Sarvam Calls (${days}d)`}
              value={String(s?.calls ?? 0)}
              sub={s?.costInr != null ? `${s.totalMinutes} min · ₹${s.costInr} est.` : `${s?.totalMinutes ?? 0} min · set SARVAM_COST_PER_MINUTE for cost`}
              accent="#059669"
            />
            <StatCard label={`LLM Tokens (${days}d)`} value={`${(((t?.tokensIn ?? 0) + (t?.tokensOut ?? 0)) / 1000).toFixed(1)}k`} sub={`${t?.tokensIn?.toLocaleString() ?? 0} in · ${t?.tokensOut?.toLocaleString() ?? 0} out`} accent="#d97706" />
          </div>

          {/* ── Daily bars ── */}
          {(summary.daily?.length ?? 0) > 0 && (
            <div className="card" style={{ padding: 18, marginBottom: 16 }}>
              <div style={statLabel}>DAILY AI RUNS — LAST {days} DAYS</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90, marginTop: 12 }}>
                {(() => {
                  const max = Math.max(...summary.daily.map((d) => d.aiRuns), 1);
                  return summary.daily.map((d) => (
                    <div key={d.date} style={{ flex: 1, textAlign: 'center' }} title={`${d.date}: ${d.aiRuns} runs`}>
                      <div style={{ background: 'linear-gradient(180deg,#3b82f6,#2563eb)', height: `${Math.max((d.aiRuns / max) * 70, 2)}px`, borderRadius: 4, margin: '0 auto', width: '70%' }} />
                      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>{d.date.slice(5)}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* ── Per-number table ── */}
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>📱 Per-number usage (today)</div>
            {(summary.accounts?.length ?? 0) === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>No numbers connected yet — connect one from the WhatsApp page.</div>
            ) : (
              <table className="data" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Number</th>
                    <th style={{ textAlign: 'left' }}>Provider</th>
                    <th style={{ textAlign: 'right' }}>In</th>
                    <th style={{ textAlign: 'right' }}>Out</th>
                    <th style={{ textAlign: 'right' }}>AI replies</th>
                    <th style={{ textAlign: 'right' }}>7d LLM cost</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.accounts.map((a) => {
                    const aiLimit = a.limits.max_ai_replies_per_day;
                    const pct = aiLimit ? Math.min(100, Math.round((a.todayAiReplies / aiLimit) * 100)) : 0;
                    return (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</td>
                        <td>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: a.provider === 'meta_cloud_api' ? '#dcfce7' : '#fef3c7', color: a.provider === 'meta_cloud_api' ? '#16a34a' : '#d97706', fontWeight: 700 }}>
                            {a.provider === 'meta_cloud_api' ? 'Official API' : 'Baileys'}
                          </span>
                        </td>
                        <td className="tnum" style={{ textAlign: 'right' }}>{a.todayInbound}</td>
                        <td className="tnum" style={{ textAlign: 'right' }}>{a.todayOutbound}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="tnum" style={{ fontWeight: 600 }}>{a.todayAiReplies}</span>
                          {aiLimit ? <span style={{ fontSize: 10, color: '#94a3b8' }}> / {aiLimit}</span> : null}
                          {aiLimit && pct >= 80 ? <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginLeft: 6 }}>⚠ {pct}%</span> : null}
                        </td>
                        <td className="tnum" style={{ textAlign: 'right' }}>${a.aiCost7dUsd.toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Top conversations vs cap ── */}
          {(summary.topConversations?.length ?? 0) > 0 && (
            <div className="card" style={{ padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>💬 Most-active conversations</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>Lifetime AI replies vs the 500 cap (blocked conversations show as Pending Human).</div>
              {summary.topConversations.map((c) => {
                const pct = Math.min(100, Math.round((c.aiReplies / c.limit) * 100));
                return (
                  <div key={c.conversationId} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{c.customerName || c.customerPhone || 'Unknown'}</span>
                      <span className="tnum" style={{ color: pct >= 80 ? '#dc2626' : '#64748b' }}>{c.aiReplies} / {c.limit}</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4 }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: pct >= 80 ? '#dc2626' : pct >= 50 ? '#d97706' : '#2563eb' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── How costs are estimated ── */}
          <div style={{ padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            <strong>How costs are estimated:</strong> LLM cost = tokens × rates from <code>LLM_INPUT_COST_PER_1M</code> / <code>LLM_OUTPUT_COST_PER_1M</code> (USD).
            Sarvam cost = call minutes × <code>SARVAM_COST_PER_MINUTE</code> (INR) — hidden until you set a rate.
            Per-number rows only track numbers connected <em>after</em> the per-number counters shipped (2026-09-10).
          </div>
        </>
      )}
    </div>
  );
}
