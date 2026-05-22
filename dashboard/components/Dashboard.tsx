"use client";

import { useState, useEffect, useRef } from "react";
import { COLORS, FONTS, API_BASE, API_KEY, TENANT_ID, HEADERS, getTenantConfig } from "./constants";
import { Logo } from "./brand";
import OverviewPage from "./pages/OverviewPage";
import CostAnalysisPage from "./pages/CostAnalysisPage";
import BudgetsPage from "./pages/BudgetsPage";
import ROIReportPage from "./pages/ROIReportPage";
import SettingsPage from "./pages/SettingsPage";
import RoutingPage from "./pages/RoutingPage";
import TeamPage from "./pages/TeamPage";

// ─── NAV ──────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "overview", label: "Overview", icon: "⚡" },
  { id: "cost-analysis", label: "Cost Analysis", icon: "📊" },
  { id: "budgets", label: "Budgets", icon: "💰" },
  { id: "roi", label: "ROI Report", icon: "📈" },
  { id: "routing", label: "Routing", icon: "↔" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Your AI cost summary at a glance" },
  "cost-analysis": { title: "Cost Analysis", subtitle: "Per-employee and per-model breakdown" },
  budgets: { title: "Budgets", subtitle: "Daily spend caps and enforcement" },
  roi: { title: "ROI Report", subtitle: "Return on your TokenGuard investment" },
  routing: { title: "Routing", subtitle: "Model optimization decisions and savings proof" },
  team: { title: "Team", subtitle: "Employee performance and efficiency" },
  settings: { title: "Settings", subtitle: "API keys, integrations, and notifications" },
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({
  page,
  setPage,
  overview,
  setAssistantInput,
  setAssistantOpen,
}: {
  page: string;
  setPage: (p: string) => void;
  overview: any;
  setAssistantInput: (s: string) => void;
  setAssistantOpen: (b: boolean) => void;
}) {
  const [sidebarUsers, setSidebarUsers] = useState<any[]>([]);
  const [proxyLatency, setProxyLatency] = useState<number | null>(null);

  // Calculate countdown to midnight UTC
  const getCountdown = () => {
    const now = new Date();
    const midnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const [countdown, setCountdown] = useState(getCountdown());

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch sidebar users
  useEffect(() => {
    const fetchUsers = async () => {
      const { tenantId, apiKey } = await getTenantConfig();
      if (!tenantId) return;
      fetch(`${API_BASE}/api/tenants/${tenantId}/users`, {
        headers: { Authorization: `Bearer ${apiKey || ""}` },
      })
        .then((r) => r.json())
        .then((d) => setSidebarUsers(d.users || d || []))
        .catch(() => {});
    };
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Proxy health
  useEffect(() => {
    const ping = async () => {
      const start = Date.now();
      try {
        await fetch(`${API_BASE}/health`);
        setProxyLatency(Date.now() - start);
      } catch {
        setProxyLatency(null);
      }
    };
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalSaved = overview?.savings_usd || 0;
  const todaySpend = overview?.total_cost_usd || 0;
  const budgetPct = Math.min((todaySpend / 200) * 100, 100);
  const warningCount = sidebarUsers.filter((u) => {
    const pct = u.budget_usd > 0 ? (u.cost_usd / u.budget_usd) * 100 : 0;
    return pct > 70;
  }).length;

  const getDot = (u: any) => {
    const pct = u.budget_usd > 0 ? (u.cost_usd / u.budget_usd) * 100 : 0;
    if (u.blocked) return "#EF4444";
    if (pct > 90) return "#EF4444";
    if (pct > 70) return "#F59E0B";
    return "#10B981";
  };

  const lastUser = sidebarUsers[0];

  return (
    <div
      style={{
        width: 240,
        background: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        flexShrink: 0,
        fontFamily: FONTS.sans,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 16px 12px" }}>
        <div style={{ marginBottom: 8 }}>
          <Logo size={28} />
        </div>
        {/* Net benefit pill */}
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: 20,
            padding: "4px 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: "#065F46",
            fontFamily: FONTS.mono,
            cursor: "pointer",
          }}
          onClick={() => {
            setAssistantInput(`Explain my savings of $${totalSaved.toFixed(2)} and how it was calculated`);
            setAssistantOpen(true);
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
          {totalSaved > 0 ? `+$${totalSaved.toFixed(2)} saved this month` : "Routing active"}
        </div>
      </div>

      {/* Spend widget */}
      <div
        style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", cursor: "pointer" }}
        onClick={() => {
          setAssistantInput(`I spent $${todaySpend.toFixed(4)} this period. Where is most of it going?`);
          setAssistantOpen(true);
        }}
      >
        <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>
          TODAY'S SPEND
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", fontFamily: FONTS.mono }}>
          ${todaySpend.toFixed(4)}
        </div>
        <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 6 }}>Resets in {countdown}</div>
        <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${budgetPct}%`,
              background: budgetPct > 90 ? "#EF4444" : budgetPct > 70 ? "#F59E0B" : "#10B981",
              borderRadius: 2,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: "12px 8px", overflowY: "auto", flex: 1 }}>
        <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, padding: "0 8px", marginBottom: 4 }}>
          PLATFORM
        </div>
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
                border: "none",
                background: active ? "#EFF6FF" : "transparent",
                color: active ? "#3B82F6" : "#64748B",
                fontWeight: active ? 600 : 400,
                position: "relative",
                textAlign: "left",
                marginBottom: 2,
                fontFamily: FONTS.sans,
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 4,
                    bottom: 4,
                    width: 2,
                    background: "#3B82F6",
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              )}
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === "budgets" && warningCount > 0 && (
                <span
                  style={{
                    background: "#FEF3C7",
                    color: "#92400E",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 10,
                  }}
                >
                  ⚠ {warningCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Team status */}
        {sidebarUsers.length > 0 && (
          <div style={{ marginTop: 16, padding: "0 8px" }}>
            <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6 }}>
              TEAM
            </div>
            {sidebarUsers.slice(0, 5).map((u, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: getDot(u), flexShrink: 0 }} />
                <span style={{ color: "#0F172A", fontWeight: 500, flex: 1 }}>{u.employee || u.name}</span>
                <span style={{ fontFamily: FONTS.mono, color: "#64748B", fontSize: 11 }}>
                  ${(u.cost_usd || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Provider health */}
        {(() => {
          const PROVIDER_LABELS: Record<string, string> = {
            openai: "OpenAI", anthropic: "Anthropic", google: "Google",
            azure: "Azure", mistral: "Mistral",
          };
          const connected = typeof window !== "undefined"
            ? Object.keys(PROVIDER_LABELS).filter(id => !!localStorage.getItem(`tg_provider_${id}`))
            : [];
          if (connected.length === 0) return null;
          return (
            <div style={{ marginTop: 12, padding: "0 8px" }}>
              <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6 }}>
                PROVIDERS
              </div>
              {connected.map((id) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 11 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
                  <span style={{ color: "#64748B", flex: 1 }}>{PROVIDER_LABELS[id]}</span>
                  <span style={{ fontSize: 10, color: "#10B981" }}>Connected</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Bottom */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", flexShrink: 0 }}>
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: 8,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#10B981",
              flexShrink: 0,
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#065F46", flex: 1 }}>Proxy Live</span>
          {proxyLatency !== null && (
            <span style={{ fontSize: 11, color: "#10B981", fontFamily: FONTS.mono }}>
              · {proxyLatency}ms
            </span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 3 }}>
            LAST CALL
          </div>
          <div style={{ fontSize: 10, color: "#64748B", fontFamily: FONTS.mono, lineHeight: 1.4 }}>
            {lastUser
              ? `${lastUser.employee || lastUser.name} · gpt-4o → mini · routed ↓`
              : "No calls yet"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [page, setPage] = useState("overview");
  const [overview, setOverview] = useState<any>(null);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [userBudgets, setUserBudgets] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  // AI Assistant
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<{ role: string; content: string }[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantTyping, setAssistantTyping] = useState(false);

  // FAB
  const [fabOpen, setFabOpen] = useState(false);
  const [copiedTooltip, setCopiedTooltip] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Status bar
  const [lastCall, setLastCall] = useState<any>(null);

  // Dismissed alerts
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Fetch overview
  useEffect(() => {
    const fetchOverview = () => {
      if (!TENANT_ID) return;
      fetch(`${API_BASE}/api/dashboard/overview`, { headers: HEADERS })
        .then((r) => r.json())
        .then(setOverview)
        .catch(() => {});
    };
    fetchOverview();
    const i = setInterval(fetchOverview, 30000);
    return () => clearInterval(i);
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const { tenantId, apiKey } = await getTenantConfig();
      if (!tenantId) return;
      fetch(`${API_BASE}/api/tenants/${tenantId}/users`, {
        headers: { Authorization: `Bearer ${apiKey || ""}` },
      })
        .then((r) => r.json())
        .then((d) => {
          const users = d.users || d || [];
          setTenantUsers(users);
          setUserBudgets(users);
          if (users.length > 0) setLastCall(users[0]);
        })
        .catch(() => {});
    };
    fetchUsers();
    const i = setInterval(fetchUsers, 15000);
    return () => clearInterval(i);
  }, []);

  // Fetch models
  useEffect(() => {
    if (!TENANT_ID) return;
    fetch(`${API_BASE}/api/dashboard/models`, { headers: HEADERS })
      .then((r) => r.json())
      .then((d) => setModels(d.models || d || []))
      .catch(() => {});
  }, []);

  // Close FAB on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // AI send
  const sendAssistantMessage = async (text: string) => {
    const userMsg = { role: "user", content: text };
    setAssistantMessages((prev) => Array.from(prev).concat([userMsg]));
    setAssistantInput("");
    setAssistantTyping(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are the TokenGuard Routing Intelligence Assistant — a financial advisor for AI costs, not a generic chatbot.

TENANT DATA (real numbers — always use these, never guess):
- Total AI spend this period: $${overview?.total_cost_usd?.toFixed(4) || "0"}
- Saved by TokenGuard routing: $${overview?.total_savings_usd?.toFixed(4) || "0"}
- Total API calls: ${overview?.total_requests || 0}
- Cache hit rate: ${overview?.cache_hit_rate?.toFixed(1) || "0"}%
- Avg response latency: ${overview?.avg_latency_ms?.toFixed(0) || "0"}ms
- Current page user is viewing: ${page}

EMPLOYEES (${tenantUsers.length} total):
${tenantUsers.map(u => `- ${u.employee}: $${(u.cost_usd||0).toFixed(4)} spent, ${u.api_calls||0} calls, ${u.routed_calls||0} routed, $${(u.savings_usd||0).toFixed(4)} saved, status: ${u.status}`).join('\n')}

MODELS IN USE:
${models.map(m => `- ${m.model}: $${(m.cost||0).toFixed(4)} (${m.percentage?.toFixed(0)||0}% of spend, ${m.requests||0} calls)`).join('\n')}

HOW TOKENGUARD ROUTING WORKS (explain this when asked):
TokenGuard scores every prompt across 7 signals before deciding which model to use: tool use (+3pts), code markers (+2pts), JSON mode (+1pt), token count (+1-2pts), conversation depth (+1-2pts), output length (+1pt), complexity keywords like "architect/implement/distributed" (+3pts).
Score ≤1 = route to efficient model. Score ≥5 = keep on premium model.
Routing stays within the same provider by default (OpenAI→OpenAI, Anthropic→Anthropic) to respect data governance.

PRICING (use for simulations — verified May 2026):
OpenAI:
- gpt-4.1: $2.00/M input, $8.00/M output (recommended production model, replaces gpt-4o)
- gpt-4o: $2.50/M input, $10.00/M output (legacy, still available)
- gpt-4.1-mini: $0.40/M input, $1.60/M output (replaces gpt-4o-mini for most tasks)
- gpt-4o-mini: $0.15/M input, $0.60/M output (legacy budget option)
- gpt-4.1-nano: $0.10/M input, $0.40/M output (cheapest OpenAI option)

Anthropic:
- claude-opus-4-6: $5.00/M input, $25.00/M output (was $15/$75 — 67% price drop)
- claude-sonnet-4-6: $3.00/M input, $15.00/M output
- claude-haiku-4-5: $1.00/M input, $5.00/M output

Google:
- gemini-2.5-pro: $1.25/M input, $10.00/M output
- gemini-2.5-flash: $0.15/M input, $0.60/M output
- gemini-2.5-flash-lite: $0.10/M input, $0.40/M output (cheapest major-provider model)

RULES:
1. Always cite specific employee names and dollar amounts from the data above
2. When you identify a saving opportunity, quantify it in dollars per month
3. When asked to simulate ("what if we moved to Haiku?"), calculate from actual call volumes above
4. Never make up numbers not in the data above
5. Be concise — 3-5 sentences max unless the question needs more
6. When the user is on a specific page, bias answers toward that page's data`,
          messages: [...assistantMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response.";
      setAssistantMessages((prev) => Array.from(prev).concat([{ role: "assistant", content: reply }]));
    } catch {
      setAssistantMessages((prev) => Array.from(prev).concat([{ role: "assistant", content: "Connection error. Please try again." }]));
    } finally {
      setAssistantTyping(false);
    }
  };

  // Alert bar users
  const alertUsers = userBudgets.filter((u) => {
    const pct = u.budget_usd > 0 ? (u.cost_usd / u.budget_usd) * 100 : 0;
    return (pct > 70 || u.blocked) && !dismissedAlerts.has(u.employee || u.name);
  });

  const pageMeta = PAGE_META[page] || { title: page, subtitle: "" };
  const companyName = typeof window !== "undefined"
    ? (localStorage.getItem("tg_company") || "")
    : "";

  const assistantChips = page === "routing"
    ? [
        "What's our routing rate and is it good?",
        "Which employees have the worst routing efficiency?",
        "How much would we save at 60% routing rate?",
        "Explain how the routing decision works",
      ]
    : page === "cost-analysis"
    ? [
        "Who spent the most this period?",
        "Simulate moving everything to Haiku",
        "Which model costs us the most?",
        "Which employee has the most untapped savings?",
      ]
    : page === "budgets"
    ? [
        "Who is closest to their budget limit?",
        "Should I increase any budgets?",
        "Which employee gets blocked most often?",
        "What budget would prevent all blocks?",
      ]
    : [
        "Are we wasting money anywhere?",
        "What's our projected spend this month?",
        "Which employee saves us the most?",
        "Simulate switching simple tasks to Haiku",
      ];

  const renderPage = () => {
    // Pages manage their own data fetching internally; props are passed for
    // pages that opt in to consuming dashboard-level state.
    const anyOverview: any = OverviewPage;
    const AnyOverview = anyOverview as any;
    const AnyBudgets = BudgetsPage as any;
    const AnyROI = ROIReportPage as any;
    switch (page) {
      case "overview":
        return <AnyOverview overview={overview} tenantUsers={tenantUsers} models={models} setPage={setPage} onStatClick={(message: string) => { setAssistantInput(message); setAssistantOpen(true); }} />;
      case "cost-analysis":
        return <CostAnalysisPage />;
      case "budgets":
        return <AnyBudgets userBudgets={userBudgets} setUserBudgets={setUserBudgets} nav={setPage} />;
      case "roi":
        return <AnyROI overview={overview} />;
      case "routing":
        return <RoutingPage />;
      case "team":
        return <TeamPage setPage={setPage} />;
      case "settings":
        return <SettingsPage />;
      default:
        return <AnyOverview overview={overview} tenantUsers={tenantUsers} models={models} setPage={setPage} onStatClick={(message: string) => { setAssistantInput(message); setAssistantOpen(true); }} />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#F8FAFC", fontFamily: FONTS.sans, overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar page={page} setPage={setPage} overview={overview} setAssistantInput={setAssistantInput} setAssistantOpen={setAssistantOpen} />

        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minWidth: 0, width: 0 }}>
          {/* Topbar */}
          <div
            style={{
              height: 56,
              background: "#FFFFFF",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{pageMeta.title}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                {companyName ? `${companyName} · ` : ""}{pageMeta.subtitle}
              </div>
            </div>
            <button
              onClick={() => setAssistantOpen(true)}
              style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}
            >
              ✦ Ask
            </button>
            <button
              onClick={() => setPage("settings")}
              style={{ background: "#3B82F6", color: "#FFF", border: "none", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}
            >
              + Add Employee
            </button>
            <button
              style={{ background: "transparent", border: "1px solid #E2E8F0", color: "#64748B", fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}
            >
              ⬇ Export
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 20, padding: "4px 10px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "pulse 2s infinite", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#065F46" }}>Live</span>
            </div>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <button onClick={() => { window.location.href = "/signin"; }} style={{ background: "transparent", border: "1px solid #E2E8F0", color: "#64748B", fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}>Sign out</button>
          </div>

          {/* Alert bar */}
          {alertUsers.map((u) => {
            const pct = u.budget_usd > 0 ? Math.round((u.cost_usd / u.budget_usd) * 100) : 0;
            const blocked = u.blocked || pct >= 100;
            const key = u.employee || u.name;
            return (
              <div
                key={key}
                style={{
                  background: blocked ? "#FFF5F5" : "#FFFBEB",
                  borderBottom: `1px solid ${blocked ? "#FECACA" : "#FDE68A"}`,
                  padding: "8px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                <span>{blocked ? "🔴" : "⚠️"}</span>
                <span style={{ color: blocked ? "#991B1B" : "#92400E" }}>
                  <strong>{key}</strong>{" "}
                  {blocked ? "has been blocked" : `has used ${pct}% of their daily budget`}
                </span>
                <button
                  onClick={() => setPage("budgets")}
                  style={{ marginLeft: "auto", background: "transparent", border: "none", color: blocked ? "#991B1B" : "#92400E", fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                >
                  {blocked ? "Reset Budget →" : "Adjust Budget →"}
                </button>
                <button
                  onClick={() => setDismissedAlerts((prev) => new Set(Array.from(prev).concat([key])))}
                  style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 24, width: "100%", minWidth: 0 }}>
            {renderPage()}
          </div>

          {/* Persistent status bar */}
          <div
            style={{
              height: 32,
              background: "#FFFFFF",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              gap: 10,
              flexShrink: 0,
              fontFamily: FONTS.mono,
              fontSize: 11,
            }}
          >
            <span
              style={{ width: 6, height: 6, borderRadius: "50%", background: lastCall ? "#10B981" : "#94A3B8", flexShrink: 0 }}
            />
            {lastCall && lastCall.api_calls > 0 ? (
              <span style={{ color: "#64748B" }}>
                Last call:{" "}
                <strong style={{ color: "#0F172A" }}>{lastCall.employee || lastCall.name}</strong>
                {" · "}
                <span style={{ color: "#10B981" }}>${(lastCall.cost_usd || 0).toFixed(6)}</span>
                {lastCall.savings_usd > 0 ? <span style={{ color: "#10B981" }}>{" · saved $"}{lastCall.savings_usd.toFixed(4)}</span> : null}
                {lastCall.routed_calls > 0 ? <span style={{ color: "#8B5CF6" }}>{" · "}{lastCall.routed_calls} routed</span> : null}
              </span>
            ) : (
              <span style={{ color: "#94A3B8" }}>
                No calls yet — make your first API call through the proxy
              </span>
            )}
            <span style={{ marginLeft: "auto", color: "#94A3B8", fontSize: 10 }}>Live · updates every 15s</span>
          </div>
        </div>
      </div>

      {/* Floating action button */}
      <div ref={fabRef} style={{ position: "fixed", bottom: 48, right: 24, zIndex: 50 }}>
        {fabOpen && (
          <div
            style={{
              position: "absolute",
              bottom: 56,
              right: 0,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              padding: 6,
              width: 190,
            }}
          >
            {[
              { icon: "👤", label: "Add Employee", action: () => { setPage("settings"); setFabOpen(false); } },
              {
                icon: "📋", label: copiedTooltip ? "Copied!" : "Copy Proxy URL", action: () => {
                  navigator.clipboard.writeText(API_BASE || "");
                  setCopiedTooltip(true);
                  setTimeout(() => setCopiedTooltip(false), 2000);
                }
              },
              { icon: "💰", label: "Adjust Budget", action: () => { setPage("budgets"); setFabOpen(false); } },
              { icon: "⬇", label: "Export CSV", action: () => setFabOpen(false) },
              { icon: "🔄", label: "Reset Budget", action: () => { setPage("budgets"); setFabOpen(false); } },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  border: "none",
                  color: "#0F172A",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setFabOpen((p) => !p)}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#3B82F6",
            border: "none",
            color: "#FFF",
            fontSize: 22,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>

      {/* AI Assistant panel */}
      {assistantOpen && (
        <div
          onClick={() => setAssistantOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 40 }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          background: "#FFFFFF",
          borderLeft: "1px solid #E2E8F0",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          transform: assistantOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>✦ AI Assistant</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Powered by Claude · {tenantUsers.length} employees · live data</div>
          </div>
          <button onClick={() => setAssistantOpen(false)} style={{ background: "transparent", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {/* Chips */}
        <div style={{ padding: "10px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {assistantChips.map((chip) => (
            <button
              key={chip}
              onClick={() => sendAssistantMessage(chip)}
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#64748B", cursor: "pointer" }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {assistantMessages.length === 0 && (
            <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", marginTop: 32 }}>
              Ask me anything about your AI usage and costs
            </div>
          )}
          {assistantMessages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "#3B82F6" : "#F8FAFC",
                color: m.role === "user" ? "#FFF" : "#0F172A",
                border: m.role === "assistant" ? "1px solid #E2E8F0" : "none",
                borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "2px 12px 12px 12px",
                padding: "8px 12px",
                maxWidth: "82%",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {m.content}
            </div>
          ))}
          {assistantTyping && (
            <div style={{ alignSelf: "flex-start", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "2px 12px 12px 12px", padding: "8px 14px" }}>
              <span style={{ color: "#94A3B8", fontSize: 13 }}>Typing…</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 8 }}>
          <input
            value={assistantInput}
            onChange={(e) => setAssistantInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && assistantInput.trim() && sendAssistantMessage(assistantInput)}
            placeholder="Ask about your AI costs..."
            style={{ flex: 1, border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: FONTS.sans }}
          />
          <button
            onClick={() => assistantInput.trim() && sendAssistantMessage(assistantInput)}
            disabled={!assistantInput.trim() || assistantTyping}
            style={{ background: "#3B82F6", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: (!assistantInput.trim() || assistantTyping) ? 0.5 : 1 }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}










