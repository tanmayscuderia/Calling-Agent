'use client';

/**
 * Tasks panel — the upgraded Follow-ups screen.
 *
 * Every follow-up is a task: lead-linked (who we talked to), employee-assigned,
 * source-tagged (AI call / AI WhatsApp / manual), and filterable end to end.
 * Task types come from the org's agent config (industry template-driven:
 * site_visit for real estate, campus_visit for education, test_drive for
 * automotive, ...). Analytics strip shows workload, types, source split and a
 * 30-day created-vs-completed trend.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

interface TaskType { key: string; label: string; icon: string }
interface Task {
  id: string;
  title: string | null;
  type: string;
  status: string;
  priority: string;
  source: string;
  notes: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  lead_id: string;
  assigned_to: string | null;
  lead?: { id: string; full_name: string | null; phone: string | null; temperature: string; status: string } | null;
  assignee?: { id: string; full_name: string; role: string; title: string } | null;
}
interface Member { id: string; full_name: string; role: string; title: string | null }
interface Analytics {
  totals: { open: number; completed: number; missed: number; cancelled: number; overdue: number; dueToday: number };
  completionRatePct: number;
  avgHoursToComplete: number | null;
  bySource: Array<{ source: string; open: number; total: number }>;
  byType: Array<{ type: string; open: number; total: number }>;
  byAssignee: Array<{ assigneeId: string | null; name: string; open: number; completed: number }>;
  trend30d: Array<{ date: string; created: number; completed: number }>;
}

const DEFAULT_TASK_TYPES: TaskType[] = [
  { key: "call", label: "Call", icon: "📞" },
  { key: "whatsapp", label: "WhatsApp", icon: "💬" },
  { key: "site_visit", label: "Site Visit", icon: "🏢" },
  { key: "email", label: "Email", icon: "✉️" },
  { key: "meeting", label: "Meeting", icon: "📅" },
  { key: "other", label: "Other", icon: "📌" },
];

const SOURCE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  ai_call: { label: "AI call", bg: "#fef3c7", color: "#92400e" },
  ai_whatsapp: { label: "AI WhatsApp", bg: "#dbeafe", color: "#1e40af" },
  manual: { label: "Manual", bg: "#f1f5f9", color: "#475569" },
};
const PRIORITY_DOT: Record<string, string> = { urgent: "#dc2626", high: "#ea580c", medium: "#d97706", low: "#94a3b8" };
const TEMP_COLOR: Record<string, string> = { hot: "#dc2626", warm: "#d97706", cold: "#2563eb", unknown: "#94a3b8" };

const statValue: React.CSSProperties = { fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a", fontVariantNumeric: "tabular-nums" };
const statLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase" };
const control: React.CSSProperties = { minHeight: 40, borderRadius: 10, border: "1px solid #e2e8f0", padding: "0 12px", fontSize: 13.5, background: "white", color: "#0f172a" };

function iconFor(types: TaskType[], key: string): string {
  return types.find((t) => t.key === key)?.icon ?? "📌";
}
function labelFor(types: TaskType[], key: string): string {
  return types.find((t) => t.key === key)?.label ?? key;
}

export default function TasksPage() {
  const { memberId, role } = useAuth();
  const isMemberRole = role === "member";

  const [tab, setTab] = useState<"mine" | "all">(isMemberRole ? "mine" : "mine");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>(DEFAULT_TASK_TYPES);
  const [loading, setLoading] = useState(true);

  // filters
  const [fAssignee, setFAssignee] = useState<string>("");
  const [fType, setFType] = useState<string>("");
  const [fSource, setFSource] = useState<string>("");
  const [fStatus, setFStatus] = useState<string>("pending");
  const [fSearch, setFSearch] = useState<string>("");

  const [creating, setCreating] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cType, setCType] = useState("call");
  const [cPriority, setCPriority] = useState("medium");
  const [cAssignee, setCAssignee] = useState("");
  const [cDue, setCDue] = useState("");
  const [cLeadQuery, setCLeadQuery] = useState("");
  const [cLeadResults, setCLeadResults] = useState<Array<{ id: string; full_name: string | null; phone: string | null }>>([]);
  const [cLead, setCLead] = useState<{ id: string; full_name: string | null; phone: string | null } | null>(null);
  const [cSaving, setCSaving] = useState(false);

  const searchLeads = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setCLeadResults([]); return; }
    try {
      const res = await api(`/api/leads?search=${encodeURIComponent(q.trim())}&limit=5`);
      setCLeadResults(res.leads ?? []);
    } catch { setCLeadResults([]); }
  }, []);

  const createTask = async () => {
    if (!cLead || !cTitle.trim()) return;
    setCSaving(true);
    try {
      await api("/api/followups", {
        method: "POST",
        body: JSON.stringify({
          leadId: cLead.id,
          title: cTitle.trim(),
          type: cType,
          priority: cPriority,
          assigned_to: (tab === "mine" ? memberId : cAssignee) || null,
          scheduled_at: cDue ? new Date(cDue).toISOString() : undefined,
          source: "manual",
          status: "pending",
        }),
      });
      setCreating(false);
      setCTitle(""); setCLead(null); setCLeadQuery(""); setCLeadResults([]); setCDue("");
      loadTasks().catch(() => {});
      loadAnalytics().catch(() => {});
    } finally {
      setCSaving(false);
    }
  };

  const effectiveAssignee = tab === "mine" ? memberId ?? fAssignee : fAssignee;

  const loadTasks = useCallback(async () => {
    const p = new URLSearchParams();
    if (fStatus) p.set("status", fStatus);
    if (effectiveAssignee) p.set("assigneeId", effectiveAssignee);
    if (fType) p.set("type", fType);
    if (fSource) p.set("source", fSource);
    if (fSearch.trim()) p.set("search", fSearch.trim());
    const res = await api(`/api/followups?${p.toString()}`);
    setTasks(res.followups ?? []);
  }, [fStatus, effectiveAssignee, fType, fSource, fSearch]);

  const loadAnalytics = useCallback(async () => {
    const res = await api("/api/followups/analytics");
    setAnalytics(res.analytics ?? null);
  }, []);

  useEffect(() => {
    api("/api/members").then((r) => setMembers(r.members ?? [])).catch(() => {});
    api("/api/agent/config")
      .then((r) => {
        const tt = r?.config?.task_types ?? r?.task_types;
        if (Array.isArray(tt) && tt.length > 0) setTaskTypes(tt);
      })
      .catch(() => {});
    loadAnalytics().catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTasks().catch(() => {}).finally(() => setLoading(false));
  }, [loadTasks]);

  const setTaskField = async (id: string, patch: Record<string, unknown>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } as Task : t)));
    try {
      await api(`/api/followups/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      loadAnalytics().catch(() => {});
    } catch {
      loadTasks().catch(() => {});
    }
  };

  const now = Date.now();
  const visible = tasks;

  return (
    <div className="stagger" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.03em", textWrap: "balance" }}>Tasks</h1>
          <p style={{ color: "#475569", fontSize: 15, margin: 0 }}>
            AI-flagged actions and follow-ups — every lead the agent talked to, assigned and tracked
          </p>
        </div>
        <button onClick={() => setCreating(true)} style={{ minHeight: 40, padding: "0 18px", borderRadius: 10, background: "#0f172a", color: "white", fontWeight: 700, fontSize: 13.5, border: "none", cursor: "pointer", transition: "transform 120ms" }}
          onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
          + New Task
        </button>
      </div>
      {analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Open", value: String(analytics.totals.open), sub: null, ring: "#e2e8f0" },
            { label: "Overdue", value: String(analytics.totals.overdue), sub: null, ring: analytics.totals.overdue > 0 ? "#fecaca" : "#e2e8f0" },
            { label: "Due today", value: String(analytics.totals.dueToday), sub: null, ring: "#e2e8f0" },
            { label: "Done (90d)", value: String(analytics.totals.completed), sub: null, ring: "#e2e8f0" },
            { label: "Completion", value: `${analytics.completionRatePct}%`, sub: analytics.avgHoursToComplete != null ? `avg ${analytics.avgHoursToComplete}h to close` : null, ring: "#e2e8f0" },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: 16, boxShadow: `inset 0 0 0 1px ${s.ring}` }}>
              <div style={statLabel}>{s.label}</div>
              <div style={{ ...statValue, marginTop: 6 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
        {!isMemberRole && (
          <div style={{ display: "inline-flex", background: "#f1f5f9", borderRadius: 10, padding: 3 }}>
            {(["mine", "all"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ minHeight: 34, padding: "0 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: tab === t ? "white" : "transparent", color: tab === t ? "#0f172a" : "#64748b",
                  boxShadow: tab === t ? "0 1px 3px rgba(15,23,42,0.12)" : "none", transition: "background 150ms, color 150ms" }}>
                {t === "mine" ? "My Tasks" : "All Tasks"}
              </button>
            ))}
          </div>
        )}
        <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} style={{ ...control, flex: "0 0 170px" }} aria-label="Filter by employee">
          <option value="">All employees</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
        <select value={fType} onChange={(e) => setFType(e.target.value)} style={{ ...control, flex: "0 0 160px" }} aria-label="Filter by type">
          <option value="">All types</option>
          {taskTypes.map((t) => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
        </select>
        <select value={fSource} onChange={(e) => setFSource(e.target.value)} style={{ ...control, flex: "0 0 160px" }} aria-label="Filter by source">
          <option value="">All sources</option>
          <option value="ai_call">AI calls</option>
          <option value="ai_whatsapp">AI WhatsApp</option>
          <option value="manual">Manual</option>
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={{ ...control, flex: "0 0 140px" }} aria-label="Filter by status">
          <option value="pending">Open</option>
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="missed">Missed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input value={fSearch} onChange={(e) => setFSearch(e.target.value)} placeholder="Search title / notes…"
          style={{ ...control, flex: "1 1 180px", minWidth: 160 }} aria-label="Search tasks" />
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 14 }}>Loading tasks…</div>
      ) : visible.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗂️</div>
          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No tasks match</div>
          <div style={{ color: "#64748b", fontSize: 13.5 }}>
            Tasks appear here when AI calls flag follow-ups or you create them manually.
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {visible.map((t, i) => {
            const overdue = t.status === "pending" && t.scheduled_at && new Date(t.scheduled_at).getTime() < now;
            const done = t.status === "completed";
            const src = SOURCE_BADGE[t.source] ?? SOURCE_BADGE.manual;
            return (
              <div key={t.id}
                style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 18px",
                  borderTop: i === 0 ? "none" : "1px solid #f1f5f9", background: overdue ? "#fff7f7" : "white" }}>
                {/* complete checkbox */}
                <button aria-label={done ? "Mark as open" : "Mark as done"}
                  onClick={() => setTaskField(t.id, { status: done ? "pending" : "completed", completed_at: done ? null : new Date().toISOString() })}
                  style={{ width: 40, height: 40, margin: "-6px 0 0 -8px", flexShrink: 0, border: "none", background: "transparent", cursor: "pointer",
                    fontSize: 20, color: done ? "#16a34a" : "#cbd5e1", lineHeight: "40px", transition: "color 150ms, scale 120ms" }}
                  onPointerDown={(e) => (e.currentTarget.style.scale = "0.96")}
                  onPointerUp={(e) => (e.currentTarget.style.scale = "1")}
                  onPointerLeave={(e) => (e.currentTarget.style.scale = "1")}>
                  {done ? "✅" : "⬜"}
                </button>

                {/* main */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15 }}>{iconFor(taskTypes, t.type)}</span>
                    <span style={{ fontWeight: 700, fontSize: 14.5, color: done ? "#94a3b8" : "#0f172a",
                      textDecoration: done ? "line-through" : "none" }}>
                      {t.title || labelFor(taskTypes, t.type)}
                    </span>
                    {t.priority && t.priority !== "medium" && t.status === "pending" && (
                      <span title={`Priority: ${t.priority}`} style={{ width: 8, height: 8, borderRadius: 99, background: PRIORITY_DOT[t.priority] ?? "#94a3b8", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: src.bg, color: src.color }}>{src.label}</span>
                  </div>
                  {t.lead && (
                    <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: TEMP_COLOR[t.lead.temperature] ?? TEMP_COLOR.unknown }} title={`Lead temperature: ${t.lead.temperature}`} />
                      <Link href={`/dashboard/leads/${t.lead_id}`} style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                        {t.lead.full_name || t.lead.phone || "Lead"}
                      </Link>
                      {t.lead.phone && <span style={{ color: "#94a3b8" }}>{t.lead.phone}</span>}
                    </div>
                  )}
                </div>

                {/* due date */}
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 88 }}>
                  {t.scheduled_at ? (
                    <>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: overdue ? "#dc2626" : "#475569", fontVariantNumeric: "tabular-nums" }}>
                        {new Date(t.scheduled_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </div>
                      <div style={{ fontSize: 11, color: overdue ? "#dc2626" : "#94a3b8", fontWeight: 600 }}>
                        {overdue ? "OVERDUE" : new Date(t.scheduled_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>No due date</div>
                  )}
                </div>

                {/* assignee */}
                {!isMemberRole && (
                  <select value={t.assigned_to ?? ""} aria-label="Assign to employee"
                    onChange={(e) => setTaskField(t.id, { assigned_to: e.target.value || null })}
                    style={{ ...control, flex: "0 0 150px", minHeight: 36, fontSize: 12.5, color: "#475569" }}>
                    <option value="">Unassigned</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {analytics && (analytics.byAssignee.length > 0 || analytics.trend30d.some((d) => d.created > 0)) && (
        <div style={{ marginTop: 22 }}>
          <div style={{ ...statLabel, marginBottom: 10 }}>Analytics — last 90 days</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            {/* Workload by employee */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Workload by employee</div>
              {analytics.byAssignee.map((a) => {
                const max = Math.max(...analytics.byAssignee.map((x) => x.open + x.completed), 1);
                const w = Math.round(((a.open + a.completed) / max) * 100);
                return (
                  <div key={a.name} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: "#0f172a", fontWeight: 600 }}>{a.name}</span>
                      <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{a.open} open · {a.completed} done</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${w}%`, borderRadius: 99, background: "linear-gradient(90deg,#2563eb,#60a5fa)", transition: "width 300ms" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* By type */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Tasks by type</div>
              {analytics.byType.map((t) => {
                const max = Math.max(...analytics.byType.map((x) => x.total), 1);
                const w = Math.round((t.total / max) * 100);
                return (
                  <div key={t.type} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: "#0f172a", fontWeight: 600 }}>{iconFor(taskTypes, t.type)} {labelFor(taskTypes, t.type)}</span>
                      <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{t.total} ({t.open} open)</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${w}%`, borderRadius: 99, background: "linear-gradient(90deg,#0f172a,#64748b)", transition: "width 300ms" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Source split + trend */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Where tasks come from</div>
              {analytics.bySource.map((s) => {
                const pct = analytics.bySource.reduce((acc, x) => acc + x.total, 0) > 0 ? Math.round((s.total / analytics.bySource.reduce((acc, x) => acc + x.total, 0)) * 100) : 0;
                const b = SOURCE_BADGE[s.source] ?? SOURCE_BADGE.manual;
                return (
                  <div key={s.source} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: b.color }}><span style={{ background: b.bg, padding: "2px 8px", borderRadius: 99 }}>{b.label}</span></span>
                      <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: "linear-gradient(90deg,#d97706,#fbbf24)", transition: "width 300ms" }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Created vs completed — 30 days</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 44 }}>
                  {analytics.trend30d.map((d) => {
                    const max = Math.max(...analytics.trend30d.map((x) => Math.max(x.created, x.completed)), 1);
                    return (
                      <div key={d.date} title={`${d.date}: ${d.created} created, ${d.completed} completed`}
                        style={{ flex: 1, display: "flex", gap: 1, alignItems: "flex-end", height: "100%" }}>
                        <div style={{ flex: 1, height: `${(d.created / max) * 100}%`, minHeight: d.created ? 3 : 0, background: "#93c5fd", borderRadius: 2 }} />
                        <div style={{ flex: 1, height: `${(d.completed / max) * 100}%`, minHeight: d.completed ? 3 : 0, background: "#16a34a", borderRadius: 2 }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10.5, color: "#94a3b8" }}>
                  <span><span style={{ color: "#93c5fd" }}>■</span> created</span>
                  <span><span style={{ color: "#16a34a" }}>■</span> completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setCreating(false); }}>
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: 22, boxShadow: "0 20px 60px rgba(15,23,42,0.25)" }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 14 }}>New task</div>

            <div style={{ marginBottom: 12 }}>
              <div style={statLabel}>Lead *</div>
              {cLead ? (
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{cLead.full_name || cLead.phone}</span>
                  {cLead.phone && <span style={{ fontSize: 12, color: "#94a3b8" }}>{cLead.phone}</span>}
                  <button onClick={() => { setCLead(null); setCLeadQuery(""); }} style={{ marginLeft: "auto", border: "none", background: "#f1f5f9", borderRadius: 8, minHeight: 30, padding: "0 10px", cursor: "pointer", fontSize: 12 }}>Change</button>
                </div>
              ) : (
                <>
                  <input value={cLeadQuery} onChange={(e) => { setCLeadQuery(e.target.value); searchLeads(e.target.value); }}
                    placeholder="Search lead by name or phone…" style={{ ...control, width: "100%", marginTop: 6 }} />
                  {cLeadResults.length > 0 && (
                    <div style={{ marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                      {cLeadResults.map((l) => (
                        <button key={l.id} onClick={() => { setCLead(l); setCLeadResults([]); }}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "white", cursor: "pointer", fontSize: 13.5, borderBottom: "1px solid #f1f5f9" }}
                          onPointerEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                          onPointerLeave={(e) => (e.currentTarget.style.background = "white)")}>
                          <span style={{ fontWeight: 600 }}>{l.full_name || "Lead"}</span>
                          {l.phone && <span style={{ color: "#94a3b8", marginLeft: 8 }}>{l.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={statLabel}>Title *</div>
              <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="e.g. Call back about pricing"
                style={{ ...control, width: "100%", marginTop: 6 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={statLabel}>Type</div>
                <select value={cType} onChange={(e) => setCType(e.target.value)} style={{ ...control, width: "100%", marginTop: 6 }}>
                  {taskTypes.map((t) => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <div style={statLabel}>Priority</div>
                <select value={cPriority} onChange={(e) => setCPriority(e.target.value)} style={{ ...control, width: "100%", marginTop: 6 }}>
                  <option value="low">Low</option><option value="medium">Medium</option>
                  <option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <div style={statLabel}>Assign to</div>
                <select value={tab === "mine" ? (memberId ?? "") : cAssignee} disabled={tab === "mine"}
                  onChange={(e) => setCAssignee(e.target.value)} style={{ ...control, width: "100%", marginTop: 6 }}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <div style={statLabel}>Due</div>
                <input type="datetime-local" value={cDue} onChange={(e) => setCDue(e.target.value)}
                  style={{ ...control, width: "100%", marginTop: 6 }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setCreating(false)} style={{ minHeight: 40, padding: "0 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>Cancel</button>
              <button onClick={createTask} disabled={!cLead || !cTitle.trim() || cSaving}
                style={{ minHeight: 40, padding: "0 20px", borderRadius: 10, border: "none", background: !cLead || !cTitle.trim() || cSaving ? "#94a3b8" : "#0f172a", color: "white", cursor: !cLead || !cTitle.trim() || cSaving ? "not-allowed" : "pointer", fontSize: 13.5, fontWeight: 700 }}>
                {cSaving ? "Creating…" : "Create task"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
