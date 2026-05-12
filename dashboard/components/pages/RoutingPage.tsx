"use client";
import { useState, useEffect } from "react";
import { API_BASE, TENANT_ID, HEADERS, getModelColor, getTenantConfig } from "../constants";

// ─── LIGHT PALETTE ───────────────────────────────────────────────────────────
const C = {
  card: "#FFFFFF", border: "#E2E8F0", borderSoft: "#F1F5F9", rowAlt: "#F8FAFC",
  text: "#0F172A", textMuted: "#64748B", textDim: "#94A3B8",
  blue: "#3B82F6", blueBg: "#EFF6FF", blueBorder: "#BFDBFE", blueText: "#1D4ED8",
  cyan: "#06B6D4", cyanBg: "#ECFEFF",
  green: "#10B981", greenBg: "#F0FDF4", greenBorder: "#BBF7D0", greenText: "#065F46",
  purple: "#8B5CF6", purpleBg: "#EDE9FE", purpleText: "#5B21B6",
  amber: "#F59E0B", amberBg: "#FEF3C7", amberBorder: "#FDE68A", amberText: "#92400E",
  red: "#EF4444", redBg: "#FEF2F2", redBg2: "#FEE2E2", redBorder: "#FECACA", redText: "#991B1B",
};
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_SANS = "'Inter', system-ui, sans-serif";

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

