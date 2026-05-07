"use client";
import { useState, useEffect, useMemo } from "react";
import { API_BASE, TENANT_ID, HEADERS, getTenantConfig } from "../constants";
import useTrialStatus from "@/hooks/useTrialStatus";

// ─── LIGHT PALETTE ───────────────────────────────────────────────────────────
const C = {
  card: "#FFFFFF", border: "#E2E8F0", borderSoft: "#F1F5F9", rowAlt: "#F8FAFC",
  text: "#0F172A", textMuted: "#64748B", textDim: "#94A3B8",
  blue: "#3B82F6", blueBg: "#EFF6FF", blueBorder: "#BFDBFE", blueText: "#1D4ED8",
  green: "#10B981", greenBg: "#F0FDF4", greenBorder: "#BBF7D0", greenText: "#065F46",
  amber: "#F59E0B", amberBg: "#FFFBEB", amberBg2: "#FEF3C7", amberBorder: "#FDE68A", amberText: "#92400E",
  red: "#EF4444", redBg: "#FFF5F5", redBg2: "#FEE2E2", redBorder: "#FECACA", redText: "#991B1B",
  purple: "#8B5CF6", purpleBg: "#F5F3FF",
};
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_SANS = "'Inter', system-ui, sans-serif";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
type U = {
  id?: string; key_id?: string; user_id?: string;
  name?: string; employee?: string; role?: string;
  cost_usd?: number; budget_usd?: number;
  api_calls?: number; routed_calls?: number; blocked?: boolean;
};

// ─── DEMO FALLBACK (renders the design when no live data is available) ──────
// Swapped in only when userBudgets is empty/undefined so every section is visible.
function pctOf(u: U) {
  const limit = u.budget_usd || 0;
  const spent = u.cost_usd || 0;
  return limit > 0 ? (spent / limit) * 100 : 0;
}
function statusOf(pct: number): "healthy" | "warning" | "blocked" {
  if (pct >= 100) return "blocked";
  if (pct >= 70) return "warning";
  return "healthy";
}
function nameOf(u: U) { return u.employee || u.name || u.user_id || "—"; }
function keyIdOf(u: U) { return u.id || u.key_id || u.user_id || ""; }

function fmtMoney(n: number, dp = 2) {
  if (!isFinite(n)) return "$0.00";
  return "$" + n.toFixed(dp);
}
function resetCountdown(): { hrs: number; mins: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hrs = Math.max(0, Math.floor(diff / 3600000));
  const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
  return { hrs, mins };
}
function colorForPct(pct: number) {
  if (pct >= 100) return C.red;
  if (pct >= 70) return C.amber;
  return C.green;
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
function Bar({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ width: "100%", height, background: C.borderSoft, borderRadius: 999, overflow: "hidden" }}>
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
      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
      background: cfg.bg, border: `1px solid ${cfg.bd}`, color: cfg.fg,
      textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FONT_SANS,
    }}>{cfg.label}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
type Props = { userBudgets?: U[]; setUserBudgets?: (u: U[]) => void; nav?: (page: string) => void };

