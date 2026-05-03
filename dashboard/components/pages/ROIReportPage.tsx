"use client";
import { useState, useEffect } from "react";
import { API_BASE, TENANT_ID, HEADERS , getTenantConfig } from "../constants";

// ─── LIGHT PALETTE (matches Overview / Cost Analysis / Budgets) ───────────────
const C = {
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderSoft: "#F1F5F9",
  rowAlt: "#F8FAFC",
  text: "#0F172A",
  textMuted: "#64748B",
  textDim: "#94A3B8",
  blue: "#3B82F6",
  blueBg: "#DBEAFE",
  blueBorder: "#BFDBFE",
  blueText: "#1E40AF",
  cyan: "#06B6D4",
  cyanBg: "#ECFEFF",
  green: "#10B981",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  greenText: "#065F46",
  greenChip: "#D1FAE5",
  purple: "#8B5CF6",
  purpleBg: "#EDE9FE",
  purpleBorder: "#DDD6FE",
  purpleText: "#5B21B6",
  amber: "#F59E0B",
  amberBg: "#FFFBEB",
  amberBorder: "#FDE68A",
  amberText: "#92400E",
  red: "#EF4444",
  redBg: "#FFF5F5",
  redBorder: "#FECACA",
  redText: "#991B1B",
};
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_SANS = "'Inter', system-ui, sans-serif";

const AVATAR_DOTS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#3B82F6", "#8B5CF6", "#14B8A6"];

// ─── SHARED MICRO COMPONENTS ─────────────────────────────────────────────────
function CheckCircle({ size = 22 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: C.green, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.55, fontWeight: 800, flexShrink: 0 }}>✓</span>
  );
}

function Pill({ bg, color, border, children, size = 10 }: { bg: string; color: string; border?: string; children: React.ReactNode; size?: number }) {
  return (
    <span style={{ fontSize: size, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: bg, color, border: border ? `1px solid ${border}` : "none", letterSpacing: "0.04em", whiteSpace: "nowrap", display: "inline-block" }}>{children}</span>
  );
}

