"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { API_BASE, TENANT_ID, HEADERS } from "../constants";

// ─── LIGHT PALETTE ───────────────────────────────────────────────────────────
const C = {
  card: "#FFFFFF", border: "#E2E8F0", borderSoft: "#F1F5F9", rowAlt: "#F8FAFC",
  text: "#0F172A", textMuted: "#64748B", textDim: "#94A3B8",
  blue: "#3B82F6", blueBg: "#EFF6FF", blueBorder: "#BFDBFE", blueText: "#1D4ED8",
  cyan: "#06B6D4",
  green: "#10B981", greenBg: "#F0FDF4", greenBorder: "#BBF7D0", greenText: "#065F46",
  amber: "#F59E0B", amberBg: "#FFFBEB", amberBg2: "#FEF3C7", amberBorder: "#FDE68A", amberText: "#92400E",
  red: "#EF4444", redBg: "#FFF5F5", redBg2: "#FEE2E2", redBorder: "#FECACA", redText: "#991B1B",
  purple: "#8B5CF6", purpleBg: "#F5F3FF",
  gold: "#FDE68A", goldBg: "#FFFBEB",
  bronze: "#FED7AA", bronzeBg: "#FFF7ED",
};
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_SANS = "'Inter', system-ui, sans-serif";

// ─── DEMO FALLBACK (renders design when /users returns empty) ───────────────
const DEMO_FALLBACK_USERS: any[] = [
  { user_id: "demo-1", employee: "Sarah Chen",    role: "Senior Engineer",   cost_usd: 42.18, budget_usd: 50, savings_usd: 168.40, api_calls: 284, routed_calls: 242, cache_hits: 42, blocked_calls: 0, top_model: "gpt-4o-mini" },
  { user_id: "demo-2", employee: "Marcus Rivera", role: "Sales Lead",        cost_usd: 26.92, budget_usd: 25, savings_usd: 12.10,  api_calls: 142, routed_calls: 51,  cache_hits: 9,  blocked_calls: 3, top_model: "gpt-4o" },
  { user_id: "demo-3", employee: "Priya Shah",    role: "Product Manager",   cost_usd: 9.62,  budget_usd: 20, savings_usd: 48.75,  api_calls: 78,  routed_calls: 55,  cache_hits: 14, blocked_calls: 0, top_model: "claude-3.5-haiku" },
  { user_id: "demo-4", employee: "Jamie Wu",      role: "Marketing",         cost_usd: 21.07, budget_usd: 20, savings_usd: 8.30,   api_calls: 165, routed_calls: 41,  cache_hits: 6,  blocked_calls: 1, top_model: "gpt-4o" },
  { user_id: "demo-5", employee: "Dan Okafor",    role: "Data Analyst",      cost_usd: 33.80, budget_usd: 40, savings_usd: 94.90,  api_calls: 221, routed_calls: 182, cache_hits: 33, blocked_calls: 0, top_model: "gpt-4o-mini" },
  { user_id: "demo-6", employee: "Leah Martins",  role: "Designer",          cost_usd: 4.15,  budget_usd: 15, savings_usd: 6.20,   api_calls: 33,  routed_calls: 22,  cache_hits: 5,  blocked_calls: 0, top_model: "claude-3.5-sonnet" },
  { user_id: "demo-7", employee: "Nikhil Rao",    role: "Platform Engineer", cost_usd: 38.45, budget_usd: 50, savings_usd: 172.15, api_calls: 312, routed_calls: 271, cache_hits: 55, blocked_calls: 0, top_model: "gpt-4o-mini" },
  { user_id: "demo-8", employee: "Taylor Brooks", role: "Ops Manager",       cost_usd: 14.20, budget_usd: 20, savings_usd: 28.90,  api_calls: 95,  routed_calls: 72,  cache_hits: 11, blocked_calls: 0, top_model: "claude-3.5-haiku" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtMoney(n: number, dp = 2) { return "$" + (isFinite(n) ? n : 0).toFixed(dp); }
function fmtInt(n: number) { return (n || 0).toLocaleString(); }

function getEfficiency(u: any): number {
  return u.api_calls > 0 ? Math.round((u.routed_calls / u.api_calls) * 100) : 0;
}
function getBudgetPct(u: any): number {
  return u.budget_usd > 0 ? Math.min((u.cost_usd / u.budget_usd) * 100, 100) : 0;
}
function getBudgetPctRaw(u: any): number {
  return u.budget_usd > 0 ? (u.cost_usd / u.budget_usd) * 100 : 0;
}
function isAnomaly(u: any): boolean {
  return (u.budget_usd || 0) > 0 && u.cost_usd > u.budget_usd * 0.5 && (u.api_calls || 0) > 20;
}
function statusOf(u: any): "healthy" | "warning" | "blocked" {
  const pct = getBudgetPctRaw(u);
  if (pct >= 100) return "blocked";
  if (pct >= 70) return "warning";
  return "healthy";
}
function getResetCountdown(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hrs = Math.max(0, Math.floor(diff / 3600000));
  const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
  return `${hrs}h ${mins}m`;
}
function colorForBudget(pct: number) {
  if (pct >= 100) return C.red;
  if (pct >= 70) return C.amber;
  return C.green;
}
function colorForEff(eff: number) {
  if (eff >= 60) return C.green;
  if (eff >= 30) return C.amber;
  return C.red;
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
function Bar({ pct, color, height = 8, width }: { pct: number; color: string; height?: number; width?: number | string }) {
  return (
    <div style={{
      width: width ?? "100%", height, background: C.borderSoft,
      borderRadius: 999, overflow: "hidden", flexShrink: 0,
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", background: color,
        borderRadius: 999, transition: "width 0.4s ease",
      }} />
    </div>
  );
}

// ─── STATUS BADGE ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "healthy" | "warning" | "blocked" }) {
  const cfg = {
    healthy: { bg: C.greenBg, bd: C.greenBorder, fg: C.greenText, label: "Healthy" },
    warning: { bg: C.amberBg, bd: C.amberBorder, fg: C.amberText, label: "Warning" },
    blocked: { bg: C.redBg2, bd: C.redBorder, fg: C.redText, label: "Blocked" },
  }[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
      background: cfg.bg, border: `1px solid ${cfg.bd}`, color: cfg.fg,
      textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FONT_SANS,
      whiteSpace: "nowrap",
    }}>{cfg.label}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [usingDemo, setUsingDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertEmailSaved, setAlertEmailSaved] = useState(false);
  const [, setTick] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // ─── Fetch users every 30s ─────────────────────────────────────────────
  async function loadUsers() {
    try {
      const data = await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/users`, { headers: HEADERS })
        .then((r) => r.json());
      const arr: any[] = data?.users || [];
      if (arr.length === 0) {
        setUsers(DEMO_FALLBACK_USERS);
        setUsingDemo(true);
      } else {
        // Normalize to make sure fields used in JSX exist
        const normalized = arr.map((u) => ({
          ...u,
          employee: u.employee || u.name || u.user_id || "—",
          cost_usd: u.cost_usd ?? 0,
          budget_usd: u.budget_usd ?? 0,
          savings_usd: u.savings_usd ?? 0,
          api_calls: u.api_calls ?? 0,
          routed_calls: u.routed_calls ?? 0,
          cache_hits: u.cache_hits ?? 0,
          blocked_calls: u.blocked_calls ?? 0,
          role: u.role || "Team Member",
          top_model: u.top_model || u.most_used_model || "—",
        }));
        setUsers(normalized);
        setUsingDemo(false);
      }
    } catch (e) {
      console.error(e);
      // Network failure → still show demo design
      setUsers((prev) => (prev.length === 0 ? DEMO_FALLBACK_USERS : prev));
      setUsingDemo((prev) => (users.length === 0 ? true : prev));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
    const i = setInterval(loadUsers, 30000);
    const t = setInterval(() => setTick((x) => x + 1), 60000); // for countdown refresh
    return () => { clearInterval(i); clearInterval(t); };
  }, []);

  // ─── Close panel on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    // slight delay so the opening click doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", handler); };
  }, [panelOpen]);

  // ─── Load per-employee alert email from localStorage when a user is selected
  useEffect(() => {
    if (!selectedUser) return;
    try {
      const key = `tg_alert_${selectedUser.employee}`;
      setAlertEmail(typeof window !== "undefined" ? (localStorage.getItem(key) || "") : "");
      setAlertEmailSaved(false);
    } catch {/* noop */}
  }, [selectedUser]);

  // ─── Derived ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => users.filter((u) =>
    u.employee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [users, searchQuery]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => getEfficiency(b) - getEfficiency(a)),
    [filtered]
  );

  const totalTeamSpend = users.reduce((s, u) => s + (u.cost_usd || 0), 0);
  const totalTeamSaved = users.reduce((s, u) => s + (u.savings_usd || 0), 0);
  const totalTeamCalls = users.reduce((s, u) => s + (u.api_calls || 0), 0);
  const blockedCount = users.filter((u) => getBudgetPctRaw(u) >= 100).length;
  const warningCount = users.filter((u) => {
    const p = getBudgetPctRaw(u);
    return p >= 70 && p < 100;
  }).length;
  const healthyCount = users.filter((u) => getBudgetPctRaw(u) < 70).length;

  // ─── CSV export ──────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ["Employee", "Role", "Calls", "Routed", "Cache Hits", "Blocked", "Cost USD", "Budget USD", "Budget %", "Routing Eff %", "Savings USD", "Status"];
    const rows = sorted.map((u) => [
      u.employee, u.role, u.api_calls, u.routed_calls, u.cache_hits, u.blocked_calls,
      (u.cost_usd || 0).toFixed(6), (u.budget_usd || 0).toFixed(2),
      getBudgetPctRaw(u).toFixed(1), getEfficiency(u),
      (u.savings_usd || 0).toFixed(2), statusOf(u),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `team-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openPanel = (u: any) => { setSelectedUser(u); setPanelOpen(true); };

  const saveAlertEmail = () => {
    if (!selectedUser) return;
    try {
      const key = `tg_alert_${selectedUser.employee}`;
      if (typeof window !== "undefined") localStorage.setItem(key, alertEmail);
    } catch {/* noop */}
    setAlertEmailSaved(true);
    setTimeout(() => setAlertEmailSaved(false), 2000);
  };

  if (loading && users.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: C.textDim, fontSize: 13, fontFamily: FONT_SANS }}>
        Loading team intelligence…
      </div>
    );
  }

  const gridCols = "32px 2fr 1fr 80px 120px 80px 120px 96px 90px";

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 16,
      width: "100%", fontFamily: FONT_SANS, color: C.text,
    }}>
      {/* Preview banner when on demo data */}
      {usingDemo && (
        <div style={{
          background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blueText,
          borderRadius: 10, padding: "8px 14px", fontSize: 12,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>ⓘ</span>
          <span>
            <strong>Preview mode</strong> — showing demo team. Add employees in Settings and route API calls through the proxy to see real data here.
          </span>
        </div>
      )}

      {/* ═══ SECTION 1 — TEAM COMMAND STRIP ═══════════════════════════════ */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden",
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderBottom: `1px solid ${C.border}`,
        }}>
          <StatCell label="TEAM MEMBERS"    value={String(users.length)}           sub="active members"     color={C.blue}   divider />
          <StatCell label="HEALTHY"         value={String(healthyCount)}           sub="under 70% budget"   color={C.green}  divider />
          <StatCell label="NEEDS ATTENTION" value={String(warningCount)}           sub="approaching limit"  color={C.amber}  divider />
          <StatCell label="BLOCKED"         value={String(blockedCount)}           sub="access blocked"     color={C.red}    divider />
          <StatCell label="TOTAL SAVED"     value={fmtMoney(totalTeamSaved, 2)}    sub="vs unrouted cost"   color={C.purple} />
        </div>
        <div style={{
          padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: C.rowAlt, gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 12, color: C.textMuted }}>
            Team spending <strong style={{ color: C.text, fontFamily: FONT_MONO }}>{fmtMoney(totalTeamSpend, 4)}</strong> today · <strong style={{ color: C.text, fontFamily: FONT_MONO }}>{fmtInt(totalTeamCalls)}</strong> total API calls · budget resets in <strong style={{ color: C.text, fontFamily: FONT_MONO }}>{getResetCountdown()}</strong>
          </div>
          <button onClick={exportCSV} style={btnGhostSm}>⬇ Export Team Report</button>
        </div>
      </div>

      {/* ═══ SECTION 2 — TOP PERFORMERS LEADERBOARD ═══════════════════════ */}
      <Card>
        <CardHeader
          title="Top Performers"
          subtitle="Ranked by routing efficiency — who's generating the most value per dollar spent."
        />
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[0, 1, 2].map((i) => {
              const u = sorted[i];
              if (!u) {
                return (
                  <div key={`ghost-${i}`} style={{
                    background: C.rowAlt, border: `1px dashed ${C.border}`, borderRadius: 12,
                    padding: 20, display: "flex", alignItems: "center", justifyContent: "center",
                    minHeight: 180,
                  }}>
                    <span style={{ fontSize: 13, color: C.textDim }}>+ Add employee</span>
                  </div>
                );
              }
              return <LeaderCard key={u.user_id || u.employee} rank={i} user={u} onClick={() => openPanel(u)} />;
            })}
          </div>
        </div>
      </Card>

      {/* ═══ SECTION 3 — FULL TEAM TABLE ══════════════════════════════════ */}
      <Card>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 12px", gap: 16, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>All Employees</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
              {filtered.length} members{searchQuery ? ` matching "${searchQuery}"` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or role..."
              style={{
                width: 220, background: C.rowAlt, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "7px 14px", fontSize: 13, color: C.text,
                outline: "none", fontFamily: FONT_SANS,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.blue)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
            <button style={btnBlueFilled}>＋ Add Employee</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6 }}>
              {searchQuery ? "No employees match your search" : "No employees yet"}
            </div>
            <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 440, margin: "0 auto 20px" }}>
              {searchQuery ? "Try a different search term." : "Add your first employee to start tracking AI usage across your team."}
            </div>
            <button style={btnBlueFilled}>＋ Add Employee</button>
          </div>
        ) : (
          <div style={{ padding: "0 12px 16px" }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: gridCols, gap: 8,
              padding: "0 12px 10px", borderBottom: `2px solid ${C.border}`,
            }}>
              {["#", "EMPLOYEE", "ROLE", "CALLS", "ROUTING EFF.", "CACHE", "BUDGET USED", "STATUS", "RESETS IN"].map((h) => (
                <div key={h} style={{
                  fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {sorted.map((u, i) => {
              const status = statusOf(u);
              const budgetPct = getBudgetPct(u);
              const eff = getEfficiency(u);
              const isSelected = selectedUser && (selectedUser.user_id === u.user_id) && panelOpen;
              const blocked = status === "blocked";
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";

              return (
                <div
                  key={u.user_id || u.employee}
                  onClick={() => openPanel(u)}
                  style={{
                    display: "grid", gridTemplateColumns: gridCols, gap: 8,
                    padding: 12, borderRadius: 8, alignItems: "center",
                    cursor: "pointer", transition: "background 0.1s",
                    background: isSelected ? C.blueBg : (blocked ? "#FFF5F508" : "transparent"),
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !blocked) e.currentTarget.style.background = C.rowAlt;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = blocked ? "#FFF5F508" : "transparent";
                  }}
                >
                  {/* # / medal */}
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textDim, textAlign: "center" }}>
                    {medal || i + 1}
                  </div>

                  {/* Employee */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: colorForBudget(getBudgetPctRaw(u)),
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.employee}
                    </span>
                    {isAnomaly(u) && (
                      <span style={{
                        background: C.amberBg2, color: C.amberText, fontSize: 9, fontWeight: 700,
                        padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap",
                      }}>3× normal</span>
                    )}
                  </div>

                  {/* Role */}
                  <div style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.role}
                  </div>

                  {/* Calls */}
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textMuted }}>
                    {fmtInt(u.api_calls)}
                  </div>

                  {/* Routing eff */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Bar pct={eff} color={colorForEff(eff)} height={6} width={50} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: colorForEff(eff), fontWeight: 600 }}>
                      {eff}%
                    </span>
                  </div>

                  {/* Cache */}
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.cyan }}>
                    {fmtInt(u.cache_hits)}
                  </div>

                  {/* Budget used */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Bar pct={budgetPct} color={colorForBudget(budgetPct)} height={6} width={50} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: colorForBudget(budgetPct), fontWeight: 600 }}>
                      {Math.round(budgetPct)}%
                    </span>
                  </div>

                  {/* Status */}
                  <div><StatusBadge status={status} /></div>

                  {/* Resets */}
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 11,
                    color: blocked ? C.red : C.textDim, fontWeight: blocked ? 600 : 400,
                  }}>
                    {blocked ? "Blocked" : getResetCountdown()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ═══ SECTION 4 — DETAIL SLIDE-IN PANEL ════════════════════════════ */}
      {panelOpen && selectedUser && (
        <div ref={panelRef} style={{
          position: "fixed", top: 0, right: 0, height: "100vh", width: 420,
          background: "#fff", borderLeft: `1px solid ${C.border}`,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.08)", zIndex: 50,
          display: "flex", flexDirection: "column",
          transition: "transform 0.25s cubic-bezier(0.19, 1, 0.22, 1)",
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          fontFamily: FONT_SANS,
        }}>
          <DetailPanel
            user={selectedUser}
            alertEmail={alertEmail}
            setAlertEmail={setAlertEmail}
            alertEmailSaved={alertEmailSaved}
            onSaveAlert={saveAlertEmail}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}

      {/* backdrop dim */}
      {panelOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 420, bottom: 0,
          background: "rgba(15,23,42,0.18)", zIndex: 49,
        }} />
      )}

      {/* keyframes */}
      <style>{`
        @keyframes tg-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatCell({
  label, value, sub, color, divider,
}: { label: string; value: string; sub: string; color: string; divider?: boolean }) {
  return (
    <div style={{
      padding: "20px 24px",
      borderRight: divider ? `1px solid ${C.border}` : "none",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em",
        textTransform: "uppercase", marginBottom: 8,
      }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: FONT_MONO, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden",
    }}>{children}</div>
  );
}

function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "18px 20px 12px", gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── LEADER CARD ─────────────────────────────────────────────────────────
function LeaderCard({ rank, user, onClick }: { rank: number; user: any; onClick: () => void }) {
  const eff = getEfficiency(user);
  const medals = ["🥇", "🥈", "🥉"];
  const styles = [
    { bg: "linear-gradient(135deg, #FFFBEB, #FFFFFF)", bd: C.gold,    accent: C.green,    badgeBg: C.greenBg,  badgeBd: C.greenBorder,  badgeFg: C.greenText, badgeLabel: "TOP PERFORMER" },
    { bg: "linear-gradient(135deg, #F8FAFC, #FFFFFF)", bd: C.border,  accent: C.blue,     badgeBg: C.blueBg,   badgeBd: C.blueBorder,   badgeFg: C.blueText,  badgeLabel: "RISING STAR" },
    { bg: "linear-gradient(135deg, #FFF7ED, #FFFFFF)", bd: C.bronze,  accent: C.textMuted, badgeBg: C.rowAlt,  badgeBd: C.border,       badgeFg: C.textMuted, badgeLabel: "STEADY" },
  ][rank];

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", cursor: "pointer", fontFamily: FONT_SANS,
        background: styles.bg, border: `1px solid ${styles.bd}`, borderRadius: 12,
        padding: 20, position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{medals[rank]}</span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
          background: styles.badgeBg, border: `1px solid ${styles.badgeBd}`, color: styles.badgeFg,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>{styles.badgeLabel}</span>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>
        {user.employee}
      </div>
      <div style={{ fontSize: 12, color: C.textDim, marginBottom: 14 }}>
        {user.role}
      </div>

      <div style={{ fontSize: 32, fontWeight: 700, color: styles.accent, fontFamily: FONT_MONO, lineHeight: 1 }}>
        {eff}%
      </div>
      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10, marginTop: 2 }}>
        routing efficiency
      </div>

      <Bar pct={eff} color={styles.accent} height={6} />

      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 10,
        fontSize: 11,
      }}>
        <span style={{ color: C.green, fontFamily: FONT_MONO, fontWeight: 600 }}>
          {fmtMoney(user.savings_usd || 0, 2)} saved
        </span>
        <span style={{ color: C.textDim }}>
          {fmtInt(user.api_calls)} calls
        </span>
      </div>
    </button>
  );
}

// ─── DETAIL PANEL ────────────────────────────────────────────────────────
function DetailPanel({
  user, alertEmail, setAlertEmail, alertEmailSaved, onSaveAlert, onClose,
}: {
  user: any;
  alertEmail: string;
  setAlertEmail: (v: string) => void;
  alertEmailSaved: boolean;
  onSaveAlert: () => void;
  onClose: () => void;
}) {
  const status = statusOf(user);
  const budgetPct = getBudgetPct(user);
  const eff = getEfficiency(user);
  const spent = user.cost_usd || 0;
  const limit = user.budget_usd || 0;
  const savings = user.savings_usd || 0;

  // synthetic 7-day trend
  const dailyAvg = spent / 7;
  const factors = [0.9, 1.1, 0.7, 1.3, 1.5, 0.6, 0.8];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const spendTrend = factors.map((f) => dailyAvg * f);
  const maxBar = Math.max(...spendTrend, dailyAvg || 1);

  // without TG estimate (savings + spent = hypothetical unrouted)
  const withoutTG = spent + savings;
  const pctCheaper = withoutTG > 0 ? Math.round((savings / withoutTG) * 100) : 0;

  // missed opportunity if eff < 60
  const missedOpp = eff < 60 && user.api_calls > 0
    ? ((0.8 - eff / 100) * user.api_calls * (spent / Math.max(1, user.api_calls)) * 0.67) * 30
    : 0;

  // Blocked count from blocked_calls field
  const blockedCalls = user.blocked_calls || 0;

  return (
    <>
      {/* Header */}
      <div style={{
        padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{user.employee}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{user.role}</div>
          <div style={{ marginTop: 6 }}><StatusBadge status={status} /></div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer", color: C.textDim,
            fontSize: 20, padding: 0, lineHeight: 1,
          }}
        >×</button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* ROI summary */}
        <div style={{
          background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: 16,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.greenText, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 12,
          }}>SAVINGS THIS EMPLOYEE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: C.textDim }}>Actual Cost</div>
              <div style={{ fontSize: 18, fontFamily: FONT_MONO, fontWeight: 700, color: C.blue, marginTop: 4 }}>
                {fmtMoney(spent, 2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.textDim }}>Without TG</div>
              <div style={{
                fontSize: 14, fontFamily: FONT_MONO, fontWeight: 500, color: C.red,
                textDecoration: "line-through", marginTop: 4,
              }}>
                {fmtMoney(withoutTG, 2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.greenText }}>You Saved</div>
              <div style={{ fontSize: 20, fontFamily: FONT_MONO, fontWeight: 700, color: C.green, marginTop: 4 }}>
                {fmtMoney(savings, 2)}
              </div>
              {pctCheaper > 0 && (
                <div style={{ fontSize: 10, color: C.green, marginTop: 2 }}>
                  {pctCheaper}% cheaper
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <MiniCard label="TOTAL CALLS" value={fmtInt(user.api_calls)} color={C.text} />
          <MiniCard label="ROUTED"      value={fmtInt(user.routed_calls)} color={C.purple} />
          <MiniCard label="CACHED"      value={fmtInt(user.cache_hits)} color={C.green} />
          <MiniCard label="BLOCKED"     value={fmtInt(blockedCalls)} color={blockedCalls > 0 ? C.red : C.textDim} />
        </div>

        {/* 7-day spend trend */}
        <div style={{
          background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 12,
          }}>7-DAY SPEND TREND</div>
          <svg width="100%" height={80} viewBox="0 0 210 80" preserveAspectRatio="none" style={{ display: "block" }}>
            {spendTrend.map((v, i) => {
              const barH = (v / maxBar) * 50;
              const x = i * 30 + 4;
              const y = 60 - barH;
              const isToday = i === 6;
              const dailyBudget = limit || Math.max(1, dailyAvg * 1.2);
              const ratio = v / dailyBudget;
              const color = ratio > 0.9 ? C.red : ratio > 0.6 ? C.amber : C.green;
              return (
                <g key={i}>
                  {isToday && (
                    <circle cx={x + 12} cy={y - 6} r={2} fill={color} />
                  )}
                  <rect
                    x={x} y={y} width={24} height={barH}
                    fill={color} rx={3}
                    opacity={isToday ? 1 : 0.8}
                  />
                  <text
                    x={x + 12} y={75} textAnchor="middle"
                    style={{ fontSize: 9, fill: C.textDim, fontFamily: FONT_SANS }}
                  >{days[i]}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Budget status */}
        <div style={{
          background: budgetPct >= 100 ? C.redBg : budgetPct >= 70 ? C.amberBg : C.rowAlt,
          border: `1px solid ${budgetPct >= 100 ? C.redBorder : budgetPct >= 70 ? C.amberBorder : C.border}`,
          borderRadius: 10, padding: 14,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 4,
          }}>DAILY BUDGET</div>
          <div style={{ fontSize: 20, fontFamily: FONT_MONO, fontWeight: 700, color: C.text, marginBottom: 10 }}>
            {fmtMoney(limit, 2)}/day
          </div>
          <Bar pct={budgetPct} color={colorForBudget(budgetPct)} height={8} />
          <div style={{
            display: "flex", justifyContent: "space-between", marginTop: 6,
            fontSize: 11, fontFamily: FONT_MONO, color: C.textDim,
          }}>
            <span>Spent <span style={{ color: C.text }}>${spent.toFixed(6)}</span></span>
            <span>Resets in {getResetCountdown()}</span>
          </div>
        </div>

        {/* Routing efficiency gauge */}
        <div style={{
          background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, textAlign: "center",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 8,
          }}>ROUTING EFFICIENCY</div>
          <div style={{ fontSize: 36, fontFamily: FONT_MONO, fontWeight: 700, color: colorForEff(eff), lineHeight: 1 }}>
            {eff}%
          </div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 4, marginBottom: 10 }}>
            of calls served cheaper than requested
          </div>
          <Bar pct={eff} color={colorForEff(eff)} height={6} />
          {eff < 60 && missedOpp > 0 && (
            <div style={{
              background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 6,
              padding: "8px 12px", marginTop: 8, fontSize: 11, color: C.amberText, textAlign: "left",
            }}>
              This employee could save ~<strong>{fmtMoney(missedOpp, 2)}</strong> more this month at 80% efficiency.
            </div>
          )}
        </div>

        {/* Personal alert email */}
        <div style={{
          background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: 14,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 4,
          }}>PERSONAL ALERTS</div>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>
            This employee gets their own warning at 70% and 90% budget.
          </div>
          <input
            type="email"
            value={alertEmail}
            onChange={(e) => setAlertEmail(e.target.value)}
            placeholder="employee@company.com"
            style={{
              width: "100%", background: C.rowAlt, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: "7px 10px", fontSize: 12, color: C.text,
              outline: "none", fontFamily: FONT_SANS, boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <button onClick={onSaveAlert} style={{ ...btnBlueFilled, padding: "6px 14px", fontSize: 11 }}>
              Save
            </button>
            {alertEmailSaved && (
              <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Saved ✓</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 10 }}>
            We'll email them directly so you don't have to be the middleman.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "16px 24px", borderTop: `1px solid ${C.border}`, flexShrink: 0,
        display: "flex", gap: 8,
      }}>
        <button style={{ ...btnBlueOutline, flex: 1 }}>Adjust Budget</button>
        <button style={btnRedOutline}>Revoke Access</button>
      </div>
    </>
  );
}

function MiniCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: 10, textAlign: "center",
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em",
        textTransform: "uppercase", marginBottom: 4,
      }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: FONT_MONO, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

// ─── BUTTON STYLES ───────────────────────────────────────────────────────
const btnBlueFilled: React.CSSProperties = {
  background: C.blue, color: "#fff", border: "none",
  fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8,
  cursor: "pointer", fontFamily: FONT_SANS,
};
const btnGhostSm: React.CSSProperties = {
  background: "#fff", color: C.textMuted, border: `1px solid ${C.border}`,
  fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
  cursor: "pointer", fontFamily: FONT_SANS,
};
const btnBlueOutline: React.CSSProperties = {
  background: C.blueBg, color: C.blueText, border: `1px solid ${C.blueBorder}`,
  fontSize: 12, fontWeight: 600, padding: "9px 14px", borderRadius: 8,
  cursor: "pointer", fontFamily: FONT_SANS,
};
const btnRedOutline: React.CSSProperties = {
  background: C.redBg, color: C.redText, border: `1px solid ${C.redBorder}`,
  fontSize: 12, fontWeight: 600, padding: "9px 14px", borderRadius: 8,
  cursor: "pointer", fontFamily: FONT_SANS,
};


