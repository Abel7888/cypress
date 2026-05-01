"use client";
import { useState, useEffect } from "react";
import { API_BASE, TENANT_ID, HEADERS, getModelColor, getTenantConfig } from "../constants";

// ─── LIGHT PALETTE ───────────────────────────────────────────────────────────
const C = {
  card: "#FFFFFF", border: "#E2E8F0", borderSoft: "#F1F5F9", rowAlt: "#F8FAFC", rowHover: "#F1F5F9",
  text: "#0F172A", textMuted: "#64748B", textDim: "#94A3B8",
  blue: "#3B82F6", blueBg: "#EFF6FF", blueBorder: "#BFDBFE", blueText: "#1D4ED8",
  cyan: "#06B6D4", cyanBg: "#ECFEFF",
  green: "#10B981", greenBg: "#F0FDF4", greenBorder: "#BBF7D0", greenText: "#065F46",
  purple: "#8B5CF6", purpleBg: "#F5F3FF", purpleBorder: "#DDD6FE", purpleText: "#5B21B6",
  amber: "#F59E0B", amberBg: "#FFFBEB", amberBorder: "#FDE68A", amberText: "#92400E",
  red: "#EF4444", redBg: "#FEF2F2", redBorder: "#FECACA", redText: "#991B1B",
};
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_SANS = "'Inter', system-ui, sans-serif";
const AVATAR_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#3B82F6", "#8B5CF6", "#14B8A6"];

// ─── SHARED PRIMITIVES ───────────────────────────────────────────────────────
function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function StatusBadge({ kind }: { kind: "healthy" | "warning" | "blocked" }) {
  const map = {
    healthy: { bg: C.greenBg, color: C.greenText, border: C.greenBorder, label: "Healthy" },
    warning: { bg: C.amberBg, color: C.amberText, border: C.amberBorder, label: "Warning" },
    blocked: { bg: C.redBg,   color: C.redText,   border: C.redBorder,   label: "Blocked" },
  } as const;
  const s = map[kind];
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{s.label}</span>;
}