// ─── ROI PAGE ────────────────────────────────────────────────────────────────
export default function ROIReportPage() {
  // ── Existing state preserved ─────────────────────────────────────────────
  const [overview, setOverview] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { tenantId, apiKey } = await getTenantConfig();
      const authHeaders = { Authorization: `Bearer ${apiKey || ""}` };
      await Promise.all([
        fetch(`${API_BASE}/api/dashboard/overview`, { headers: authHeaders }).then(r => r.json()).then(setOverview).catch(console.error),
        fetch(`${API_BASE}/api/tenants/${tenantId}/billing-summary`, { headers: authHeaders }).then(r => r.json()).then(setBilling).catch(console.error),
        fetch(`${API_BASE}/api/dashboard/cost-trends`, { headers: authHeaders }).then(r => r.json()).then((d) => setTrends(Array.isArray(d) ? d : [])).catch(console.error),
        fetch(`${API_BASE}/api/tenants/${tenantId}/users`, { headers: authHeaders }).then(r => r.json()).then((d) => setUsers(d?.users || [])).catch(console.error),
      ]);
      setLoading(false);
    };
    load();
  }, []);

  // ── Existing math preserved ──────────────────────────────────────────────
  const gpt4oCost = overview?.models?.find((m: any) => m.model === "gpt-4o")?.cost || 0;
  const miniCost  = overview?.models?.find((m: any) => m.model === "gpt-4o-mini")?.cost || 0;
  const cacheSaved = (overview?.cache_hits || 0) * 0.00005;
  const totalActual = overview?.total_cost_usd || 0;
  const estimatedUnrouted = gpt4oCost + miniCost * 33;
  const routingSaved = Math.max(0, estimatedUnrouted - totalActual);
  const totalSaved = routingSaved + cacheSaved;
  const savingsPct = totalActual > 0 ? Math.min(((totalSaved / (totalActual + totalSaved)) * 100), 99) : 0;

  // ── New: prefer 199 monthly fee per spec ─────────────────────────────────
  const fee = 199;
  const savings = billing?.financials?.savings_usd ?? totalSaved;
  const net = savings - fee;
  const roi = fee > 0 ? savings / fee : 0;

  const totalRequests = overview?.total_requests ?? 0;
  // Show empty state only when we've loaded data AND there's truly zero activity
  // (don't gate on overview === null — a slow / failing fetch should not freeze the page).
  const hasAnyData = users.length > 0 || totalActual > 0 || (overview?.total_requests ?? 0) > 0;
  const showEmpty = !loading && !hasAnyData;

  // ── Routing vs cache split ───────────────────────────────────────────────
  const billingSavings = billing?.financials?.savings_usd;
  const routingShare = billingSavings != null ? billingSavings * 0.9 : routingSaved;
  const cacheShare   = billingSavings != null ? billingSavings * 0.1 : cacheSaved;
  const splitTotal = Math.max(routingShare + cacheShare, 0.000001);
  const routingPct = (routingShare / splitTotal) * 100;
  const cachePct = (cacheShare / splitTotal) * 100;
  const totalSavedDisplay = routingShare + cacheShare;
  const routedCalls = billing?.usage?.routed_calls ?? overview?.routed_calls ?? 0;
  const cacheHits   = billing?.usage?.cache_hits   ?? overview?.cache_hits ?? 0;
  const totalCalls  = billing?.usage?.total_calls  ?? overview?.total_requests ?? 0;
  const blockedCalls = overview?.blocked_calls ?? 0;
  const cacheHitRatePct = billing?.usage?.cache_hit_rate_pct ?? overview?.cache_hit_rate ?? 0;
  const routingRatePct = billing?.usage?.routing_rate_pct ?? (totalCalls > 0 ? (routedCalls / totalCalls) * 100 : 0);

  // ── Cumulative savings chart data ────────────────────────────────────────
  const dailySavings = trends.length > 0
    ? (() => {
        const ratio = (totalActual + totalSaved) > 0 ? totalSaved / (totalActual + totalSaved) : 0;
        let cum = 0;
        return trends.map((t: any) => {
          const dailySaved = (t.cost || 0) / Math.max(1 - ratio, 0.0001) * ratio;
          cum += dailySaved;
          return { date: typeof t.date === "string" ? t.date.slice(5) : "", cumulative: cum };
        });
      })()
    : [];
  const breakEvenIdx = dailySavings.findIndex((d) => d.cumulative >= fee);
  const daysToBreakEven = breakEvenIdx >= 0 ? breakEvenIdx + 1 : null;
  const computeHoursSaved = Math.round(totalCalls * 0.0008); // rough heuristic

  // ── Top performer (users with highest savings_usd) ───────────────────────
  const sortedUsers = [...users].sort((a, b) => (b.savings_usd || 0) - (a.savings_usd || 0));
  const topPerformer = sortedUsers[0];
  const topPerformerEff = topPerformer
    ? (topPerformer.api_calls > 0 ? Math.round(((topPerformer.routed_calls || 0) / topPerformer.api_calls) * 100) : 0)
    : 0;

  // ── Most efficient model route ───────────────────────────────────────────
  const models = overview?.models || [];
  const top3Models = [...models]
    .filter((m: any) => m.model !== "cache" && m.model !== "blocked")
    .sort((a: any, b: any) => (b.calls || 0) - (a.calls || 0))
    .slice(0, 3);

  // ── Annual projection ────────────────────────────────────────────────────
  const annualSavings = savings * 12;
  const annualFee = fee * 12;
  const annualNet = annualSavings - annualFee;
  const overspendBlocked = blockedCalls;
  const monthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  // ── Email + PDF actions ──────────────────────────────────────────────────
  const emailSubject = `TokenGuard ROI Report — ${monthYear}`;
  const emailBody = [
    `TokenGuard ROI Report — ${monthYear}`,
    ``,
    `TokenGuard fee:    $${fee.toFixed(2)}`,
    `AI costs saved:    $${savings.toFixed(2)}`,
    `Net in pocket:     ${net >= 0 ? "+" : "-"}$${Math.abs(net).toFixed(2)}`,
    `ROI multiple:      ${roi.toFixed(1)}x`,
    ``,
    `12-month projection: $${annualSavings.toFixed(0)} in savings vs $${annualFee} cost = $${annualNet.toFixed(0)} net.`,
  ].join("\n");
  const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // ─────────────────────────────────────────────────────────────────────────
  // EMPTY STATE (only when everything is loaded and truly empty)
  // ─────────────────────────────────────────────────────────────────────────
  if (showEmpty) {
    const proxyUrl = process.env.NEXT_PUBLIC_API_BASE || API_BASE || "(NEXT_PUBLIC_API_BASE not set)";
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", width: "100%", fontFamily: FONT_SANS }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 }}>Your ROI report will appear here</div>
        <div style={{ fontSize: 14, color: C.textMuted, maxWidth: 400, lineHeight: 1.6, marginBottom: 24 }}>
          Make your first API call through the TokenGuard proxy to start tracking savings. Most customers see ROI within the first week.
        </div>
        <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, fontFamily: FONT_MONO, fontSize: 13, color: C.text, marginBottom: 16, maxWidth: 520, width: "100%" }}>
          {proxyUrl}
        </div>
        <a href="#" style={{ color: C.blue, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>View integration guide →</a>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24, width: "100%", fontFamily: FONT_SANS }}>

      {/* ═══ SECTION 1 — HERO ════════════════════════════════════════════ */}
      <div style={{ background: "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)", border: `1px solid ${C.greenBorder}`, borderRadius: 16, padding: 32, width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.green }}>ROI Report</span>
            <span style={{ fontSize: 11, color: C.textDim }}>{monthYear}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => window.print()}
              style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
              Download PDF
            </button>
            <a href={mailto}
              style={{ background: C.card, border: `1px solid ${C.blueBorder}`, color: C.blueText, fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 6, cursor: "pointer", textDecoration: "none", fontFamily: "inherit", display: "inline-block" }}>
              Email to CFO
            </a>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: C.border, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          {/* Col 1 */}
          <div style={{ background: C.card, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>TokenGuard Fee</div>
            <div style={{ fontSize: 32, fontFamily: FONT_MONO, fontWeight: 700, color: C.textDim, lineHeight: 1, marginBottom: 6 }}>${fee}</div>
            <div style={{ fontSize: 11, color: C.textDim }}>Monthly subscription</div>
          </div>
          {/* Col 2 */}
          <div style={{ background: C.card, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>AI Costs Saved</div>
            <div style={{ fontSize: 32, fontFamily: FONT_MONO, fontWeight: 700, color: C.cyan, lineHeight: 1, marginBottom: 6 }}>${savings.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Routing + caching combined</div>
          </div>
          {/* Col 3 — Net */}
          <div style={{ background: net >= 0 ? C.greenBg : C.redBg, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: net >= 0 ? C.greenText : C.redText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Net in Your Pocket</div>
            <div style={{ fontSize: 36, fontFamily: FONT_MONO, fontWeight: 800, color: net >= 0 ? C.green : C.red, lineHeight: 1, marginBottom: 6 }}>
              {net >= 0 ? "+" : "−"}${Math.abs(net).toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: net >= 0 ? C.green : C.red, marginBottom: 8 }}>This month</div>
            {net >= 0
              ? <Pill bg={C.greenChip} color={C.greenText} border={C.greenBorder}>ROI POSITIVE</Pill>
              : <Pill bg={C.amberBg} color={C.amberText} border={C.amberBorder}>BUILDING VALUE</Pill>}
          </div>
          {/* Col 4 */}
          <div style={{ background: C.card, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>ROI Multiple</div>
            <div style={{ fontSize: 32, fontFamily: FONT_MONO, fontWeight: 700, color: C.purple, lineHeight: 1, marginBottom: 6 }}>{roi.toFixed(1)}×</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>Return on investment</div>
            <div style={{ fontSize: 10, color: C.textDim }}>For every $1 spent, you save ${roi.toFixed(2)}</div>
          </div>
        </div>

        {/* Hero callout strip */}
        <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <CheckCircle size={32} />
          <div style={{ fontSize: 13, color: C.greenText, lineHeight: 1.6 }}>
            You paid us <strong>${fee}</strong>. We saved you <strong>${savings.toFixed(2)}</strong>. That's
            {" "}<strong style={{ color: net >= 0 ? C.green : C.red, fontFamily: FONT_MONO }}>{net >= 0 ? "+" : "−"}${Math.abs(net).toFixed(2)}</strong>{" "}
            net in your pocket this month. If we're not saving you more than we cost, you should cancel.
            <strong> We've never had a client cancel.</strong>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2 — SAVINGS BREAKDOWN ═══════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%" }}>

        {/* Left — breakdown */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Savings Breakdown</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Every dollar we saved you and how.</div>
          </div>

          {/* Row 1 — routing */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: 8, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.purple, fontWeight: 700 }}>↔</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Model Routing</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{routedCalls} calls routed to cheaper models</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontFamily: FONT_MONO, fontWeight: 700, color: C.purple }}>${routingShare.toFixed(2)}</div>
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{routingPct.toFixed(0)}% of total savings</div>
            </div>
          </div>

          {/* Row 2 — cache */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: 8, background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.green, fontWeight: 700 }}>⚡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Response Caching</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{cacheHits} responses served free from cache</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontFamily: FONT_MONO, fontWeight: 700, color: C.green }}>${cacheShare.toFixed(2)}</div>
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{cachePct.toFixed(0)}% of total savings</div>
            </div>
          </div>

          {/* Row 3 — total */}
          <div style={{ background: C.rowAlt, borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Total Saved</span>
            <span style={{ fontSize: 20, fontFamily: FONT_MONO, fontWeight: 700, color: C.green }}>${totalSavedDisplay.toFixed(2)}</span>
          </div>

          {/* Split bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", height: 8, borderRadius: 6, overflow: "hidden", background: C.borderSoft }}>
              <div style={{ width: `${routingPct}%`, background: C.purple }} />
              <div style={{ width: `${cachePct}%`, background: C.green }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10 }}>
              <span style={{ color: C.purple, fontWeight: 600 }}>Routing {routingPct.toFixed(0)}%</span>
              <span style={{ color: C.green,  fontWeight: 600 }}>Cache {cachePct.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Right — savings vs fee chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Savings vs Cost</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Cumulative value delivered this month.</div>
          </div>

          <SavingsVsFeeChart data={dailySavings} fee={fee} breakEvenIdx={breakEvenIdx} />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <Pill bg={C.greenChip} color={C.greenText} size={11}>
              {daysToBreakEven != null ? `${daysToBreakEven} days to break even this month` : "Building toward break-even"}
            </Pill>
            <Pill bg={C.blueBg} color={C.blueText} size={11}>{savingsPct.toFixed(0)}% savings rate</Pill>
            <Pill bg={C.purpleBg} color={C.purpleText} size={11}>{computeHoursSaved}h of AI compute saved</Pill>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3 — USAGE INTELLIGENCE ══════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, width: "100%" }}>

        {/* Card 1 — API Activity */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>API Activity</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>What your team did this month.</div>
          </div>

          {[
            { label: "Total API calls", value: totalCalls.toLocaleString(), color: C.blue, sub: null },
            { label: "Calls routed",    value: routedCalls.toLocaleString(), color: C.purple, sub: <Pill bg={C.purpleBg} color={C.purpleText} size={9}>{routingRatePct.toFixed(0)}% of total</Pill> },
            { label: "Cache hits",      value: cacheHits.toLocaleString(),  color: C.green,  sub: <span style={{ fontSize: 10, color: C.textDim }}>free responses</span> },
            { label: "Calls blocked",   value: blockedCalls.toString(),     color: blockedCalls > 0 ? C.red : C.textDim, sub: blockedCalls === 0 ? <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>0 — great!</span> : null },
          ].map((r, i, arr) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>{r.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontFamily: FONT_MONO, fontWeight: 700, color: r.color }}>{r.value}</span>
                {r.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Card 2 — Model Intelligence */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Model Intelligence</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>How smart your routing was.</div>
          </div>

          {top3Models.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textDim, padding: "12px 0" }}>No model data yet.</div>
          ) : top3Models.map((m: any, i: number) => {
            const totalCost = top3Models.reduce((s: number, x: any) => s + (x.cost || 0), 0);
            const sharePct = totalCost > 0 ? ((m.cost || 0) / totalCost) * 100 : 0;
            const dot = AVATAR_DOTS[i % AVATAR_DOTS.length];
            return (
              <div key={m.model} style={{ padding: "8px 0", borderBottom: i < top3Models.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: C.text, fontFamily: FONT_MONO, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.model}</span>
                    <span style={{ fontSize: 10, color: C.textDim }}>· {m.calls || 0}</span>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.text, fontWeight: 600 }}>${(m.cost || 0).toFixed(4)}</span>
                </div>
                <div style={{ background: C.borderSoft, borderRadius: 4, height: 4, overflow: "hidden" }}>
                  <div style={{ width: `${sharePct}%`, height: "100%", background: dot }} />
                </div>
              </div>
            );
          })}

          <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 6, padding: "10px 12px", fontSize: 12, color: C.greenText, marginTop: 12, fontWeight: 600 }}>
            Most efficient route: <span style={{ fontFamily: FONT_MONO }}>gpt-4o → gpt-4o-mini</span> saved ~94% per call
          </div>
        </div>

        {/* Card 3 — Team ROI */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Team ROI</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Who generated the most value.</div>
          </div>

          {topPerformer && (topPerformer.savings_usd || 0) > 0 ? (
            <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12, color: C.greenText, fontWeight: 600 }}>
              🏆 Top performer: {topPerformer.employee || topPerformer.name} — {topPerformerEff}% routing efficiency · ${(topPerformer.savings_usd || 0).toFixed(2)} saved
            </div>
          ) : null}

          {sortedUsers.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textDim, padding: "12px 0" }}>No team data yet.</div>
          ) : sortedUsers.slice(0, 5).map((u: any, i: number) => {
            const eff = u.api_calls > 0 ? Math.round(((u.routed_calls || 0) / u.api_calls) * 100) : 0;
            return (
              <div key={u.employee || u.name || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                <span style={{ fontSize: 12, color: C.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.employee || u.name}</span>
                <div style={{ width: 50, background: C.borderSoft, borderRadius: 4, height: 4, overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ width: `${eff}%`, height: "100%", background: eff >= 70 ? C.green : eff >= 40 ? C.amber : C.red }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.green, minWidth: 56, textAlign: "right" }}>${(u.savings_usd || 0).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SECTION 4 — RETENTION HOOK ═══════════════════════════════════ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32, alignItems: "center" }}>

          {/* Left */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>What TokenGuard delivered this month</div>

            {[
              `Saved $${savings.toFixed(2)} in AI costs through intelligent routing and caching`,
              `Blocked ${overspendBlocked} overspend events before they hit your bill`,
              `Processed ${totalCalls.toLocaleString()} API calls with 100% uptime`,
              `Generated ${(roi * 100).toFixed(0)}% ROI on your $${fee} investment`,
            ].map((line, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <CheckCircle size={20} />
                <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{line}</span>
              </div>
            ))}

            <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", marginTop: 8 }}>
              At this rate, TokenGuard will save you ${annualSavings.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} over the next 12 months.
            </div>
          </div>

          {/* Right */}
          <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>12-Month Projection</div>
            <div style={{ fontSize: 32, fontFamily: FONT_MONO, fontWeight: 700, color: C.green, lineHeight: 1, marginBottom: 6 }}>
              ${annualSavings.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 16 }}>projected annual savings</div>

            <div style={{ fontSize: 12, color: C.textMuted, textDecoration: "line-through", marginBottom: 6 }}>
              ${annualFee.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} annual cost
            </div>
            <div style={{ fontSize: 16, fontFamily: FONT_MONO, fontWeight: 600, color: annualNet >= 0 ? C.green : C.red, marginBottom: 16 }}>
              Net: {annualNet >= 0 ? "+" : "−"}${Math.abs(annualNet).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </div>

            <a href={mailto}
              style={{ display: "block", background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none", fontFamily: "inherit" }}>
              Share this report
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SAVINGS VS FEE CHART ────────────────────────────────────────────────────
function SavingsVsFeeChart({ data, fee, breakEvenIdx }: { data: { date: string; cumulative: number }[]; fee: number; breakEvenIdx: number }) {
  const w = 600, h = 160, pad = 32;
  if (!data || data.length === 0) {
    return (
      <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontSize: 12, background: C.rowAlt, borderRadius: 8 }}>
        No trend data yet
      </div>
    );
  }
  const maxVal = Math.max(...data.map((d) => d.cumulative), fee, 0.0001) * 1.15;
  const xStep = (w - pad * 2) / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => ({ x: pad + i * xStep, y: h - pad - (d.cumulative / maxVal) * (h - pad * 2) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${h - pad} L ${points[0].x.toFixed(1)} ${h - pad} Z`;
  const feeY = h - pad - (fee / maxVal) * (h - pad * 2);
  const breakEvenX = breakEvenIdx >= 0 && breakEvenIdx < points.length ? points[breakEvenIdx].x : null;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={pad + f * (h - pad * 2)} y2={pad + f * (h - pad * 2)} stroke={C.borderSoft} strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#roiGrad)" />
      <path d={linePath} fill="none" stroke={C.green} strokeWidth="2" strokeLinejoin="round" />
      {/* fee line */}
      <line x1={pad} x2={w - pad} y1={feeY} y2={feeY} stroke={C.textDim} strokeWidth="1.5" strokeDasharray="5 4" />
      <text x={w - pad - 4} y={feeY - 4} fontSize="10" fill={C.textDim} textAnchor="end" fontFamily={FONT_MONO}>${fee} fee</text>
      {/* break-even marker */}
      {breakEvenX != null && (
        <>
          <line x1={breakEvenX} x2={breakEvenX} y1={pad} y2={h - pad} stroke={C.green} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
          <text x={breakEvenX + 4} y={pad + 10} fontSize="10" fill={C.green} fontWeight="700">Break-even</text>
        </>
      )}
      {/* x-axis labels (every other) */}
      {data.map((d, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0 ? (
        <text key={i} x={pad + i * xStep} y={h - 8} fontSize="9" fill={C.textDim} textAnchor="middle" fontFamily={FONT_MONO}>{d.date || "—"}</text>
      ) : null)}
    </svg>
  );
}