export default function BudgetsPage({ userBudgets: propBudgets, setUserBudgets: propSet, nav }: Props) {
  const { isTrial, seatLimit } = useTrialStatus();
  const [trialSeatMsg, setTrialSeatMsg] = useState(false);
  // Local fallback if not provided via props (so the page works standalone too)
  const [localBudgets, setLocalBudgets] = useState<U[]>([]);
  const liveBudgets: U[] = propBudgets ?? localBudgets;
  const userBudgets: U[] = liveBudgets;
  const setUserBudgets = propSet ?? setLocalBudgets;

  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [dailyCap, setDailyCap] = useState<number | null>(null);
  const [monthlyCap, setMonthlyCap] = useState<number | null>(null);

  // ─── Fetch budgets (only if no props) ────────────────────────────────────
  useEffect(() => {
    if (propBudgets) { setLoaded(true); return; }
    const load = async () => {
      const { tenantId, apiKey } = await getTenantConfig();
      if (!tenantId) { setLoaded(true); return; }
      const authHeaders = { Authorization: `Bearer ${apiKey || ""}` };
      try {
        const usersRes = await fetch(`${API_BASE}/api/tenants/${tenantId}/users`, { headers: authHeaders });
        const d = await usersRes.json();
        setLocalBudgets(d.users || d || []);
        setLoaded(true);
      } catch { setLoaded(true); }
      try {
        const capsRes = await fetch(`${API_BASE}/api/tenants/${tenantId}/caps`, { headers: authHeaders });
        const capsData = await capsRes.json();
        if (capsData.daily_cap_usd != null) setDailyCap(Number(capsData.daily_cap_usd));
        if (capsData.monthly_cap_usd != null) setMonthlyCap(Number(capsData.monthly_cap_usd));
      } catch { /* noop */ }
    };
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, [propBudgets]);

  // 1s tick to keep "resets in" countdown live
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(i);
  }, []);

  // mark loaded when prop budgets arrive
  useEffect(() => { if (propBudgets) setLoaded(true); }, [propBudgets]);

  // ─── Reload helper after mutation ─────────────────────────────────────────
  const reload = async () => {
    const { tenantId, apiKey } = await getTenantConfig();
    if (!tenantId) return;
    const authHeaders = { Authorization: `Bearer ${apiKey || ""}` };
    try {
      const r = await fetch(`${API_BASE}/api/tenants/${tenantId}/users`, { headers: authHeaders });
      const d = await r.json();
      setUserBudgets(d.users || d || []);
    } catch { /* noop */ }
  };

  // ─── Mutation: update budget ──────────────────────────────────────────────
  const updateBudget = async (keyId: string, newLimit: number) => {
    if (!keyId || !isFinite(newLimit) || newLimit < 0) return;
    try {
      const { tenantId: utid } = await getTenantConfig();
    await fetch(`${API_BASE}/api/tenants/${utid}/keys/${keyId}/budget`, {
        method: "PATCH",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ budget_usd: newLimit }),
      });
      await reload();
    } catch { /* noop */ }
  };

  // ─── Mutation: reset budget for one user ─────────────────────────────────
  const resetBudget = async (keyId: string) => {
    if (!keyId) return;
    try {
      await fetch(`${API_BASE}/budget/reset`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ key_id: keyId }),
      });
      await reload();
      showToast("Budget reset");
    } catch { /* noop */ }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  // ─── Apply template ──────────────────────────────────────────────────────
  const applyTemplate = async () => {
    if (!selectedTemplate || selectedEmployees.size === 0) return;
    const amounts: Record<string, number> = { Engineering: 50, Marketing: 20, Executive: 9999 };
    const amt = amounts[selectedTemplate] ?? 0;
    const ids = Array.from(selectedEmployees);
    const { tenantId: applyTid } = await getTenantConfig();
    await Promise.all(ids.map((id) =>
      fetch(`${API_BASE}/api/tenants/${applyTid}/keys/${id}/budget`, {
        method: "PATCH",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ budget_usd: amt }),
      }).catch(() => null)
    ));
    setSelectedEmployees(new Set());
    setSelectedTemplate(null);
    await reload();
    showToast(`Applied ${selectedTemplate} preset to ${ids.length} ${ids.length === 1 ? "employee" : "employees"}`);
  };

  const resetAll = async () => {
    if (userBudgets.length === 0) return;
    await Promise.all(userBudgets.map((u) => {
      const id = keyIdOf(u);
      if (!id) return Promise.resolve();
      return fetch(`${API_BASE}/budget/reset`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ key_id: id }),
      }).catch(() => null);
    }));
    await reload();
    showToast("All budgets reset");
  };

  // ─── Derived metrics ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let healthy = 0, warning = 0, blocked = 0, todaySpend = 0;
    for (const u of userBudgets) {
      const pct = pctOf(u);
      const s = statusOf(pct);
      if (s === "healthy") healthy++;
      else if (s === "warning") warning++;
      else blocked++;
      todaySpend += u.cost_usd || 0;
    }
    return { healthy, warning, blocked, todaySpend };
  }, [userBudgets]);

  const accountTotals = useMemo(() => {
    const limit = userBudgets.reduce((s, u) => s + (u.budget_usd || 0), 0);
    const spent = userBudgets.reduce((s, u) => s + (u.cost_usd || 0), 0);
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    return { limit, spent, pct };
  }, [userBudgets]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 16,
      width: "100%", fontFamily: FONT_SANS, color: C.text,
    }}>
      {!loaded && (
        <div style={{
          background: C.borderSoft, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "10px 16px", fontSize: 12,
          display: "flex", alignItems: "center", gap: 10, color: C.textMuted,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.textDim, opacity: 0.5 }} />
          Loading budgets…
        </div>
      )}
      {/* ═══ HEADER ════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 0, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.12em",
            textTransform: "uppercase", marginBottom: 4,
          }}>
            BUDGETS · FINANCIAL COMMAND CENTER
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>
            Daily spend caps, forecasts &amp; controls
          </h1>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 11,
          color: C.textMuted, fontFamily: FONT_MONO,
        }}>
          <span style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: C.green, animation: "tg-pulse 2s ease-in-out infinite",
          }} />
          Live · resets at midnight UTC
        </div>
      </div>

      {/* ═══ SECTION 1 — BUDGET HEALTH COMMAND STRIP ══════════════════════ */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", overflow: "hidden",
      }}>
        <StatCell label="HEALTHY EMPLOYEES" value={String(stats.healthy)} sub="employees" color={C.green} divider />
        <StatCell label="APPROACHING LIMIT" value={String(stats.warning)} sub="need attention" color={C.amber} divider />
        <StatCell label="BLOCKED TODAY" value={String(stats.blocked)} sub="access blocked" color={C.red} divider />
        <StatCell label="TOTAL SPEND TODAY" value={fmtMoney(stats.todaySpend, 2)} sub="across team" color={C.blue} />
      </div>

      {/* ═══ SECTION 2 — EMPLOYEE BUDGETS ═════════════════════════════ */}
      {true && (
        <>
          <Card>
            <CardHeader
              title="Employee Budgets"
              subtitle="Daily spend caps · resets at midnight UTC"
              right={
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btnBlueFilled} onClick={() => {
                      if (isTrial && userBudgets.length >= seatLimit) {
                        setTrialSeatMsg(true);
                        setTimeout(() => setTrialSeatMsg(false), 4000);
                        return;
                      }
                      if (nav) { nav("settings"); } else { window.location.hash = "settings"; }
                    }}>
                      ＋ Add Employee
                    </button>
                    <button style={btnGhost} onClick={resetAll}>
                      Reset All
                    </button>
                  </div>
                  {trialSeatMsg && (
                    <div style={{
                      background: "#EEF3FB", border: "1px solid #2563EB", borderRadius: 8,
                      padding: "10px 14px", fontSize: 13, color: "#2563EB", marginTop: 8
                    }}>
                      🔒 Trial accounts are limited to 1 seat. <a href="/settings?tab=billing" style={{ color: "#2563EB", fontWeight: 600 }}>Upgrade to add your full team →</a>
                    </div>
                  )}
                </div>
              }
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px 20px" }}>
              {loaded && userBudgets.length === 0 && <EmptyCard />}
              {userBudgets.map((u) => {
                const pct = pctOf(u);
                const status = statusOf(pct);
                const id = keyIdOf(u);
                const limit = u.budget_usd || 0;
                const spent = u.cost_usd || 0;

                const cardStyle = {
                  border: `1px solid ${
                    status === "blocked" ? C.redBorder :
                    status === "warning" ? C.amberBorder : C.border
                  }`,
                  background:
                    status === "blocked" ? "#FFF5F508" :
                    status === "warning" ? "#FFFBEB08" : C.card,
                  borderRadius: 12, padding: 16,
                };

                const { hrs, mins } = resetCountdown();
                const isEditing = editingId === id;

                // burn-rate forecast
                const hoursElapsed = Math.max(new Date().getUTCHours(), 1);
                const burnRate = spent / hoursElapsed;
                const remaining = Math.max(0, limit - spent);
                const hoursRemaining = burnRate > 0 ? remaining / burnRate : 999;

                return (
                  <div key={id || nameOf(u)} style={cardStyle}>
                    {/* Row 1 — Identity + Status */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{nameOf(u)}</div>
                        {u.role && (
                          <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{u.role}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <StatusBadge status={status} />
                        {isEditing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT_MONO }}>$</span>
                            <input
                              type="number" min={0} step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { updateBudget(id, parseFloat(editValue)); setEditingId(null); }
                                if (e.key === "Escape") { setEditingId(null); }
                              }}
                              style={{
                                width: 80, fontSize: 12, fontFamily: FONT_MONO,
                                padding: "4px 8px", border: `1px solid ${C.blueBorder}`,
                                borderRadius: 6, color: C.text, background: "#fff", outline: "none",
                              }}
                            />
                            <button
                              onClick={() => { updateBudget(id, parseFloat(editValue)); setEditingId(null); }}
                              style={{ ...btnBlueFilled, padding: "4px 10px", fontSize: 11 }}
                            >Save</button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{ ...btnGhost, padding: "4px 10px", fontSize: 11 }}
                            >Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT_MONO }}>
                              {fmtMoney(limit, 2)}/day
                            </span>
                            <button
                              onClick={() => { setEditingId(id); setEditValue(String(limit || 50)); }}
                              title="Edit limit"
                              style={{
                                background: "transparent", border: "none", padding: 4,
                                color: C.textDim, cursor: "pointer", fontSize: 12, lineHeight: 1,
                              }}
                            >✎</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 2 — Progress + Numbers */}
                    <div style={{ marginTop: 12 }}>
                      <Bar pct={pct} color={colorForPct(pct)} />
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        marginTop: 6, fontSize: 11, color: C.textMuted,
                      }}>
                        <span>
                          Spent <span style={{ color: C.text, fontFamily: FONT_MONO, marginLeft: 4 }}>
                            ${spent.toFixed(6)}
                          </span>
                        </span>
                        <span style={{ color: colorForPct(pct), fontWeight: 600 }}>
                          {pct.toFixed(0)}% used
                        </span>
                        <span style={{ fontFamily: FONT_MONO, color: C.textDim }}>
                          Resets in {hrs}h {mins}m
                        </span>
                      </div>
                    </div>

                    {/* Row 3 — Action row (>=70%) */}
                    {pct >= 70 && (
                      <div style={{
                        marginTop: 10, background: C.amberBg, border: `1px solid ${C.amberBorder}`,
                        borderRadius: 8, padding: "10px 14px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      }}>
                        <span style={{ fontSize: 12, color: C.amberText }}>
                          {pct >= 100
                            ? <>⚠ Budget exhausted — <strong>access blocked</strong></>
                            : <>⚠ At current rate, budget exhausted in <strong>~{Math.max(1, Math.round(hoursRemaining))}h</strong></>}
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => { setEditingId(id); setEditValue(String((limit || 50) * 1.5)); }}
                            style={{
                              border: `1px solid ${C.blueBorder}`, color: C.blueText,
                              background: C.blueBg, fontSize: 12, padding: "5px 12px",
                              borderRadius: 6, cursor: "pointer", fontWeight: 600,
                            }}
                          >Increase Limit</button>
                          <button
                            onClick={() => resetBudget(id)}
                            style={{
                              border: `1px solid ${C.redBorder}`, color: C.redText,
                              background: C.redBg, fontSize: 12, padding: "5px 12px",
                              borderRadius: 6, cursor: "pointer", fontWeight: 600,
                            }}
                          >Reset Now</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ═══ SECTION 3 — BUDGET TEMPLATES ═════════════════════════════ */}
          <Card>
            <CardHeader
              title="Budget Templates"
              subtitle="One click to apply a spending preset to your entire team or selected members."
            />
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20,
              }}>
                <TemplateCard
                  title="Engineering" amount="$50 / day" amountColor={C.blue}
                  desc="Heavy AI usage · code generation · analysis"
                  tag="Recommended" tagColor="green"
                  selected={selectedTemplate === "Engineering"}
                  onClick={() => setSelectedTemplate(selectedTemplate === "Engineering" ? null : "Engineering")}
                />
                <TemplateCard
                  title="Marketing" amount="$20 / day" amountColor={C.purple}
                  desc="Moderate usage · copy writing · research"
                  selected={selectedTemplate === "Marketing"}
                  onClick={() => setSelectedTemplate(selectedTemplate === "Marketing" ? null : "Marketing")}
                />
                <TemplateCard
                  title="Executive" amount="Unlimited" amountColor={C.green}
                  desc="No spending cap · full model access"
                  selected={selectedTemplate === "Executive"}
                  onClick={() => setSelectedTemplate(selectedTemplate === "Executive" ? null : "Executive")}
                />
              </div>

              {/* Employee selector chips */}
              <div style={{
                fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: 8,
              }}>
                SELECT EMPLOYEES
              </div>
              <div style={{ position: "relative", minHeight: 120 }}>
                <div style={{ position: "absolute", inset: 0, zIndex: 10, borderRadius: 10, background: "rgba(10,20,50,0.85)", backdropFilter: "blur(3px)", border: "1px solid #1e3a6e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20 }}>
                  <div style={{ fontSize: 22 }}>🔒</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F0F4FF" }}>Department Budgeting</div>
                  <div style={{ fontSize: 11, color: "#6B7FA3", textAlign: "center", maxWidth: 220 }}>Group employees by department and apply budgets at scale. Available on Pro.</div>
                  <button onClick={() => alert("To upgrade to Pro, email us at support@cypressai.xyz")} style={{ marginTop: 4, background: "#4F8EF7", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, padding: "8px 20px", cursor: "pointer" }}>Upgrade to Pro</button>
                </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {userBudgets.map((u) => {
                  const id = keyIdOf(u);
                  const sel = selectedEmployees.has(id);
                  return (
                    <button
                      key={id || nameOf(u)}
                      onClick={() => {
                        const next = new Set(selectedEmployees);
                        if (sel) next.delete(id); else next.add(id);
                        setSelectedEmployees(next);
                      }}
                      style={{
                        background: sel ? C.blueBg : C.rowAlt,
                        border: `1px solid ${sel ? C.blueBorder : C.border}`,
                        color: sel ? C.blueText : C.textMuted,
                        fontWeight: sel ? 600 : 500,
                        fontSize: 12, padding: "6px 12px", borderRadius: 999,
                        cursor: "pointer", fontFamily: FONT_SANS,
                      }}
                    >{nameOf(u)}</button>
                  );
                })}
                {userBudgets.length > 1 && (
                  <button
                    onClick={() => {
                      if (selectedEmployees.size === userBudgets.length) setSelectedEmployees(new Set());
                      else setSelectedEmployees(new Set(userBudgets.map(keyIdOf)));
                    }}
                    style={{
                      background: "transparent", border: `1px dashed ${C.border}`,
                      color: C.textMuted, fontSize: 12, padding: "6px 12px", borderRadius: 999,
                      cursor: "pointer",
                    }}
                  >
                    {selectedEmployees.size === userBudgets.length ? "Clear all" : "Select all"}
                  </button>
                )}
              </div>
              </div>

              <button
                disabled={!selectedTemplate || selectedEmployees.size === 0}
                onClick={applyTemplate}
                style={{
                  ...btnBlueFilled,
                  padding: "10px 20px", fontSize: 13,
                  opacity: !selectedTemplate || selectedEmployees.size === 0 ? 0.5 : 1,
                  cursor: !selectedTemplate || selectedEmployees.size === 0 ? "not-allowed" : "pointer",
                }}
              >
                Apply to selected ({selectedEmployees.size} {selectedEmployees.size === 1 ? "employee" : "employees"})
              </button>
            </div>
          </Card>

          {/* ═══ SECTION 4 — SPEND FORECAST + SAVINGS OPPORTUNITY ═════════ */}
          <ForecastSection users={userBudgets} />

          {/* ═══ SECTION 5 — ACCOUNT BUDGET ═══════════════════════════════ */}
          <Card>
            <CardHeader
              title="Account Budget"
              subtitle="Overall spend enforcement across all employees."
            />
            <div style={{ padding: "0 20px 20px" }}>
              {accountTotals.limit === 0 && (
                <div style={{
                  background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8,
                  padding: "10px 14px", fontSize: 12, color: "#92400E", marginBottom: 12,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>⚠</span>
                  <span>No company budget set yet. Add employees and set their daily budgets — the account total updates automatically.</span>
                </div>
              )}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
              }}>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  Today&apos;s aggregate spend
                </div>
                <StatusBadge status={statusOf(accountTotals.pct)} />
              </div>
              <Bar pct={(dailyCap ? (userBudgets.reduce((s,u) => s+(u.cost_usd||0),0) / dailyCap) * 100 : 0) || 0} color={colorForPct(dailyCap ? (userBudgets.reduce((s,u) => s+(u.cost_usd||0),0) / dailyCap) * 100 : 0)} height={10} />
              <div style={{
                display: "flex", justifyContent: "space-between", marginTop: 8,
                fontSize: 12, fontFamily: FONT_MONO,
              }}>
                <span>
                  <span style={{ color: C.textMuted }}>Spent </span>
                  <span style={{ color: C.text, fontWeight: 600 }}>{fmtMoney(userBudgets.reduce((s, u) => s + (u.cost_usd || 0), 0), 4)}</span>
                </span>
                <span style={{ color: colorForPct(dailyCap ? (userBudgets.reduce((s,u) => s+(u.cost_usd||0),0) / dailyCap) * 100 : 0), fontWeight: 600 }}>
                  {(dailyCap ? (userBudgets.reduce((s,u) => s+(u.cost_usd||0),0) / dailyCap) * 100 : 0).toFixed(0)}% of team daily cap
                </span>
                <span>
                  <span style={{ color: C.textMuted }}>Limit </span>
                  <span style={{ color: C.text, fontWeight: 600 }}>{dailyCap != null ? `$${dailyCap.toFixed(2)}/day` : "No limit set"}</span>
                </span>
              </div>
              <div style={{
                marginTop: 10, padding: "10px 14px",
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 12, color: "#64748B" }}>Monthly cap (30 days)</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#0F172A" }}>
                  {monthlyCap != null ? `$${monthlyCap.toFixed(2)}` : "No limit set"}
                </span>
              </div>
              <div style={{ marginTop: 10 }}>
                <a
                  href="mailto:support@tokenguard.io?subject=Increase%20account%20budget"
                  style={{ color: C.blue, fontSize: 12, textDecoration: "none", fontWeight: 500 }}
                >Need more budget? Contact support →</a>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ═══ TOAST ═══════════════════════════════════════════════════════════ */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "#0F172A", color: "#fff", padding: "10px 20px",
          borderRadius: 8, fontSize: 13, zIndex: 1000,
          boxShadow: "0 8px 24px rgba(15,23,42,0.25)",
        }}>{toast}</div>
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
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: FONT_MONO, lineHeight: 1 }}>
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
        {subtitle && (
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}

function TemplateCard({
  title, amount, amountColor, desc, tag, tagColor, selected, onClick,
}: {
  title: string; amount: string; amountColor: string; desc: string;
  tag?: string; tagColor?: "green";
  selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", cursor: "pointer", fontFamily: FONT_SANS,
        background: selected ? C.blueBg : C.rowAlt,
        border: selected ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
        borderRadius: 12, padding: selected ? 17 : 18,
        transition: "border-color 0.15s, background 0.15s",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</div>
        {tag && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
            background: tagColor === "green" ? C.greenBg : C.blueBg,
            border: `1px solid ${tagColor === "green" ? C.greenBorder : C.blueBorder}`,
            color: tagColor === "green" ? C.greenText : C.blueText,
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>{tag}</span>
        )}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: amountColor, fontFamily: FONT_MONO, marginTop: 8,
      }}>{amount}</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, lineHeight: 1.4 }}>{desc}</div>
    </button>
  );
}