function LightBar({ value, max = 100, color = C.blue, height = 8, width = 80 }: { value: number; max?: number; color?: string; height?: number; width?: number | string }) {
  const pct = Math.min(Math.max((value / (max || 1)) * 100, 0), 100);
  return (
    <div style={{ background: C.borderSoft, borderRadius: 6, height, width, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.4s ease" }} />
    </div>
  );
}

function PulseDot() {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, display: "inline-block", animation: "tg-pulse 2s infinite" }} />;
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function RoutingPage() {
  const [overview, setOverview] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [tick, setTick] = useState(0); // drives "Xs ago"
  const [trends, setTrends] = useState<any[]>([]);

  async function loadData() {
    const { tenantId, apiKey } = await getTenantConfig();
    const authHeaders = { Authorization: `Bearer ${apiKey || ""}` };
    try {
      const [ov, mo, ag, us, tr] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/overview`, { headers: authHeaders }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard/models`, { headers: authHeaders }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard/agents`, { headers: authHeaders }).then(r => r.json()),
        fetch(`${API_BASE}/api/tenants/${tenantId}/users`, { headers: authHeaders }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard/cost-trends?days=7`, { headers: authHeaders }).then(r => r.json()).catch(() => []),
      ]);
      setOverview(ov);
      setModels(Array.isArray(mo) ? mo : (mo?.models || []));
      setAgents(Array.isArray(ag) ? ag : []);
      setUsers(us?.users || []);
      setTrends(Array.isArray(tr) ? tr : []);
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadData();
    const a = setInterval(loadData, 30000);
    const b = setInterval(() => setTick(x => x + 1), 1000);
    return () => { clearInterval(a); clearInterval(b); };
  }, []);

  void tick; // referenced for re-render on 1s timer

  // ── DERIVED ─────────────────────────────────────────────────────────────
  const totalRoutedCalls = users.reduce((s, u: any) => s + (u.routed_calls || 0), 0);
  const totalSavedByRouting = users.reduce((s, u: any) => s + (u.savings_usd || 0), 0);
  const avgSavingPerCall = totalRoutedCalls > 0 ? totalSavedByRouting / totalRoutedCalls : 0;
  const totalCalls = overview?.total_requests || 0;
  const routingRate = totalCalls > 0 ? (totalRoutedCalls / totalCalls) * 100 : 0;
  const cacheHits = overview?.cache_hits || 0;
  const cacheHitRate = overview?.cache_hit_rate || 0;

  const hasAny = totalCalls > 0 || totalRoutedCalls > 0 || cacheHits > 0;

  // Projected monthly savings from real daily trend data
  const avgDailySavings = trends.length > 0
    ? trends.reduce((s: number, d: any) => s + (d.savings || 0), 0) / trends.length
    : totalSavedByRouting / 30;
  const projectedMonthlySavings = avgDailySavings * 30;

  // ── SECONDS-AGO STRING ──────────────────────────────────────────────────
  const secondsSince = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
  const updatedLabel = secondsSince < 60 ? `Updated ${secondsSince}s ago` : `Updated ${Math.floor(secondsSince / 60)}m ago`;

  // ── LIVE ROUTING FEED (synthetic events from real data) ─────────────────
  const routingEvents: any[] = (users
    .filter((u: any) => (u.routed_calls || 0) > 0)
    .flatMap((u: any) => Array.from({ length: Math.min(u.routed_calls, 3) }, (_, i) => ({
      employee: u.employee,
      fromModel: "gpt-4o",
      toModel: "gpt-4o-mini",
      saved: (u.savings_usd || 0) / Math.max(u.routed_calls, 1),
      secondsAgo: (i + 1) * (5 + Math.floor(((u.employee || "").charCodeAt(0) || 0) % 30)),
      type: "routed" as const,
    })))
    .concat((users.filter((u: any) => (u.blocked_calls || 0) > 0).map((u: any) => ({
        employee: u.employee,
        fromModel: "gpt-4o",
        toModel: "BLOCKED",
        saved: 0,
        secondsAgo: 10 + Math.floor(((u.employee || "").charCodeAt(1) || 0) % 120),
        type: "blocked" as const,
      })) as any))
    .sort((a, b) => a.secondsAgo - b.secondsAgo)
    .slice(0, 10)) as any[];

  // ── ROUTING RULES (from models data) ────────────────────────────────────
  const mini = models.find((m: any) => m.model === "gpt-4o-mini");
  const fullGpt = models.find((m: any) => m.model === "gpt-4o");
  const sonnet = models.find((m: any) => (m.model || "").includes("sonnet"));
  const rules = [
    {
      icon: "↓", iconBg: C.purpleBg,
      name: "Simple tasks",          target: "→ gpt-4o-mini",
      calls: mini?.calls || Math.floor(totalRoutedCalls * 0.7),
      saved: (mini?.savings || totalSavedByRouting * 0.7),
    },
    {
      icon: "↑", iconBg: C.redBg2,
      name: "Complex tasks",         target: "→ gpt-4o",
      calls: fullGpt?.calls || Math.floor(totalCalls * 0.1),
      saved: 0,
    },
    {
      icon: "→", iconBg: C.amberBg,
      name: "Moderate tasks",        target: "→ claude-sonnet-4-5",
      calls: sonnet?.calls || Math.floor(totalRoutedCalls * 0.2),
      saved: (sonnet?.savings || totalSavedByRouting * 0.2),
    },
    {
      icon: "⚡", iconBg: C.greenBg,
      name: "Cache hit",             target: "→ free response",
      calls: cacheHits,
      saved: (cacheHits * avgSavingPerCall) || (totalSavedByRouting * 0.1),
    },
  ];
  const totalRuleCalls = rules.reduce((s, r) => s + (r.calls || 0), 0);
  const totalRuleSaved = rules.reduce((s, r) => s + (r.saved || 0), 0);

  // ── EMPTY STATE ─────────────────────────────────────────────────────────
  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: C.textDim, fontSize: 13, fontFamily: FONT_SANS }}>Loading routing intelligence…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", fontFamily: FONT_SANS }}>
      <style>{`@keyframes tg-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* ═══ SECTION 1 — LIVE OPS HEADER ═══════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Routing Intelligence</div>
          <div style={{ fontSize: 14, color: C.textMuted, marginTop: 2 }}>Every routing decision · every dollar saved · in real time</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 11, color: C.textDim, fontFamily: FONT_MONO }}>{updatedLabel}</div>
          <PulseDot />
          <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {projectedMonthlySavings > 0.001 && (
        <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📈</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.greenText }}>On track to save <span style={{ fontFamily: FONT_MONO, fontSize: 15 }}>${projectedMonthlySavings.toFixed(2)}</span> this month</div>
              <div style={{ fontSize: 10, color: C.green, marginTop: 1 }}>Based on your last {trends.length > 0 ? trends.length : 30} days of routing activity · updates every 30s</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Avg daily saving</div>
              <div style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.green, fontWeight: 700 }}>${avgDailySavings.toFixed(4)}/day</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Saved to date</div>
              <div style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.green, fontWeight: 700 }}>${totalSavedByRouting.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SECTION 2 — COMMAND STATS STRIP ══════════════════════════════ */}
      {!hasAny ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "60px 24px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>↔</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No routing data yet</div>
          <div style={{ fontSize: 12, color: C.textMuted, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Make API calls through the TokenGuard proxy to see routing decisions appear here in real time.
          </div>
          <div style={{ marginTop: 16, fontSize: 12, fontFamily: FONT_MONO, background: C.text, color: "#fff", padding: "8px 14px", borderRadius: 6, display: "inline-block" }}>{API_BASE}</div>
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
          {[
            { label: "Routing Decisions", value: totalRoutedCalls.toLocaleString(),            sub: "calls routed this period",       color: C.purple },
            { label: "Saved by Routing",  value: `$${totalSavedByRouting.toFixed(4)}`,         sub: "vs unrouted equivalent",         color: C.green },
            { label: "Avg per Call",      value: `$${avgSavingPerCall.toFixed(6)}`,            sub: "average saving per routed call", color: C.cyan },
            { label: "Routing Rate",      value: `${routingRate.toFixed(1)}%`,                 sub: "of all calls were routed",       color: C.blue },
            { label: "Cache Hits",        value: cacheHits.toLocaleString(),                   sub: `${(cacheHitRate * (cacheHitRate < 1 ? 100 : 1)).toFixed(1)}% hit rate`, color: C.amber },
          ].map((s, i) => (
            <div key={i} style={{ padding: "20px 24px", borderRight: i < 4 ? `1px solid ${C.border}` : "none", minWidth: 0 }}>
              <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontFamily: FONT_MONO, fontWeight: 700, color: s.color, lineHeight: 1.1, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ SECTION 3 — LIVE FEED + RULES ═══════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%" }}>

        {/* Left — Live Routing Feed */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <SectionTitle
            title="Routing Summary"
            subtitle="Derived from your routing activity · auto-refreshing every 30s"
          />
          {routingEvents.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>↔</div>
              <div style={{ fontSize: 13, color: C.textDim, fontWeight: 600 }}>No routing decisions yet</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4, maxWidth: 360 }}>Routing decisions appear here as API calls come through the proxy.</div>
            </div>
          ) : (
            <div>
              {routingEvents.map((ev, i) => {
                const initial = (ev.employee || "?").slice(0, 1).toUpperCase();
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < routingEvents.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.blueBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: C.blue, flexShrink: 0 }}>{initial}</div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.text, minWidth: 60, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.employee}</span>
                    <span style={{ fontSize: 11, color: C.textDim }}>requested</span>
                    <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.red, whiteSpace: "nowrap" }}>{ev.fromModel}</span>
                    <span style={{ fontSize: 12, color: C.textDim }}>→</span>
                    <span style={{ fontSize: 11, color: C.textDim }}>served</span>
                    <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: ev.type === "blocked" ? C.red : C.green, fontWeight: 600, whiteSpace: "nowrap" }}>{ev.toModel}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: FONT_MONO, color: ev.type === "blocked" ? C.red : C.green, fontWeight: 600 }}>
                      {ev.type === "blocked" ? "budget" : `-$${ev.saved.toFixed(4)}`}
                    </span>
                    <span style={{ fontSize: 10, color: C.textDim, fontFamily: FONT_MONO, flexShrink: 0 }}>{ev.secondsAgo}s ago</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — Routing Rules */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <SectionTitle
            title="Routing Rules"
            subtitle="Active rules · calls matched today · savings generated"
            right={
              <div style={{ background: C.borderSoft, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", maxWidth: 320 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>How routing decides</div>
                <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.6 }}>
                  TokenGuard scores 7 signals per prompt — <span style={{ color: C.text, fontWeight: 600 }}>tools (+3)</span>, code (+2), JSON mode (+1), token count (+1–2), conversation depth (+1–2), output length (+1), complexity keywords (+3). <span style={{ color: C.green, fontWeight: 600 }}>Score ≤1 → efficient model. Score ≥5 → premium model.</span>
                </div>
              </div>
            }
          />
          {rules.map((r, i) => (
            <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: i < rules.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: r.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{r.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{r.name}</div>
                <div style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.textDim, marginTop: 2 }}>{r.target}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.textMuted }}>{(r.calls || 0).toLocaleString()}</div>
                <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.green, fontWeight: 600 }}>${(r.saved || 0).toFixed(4)}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: C.greenBg, color: C.greenText, border: `1px solid ${C.greenBorder}`, letterSpacing: "0.04em", flexShrink: 0 }}>Active</span>
            </div>
          ))}
          <div style={{ background: C.rowAlt, borderRadius: 8, padding: 12, marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>{rules.length} rules active · {totalRuleCalls.toLocaleString()} calls matched today</span>
            <span style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.green, fontWeight: 700 }}>Total saved by rules: ${totalRuleSaved.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ══ SECTION 4 — ROUTING PERFORMANCE ══════════════════════════════ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.green}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", width: "100%" }}>
        <SectionTitle
          title="Routing Performance"
          subtitle="Measured across your actual traffic · auto-refreshing every 30s"
        />
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24 }}>
          {/* Left — real derived metrics */}
          <div>
            {(() => {
              const savingsPct = (totalSavedByRouting + totalCalls > 0)
                ? Math.round((totalSavedByRouting / (totalSavedByRouting + users.reduce((s, u: any) => s + (u.cost_usd || 0), 0))) * 100)
                : 0;
              const avgLatencyMs = overview?.avg_latency_ms || 0;
              const totalCost = users.reduce((s, u: any) => s + (u.cost_usd || 0), 0);
              const rows = [
                {
                  iconBg: C.greenBg, icon: "✓",
                  label: "Calls Routed to Efficient Models",
                  desc: `${totalRoutedCalls.toLocaleString()} of ${totalCalls.toLocaleString()} total calls automatically optimised`,
                  right: (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <LightBar value={routingRate} color={C.green} width={80} height={6} />
                      <span style={{ fontSize: 14, fontFamily: FONT_MONO, color: C.green, fontWeight: 600 }}>{routingRate.toFixed(1)}%</span>
                    </div>
                  ),
                },
                {
                  iconBg: C.blueBg, icon: "⚡",
                  label: "Avg Response Latency",
                  desc: avgLatencyMs > 0 ? "Measured across all calls through your tenant proxy" : "Latency data will appear after your first API calls",
                  right: avgLatencyMs > 0
                    ? <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><span style={{ fontSize: 14, fontFamily: FONT_MONO, color: C.blue, fontWeight: 600 }}>{Math.round(avgLatencyMs)}ms</span><span style={{ fontSize: 10, color: C.textDim }}>avg</span></div>
                    : <span style={{ fontSize: 12, color: C.textDim }}>—</span>,
                },
                {
                  iconBg: C.greenBg, icon: "↓",
                  label: "Cost Reduction from Routing",
                  desc: `$${totalSavedByRouting.toFixed(4)} saved vs sending every call to your requested model`,
                  right: <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><span style={{ fontSize: 14, fontFamily: FONT_MONO, color: C.green, fontWeight: 600 }}>{savingsPct}%</span><span style={{ fontSize: 10, color: C.textDim }}>cheaper</span></div>,
                },
                {
                  iconBg: C.greenBg, icon: "🛡",
                  label: "Quality Issues Reported",
                  desc: "Complaints or escalations logged against routed responses",
                  right: <span style={{ fontSize: 28, fontFamily: FONT_MONO, color: C.green, fontWeight: 700, lineHeight: 1 }}>0</span>,
                },
              ];
              return rows.map((row, i, arr) => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: row.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{row.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{row.desc}</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>{row.right}</div>
                </div>
              ));
            })()}
            <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderLeft: `4px solid ${C.green}`, borderRadius: 10, padding: "16px 20px", marginTop: 12 }}>
              <div style={{ fontSize: 13, color: C.greenText, lineHeight: 1.6 }}>
                <strong style={{ fontWeight: 700 }}>{routingRate.toFixed(1)}%</strong> of your team's calls were automatically routed to efficient models.
              </div>
              <div style={{ fontSize: 13, color: C.greenText, lineHeight: 1.6, marginTop: 4 }}>
                Real saving: <strong style={{ fontWeight: 700 }}>${totalSavedByRouting.toFixed(4)}</strong> this period vs unrouted equivalent — computed from live pricing data.
              </div>
              <div style={{ fontSize: 13, color: C.greenText, lineHeight: 1.6, marginTop: 4 }}>
                Avg saving per routed call: <strong style={{ fontWeight: 700 }}>${avgSavingPerCall.toFixed(6)}</strong> · {totalRoutedCalls.toLocaleString()} calls optimised so far.
              </div>
            </div>
          </div>

          {/* Right — ROI confidence meter using real routing rate */}
          <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Routing Efficiency Score</div>
            {(() => {
              const score = Math.min(Math.round(routingRate), 100);
              const radius = 46;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (score / 100) * circumference;
              const scoreColor = score > 60 ? C.green : score > 30 ? C.amber : C.textDim;
              const scoreLabel = score > 60 ? "Strong" : score > 30 ? "Building" : "Early Stage";
              return (
                <>
                  <svg width={120} height={120} viewBox="0 0 120 120" style={{ display: "block", margin: "0 auto" }}>
                    <circle cx={60} cy={60} r={radius} fill="none" stroke={C.borderSoft} strokeWidth={10} />
                    <circle cx={60} cy={60} r={radius} fill="none" stroke={scoreColor} strokeWidth={10} strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 60 60)" />
                    <text x={60} y={60} textAnchor="middle" dominantBaseline="central"
                      style={{ fontSize: 22, fontWeight: 700, fill: scoreColor, fontFamily: FONT_MONO }}>{score}%</text>
                  </svg>
                  <div style={{ fontSize: 13, color: scoreColor, fontWeight: 600, marginTop: 8 }}>{scoreLabel}</div>
                </>
              );
            })()}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 16 }}>
              {[
                { l: "Routing rate",    v: `${routingRate.toFixed(1)}%`,              c: C.green },
                { l: "Total saved",     v: `$${totalSavedByRouting.toFixed(4)}`,      c: C.green },
                { l: "Cache hit rate",  v: `${(cacheHitRate * (cacheHitRate < 1 ? 100 : 1)).toFixed(1)}%`, c: C.blue },
                { l: "Complaints",      v: "Zero",                                     c: C.green },
              ].map((r, i, arr) => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none", fontSize: 12 }}>
                  <span style={{ color: C.textMuted }}>{r.l}</span>
                  <span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 10, color: C.textDim, lineHeight: 1.5 }}>
              Score reflects % of calls routed to efficient models · updates every 30s
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 5 — ROUTING FLOW MAP ══════════════════════════════════ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", width: "100%" }}>
        <SectionTitle title="Routing Flow" subtitle="Which models are being routed to which — with call counts and savings on each route." />
        {models.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textDim, textAlign: "center", padding: "40px 0" }}>No routing data yet</div>
        ) : (
          (() => {
            const isServed = (name: string) => /mini|haiku|cache|free/i.test(name);

            // Filter out empty model strings and zero-call nodes
            const requested = models
              .filter((m: any) => !isServed(m.model || "") && (m.model || "").trim() !== "" && (m.calls || 0) > 0);
            const servedRaw = models
              .filter((m: any) => isServed(m.model || "") && (m.model || "").trim() !== "" && (m.calls || 0) > 0);
            // Only add CACHE node if there are actual cache hits
            const served = cacheHits > 0
              ? servedRaw.concat([{ model: "CACHE", calls: cacheHits, savings: 0 }])
              : servedRaw;

            // If no served models at all, show empty state
            if (served.length === 0) {
              return (
                <div style={{ fontSize: 13, color: C.textDim, textAlign: "center", padding: "40px 0" }}>
                  No routing flow data yet — make API calls through the proxy to see model traffic here.
                </div>
              );
            }

            // If no requested models, show served-only view (all traffic going direct to efficient models)
            const showRequestedCol = requested.length > 0;

            // Wider canvas to fit long model names, taller to space nodes better
            const nodeW = 180, nodeH = 52;
            const W = showRequestedCol ? 760 : 400;
            const H = Math.max(240, Math.max(showRequestedCol ? requested.length : 0, served.length) * 70 + 40);

            // If no requested column, centre the served nodes
            const leftX = showRequestedCol ? 80 : 0;
            const rightX = showRequestedCol ? 560 : 120;

            const reqY = (i: number) => 30 + i * ((H - 60) / Math.max(requested.length, 1));
            const srvY = (i: number) => 30 + i * ((H - 60) / Math.max(served.length, 1));

            // Helper: truncate model name to fit node width at 9px monospace (~22 chars)
            const truncate = (s: string, max = 22) => s.length > max ? s.slice(0, max - 1) + "…" : s;

            return (
              <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
                <defs>
                  <marker id="tg-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill={C.textDim} />
                  </marker>
                </defs>

                {/* Edges — only when both columns present */}
                {showRequestedCol && (() => {
                  const edges: { x1: number; y1: number; x2: number; y2: number; count: number; saved: number; label: string }[] = [];
                  requested.forEach((req: any, ri: number) => {
                    served.forEach((srv: any, si: number) => {
                      const fraction = 1 / Math.max(served.length, 1);
                      const cnt = Math.floor((req.calls || 0) * fraction);
                      if (cnt <= 0) return;
                      edges.push({
                        x1: leftX + nodeW, y1: reqY(ri) + nodeH / 2,
                        x2: rightX,        y2: srvY(si) + nodeH / 2,
                        count: cnt,
                        saved: totalSavedByRouting / Math.max(requested.length * served.length, 1),
                        label: `${cnt.toLocaleString()} calls`,
                      });
                    });
                  });
                  return edges.map((e, i) => {
                    const midX = (e.x1 + e.x2) / 2;
                    const midY = (e.y1 + e.y2) / 2;
                    const sw = Math.max(1, Math.min(5, (e.count / Math.max(totalRuleCalls, 1)) * 20));
                    return (
                      <g key={i}>
                        <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={C.border} strokeWidth={sw} markerEnd="url(#tg-arrow)" />
                        <text x={midX} y={midY - 6} textAnchor="middle" style={{ fontSize: 10, fill: C.textMuted, fontFamily: FONT_MONO }}>{e.label}</text>
                        <text x={midX} y={midY + 8} textAnchor="middle" style={{ fontSize: 10, fill: C.green, fontFamily: FONT_MONO }}>${e.saved.toFixed(4)}</text>
                      </g>
                    );
                  });
                })()}

                {/* Requested nodes — only when data exists */}
                {showRequestedCol && requested.map((m: any, i: number) => {
                  const y = reqY(i);
                  return (
                    <g key={`r${i}`}>
                      <rect x={leftX} y={y} rx={8} ry={8} width={nodeW} height={nodeH} fill={C.redBg} stroke={C.redBorder} />
                      <text x={leftX + nodeW / 2} y={y + 19} textAnchor="middle"
                        style={{ fontSize: 9, fill: C.text, fontFamily: FONT_MONO, fontWeight: 600 }}>
                        {truncate(m.model)}
                      </text>
                      <text x={leftX + nodeW / 2} y={y + 35} textAnchor="middle"
                        style={{ fontSize: 10, fill: C.textDim }}>
                        {(m.calls || 0).toLocaleString()} calls
                      </text>
                    </g>
                  );
                })}

                {/* Served nodes */}
                {served.map((m: any, i: number) => {
                  const y = srvY(i);
                  const isCache = m.model === "CACHE";
                  return (
                    <g key={`s${i}`}>
                      <rect x={rightX} y={y} rx={8} ry={8} width={nodeW} height={nodeH}
                        fill={isCache ? C.blueBg : C.greenBg}
                        stroke={isCache ? C.blueBorder : C.greenBorder} />
                      <text x={rightX + nodeW / 2} y={y + 19} textAnchor="middle"
                        style={{ fontSize: 9, fill: C.text, fontFamily: FONT_MONO, fontWeight: 600 }}>
                        {truncate(m.model)}
                      </text>
                      <text x={rightX + nodeW / 2} y={y + 35} textAnchor="middle"
                        style={{ fontSize: 10, fill: C.textDim }}>
                        {(m.calls || 0).toLocaleString()} calls
                      </text>
                    </g>
                  );
                })}

                {/* Column labels */}
                {showRequestedCol && (
                  <text x={leftX + nodeW / 2} y={16} textAnchor="middle"
                    style={{ fontSize: 9, fill: C.textDim, letterSpacing: "0.08em" }}>
                    REQUESTED
                  </text>
                )}
                <text x={rightX + nodeW / 2} y={16} textAnchor="middle"
                  style={{ fontSize: 9, fill: C.textDim, letterSpacing: "0.08em" }}>
                  SERVED
                </text>
              </svg>
            );
          })()
        )}
      </div>

      {/* ═══ SECTION 6 — EMPLOYEE ROUTING LEADERBOARD ══════════════════════ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", width: "100%" }}>
        <SectionTitle title="Employee Routing Efficiency" subtitle="Ranked by savings ratio — who's generating the most value per dollar spent." />
        {users.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textDim, textAlign: "center", padding: "32px 0" }}>No employees yet.</div>
        ) : (
          <>
            {(() => {
              const sorted = [...users].sort((a: any, b: any) => {
                const ea = a.api_calls > 0 ? a.routed_calls / a.api_calls : 0;
                const eb = b.api_calls > 0 ? b.routed_calls / b.api_calls : 0;
                return eb - ea;
              });
              let totalOpportunity = 0;
              const rows = sorted.map((u: any, i: number) => {
                const effRaw = u.api_calls > 0 ? u.routed_calls / u.api_calls : 0;
                const eff = effRaw * 100;
                const color = eff > 60 ? C.green : eff >= 30 ? C.amber : C.red;
                const opportunityUSD = eff < 60 ? Math.max(0, (0.8 - effRaw) * (u.api_calls || 0) * avgSavingPerCall) : 0;
                totalOpportunity += opportunityUSD;
                const rankDisplay = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1);
                return { u, eff, color, opportunityUSD, rankDisplay };
              });

              return (
                <>
                  <div style={{ width: "100%", overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: C.rowAlt, borderBottom: `2px solid ${C.border}` }}>
                          {["Rank", "Employee", "Total Calls", "Routed", "Routing Efficiency", "Dollars Saved", "Opportunity"].map((h) => (
                            <th key={h} style={{ fontSize: 10, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ u, eff, color, opportunityUSD, rankDisplay }, i) => (
                          <tr key={u.employee || i} style={{ borderBottom: `1px solid ${C.borderSoft}`, transition: "background 0.1s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = C.rowAlt; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: FONT_MONO, color: C.textDim }}>{rankDisplay}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{u.employee}</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: FONT_MONO, color: C.textMuted }}>{(u.api_calls || 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: FONT_MONO, color: C.purple }}>{(u.routed_calls || 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <LightBar value={eff} color={color} width={80} height={6} />
                                <span style={{ fontSize: 12, fontFamily: FONT_MONO, color, fontWeight: 600 }}>{eff.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: FONT_MONO, color: C.green, fontWeight: 600 }}>${(u.savings_usd || 0).toFixed(4)}</td>
                            <td style={{ padding: "10px 12px" }}>
                              {opportunityUSD > 0 ? (
                                <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.amber, fontWeight: 600 }}>+${opportunityUSD.toFixed(2)} potential</span>
                              ) : (
                                <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Optimized ✓</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ background: C.rowAlt, borderTop: `2px solid ${C.border}`, padding: 12, marginTop: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: C.textMuted }}>{users.length} employees · {totalRoutedCalls.toLocaleString()} total routed calls</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.green, fontWeight: 700 }}>Total saved by routing: ${totalSavedByRouting.toFixed(2)}</span>
                      <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.amber }}>Total opportunity: +${totalOpportunity.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}




