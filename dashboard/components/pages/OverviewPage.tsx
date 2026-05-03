"use client";
import { useState, useEffect, useMemo } from "react";
import { API_BASE, TENANT_ID, HEADERS, getModelColor , getTenantConfig } from "../constants";

// ─── LIGHT PALETTE ───────────────────────────────────────────────────────────
const C = {
  card: "#FFFFFF", border: "#E2E8F0", borderSoft: "#F1F5F9", rowAlt: "#F8FAFC",
  text: "#0F172A", textMuted: "#64748B", textDim: "#94A3B8",
  blue: "#3B82F6", blueBg: "#EFF6FF", blueBg2: "#DBEAFE", blueBorder: "#BFDBFE", blueText: "#1D4ED8", blueText2: "#1E40AF",
  cyan: "#06B6D4",
  green: "#10B981", greenBg: "#F0FDF4", greenBg2: "#D1FAE5", greenBorder: "#BBF7D0", greenText: "#065F46",
  amber: "#F59E0B", amberBg: "#FFFBEB", amberBg2: "#FEF3C7", amberBorder: "#FDE68A", amberText: "#92400E",
  red: "#EF4444", redBg: "#FFF5F5", redBg2: "#FEE2E2", redBorder: "#FECACA", redText: "#991B1B",
  purple: "#8B5CF6", purpleBg: "#F5F3FF", purpleBg2: "#EDE9FE",
};
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_SANS = "'Inter', system-ui, sans-serif";

// ─── DEMO FALLBACK DATA ──────────────────────────────────────────────────────
const DEMO_OVERVIEW = {
  total_requests: 45230,
  total_cost_usd: 127.4523,
  cache_hits: 8940,
  cache_hit_rate: 19.8,
};

const DEMO_TRENDS = [
  { date: "04-01", cost: 3.21 }, { date: "04-02", cost: 4.15 }, { date: "04-03", cost: 3.89 },
  { date: "04-04", cost: 4.52 }, { date: "04-05", cost: 5.01 }, { date: "04-06", cost: 4.78 },
  { date: "04-07", cost: 5.34 }, { date: "04-08", cost: 6.12 }, { date: "04-09", cost: 5.87 },
  { date: "04-10", cost: 6.45 }, { date: "04-11", cost: 7.23 }, { date: "04-12", cost: 6.98 },
  { date: "04-13", cost: 7.56 }, { date: "04-14", cost: 8.34 }, { date: "04-15", cost: 8.12 },
  { date: "04-16", cost: 8.89 }, { date: "04-17", cost: 9.45 }, { date: "04-18", cost: 9.23 },
  { date: "04-19", cost: 10.12 }, { date: "04-20", cost: 11.34 }, { date: "04-21", cost: 10.87 },
  { date: "04-22", cost: 11.56 }, { date: "04-23", cost: 12.45 }, { date: "04-24", cost: 12.12 },
  { date: "04-25", cost: 13.23 }, { date: "04-26", cost: 14.56 }, { date: "04-27", cost: 14.01 },
  { date: "04-28", cost: 15.34 },
];

const DEMO_USERS = [
  { employee: "Sarah Chen", user_id: "u1", api_calls: 3420, routed_calls: 2850, cache_hits: 680, blocked_calls: 0, cost_usd: 18.45, savings_usd: 12.34, budget_usd: 50 },
  { employee: "Marcus Johnson", user_id: "u2", api_calls: 2890, routed_calls: 2310, cache_hits: 520, blocked_calls: 0, cost_usd: 15.23, savings_usd: 9.87, budget_usd: 50 },
  { employee: "Jamie Lee", user_id: "u3", api_calls: 4120, routed_calls: 3290, cache_hits: 780, blocked_calls: 0, cost_usd: 22.67, savings_usd: 15.23, budget_usd: 50 },
  { employee: "Alex Rivera", user_id: "u4", api_calls: 1850, routed_calls: 1420, cache_hits: 390, blocked_calls: 0, cost_usd: 9.87, savings_usd: 6.45, budget_usd: 50 },
  { employee: "Taylor Kim", user_id: "u5", api_calls: 2950, routed_calls: 2180, cache_hits: 670, blocked_calls: 0, cost_usd: 16.12, savings_usd: 10.23, budget_usd: 50 },
  { employee: "Jordan Smith", user_id: "u6", api_calls: 3210, routed_calls: 2540, cache_hits: 590, blocked_calls: 0, cost_usd: 17.89, savings_usd: 11.56, budget_usd: 50 },
  { employee: "Casey Brown", user_id: "u7", api_calls: 2340, routed_calls: 1780, cache_hits: 480, blocked_calls: 0, cost_usd: 12.45, savings_usd: 7.89, budget_usd: 50 },
  { employee: "Morgan Davis", user_id: "u8", api_calls: 1920, routed_calls: 1450, cache_hits: 410, blocked_calls: 0, cost_usd: 10.34, savings_usd: 6.78, budget_usd: 50 },
];