function EmptyCard() {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "60px 24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6 }}>
        No budget data yet
      </div>
      <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 460, margin: "0 auto" }}>
        Make your first API call through the proxy and employee budgets will appear here automatically.
      </div>
    </div>
  );
}

// ─── SECTION 4: FORECAST + SAVINGS ─────────────────────────────────────────
function ForecastSection({ users }: { users: U[] }) {
  const now = new Date();
  const hoursElapsed = Math.max(now.getUTCHours(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  const rows = users.map((u) => {
    const spent = u.cost_usd || 0;
    const limit = u.budget_usd || 0;
    const dailyBurnRate = (spent / hoursElapsed) * 24;
    const projected = spent + dailyBurnRate * daysRemaining;
    const monthlyLimit = limit * daysInMonth;
    let label: "On track" | "Watch closely" | "Will exceed" = "On track";
    let color = C.green;
    if (monthlyLimit > 0) {
      if (projected > monthlyLimit) { label = "Will exceed"; color = C.red; }
      else if (projected > monthlyLimit * 0.8) { label = "Watch closely"; color = C.amber; }
    }
    return { u, projected, monthlyLimit, label, color };
  });

  const totalProjected = rows.reduce((s, r) => s + r.projected, 0);
  const totalMonthlyLimit = rows.reduce((s, r) => s + r.monthlyLimit, 0);
  const totalColor = totalMonthlyLimit > 0
    ? (totalProjected > totalMonthlyLimit ? C.red : totalProjected > totalMonthlyLimit * 0.8 ? C.amber : C.green)
    : C.text;

  // Savings opportunity
  const savingsRows = users.map((u) => {
    const calls = u.api_calls || 0;
    const routed = u.routed_calls || 0;
    const eff = calls > 0 ? routed / calls : 0;
    const spent = u.cost_usd || 0;
    const avgCostPerCall = calls > 0 ? spent / calls : 0;
    if (eff >= 0.8 || calls === 0) return { u, eff, additional: 0 };
    const additional = (0.8 - eff) * calls * avgCostPerCall * 0.67;
    return { u, eff, additional };
  });
  const totalAdditional = savingsRows.reduce((s, r) => s + r.additional, 0);
  const lowEfficiency = savingsRows.filter((r) => r.eff < 0.6 && r.additional > 0);

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.green}`,
      borderRadius: 12,
    }}>
      <CardHeader
        title="Spend Forecast"
        subtitle="Projected month-end spend based on today's burn rate."
      />
      <div style={{
        padding: "0 20px 20px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
      }}>
        {/* LEFT: month-end projections */}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 12,
          }}>PROJECTED MONTH-END</div>

          {rows.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textMuted, padding: "12px 0" }}>
              No employees yet.
            </div>
          ) : rows.map(({ u, projected, label, color }) => (
            <div key={keyIdOf(u) || nameOf(u)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 0", borderBottom: `1px solid ${C.borderSoft}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block",
                }} />
                <span style={{ fontSize: 12, color: C.text }}>{nameOf(u)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.text }}>
                  {fmtMoney(projected, 2)}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em",
                }}>{label}</span>
              </div>
            </div>
          ))}

          <div style={{
            display: "flex", justifyContent: "space-between",
            borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
              Team total projection
            </span>
            <span style={{
              fontSize: 16, fontWeight: 700, color: totalColor, fontFamily: FONT_MONO,
            }}>{fmtMoney(totalProjected, 2)}</span>
          </div>
        </div>

        {/* RIGHT: Savings opportunity */}
        <div style={{
          background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 12,
          padding: 18, height: "fit-content",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, fontSize: 13,
            fontWeight: 600, color: C.greenText, marginBottom: 8,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
            Savings Opportunity
          </div>
          <div style={{ fontSize: 12, color: C.greenText, marginBottom: 8 }}>
            If your whole team hit 80% routing efficiency:
          </div>
          <div style={{
            fontSize: 24, fontWeight: 700, color: C.green, fontFamily: FONT_MONO, marginBottom: 14,
          }}>
            +{fmtMoney(totalAdditional, 2)} more this month
          </div>

          {lowEfficiency.length === 0 ? (
            <div style={{ fontSize: 12, color: C.greenText }}>
              Your team is routing efficiently 🎉
            </div>
          ) : (
            <div>
              {lowEfficiency.map(({ u, additional }) => (
                <div key={keyIdOf(u) || nameOf(u)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0",
                }}>
                  <span style={{ fontSize: 12, color: C.greenText }}>{nameOf(u)}</span>
                  <span style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.green, fontWeight: 600 }}>
                    could save {fmtMoney(additional, 2)} more
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BUTTON STYLES ─────────────────────────────────────────────────────────
const btnBlueFilled: React.CSSProperties = {
  background: C.blue, color: "#fff", border: "none",
  fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8,
  cursor: "pointer", fontFamily: FONT_SANS,
};
const btnGhost: React.CSSProperties = {
  background: "#fff", color: C.textMuted, border: `1px solid ${C.border}`,
  fontSize: 12, fontWeight: 500, padding: "7px 14px", borderRadius: 8,
  cursor: "pointer", fontFamily: FONT_SANS,
};