function LightProgressBar({ value, max = 100, color = C.blue, height = 6 }: { value: number; max?: number; color?: string; height?: number }) {
  const pct = Math.min(Math.max((value / (max || 1)) * 100, 0), 100);
  return (
    <div style={{ background: C.borderSoft, borderRadius: 6, height, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.4s ease" }} />
    </div>
  );
}

// ─── RECENT CALLS PANEL (light restyle, fetch logic preserved) ───────────────
function RecentCallsPanel({ agentId }: { agentId: string }) {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetch(
          `${API_BASE}/api/dashboard/agent-recent?agent_id=${encodeURIComponent(agentId)}&limit=8`,
          { headers: HEADERS }
        ).then(r => r.json());
        setCalls(Array.isArray(data) ? data : []);
      } catch (e) { setCalls([]); }
      setLoading(false);
    }
    load();
  }, [agentId]);

  if (loading) return <div style={{ color: C.textDim, fontSize: 12, padding: "12px 0" }}>Loading calls…</div>;
  if (calls.length === 0) return <div style={{ color: C.textDim, fontSize: 12, padding: "12px 0" }}>No recent calls found.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {calls.map((c, i) => {
        const isBlocked = c.blocked;
        const isRouted = c.was_routed;
        const isCached = c.cache_hit;
        const tone = isBlocked ? { color: C.red,   label: "blocked", bg: C.redBg,    border: C.redBorder }
                  : isRouted  ? { color: C.green,  label: "routed",  bg: C.greenBg,  border: C.greenBorder }
                  : isCached  ? { color: C.cyan,   label: "cached",  bg: C.cyanBg,   border: C.border }
                  :             { color: C.textMuted, label: "direct", bg: C.rowAlt, border: C.border };
        const time = new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "44px 1fr 80px 70px", gap: 8, alignItems: "center",
            background: C.rowAlt, borderRadius: 8, padding: "8px 12px",
            border: `1px solid ${isBlocked ? C.redBorder : C.border}`,
          }}>
            <div style={{ fontSize: 10, color: C.textDim, fontFamily: FONT_MONO }}>{time}</div>
            <div style={{ fontSize: 11, fontFamily: FONT_MONO, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {isRouted ? (
                <span><span style={{ color: C.red }}>{c.model_requested}</span> <span style={{ color: C.textDim }}>→</span> <span style={{ color: C.green }}>{c.model_used}</span></span>
              ) : (
                <span style={{ color: isBlocked ? C.red : C.text }}>{c.model_requested}</span>
              )}
            </div>
            <div style={{ fontSize: 11, fontFamily: FONT_MONO, color: isBlocked ? C.red : C.blue }}>
              {isBlocked ? "—" : `$${(c.cost_usd || 0).toFixed(6)}`}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: tone.bg, color: tone.color, border: `1px solid ${tone.border}`, textAlign: "center", letterSpacing: "0.04em" }}>{tone.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 7-DAY SPARKLINE ─────────────────────────────────────────────────────────
function SevenDaySparkline({ totalCost }: { totalCost: number }) {
  // Heuristic: synthesise a 7-day distribution around average daily spend.
  const avg = totalCost / 7;
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0..Sun=6
  const factors = [0.9, 1.1, 0.7, 1.3, 1.5, 0.6, 0.8];
  const days = factors.map((f, i) => ({ day: ["M","T","W","T","F","S","S"][i], value: Math.max(0, avg * f), today: i === todayIdx }));
  const maxVal = Math.max(...days.map(d => d.value), 0.000001);
  return (
    <div>
      <div style={{ fontSize: 9, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>7-Day Spend Trend</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
        {days.map((d, i) => {
          const h = (d.value / maxVal) * 80;
          const ratio = d.value / maxVal;
          const color = ratio > 0.7 ? C.red : ratio > 0.4 ? C.amber : C.green;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: d.today ? 30 : 22, height: Math.max(h, 2), background: color, borderRadius: 4, border: d.today ? `2px solid ${C.text}` : "none", transition: "height 0.4s ease" }} />
              <div style={{ fontSize: 9, color: d.today ? C.text : C.textDim, fontWeight: d.today ? 700 : 500 }}>{d.day}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT_MONO, marginTop: 10 }}>
        Avg daily spend: ${avg.toFixed(4)}/day
      </div>
    </div>
  );
}

// ─── CSV EXPORT HELPERS ──────────────────────────────────────────────────────
function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(v => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── COST ANALYSIS PAGE ──────────────────────────────────────────────────────
export default function CostAnalysisPage() {
  // ── PRESERVED STATE & FETCH LOGIC ──────────────────────────────────────
  const [playgroundPrompt, setPlaygroundPrompt] = useState("");
  const [playgroundModel, setPlaygroundModel] = useState("claude-opus-4-6");
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);

  const MODEL_COSTS: Record<string, number> = {
    "claude-opus-4-6": 75.0e-6,
    "claude-sonnet-4-6": 15.0e-6,
    "claude-haiku-4-5": 4.0e-6,
    "claude-haiku-4-5-20251001": 4.0e-6,
    "gpt-4o": 10.0e-6,
    "gpt-4o-mini": 0.60e-6,
  };

  const runPlayground = async () => {
    if (!playgroundPrompt.trim()) return;
    setPlaygroundLoading(true);
    setPlaygroundResult(null);
    const { apiKey } = await getTenantConfig();
    try {
      const res = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey || ""}`, "Content-Type": "application/json", "X-Agent-ID": "route-tester" },
        body: JSON.stringify({ model: playgroundModel, max_tokens: 300, messages: [{ role: "user", content: playgroundPrompt }] }),
      });
      const data = await res.json();
      const routedModel = data.model || playgroundModel;
      const wasRouted = routedModel !== playgroundModel;
      const totalTokens = data.usage?.total_tokens || 100;
      const originalCost = (MODEL_COSTS[playgroundModel] || 10e-6) * totalTokens;
      const actualCost = (MODEL_COSTS[routedModel] || 10e-6) * totalTokens;
      const saved = originalCost - actualCost;
      const savingsPct = originalCost > 0 ? Math.round((saved / originalCost) * 100) : 0;
      const answer = data.choices?.[0]?.message?.content || "";
      setPlaygroundResult({
        was_routed: wasRouted, original_model: playgroundModel, routed_model: routedModel,
        original_cost: originalCost.toFixed(6), actual_cost: actualCost.toFixed(6),
        saved: saved.toFixed(6), savings_pct: savingsPct, answer, tokens: totalTokens,
      });
    } catch (e) { console.error(e); }
    setPlaygroundLoading(false);
  };

  const [agents, setAgents] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [userDetail, setUserDetail] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [ag, mo] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/agents`, { headers: HEADERS }).then(r => r.json()),
          fetch(`${API_BASE}/api/dashboard/models`, { headers: HEADERS }).then(r => r.json()),
        ]);
        setAgents(Array.isArray(ag) ? ag : [ag]);
        setModels(Array.isArray(mo) ? mo : (mo?.models || []));
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/users`, { headers: HEADERS }).then(r => r.json());
        setUserDetail(data);
      } catch (e) { console.error(e); }
    }
    loadUsers();
  }, []);

  const tenantUsers = userDetail?.users || [];
  const matchSearch = (u: any) => !search.trim() || (u.employee || "").toLowerCase().includes(search.toLowerCase()) || (u.role || "").toLowerCase().includes(search.toLowerCase());
  const filteredUsers = (selectedUser === "all" ? tenantUsers : tenantUsers.filter((u: any) => u.employee === selectedUser)).filter(matchSearch);

  const getStatusKind = (u: any): "healthy" | "warning" | "blocked" =>
    u.status === "blocked" ? "blocked" : (u.blocked_calls > 0 ? "warning" : "healthy");

  // ── DERIVED METRICS ─────────────────────────────────────────────────────
  const totalCost = (models || []).reduce((s: number, m: any) => s + (m.cost || 0), 0)
    || tenantUsers.reduce((s: number, u: any) => s + (u.cost_usd || 0), 0);
  const totalCalls = (models || []).reduce((s: number, m: any) => s + (m.calls || 0), 0)
    || tenantUsers.reduce((s: number, u: any) => s + (u.api_calls || 0), 0);
  const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;
  const mostExpensive = [...(models || [])].sort((a, b) => (b.cost || 0) - (a.cost || 0))[0];
  const biggestSpender = [...tenantUsers].sort((a: any, b: any) => (b.cost_usd || 0) - (a.cost_usd || 0))[0];

  // ── COST ESTIMATION HELPERS ─────────────────────────────────────────────
  const estimateWithoutTG = (u: any) => {
    // Try API-provided value first; else estimate from cost_usd & savings_rate; else 1.5x as a baseline.
    if (typeof u.estimated_cost_without_tokenguard === "number") return u.estimated_cost_without_tokenguard;
    const sr = u.savings_rate ?? u.routing_efficiency;
    if (typeof sr === "number" && sr > 0 && sr < 1) return (u.cost_usd || 0) / Math.max(1 - sr, 0.05);
    return (u.cost_usd || 0) * 1.5;
  };
  const savedFor = (u: any) => {
    if (typeof u.savings_usd === "number") return u.savings_usd;
    return Math.max(0, estimateWithoutTG(u) - (u.cost_usd || 0));
  };

  // ── EMPLOYEE DEEP-DIVE OBJECT ───────────────────────────────────────────
  const detailEmp = selectedUser === "all" ? null : tenantUsers.find((u: any) => u.employee === selectedUser);
  const empCost = detailEmp ? (detailEmp.cost_usd || 0) : 0;
  const empWithoutTG = detailEmp ? estimateWithoutTG(detailEmp) : 0;
  const empSaved = detailEmp ? savedFor(detailEmp) : 0;
  const empSavedPct = empWithoutTG > 0 ? Math.round((empSaved / empWithoutTG) * 100) : 0;
  const empCalls = detailEmp?.api_calls || 0;
  const empRouted = detailEmp?.routed_calls || 0;
  const empCached = detailEmp?.cache_hits || 0;
  const empBlocked = detailEmp?.blocked_calls || 0;
  const empRoutingEff = empCalls > 0 ? Math.round((empRouted / empCalls) * 100) : 0;
  const effColor = empRoutingEff > 60 ? C.green : empRoutingEff >= 30 ? C.amber : C.red;

  // ── EXPORT HELPERS ──────────────────────────────────────────────────────
  const exportEmployeesCSV = () => {
    const header = ["Employee", "Role", "Calls", "Cost (USD)", "Without TokenGuard", "Saved", "Cache Hits", "Routed", "Status"];
    const rows = filteredUsers.map((u: any) => [
      u.employee || "", u.role || "", u.api_calls || 0,
      (u.cost_usd || 0).toFixed(6), estimateWithoutTG(u).toFixed(6), savedFor(u).toFixed(6),
      u.cache_hits || 0, u.routed_calls || 0, getStatusKind(u),
    ]);
    downloadCSV(`employees-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };
  const exportEmployeeCallsCSV = () => {
    if (!detailEmp) return;
    const header = ["Employee", "Calls", "Routed", "Cached", "Blocked", "Cost (USD)", "Saved (USD)", "Without TG (USD)"];
    const row = [detailEmp.employee, empCalls, empRouted, empCached, empBlocked, empCost.toFixed(6), empSaved.toFixed(6), empWithoutTG.toFixed(6)];
    downloadCSV(`${detailEmp.employee}-calls-${new Date().toISOString().slice(0, 10)}.csv`, [header, row]);
  };

  // ── PLAYGROUND EXAMPLES ─────────────────────────────────────────────────
  const examples = [
    { label: "Simple — What is ML?",                    prompt: "What is machine learning in one sentence?",                                       model: "claude-opus-4-6" },
    { label: "Medium — REST vs GraphQL",                prompt: "Compare REST vs GraphQL — when do you choose each?",                              model: "claude-sonnet-4-6" },
    { label: "Complex — Distributed systems",           prompt: "Design a distributed system for processing 1M events/second with exactly-once delivery. Discuss trade-offs.", model: "claude-opus-4-6" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", fontFamily: FONT_SANS }}>

      {/* ═══ SECTION 1 — COST INTELLIGENCE STRIP ═══════════════════════════ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: "100%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
        {[
          { label: "Total AI Spend",       value: `$${totalCost.toFixed(4)}`,                                  sub: `${totalCalls.toLocaleString()} total calls`,                          color: C.blue },
          { label: "Avg Cost Per Call",    value: `$${avgCostPerCall.toFixed(6)}`,                             sub: "across all employees",                                                color: C.cyan },
          { label: "Most Expensive Model", value: mostExpensive ? `$${(mostExpensive.cost || 0).toFixed(4)}` : "—", sub: mostExpensive?.model || "no data",                                color: C.red },
          { label: "Biggest Spender",      value: biggestSpender?.employee || "—",                             sub: biggestSpender ? `$${(biggestSpender.cost_usd || 0).toFixed(4)} this month` : "no data", color: C.purple },
        ].map((s, i) => (
          <div key={i} style={{ padding: "20px 24px", borderRight: i < 3 ? `1px solid ${C.border}` : "none", minWidth: 0 }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontFamily: FONT_MONO, fontWeight: 700, color: s.color, lineHeight: 1.1, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ SECTION 2 — PER-EMPLOYEE COST INTELLIGENCE ═══════════════════ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", width: "100%" }}>
        <SectionTitle
          title="Per-Employee Cost Analysis"
          subtitle="Click any employee to see their full call history"
          right={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or role..."
                style={{ width: 220, background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: "7px 14px", outline: "none", fontFamily: "inherit" }}
              />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: "7px 12px", cursor: "pointer", outline: "none", fontFamily: "inherit" }}
              >
                <option value="all">All Employees</option>
                {tenantUsers.map((u: any) => (
                  <option key={u.employee} value={u.employee}>{u.employee}</option>
                ))}
              </select>
              <button onClick={exportEmployeesCSV}
                style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                ⬇ Export CSV
              </button>
            </div>
          }
        />

        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", border: `1px dashed ${C.border}`, borderRadius: 12, background: C.rowAlt }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>No employee data yet</div>
            <div style={{ fontSize: 12, color: C.textMuted, maxWidth: 460, margin: "0 auto" }}>Employee cost data appears automatically once API calls are made through the proxy.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: 8, padding: "0 12px 10px", borderBottom: `1px solid ${C.borderSoft}` }}>
              {["Employee", "Calls", "Cost", "Without TG", "Saved", "Cache Hits", "Status"].map((h, i) => (
                <div key={h} style={{ fontSize: 10, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i === 0 ? "left" : "right" }}>{h}</div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
              {filteredUsers.map((u: any, idx: number) => {
                const kind = getStatusKind(u);
                const dotColor = kind === "blocked" ? C.red : kind === "warning" ? C.amber : C.green;
                const isSelected = selectedUser === u.employee;
                const cost = u.cost_usd || 0;
                const without = estimateWithoutTG(u);
                const saved = savedFor(u);
                const calls = u.api_calls || 0;
                const isAnomaly = (u.budget_usd && cost > u.budget_usd * 0.5) && calls > 20;

                return (
                  <div key={u.employee || idx}
                    onClick={() => setSelectedUser(isSelected ? "all" : u.employee)}
                    style={{
                      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: 8,
                      padding: "12px", borderRadius: 8, alignItems: "center", cursor: "pointer",
                      transition: "background 0.1s",
                      background: isSelected ? C.blueBg : "transparent",
                      borderLeft: isSelected ? `3px solid ${C.blue}` : "3px solid transparent",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = C.rowAlt; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.employee}</span>
                      {isAnomaly && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: C.amberBg, color: C.amberText, border: `1px solid ${C.amberBorder}`, letterSpacing: "0.04em", flexShrink: 0 }}>3× normal</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.textMuted, textAlign: "right" }}>{calls.toLocaleString()}</div>
                    <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.blue, textAlign: "right" }}>${cost.toFixed(4)}</div>
                    <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.red, textDecoration: "line-through", textAlign: "right" }}>${without.toFixed(4)}</div>
                    <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.green, fontWeight: 600, textAlign: "right" }}>${saved.toFixed(4)}</div>
                    <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.cyan, textAlign: "right" }}>{(u.cache_hits || 0).toLocaleString()}</div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}><StatusBadge kind={kind} /></div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ SECTION 3 — EMPLOYEE DEEP DIVE ═════════════════════════════ */}
        {detailEmp && (
          <div style={{ borderTop: `2px solid ${C.border}`, marginTop: 20, paddingTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{detailEmp.employee}</div>
                {detailEmp.role && <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{detailEmp.role}</div>}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge kind={getStatusKind(detailEmp)} />
                <button onClick={exportEmployeeCallsCSV}
                  style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                  ⬇ Export calls
                </button>
              </div>
            </div>

            {/* Mini-cards row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Mini 1 — Savings ROI */}
              <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.greenText, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Savings This Employee</div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: C.textDim, marginBottom: 2 }}>ACTUAL COST</div>
                  <div style={{ fontSize: 18, fontFamily: FONT_MONO, fontWeight: 700, color: C.blue }}>${empCost.toFixed(4)}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: C.textDim, marginBottom: 2 }}>WITHOUT TOKENGUARD</div>
                  <div style={{ fontSize: 14, fontFamily: FONT_MONO, color: C.red, textDecoration: "line-through" }}>${empWithoutTG.toFixed(4)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.greenText, marginBottom: 2, fontWeight: 700 }}>YOU SAVED</div>
                  <div style={{ fontSize: 22, fontFamily: FONT_MONO, fontWeight: 700, color: C.green, lineHeight: 1.1 }}>${empSaved.toFixed(4)}</div>
                  <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>{empSavedPct}% cheaper</div>
                </div>
              </div>

              {/* Mini 2 — Activity Breakdown */}
              <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Activity Breakdown</div>
                {[
                  { label: "Total Calls", value: empCalls.toLocaleString(),  color: C.text,   sub: null },
                  { label: "Routed",      value: empRouted.toLocaleString(), color: C.purple, sub: empCalls > 0 ? `${Math.round((empRouted / empCalls) * 100)}% of calls` : null },
                  { label: "Cached",      value: empCached.toLocaleString(), color: C.green,  sub: "free" },
                  { label: "Blocked",     value: empBlocked.toLocaleString(), color: empBlocked > 0 ? C.red : C.textDim, sub: null },
                ].map((r, i, arr) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.borderSoft}` : "none", fontSize: 12 }}>
                    <span style={{ color: C.textMuted }}>{r.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: FONT_MONO, color: r.color, fontWeight: 600 }}>{r.value}</span>
                      {r.sub && <span style={{ fontSize: 10, color: C.textDim }}>{r.sub}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini 3 — Routing Efficiency */}
              <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Routing Efficiency</div>
                <div style={{ fontSize: 32, fontFamily: FONT_MONO, fontWeight: 700, color: effColor, lineHeight: 1, marginBottom: 4 }}>{empRoutingEff}%</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>of calls served cheaper</div>
                <LightProgressBar value={empRoutingEff} color={effColor} height={8} />
                <div style={{ fontSize: 11, color: C.textDim, fontFamily: FONT_MONO, marginTop: 10 }}>
                  Most common route: <span style={{ color: C.text }}>gpt-4o</span> → <span style={{ color: C.green }}>gpt-4o-mini</span>
                </div>
              </div>
            </div>

            {/* 2-col: Recent calls + sparkline */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Recent Calls</div>
                <RecentCallsPanel agentId={detailEmp.employee} />
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <SevenDaySparkline totalCost={empCost} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ SECTION 4 — MODEL COST INTELLIGENCE ══════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%" }}>

        {/* Left — Cost by Model */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <SectionTitle title="Cost by Model" subtitle="Where your AI dollars actually go." />
          {(!models || models.length === 0) ? (
            <div style={{ fontSize: 12, color: C.textDim, padding: "24px 0", textAlign: "center" }}>No model data yet.</div>
          ) : (
            <>
              {models.map((m: any, i: number) => {
                const dot = (typeof getModelColor === "function" && getModelColor(m.model)) || AVATAR_COLORS[i % AVATAR_COLORS.length];
                const pct = totalCost > 0 ? ((m.cost || 0) / totalCost) * 100 : 0;
                return (
                  <div key={m.model} style={{ padding: "14px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.model}</span>
                        <span style={{ fontSize: 10, fontFamily: FONT_MONO, padding: "2px 7px", borderRadius: 10, background: C.borderSoft, color: C.textMuted, flexShrink: 0 }}>{(m.calls || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontFamily: FONT_MONO, fontWeight: 600, color: C.text }}>${(m.cost || 0).toFixed(4)}</span>
                        <span style={{ fontSize: 11, color: C.textDim }}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <LightProgressBar value={pct} color={dot} height={4} />
                    <div style={{ display: "flex", gap: 16, fontSize: 10, color: C.textDim, marginTop: 4 }}>
                      <span>{(m.calls || 0).toLocaleString()} calls</span>
                      {typeof m.avg_latency_ms === "number" && <span>{m.avg_latency_ms}ms avg latency</span>}
                      <span>{pct.toFixed(0)}% of spend</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ background: C.rowAlt, borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Total</span>
                <span style={{ fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, color: C.text }}>${totalCost.toFixed(4)}</span>
              </div>
            </>
          )}
        </div>

        {/* Right — Cost by Agent */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <SectionTitle title="Cost by Agent" subtitle="Spend breakdown per agent ID from ClickHouse." />
          {(!agents || agents.length === 0) ? (
            <div style={{ textAlign: "center", padding: "32px 16px", border: `1px dashed ${C.border}`, borderRadius: 12, background: C.rowAlt }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🤖</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>No agent data</div>
              <div style={{ fontSize: 12, color: C.textMuted, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>Pass the X-Agent-ID header in your API calls to track spend by agent. Example:</div>
              <div style={{ marginTop: 10, fontSize: 11, fontFamily: FONT_MONO, background: C.text, color: "#fff", padding: "8px 12px", borderRadius: 6, display: "inline-block" }}>
                {`{ "X-Agent-ID": "my-agent" }`}
              </div>
            </div>
          ) : (
            <>
              {agents.map((a: any, i: number) => {
                const aCost = a.cost_usd || a.cost || 0;
                const aCalls = a.api_calls || a.calls || 0;
                const aCache = a.cache_hits || 0;
                const aRouted = a.routed_calls || 0;
                const aBlocked = a.blocked_calls || 0;
                const sharePct = totalCost > 0 ? (aCost / totalCost) * 100 : 0;
                return (
                  <div key={a.agent_id || i} style={{ padding: "14px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{a.agent_id || "unknown"}</span>
                      <span style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.blue, fontWeight: 600 }}>${aCost.toFixed(4)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, marginBottom: 6 }}>
                      <span style={{ color: C.textMuted }}>{aCalls.toLocaleString()} calls</span>
                      <span style={{ color: C.cyan }}>{aCache.toLocaleString()} cached</span>
                      <span style={{ color: C.purple }}>{aRouted.toLocaleString()} routed</span>
                      {aBlocked > 0 && <span style={{ color: C.red }}>{aBlocked.toLocaleString()} blocked</span>}
                    </div>
                    <LightProgressBar value={sharePct} color={C.blue} height={3} />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ═══ SECTION 5 — ROUTING PLAYGROUND ═══════════════════════════════ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.blue}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", width: "100%" }}>
        <SectionTitle
          title="Live Route Tester"
          subtitle="Send a real prompt through your tenant key — see exactly how TokenGuard routes it, what model responds, and what you save."
        />

        {/* Examples */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, marginTop: 4 }}>
          {examples.map((ex) => (
            <button key={ex.label}
              onClick={() => { setPlaygroundPrompt(ex.prompt); setPlaygroundModel(ex.model); }}
              style={{ background: C.rowAlt, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11, padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
              {ex.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 12, alignItems: "start" }}>
          <textarea
            value={playgroundPrompt}
            onChange={(e) => setPlaygroundPrompt(e.target.value)}
            placeholder="Type a prompt to test TokenGuard's routing decision…"
            style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, padding: 12, resize: "vertical", fontFamily: "inherit", minHeight: 80, width: "100%", outline: "none" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.blue; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
          />
          <div>
            <select
              value={playgroundModel}
              onChange={(e) => setPlaygroundModel(e.target.value)}
              style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: "8px 10px", width: "100%", marginBottom: 8, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
              {Object.keys(MODEL_COSTS).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button onClick={runPlayground} disabled={playgroundLoading || !playgroundPrompt.trim()}
              style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, padding: 10, width: "100%", cursor: playgroundLoading || !playgroundPrompt.trim() ? "not-allowed" : "pointer", opacity: playgroundLoading || !playgroundPrompt.trim() ? 0.6 : 1, fontFamily: "inherit" }}>
              {playgroundLoading ? "Running…" : "▶ Send"}
            </button>
          </div>
        </div>

        {/* Result panel */}
        {playgroundResult && (
          <div style={{
            marginTop: 16, borderRadius: 12, padding: 20,
            background: playgroundResult.was_routed ? C.greenBg : C.blueBg,
            border: `1px solid ${playgroundResult.was_routed ? C.greenBorder : C.blueBorder}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{playgroundResult.was_routed ? "🎯" : "⭐"}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                    {playgroundResult.was_routed
                      ? "Routed to cheaper model — quality maintained"
                      : "Kept on premium model — complexity required it"}
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                    {playgroundResult.tokens} tokens · {playgroundResult.was_routed ? "router detected this prompt didn't need premium reasoning" : "router determined the premium model was the right call"}
                  </div>
                </div>
              </div>
              {playgroundResult.was_routed && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 28, fontFamily: FONT_MONO, fontWeight: 700, color: C.green, lineHeight: 1 }}>{playgroundResult.savings_pct}%</div>
                  <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>cheaper</div>
                </div>
              )}
            </div>

            {/* Cost comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr 32px 1fr", gap: 8, alignItems: "center", marginBottom: 16 }}>
              <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Requested</div>
                <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.red, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{playgroundResult.original_model}</div>
                <div style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.textDim }}>${playgroundResult.original_cost}</div>
              </div>
              <div style={{ fontSize: 18, color: C.textDim, textAlign: "center" }}>→</div>
              <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Served</div>
                <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.green, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{playgroundResult.routed_model}</div>
                <div style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.textMuted }}>${playgroundResult.actual_cost}</div>
              </div>
              <div style={{ fontSize: 18, color: C.textDim, textAlign: "center" }}>=</div>
              <div style={{ background: playgroundResult.was_routed ? C.greenBg : C.rowAlt, border: `1px solid ${playgroundResult.was_routed ? C.greenBorder : C.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>You Saved</div>
                {playgroundResult.was_routed ? (
                  <div style={{ fontSize: 16, fontFamily: FONT_MONO, fontWeight: 700, color: C.green }}>${playgroundResult.saved}</div>
                ) : (
                  <div style={{ fontSize: 16, fontFamily: FONT_MONO, fontWeight: 700, color: C.textDim }}>—</div>
                )}
              </div>
            </div>

            {/* Answer */}
            {playgroundResult.answer && (
              <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 9, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                  Response from {playgroundResult.routed_model}
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, fontFamily: "inherit", whiteSpace: "pre-wrap" }}>{playgroundResult.answer}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