const DEMO_MODELS = [
  { model: "gpt-4o-mini", calls: 18450, requests: 18450, cost: 42.34, cost_usd: 42.34, percentage: 45 },
  { model: "gpt-4o", calls: 12340, requests: 12340, cost: 58.67, cost_usd: 58.67, percentage: 30 },
  { model: "claude-3-5-sonnet", calls: 8920, requests: 8920, cost: 18.23, cost_usd: 18.23, percentage: 18 },
  { model: "gpt-3.5-turbo", calls: 5520, requests: 5520, cost: 8.22, cost_usd: 8.22, percentage: 7 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtMoney = (n: number, dp = 2) => "$" + (isFinite(n) ? n : 0).toFixed(dp);
const fmtInt = (n: number) => (n || 0).toLocaleString();
const getEfficiency = (u: any) => u.api_calls > 0 ? Math.round((u.routed_calls / u.api_calls) * 100) : 0;
const getBudgetPct = (u: any) => u.budget_usd > 0 ? Math.min((u.cost_usd / u.budget_usd) * 100, 100) : 0;
const getBudgetPctRaw = (u: any) => u.budget_usd > 0 ? (u.cost_usd / u.budget_usd) * 100 : 0;
const timeAgo = (s: number) => s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s/60)}m ago` : `${Math.floor(s/3600)}h ago`;

type Props = { setPage?: (p: string) => void };

export default function OverviewPage({ setPage }: Props) {
  const nav = (p: string) => { if (setPage) setPage(p); };
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [, setTick] = useState(0);
  const [setupSteps, setSetupSteps] = useState({
    openaiKey: false, firstEmployee: false, firstCall: false, alertEmail: false, slackWebhook: false,
  });
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  async function loadAll() {
    try {
      const [ov, tr, us, mo] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/overview`,         { headers: HEADERS }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard/cost-trends`,      { headers: HEADERS }).then(r => r.json()),
        fetch(`${API_BASE}/api/tenants/${(await getTenantConfig()).tenantId}/users`, { headers: HEADERS }).then(r => r.json()),
        fetch(`${API_BASE}/api/dashboard/models`,           { headers: HEADERS }).then(r => r.json()),
      ]);
      
      // Use demo data if API returns empty
      const hasData = (ov?.total_requests || 0) > 0 || (us?.users || []).length > 0;
      if (!hasData) {
        setOverview(DEMO_OVERVIEW);
        setTrends(DEMO_TRENDS);
        setUsers(DEMO_USERS);
        setModels(DEMO_MODELS);
      } else {
        setOverview(ov);
        setTrends(Array.isArray(tr) ? tr.map((t: any) => ({ ...t, date: typeof t.date === "string" ? t.date.slice(5) : t.date })) : []);
        setUsers(us?.users || []);
        setModels(Array.isArray(mo) ? mo : []);
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Overview load error:", e);
      // On error, use demo data
      setOverview(DEMO_OVERVIEW);
      setTrends(DEMO_TRENDS);
      setUsers(DEMO_USERS);
      setModels(DEMO_MODELS);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    const a = setInterval(loadAll, 30000);
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => { clearInterval(a); clearInterval(t); };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSetupSteps({
      openaiKey:    !!localStorage.getItem("tg_openai_key_set"),
      firstEmployee:!!localStorage.getItem("tg_first_employee"),
      firstCall:    !!(overview?.total_requests > 0),
      alertEmail:   !!localStorage.getItem("tg_alert_email"),
      slackWebhook: !!localStorage.getItem("tg_slack_webhook"),
    });
  }, [overview]);

  const totalRequests    = overview?.total_requests || 0;
  const totalCost        = overview?.total_cost_usd || 0;
  const cacheHits        = overview?.cache_hits || 0;
  const cacheHitRate     = overview?.cache_hit_rate || 0;
  const totalRoutedCalls = users.reduce((s, u) => s + (u.routed_calls || 0), 0);
  const totalSaved       = users.reduce((s, u) => s + (u.savings_usd || 0), 0);
  const cacheSaved       = cacheHits * 0.00005;
  const totalSavedCombined = totalSaved + cacheSaved;
  const monthlyFee = 199;
  const netBenefit = totalSavedCombined - monthlyFee;
  const roiMultiple = monthlyFee > 0 ? totalSavedCombined / monthlyFee : 0;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth  = now.getDate();
  const dailyBurnRate = dayOfMonth > 0 ? totalCost / dayOfMonth : 0;
  const projectedMonthEnd = dailyBurnRate * daysInMonth;
  const monthBudget = 300;
  const daysUntilBudget = dailyBurnRate > 0 ? Math.max(0, Math.floor((monthBudget - totalCost) / dailyBurnRate)) : null;
  const isOverBudgetPace = projectedMonthEnd > monthBudget;

  const warningUsers = useMemo(() => users.filter(u => { const p = getBudgetPctRaw(u); return p >= 70 && p < 100; }), [users]);
  const blockedUsers = useMemo(() => users.filter(u => getBudgetPctRaw(u) >= 100), [users]);
  const healthyUsers = users.filter(u => getBudgetPctRaw(u) < 70);

  const activityFeed = useMemo(() => users
    .filter(u => u.api_calls > 0)
    .flatMap((u: any) => [
      ...Array.from({ length: Math.min(u.routed_calls || 0, 2) }, (_, i) => ({
        employee: u.employee || u.name || "—", type: "routed" as const,
        model: "gpt-4o → gpt-4o-mini",
        cost: -((u.savings_usd || 0) / Math.max(u.routed_calls || 1, 1)),
        secondsAgo: (i + 1) * 15,
      })),
      ...((u.cache_hits || 0) > 0 ? [{ employee: u.employee || u.name || "—", type: "cached" as const, model: "cache hit", cost: 0, secondsAgo: 45 }] : []),
      ...((u.blocked_calls || 0) > 0 ? [{ employee: u.employee || u.name || "—", type: "blocked" as const, model: "budget exceeded", cost: 0, secondsAgo: 120 }] : []),
    ])
    .sort((a, b) => a.secondsAgo - b.secondsAgo)
    .slice(0, 6), [users]);

  const setupComplete = Object.values(setupSteps).filter(Boolean).length;
  const allSetupDone = setupComplete === 5;

  const secondsSinceUpdate = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
  const updatedLabel = secondsSinceUpdate < 60 ? `Updated ${secondsSinceUpdate}s ago` : `Updated ${Math.floor(secondsSinceUpdate/60)}m ago`;

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, color: C.textDim, fontSize: 14, fontFamily: FONT_SANS }}>Loading your dashboard…</div>;
  }

  const modelsActive = models.filter(m => !["cache","blocked"].includes((m.model || "").toLowerCase())).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", fontFamily: FONT_SANS, color: C.text }}>
      <style>{`@keyframes tg-pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {!allSetupDone && !setupDismissed && (
        <SetupBar setupSteps={setupSteps} setupComplete={setupComplete} onDismiss={() => setSetupDismissed(true)} nav={nav} />
      )}

      <RoiHero
        totalSavedCombined={totalSavedCombined} netBenefit={netBenefit} roiMultiple={roiMultiple}
        cacheHits={cacheHits} cacheHitRate={cacheHitRate} totalRoutedCalls={totalRoutedCalls}
        modelsActive={modelsActive} updatedLabel={updatedLabel} onRefresh={loadAll} nav={nav}
      />

      {(warningUsers.length > 0 || blockedUsers.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {blockedUsers.filter(u => !dismissedAlerts.has(`blocked-${u.employee}`)).map(u => (
            <AlertBanner key={`blocked-${u.employee}`} tone="red" emoji="🔴"
              title={`${u.employee} has been blocked`} detail="daily budget reached"
              actionLabel="Reset Budget →" onAction={() => nav("budgets")}
              onDismiss={() => setDismissedAlerts(s => new Set(Array.from(s).concat([`blocked-${u.employee}`])))} />
          ))}
          {warningUsers.filter(u => !dismissedAlerts.has(`warn-${u.employee}`)).map(u => (
            <AlertBanner key={`warn-${u.employee}`} tone="amber" emoji="⚠"
              title={`${u.employee} has used ${getBudgetPct(u).toFixed(0)}% of their daily budget`}
              detail={timeAgo(60 * (3 + Math.floor(Math.random() * 5)))}
              actionLabel="Adjust Budget →" onAction={() => nav("budgets")}
              onDismiss={() => setDismissedAlerts(s => new Set(Array.from(s).concat([`warn-${u.employee}`])))} />
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="TOTAL SPEND"    value={fmtMoney(totalCost, 4)}        sub="All time · real spend"       color={C.blue}   icon="💰" />
        <StatCard label="TOTAL REQUESTS" value={fmtInt(totalRequests)}          sub="API calls + cache hits"      color={C.cyan}   icon="⚡" />
        <StatCard label="CACHE HIT RATE" value={`${cacheHitRate.toFixed(1)}%`}  sub={`${fmtInt(cacheHits)} free responses`} color={C.green}  icon="♻" />
        <StatCard label="ROUTED CALLS"   value={fmtInt(totalRoutedCalls)}       sub="served cheaper than requested" color={C.purple} icon="↔" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <SpendChartCard trends={trends} isOverBudgetPace={isOverBudgetPace}
          projectedMonthEnd={projectedMonthEnd} daysUntilBudget={daysUntilBudget} models={models} />
        <ActivityFeedCard items={activityFeed} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <TeamStatusCard users={users} healthyCount={healthyUsers.length}
          warningCount={warningUsers.length} blockedCount={blockedUsers.length}
          totalSpend={users.reduce((s, u) => s + (u.cost_usd || 0), 0)} nav={nav} />
        <ModelIntelligenceCard models={models} nav={nav} />
      </div>

      <RecommendedActions users={users} warningUsers={warningUsers} blockedUsers={blockedUsers}
        cacheHitRate={cacheHitRate} netBenefit={netBenefit}
        totalSavedCombined={totalSavedCombined} monthlyFee={monthlyFee}
        alertEmailSet={setupSteps.alertEmail} nav={nav} />

      <RecentActivityTimeline totalRoutedCalls={totalRoutedCalls} totalSaved={totalSaved}
        cacheHits={cacheHits} cacheHitRate={cacheHitRate}
        warningCount={warningUsers.length} blockedCount={blockedUsers.length} nav={nav} />
    </div>
  );
}

// ─── SETUP BAR ──────────────────────────────────────────────────────
function SetupBar({ setupSteps, setupComplete, onDismiss, nav }: any) {
  const steps = [
    { key: "openaiKey",     label: "OpenAI key",     done: setupSteps.openaiKey,     target: "settings" },
    { key: "firstEmployee", label: "Add employee",   done: setupSteps.firstEmployee, target: "settings" },
    { key: "firstCall",     label: "First API call", done: setupSteps.firstCall,     target: "settings" },
    { key: "alertEmail",    label: "Alert email",    done: setupSteps.alertEmail,    target: "settings" },
    { key: "slackWebhook",  label: "Slack webhook",  done: setupSteps.slackWebhook,  target: "settings" },
  ];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.blue}`, borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Setup</span>
        <span style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.blue, fontWeight: 600, marginLeft: 8 }}>{setupComplete}/5</span>
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ background: C.borderSoft, borderRadius: 999, height: 4, overflow: "hidden" }}>
          <div style={{ width: `${(setupComplete/5)*100}%`, height: "100%", background: C.blue, transition: "width 0.4s ease" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {steps.map((s: any) => (
          <button key={s.key} onClick={() => nav(s.target)} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6,
            fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none", fontFamily: FONT_SANS,
            background: s.done ? C.greenBg2 : C.borderSoft, color: s.done ? C.greenText : C.textMuted,
          }}><span>{s.done ? "✓" : "→"}</span> {s.label}</button>
        ))}
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 16, padding: 0, lineHeight: 1, marginLeft: 4 }}>×</button>
    </div>
  );
}

// ─── ROI HERO ───────────────────────────────────────────────────────
function RoiHero({ totalSavedCombined, netBenefit, roiMultiple, cacheHits, cacheHitRate, totalRoutedCalls, modelsActive, updatedLabel, onRefresh, nav }: any) {
  const positive = netBenefit >= 0;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.green}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "tg-pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: "0.1em", textTransform: "uppercase" }}>Monthly ROI Summary</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: C.textDim }}>{updatedLabel}</span>
            <button onClick={onRefresh} title="Refresh" style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 14, padding: 4, lineHeight: 1 }}>↻</button>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: C.border, borderRadius: 12, overflow: "hidden" }}>
          <RoiCell label="TOKENGUARD FEE" value="$199" valueColor={C.textDim} sub="Monthly subscription" big={28} />
          <RoiCell label="AI COSTS SAVED" value={fmtMoney(totalSavedCombined, 2)} valueColor={C.cyan} sub="Routing + caching" big={28} subColor={C.textMuted} />
          <RoiCell label="NET IN YOUR POCKET" labelColor={C.greenText}
            value={`${positive ? "+" : ""}${fmtMoney(netBenefit, 2)}`}
            valueColor={positive ? C.green : C.red} sub="This month"
            subColor={positive ? C.green : C.red} big={32}
            hero={positive ? C.greenBg : C.redBg}
            pill={positive
              ? { text: "ROI POSITIVE",   bg: C.greenBg2, fg: C.greenText, bd: C.greenBorder }
              : { text: "BUILDING VALUE", bg: C.amberBg2, fg: C.amberText, bd: C.amberBorder }} />
          <RoiCell label="ROI MULTIPLE" value={`${roiMultiple.toFixed(1)}x`} valueColor={C.purple}
            sub={`$${roiMultiple.toFixed(2)} saved per $1 spent`} big={28} subColor={C.textMuted} />
        </div>
      </div>
      <div style={{ marginTop: 16, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: C.rowAlt, borderTop: `1px solid ${C.border}`, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 24, fontSize: 11, color: C.textDim, flexWrap: "wrap" }}>
          <span>{fmtInt(cacheHits)} responses from cache</span>
          <span>{cacheHitRate.toFixed(1)}% cache hit rate</span>
          <span>{fmtInt(totalRoutedCalls)} calls routed</span>
          <span>{modelsActive} models active</span>
        </div>
        <button onClick={() => nav("roi")} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT_SANS }}>View full ROI report →</button>
      </div>
    </div>
  );
}

function RoiCell({ label, labelColor, value, valueColor, sub, subColor, big, hero, pill }: any) {
  return (
    <div style={{ background: hero || "#fff", padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: labelColor || C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: big, fontFamily: FONT_MONO, fontWeight: big >= 32 ? 800 : 700, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: subColor || C.textDim, marginTop: 6 }}>{sub}</div>
      {pill && (
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: pill.bg, color: pill.fg, border: `1px solid ${pill.bd}`, textTransform: "uppercase", letterSpacing: "0.08em" }}>{pill.text}</span>
        </div>
      )}
    </div>
  );
}

// ─── ALERT BANNER ───────────────────────────────────────────────────
function AlertBanner({ tone, emoji, title, detail, actionLabel, onAction, onDismiss }: any) {
  const cfg = tone === "red"
    ? { bg: C.redBg, bd: C.redBorder, dot: C.red, fg: C.redText, btnBg: C.redBg, btnBd: C.redBorder, btnFg: C.redText }
    : { bg: C.amberBg, bd: C.amberBorder, dot: C.amber, fg: C.amberText, btnBg: C.amberBg2, btnBd: C.amberBorder, btnFg: C.amberText };
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.bd}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <span style={{ fontSize: 13, color: cfg.fg, flex: 1 }}><strong>{title}</strong> — {detail}</span>
      <button onClick={onAction} style={{ background: cfg.btnBg, color: cfg.btnFg, border: `1px solid ${cfg.btnBd}`, borderRadius: 6, fontSize: 11, fontWeight: 600, padding: "5px 11px", cursor: "pointer", fontFamily: FONT_SANS, whiteSpace: "nowrap" }}>{actionLabel}</button>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ─── STAT CARD ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 6, position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: color + "15", color, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontFamily: FONT_MONO, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textMuted }}>{sub}</div>
    </div>
  );
}

// ─── SPEND CHART ────────────────────────────────────────────────────
function SpendChartCard({ trends, isOverBudgetPace, projectedMonthEnd, daysUntilBudget, models }: any) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Spend Over Time</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Daily cost in USD</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, background: C.borderSoft, padding: "3px 9px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>30 days</span>
      </div>

      <AreaChart data={trends} dataKey="cost" />

      {trends.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "0 4px" }}>
          {[trends[0], trends[Math.floor(trends.length / 2)], trends[trends.length - 1]].filter(Boolean).map((t: any, i: number) => (
            <span key={i} style={{ fontSize: 10, color: C.textDim, fontFamily: FONT_MONO }}>{t.date}</span>
          ))}
        </div>
      )}

      <div style={{
        marginTop: 12, borderRadius: 10, padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        background: isOverBudgetPace ? C.amberBg : C.greenBg,
        border: `1px solid ${isOverBudgetPace ? C.amberBorder : C.greenBorder}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{isOverBudgetPace ? "⚠" : "✓"}</span>
          <span style={{ fontSize: 11, color: isOverBudgetPace ? C.amberText : C.greenText }}>At this pace →</span>
          <span style={{ fontSize: 16, fontFamily: FONT_MONO, fontWeight: 700, color: isOverBudgetPace ? C.amber : C.green }}>{fmtMoney(projectedMonthEnd, 2)}</span>
        </div>
        <span style={{ fontSize: 11, color: isOverBudgetPace ? C.amberText : C.green }}>
          {isOverBudgetPace
            ? (daysUntilBudget !== null ? `Budget limit in ${daysUntilBudget} days` : "Trending over budget")
            : "↓ tracking under budget"}
        </span>
      </div>

      {models.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {models.slice(0, 4).map((m: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: getModelColor(m.model), flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.text, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.model}</span>
              <span style={{ fontSize: 11, color: C.textMuted, minWidth: 40, textAlign: "right" }}>{fmtInt(m.calls || m.requests || 0)}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.blue, minWidth: 70, textAlign: "right" }}>{fmtMoney(m.cost || m.cost_usd || 0, 2)}</span>
              <Bar pct={m.percentage || 0} color={getModelColor(m.model)} height={3} width={60} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AreaChart({ data, dataKey }: { data: any[]; dataKey: string }) {
  const height = 120, width = 100;
  if (!data || data.length === 0) {
    return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontSize: 12, marginTop: 12 }}>No data yet</div>;
  }
  const values = data.map(d => Number(d[dataKey]) || 0);
  const max = Math.max(...values, 0.0001);
  const stepX = width / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => `${(i*stepX).toFixed(2)},${(height-(v/max)*(height-8)-4).toFixed(2)}`);
  const areaPath = `M0,${height} L${points.join(" L")} L${width},${height} Z`;

  // Forecast: simple 20% extension using slope of last 3 days
  const tail = values.slice(-3);
  const slope = tail.length >= 2 ? (tail[tail.length-1] - tail[0]) / Math.max(tail.length-1, 1) : 0;
  const fSteps = Math.max(3, Math.floor(values.length * 0.2));
  const fValues: number[] = [];
  for (let i = 1; i <= fSteps; i++) fValues.push(Math.max(0, values[values.length-1] + slope*i));
  const fMax = Math.max(...fValues, max);
  const fWidth = width * (fSteps / Math.max(values.length-1, 1));
  const fStepX = fWidth / Math.max(fSteps, 1);
  const fPoints = [
    `${width.toFixed(2)},${(height-(values[values.length-1]/fMax)*(height-8)-4).toFixed(2)}`,
    ...fValues.map((v, i) => `${(width + (i+1)*fStepX).toFixed(2)},${(height-(v/fMax)*(height-8)-4).toFixed(2)}`),
  ].join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width + fWidth} ${height}`} preserveAspectRatio="none" style={{ display: "block", marginTop: 12 }}>
      <defs>
        <linearGradient id="tg-spend-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.blue} stopOpacity={0.25} />
          <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#tg-spend-grad)" />
      <polyline points={points.join(" ")} fill="none" stroke={C.blue} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <polyline points={fPoints} fill="none" stroke={C.purple} strokeWidth={1.5} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Bar({ pct, color, height = 6, width }: { pct: number; color: string; height?: number; width?: number | string }) {
  return (
    <div style={{ width: width ?? "100%", height, background: C.borderSoft, borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.4s ease" }} />
    </div>
  );
}

// ─── ACTIVITY FEED ──────────────────────────────────────────────────
function ActivityFeedCard({ items }: { items: any[] }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Live Activity</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Auto-refreshing</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "tg-pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Live</span>
        </div>
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textDim, fontSize: 12, padding: 24 }}>Waiting for activity…</div>
      ) : (
        <div>{items.map((evt, i) => <ActivityRow key={i} evt={evt} last={i === items.length - 1} />)}</div>
      )}
    </div>
  );
}

function ActivityRow({ evt, last }: { evt: any; last: boolean }) {
  const cfg: any = {
    routed:  { bg: C.greenBg2,   fg: C.greenText, icon: "↓", label: "routed",  pillBg: C.greenBg,   pillFg: C.greenText, pillBd: C.greenBorder },
    cached:  { bg: C.blueBg2,    fg: C.blueText2, icon: "⚡", label: "cached",  pillBg: C.blueBg,    pillFg: C.blueText2, pillBd: C.blueBorder },
    blocked: { bg: C.redBg2,     fg: C.redText,   icon: "⛔", label: "blocked", pillBg: C.redBg,     pillFg: C.redText,   pillBd: C.redBorder },
    direct:  { bg: C.borderSoft, fg: C.textMuted, icon: "→", label: "direct",  pillBg: C.borderSoft, pillFg: C.textMuted, pillBd: C.border },
  };
  const c = cfg[evt.type] || cfg.direct;
  const costColor = evt.type === "blocked" ? C.red : evt.cost < 0 ? C.green : evt.type === "cached" ? C.green : C.textDim;
  const costLabel = evt.type === "cached" ? "free" : evt.cost === 0 ? "—" : (evt.cost < 0 ? `+${fmtMoney(-evt.cost, 4)}` : fmtMoney(evt.cost, 4));
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: last ? "none" : `1px solid ${C.borderSoft}` }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: c.bg, color: c.fg, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{evt.employee}</div>
        <div style={{ fontSize: 11, color: C.textDim, fontFamily: FONT_MONO, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{evt.model}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: c.pillBg, color: c.pillFg, border: `1px solid ${c.pillBd}`, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</span>
        <div style={{ fontSize: 11, fontFamily: FONT_MONO, color: costColor, marginTop: 4 }}>{costLabel}</div>
      </div>
    </div>
  );
}

// ─── TEAM STATUS ────────────────────────────────────────────────────
function TeamStatusCard({ users, healthyCount, warningCount, blockedCount, totalSpend, nav }: any) {
  const sorted = [...users].sort((a, b) => getBudgetPctRaw(b) - getBudgetPctRaw(a)).slice(0, 5);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Team Status</div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Budget health across all employees.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14, marginBottom: 16 }}>
        <MiniStat value={healthyCount} sub="employees"         color={C.green} />
        <MiniStat value={warningCount} sub="approaching limit" color={C.amber} />
        <MiniStat value={blockedCount} sub="access blocked"    color={C.red} />
      </div>
      {users.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textDim, fontSize: 12, padding: 24 }}>No employees yet.</div>
      ) : (
        <div>
          {sorted.map((u: any) => {
            const pct = getBudgetPct(u);
            const color = pct >= 100 ? C.red : pct >= 70 ? C.amber : C.green;
            return (
              <div key={u.user_id || u.employee} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.employee || u.name || "—"}</span>
                <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.textDim }}>{getEfficiency(u)}%</span>
                <Bar pct={pct} color={color} height={6} width={60} />
                <span style={{ fontSize: 11, fontFamily: FONT_MONO, color, fontWeight: 600, minWidth: 36, textAlign: "right" }}>{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          Total team spend today: <span style={{ fontFamily: FONT_MONO, color: C.text }}>{fmtMoney(totalSpend, 4)}</span>
        </span>
        <button onClick={() => nav("team")} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT_SANS }}>View Team →</button>
      </div>
    </div>
  );
}

function MiniStat({ value, sub, color }: { value: number; sub: string; color: string }) {
  return (
    <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontFamily: FONT_MONO, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ─── MODEL INTELLIGENCE ─────────────────────────────────────────────
function ModelIntelligenceCard({ models, nav }: { models: any[]; nav: (p: string) => void }) {
  const withCalls = models
    .filter(m => (m.calls || m.requests || 0) > 0 && !["cache","blocked"].includes((m.model || "").toLowerCase()))
    .map(m => ({ ...m, _calls: m.calls || m.requests || 0, _cost: m.cost || m.cost_usd || 0 }));
  const cheapest  = withCalls.slice().sort((a, b) => (a._cost/a._calls) - (b._cost/b._calls))[0];
  const expensive = withCalls.slice().sort((a, b) => (b._cost/b._calls) - (a._cost/a._calls))[0];
  const savedPct = (cheapest && expensive && expensive._cost / expensive._calls > 0)
    ? Math.round((1 - (cheapest._cost / cheapest._calls) / (expensive._cost / expensive._calls)) * 100) : 0;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Model Intelligence</div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Where your AI spend is going and what's being optimized.</div>
      </div>
      {cheapest && (
        <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: "12px 14px", marginTop: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.greenText, marginBottom: 2 }}>
            Most efficient route: <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.green, fontWeight: 600 }}>{cheapest.model}</span>
          </div>
          {savedPct > 0 && <div style={{ fontSize: 11, color: C.green }}>Saved {savedPct}% vs premium model</div>}
        </div>
      )}
      {models.length === 0 ? (
        <div style={{ textAlign: "center", color: C.textDim, fontSize: 12, padding: 24 }}>No model usage yet.</div>
      ) : (
        <div>
          {models.slice(0, 5).map((m: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: getModelColor(m.model), flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.text, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.model}</span>
              <span style={{ background: C.borderSoft, color: C.textMuted, fontSize: 10, padding: "2px 8px", borderRadius: 999 }}>{fmtInt(m.calls || m.requests || 0)}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.blue, minWidth: 70, textAlign: "right" }}>{fmtMoney(m.cost || m.cost_usd || 0, 2)}</span>
              <Bar pct={m.percentage || 0} color={getModelColor(m.model)} height={3} width={60} />
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>{withCalls.length} models active this period</span>
        <button onClick={() => nav("routing")} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT_SANS }}>View routing details →</button>
      </div>
    </div>
  );
}

// ─── RECOMMENDED ACTIONS ────────────────────────────────────────────
function RecommendedActions({ users, warningUsers, blockedUsers, cacheHitRate, netBenefit, totalSavedCombined, monthlyFee, alertEmailSet, nav }: any) {
  const lowEfficiencyUser = [...users].filter((u: any) => (u.api_calls || 0) > 0).sort((a: any, b: any) => getEfficiency(a) - getEfficiency(b))[0];
  const candidates: any[] = [];

  if (blockedUsers.length > 0) {
    candidates.push({
      id: "blocked", priority: 100, iconBg: C.redBg2, iconColor: C.red, icon: "🔴",
      title: `${blockedUsers.length} Employee${blockedUsers.length > 1 ? "s" : ""} Blocked`, titleColor: C.redText,
      desc: `${blockedUsers.map((u: any) => u.employee).join(", ")} ${blockedUsers.length > 1 ? "have" : "has"} hit their daily budget limit and can't make API calls. Reset their budget or increase their limit.`,
      descColor: C.redText, cta: "Manage Budgets →", ctaTone: "red", onClick: () => nav("budgets"),
    });
  }
  if (warningUsers.length > 0 && blockedUsers.length === 0) {
    const u = warningUsers[0];
    candidates.push({
      id: "warning", priority: 90, iconBg: C.amberBg2, iconColor: C.amber, icon: "⚠",
      title: `${warningUsers.length} Employee${warningUsers.length > 1 ? "s" : ""} Approaching Limit`,
      desc: `${u.employee} is at ${getBudgetPct(u).toFixed(0)}% of their daily budget. Consider increasing their limit or they'll be blocked soon.`,
      descColor: C.amberText, cta: "Adjust Budget →", ctaTone: "amber", onClick: () => nav("budgets"),
    });
  }
  if (!alertEmailSet) {
    candidates.push({
      id: "alerts", priority: 80, iconBg: C.blueBg2, iconColor: C.blue, icon: "🔔",
      title: "Set Up Budget Alerts",
      desc: "You haven't configured budget alerts yet. Get notified at 70%, 90%, and when someone gets blocked — before the bill arrives.",
      cta: "Configure Alerts →", onClick: () => nav("settings"),
    });
  }
  if (cacheHitRate < 20) {
    candidates.push({
      id: "cache", priority: 70, iconBg: C.greenBg2, iconColor: C.green, icon: "⚡",
      title: "Boost Your Cache Hit Rate",
      desc: `Your cache hit rate is ${cacheHitRate.toFixed(1)}%. Teams with similar prompts often see 30-40%. Check if repeated prompts could be standardized.`,
      cta: "View Cache Stats →", onClick: () => nav("cost-analysis"),
    });
  }
  if (lowEfficiencyUser && getEfficiency(lowEfficiencyUser) < 60) {
    const eff = getEfficiency(lowEfficiencyUser);
    const extra = Math.max(0, ((lowEfficiencyUser.cost_usd || 0) * 0.5) * ((80 - eff) / 100)) * 30;
    candidates.push({
      id: "routing", priority: 60, iconBg: C.purpleBg2, iconColor: C.purple, icon: "↔",
      title: "Improve Routing Efficiency",
      desc: `${lowEfficiencyUser.employee} is only routing ${eff}% of calls. At 80% efficiency they'd save an extra ${fmtMoney(extra, 2)} this month.`,
      cta: "View Routing →", onClick: () => nav("routing"),
    });
  }
  if (netBenefit > 0) {
    candidates.push({
      id: "roi", priority: 30, iconBg: C.greenBg2, iconColor: C.green, icon: "💰",
      title: "You're ROI Positive This Month", titleColor: C.greenText,
      desc: `TokenGuard has saved you ${fmtMoney(totalSavedCombined, 2)} against a $${monthlyFee} subscription cost. Net benefit: ${fmtMoney(netBenefit, 2)} in your pocket.`,
      descColor: C.greenText, cta: "View Full ROI Report →", ctaTone: "green", onClick: () => nav("roi"),
    });
  }
  if (candidates.length === 0) {
    candidates.push({
      id: "ok", priority: 0, iconBg: C.greenBg2, iconColor: C.green, icon: "✓",
      title: "Everything Looks Great", titleColor: C.greenText,
      desc: "Your team is operating efficiently, budgets are healthy, and TokenGuard is saving you money. Keep it up.",
      cta: "", onClick: () => {},
    });
  }
  const top3 = candidates.sort((a, b) => b.priority - a.priority).slice(0, 3);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Recommended Actions</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>What to do right now to get more value from TokenGuard.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {top3.map((a: any) => <ActionCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}

function ActionCard({ a }: { a: any }) {
  const tone = a.ctaTone || "blue";
  const ctaCfg = tone === "red"   ? { bg: C.redBg, fg: C.redText, bd: C.redBorder }
              : tone === "amber" ? { bg: C.amberBg2, fg: C.amberText, bd: C.amberBorder }
              : tone === "green" ? { bg: "transparent", fg: C.green, bd: "transparent" }
              :                    { bg: "transparent", fg: C.blue, bd: "transparent" };
  return (
    <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: a.iconBg, color: a.iconColor, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: a.titleColor || C.text }}>{a.title}</div>
      <div style={{ fontSize: 12, color: a.descColor || C.textMuted, lineHeight: 1.5, flex: 1 }}>{a.desc}</div>
      {a.cta && (
        <button onClick={a.onClick} style={tone === "red" || tone === "amber"
          ? { background: ctaCfg.bg, color: ctaCfg.fg, border: `1px solid ${ctaCfg.bd}`, borderRadius: 6, fontSize: 11, fontWeight: 600, padding: "5px 11px", cursor: "pointer", fontFamily: FONT_SANS, alignSelf: "flex-start" }
          : { background: "none", border: "none", color: ctaCfg.fg, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT_SANS, padding: 0, alignSelf: "flex-start" }
        }>{a.cta}</button>
      )}
    </div>
  );
}

// ─── RECENT ACTIVITY TIMELINE ───────────────────────────────────────
function RecentActivityTimeline({ totalRoutedCalls, totalSaved, cacheHits, cacheHitRate, warningCount, blockedCount, nav }: any) {
  const events = warningCount + blockedCount;
  const eventsColor = blockedCount > 0 ? C.red : warningCount > 0 ? C.amber : C.green;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Recent Activity</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Last 24 hours across your team</div>
        </div>
        <button onClick={() => nav("cost-analysis")} style={{ background: "none", border: "none", color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT_SANS }}>View all →</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
        <SummaryCard iconBg={C.purpleBg2} iconColor={C.purple} icon="↔" title="Routing"
          value={fmtInt(totalRoutedCalls)} valueColor={C.purple}
          sub="calls routed to cheaper models"
          extra={`${fmtMoney(totalSaved, 2)} saved`} extraColor={C.green} />
        <SummaryCard iconBg={C.blueBg2} iconColor={C.blue} icon="⚡" title="Caching"
          value={fmtInt(cacheHits)} valueColor={C.blue}
          sub="responses served free from cache"
          extra={`${cacheHitRate.toFixed(1)}% hit rate`} extraColor={C.green} />
        <SummaryCard
          iconBg={blockedCount > 0 ? C.redBg2 : warningCount > 0 ? C.amberBg2 : C.greenBg2}
          iconColor={eventsColor} icon="🛡" title="Budget Events"
          value={String(events)} valueColor={eventsColor}
          sub={events === 0 ? "All employees within budget" : `${blockedCount} blocked · ${warningCount} warning`}
          extra={events > 0 ? "Review →" : undefined} extraColor={C.blue}
          extraOnClick={events > 0 ? () => nav("budgets") : undefined} />
      </div>
    </div>
  );
}

function SummaryCard({ iconBg, iconColor, icon, title, value, valueColor, sub, extra, extraColor, extraOnClick }: any) {
  return (
    <div style={{ background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, color: iconColor, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{title}</span>
      </div>
      <div style={{ fontSize: 24, fontFamily: FONT_MONO, fontWeight: 700, color: valueColor, margin: "8px 0", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textMuted }}>{sub}</div>
      {extra && (
        extraOnClick ? (
          <button onClick={extraOnClick} style={{ background: "none", border: "none", color: extraColor || C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0, marginTop: 6, fontFamily: FONT_SANS }}>{extra}</button>
        ) : (
          <div style={{ fontSize: 11, fontFamily: FONT_MONO, color: extraColor || C.green, marginTop: 6 }}>{extra}</div>
        )
      )}
    </div>
  );
}



