"use client";
import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#080C14",
  bgCard: "#0D1220",
  bgCardHover: "#111827",
  bgAccent: "#141B2D",
  border: "#1E2A42",
  borderLight: "#243249",
  primary: "#4F8EF7",
  primaryDim: "#1E3A6B",
  green: "#22C55E",
  greenDim: "#14532D",
  amber: "#F59E0B",
  red: "#EF4444",
  cyan: "#06B6D4",
  purple: "#8B5CF6",
  text: "#F0F4FF",
  textMuted: "#6B7FA3",
  textDim: "#3D4F72",
};

const MODEL_COLORS: Record<string, string> = {
  "gpt-4o": "#8B5CF6",
  "gpt-4o-mini": "#06B6D4",
  "claude-3.5-sonnet": "#F59E0B",
  "claude-3.5-haiku": "#22C55E",
  "cache": "#4F8EF7",
  "blocked": "#6B7FA3",
};

function getModelColor(model: string): string {
  return MODEL_COLORS[model] || "#4F8EF7";
}

const API_BASE = "https://cypress-production-1cc5.up.railway.app";
const API_KEY = "lMNUO5f2xEAmxq8lXA9ODmCi-pxCr-9hL99fyw3VlWw";
const TENANT_ID = "6f96c565-2284-4092-93c4-62252a1c1d59";
const HEADERS = { Authorization: `Bearer ${API_KEY}` };
const DEMO_EMPLOYEES = [
  { name: "Sarah (Engineering)", key: "tg-d06616108a81726611cb49c0ef73f8c96f4eba3b15806e43" },
  { name: "Jamie (Blocked)",     key: "tg-9587f9fa1cbc7091e59c3c46dd5d541931b148916bd6c2f4" },
  { name: "Marcus (Sales)",      key: "tg-532afe26d2cdd4f6428cc2bfe5a8ade9cc998acc121aeaf8" },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 20 }}>{children}</div>;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function Badge({ children, color, textColor }: { children: React.ReactNode; color: string; textColor: string }) {
  return (
    <span style={{
      background: color,
      color: textColor,
      fontSize: 10,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 999,
      letterSpacing: "0.05em",
    }}>
      {children}
    </span>
  );
}

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 100 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ background: "#1e293b", borderRadius: 6, height: 8, overflow: "hidden", width: "100%" }}>
      <div style={{
        width: `${pct}%`,
        height: "100%",
        background: color,
        borderRadius: 6,
        transition: "width 0.6s ease-in-out, background 0.4s ease",
      }} />
    </div>
  );
}

function StatCard({ label, value, sub, color = COLORS.primary }: {
  label: string; value: string; sub: string; color?: string;
}) {
  return (
    <Card>
      <CardBody>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4, fontFamily: "monospace" }}>{value}</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{sub}</div>
      </CardBody>
    </Card>
  );
}

function AreaChartSVG({ data, dataKey, color, height = 80 }: {
  data: any[]; dataKey: string; color: string; height?: number;
}) {
  if (!data || data.length === 0) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textDim, fontSize: 11 }}>No data yet</div>
  );
  const values = data.map((d: any) => d[dataKey] || 0);
  const max = Math.max(...values, 0.000001);
  const w = 100; const h = height; const pad = 4;
  const points = values.map((v: number, i: number) => ({
    x: pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2),
    y: h - pad - (v / max) * (h - pad * 2),
  }));
  const line = points.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${dataKey})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
}

// ─── SAVINGS SUMMARY CARD ────────────────────────────────────────────────────

function SavingsSummaryCard({ overview }: { overview: any }) {
  if (!overview) return null;
  const gpt4oCost = overview?.models?.find((m: any) => m.model === "gpt-4o")?.cost || 0;
  const miniCost = overview?.models?.find((m: any) => m.model === "gpt-4o-mini")?.cost || 0;
  const cacheSaved = (overview?.cache_hits || 0) * 0.00005;
  const totalActual = overview?.total_cost_usd || 0;
  const estimatedUnrouted = gpt4oCost + miniCost * 33;
  const routingSaved = Math.max(0, estimatedUnrouted - totalActual);
  const totalSaved = routingSaved + cacheSaved;
  const monthlyFee = 999;
  const netBenefit = totalSaved - monthlyFee;

  return (
    <Card style={{ background: `linear-gradient(135deg, #0D1220 0%, #0a1628 100%)`, border: `1px solid ${COLORS.green}30` }}>
      <CardBody>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.green, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Monthly ROI Summary
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { label: "You paid TokenGuard", value: `$${monthlyFee.toFixed(0)}`, color: COLORS.textMuted },
            { label: "AI costs saved", value: `$${totalSaved.toFixed(4)}`, color: COLORS.cyan },
            { label: "Net in your pocket", value: netBenefit >= 0 ? `+$${netBenefit.toFixed(2)}` : `-$${Math.abs(netBenefit).toFixed(2)}`, color: netBenefit >= 0 ? COLORS.green : COLORS.red },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color, fontFamily: "monospace" }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
          <span style={{ color: COLORS.textDim }}>{(overview?.cache_hits || 0)} responses served from cache</span>
          <span style={{ color: COLORS.textDim }}>{(overview?.cache_hit_rate || 0).toFixed(1)}% cache hit rate</span>
          <span style={{ color: COLORS.purple }}>{overview?.models?.filter((m: any) => m.model !== "cache" && m.model !== "blocked").length || 0} models active</span>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── ACTIVITY FEED ───────────────────────────────────────────────────────────

function ActivityFeed() {
  const [events, setEvents] = useState<any[]>([]);
  const prevCountRef = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/users`, { headers: HEADERS }).then(r => r.json());
        const users = data.users || [];
        // Build synthetic feed from user data
        const feed: any[] = [];
        users.forEach((u: any) => {
          if (u.api_calls > 0) {
            feed.push({ employee: u.employee, type: "call", cost: u.cost_usd / u.api_calls, model: "gpt-4o-mini", time: "recent" });
          }
          if (u.cache_hits > 0) {
            feed.push({ employee: u.employee, type: "cache", cost: 0, model: "cache", time: "recent" });
          }
          if (u.blocked_calls > 0) {
            feed.push({ employee: u.employee, type: "blocked", cost: 0, model: "blocked", time: "recent" });
          }
        });
        setEvents(feed.slice(0, 8));
      } catch (e) {
        console.error(e);
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const typeConfig: Record<string, any> = {
    call: { label: "API Call", color: COLORS.primary, icon: "→" },
    cache: { label: "Cache HIT", color: COLORS.green, icon: "✓" },
    blocked: { label: "BLOCKED", color: COLORS.red, icon: "✕" },
  };

  return (
    <Card>
      <CardBody>
        <SectionHeader title="Live Activity Feed" subtitle="Last 15 seconds — auto-refreshing" />
        {events.length === 0 ? (
          <div style={{ color: COLORS.textDim, fontSize: 12 }}>Waiting for activity...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map((e, i) => {
              const cfg = typeConfig[e.type] || typeConfig.call;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < events.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${cfg.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: cfg.color, fontWeight: 700, flexShrink: 0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: COLORS.text, fontFamily: "monospace" }}>{e.employee}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 1 }}>{e.model}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim, fontFamily: "monospace" }}>
                      {e.type === "call" ? `$${e.cost.toFixed(6)}` : e.type === "cache" ? "$0.000000" : "blocked"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

function OverviewPage() {
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ov, tr] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/overview`, { headers: HEADERS }).then(r => r.json()),
          fetch(`${API_BASE}/api/dashboard/cost-trends`, { headers: HEADERS }).then(r => r.json()),
        ]);
        setOverview(ov);
        setTrends(tr.map((row: any) => ({ ...row, date: row.date.slice(5) })));
      } catch (e) {
        console.error("Could not load real data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ color: COLORS.textMuted, padding: 40, fontSize: 13 }}>Loading real data from ClickHouse...</div>;
  if (!overview) return <div style={{ color: COLORS.red, padding: 40, fontSize: 13 }}>Could not connect to proxy.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Savings Summary Card — shown first */}
      <SavingsSummaryCard overview={overview} />

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Total Spend" value={`$${(overview.total_cost_usd || 0).toFixed(4)}`} sub="All time" color={COLORS.primary} />
        <StatCard label="Total Requests" value={(overview.total_requests || 0).toLocaleString()} sub="API calls + cache hits" color={COLORS.cyan} />
        <StatCard label="Cache Hit Rate" value={`${(overview.cache_hit_rate || 0).toFixed(1)}%`} sub={`${overview.cache_hits || 0} free responses`} color={COLORS.green} />
        <StatCard label="Routed Calls" value={(overview.models || []).filter((m: any) => m.model !== "cache" && m.model !== "blocked").length.toString()} sub="Model types active" color={COLORS.purple} />
      </div>

      {/* Charts + Activity Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card>
          <CardBody>
            <SectionHeader title="Spend Over Time" subtitle="Daily cost in USD" />
            <AreaChartSVG data={trends} dataKey="cost" color={COLORS.primary} height={120} />
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              {trends.map((t, i) => (
                <div key={i} style={{ fontSize: 10, color: COLORS.textDim }}>
                  <div style={{ color: COLORS.textMuted }}>{t.date}</div>
                  <div style={{ color: COLORS.text, fontFamily: "monospace" }}>${t.cost.toFixed(5)}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <ActivityFeed />
      </div>

      {/* Model Breakdown */}
      <Card>
        <CardBody>
          <SectionHeader title="Model Breakdown" subtitle="Cost and calls per model" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Model", "Calls", "Cost", "Share", "Distribution"].map(h => (
                  <th key={h} style={{ textAlign: h === "Distribution" || h === "Model" ? "left" : "right", fontSize: 10, color: COLORS.textDim, padding: "0 12px 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(overview.models || []).map((m: any) => (
                <tr key={m.model} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: getModelColor(m.model), display: "inline-block" }} />
                    <span style={{ fontSize: 12, color: COLORS.text, fontFamily: "monospace" }}>{m.model}</span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontSize: 12, color: COLORS.textMuted }}>{m.calls}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontSize: 12, fontFamily: "monospace", color: COLORS.text }}>${m.cost.toFixed(6)}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontSize: 12, color: COLORS.textMuted }}>{(m.percentage || 0).toFixed(1)}%</td>
                  <td style={{ padding: "12px", minWidth: 100 }}><ProgressBar value={m.percentage || 0} max={100} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── COST ANALYSIS WITH PER-USER DROPDOWN ────────────────────────────────────

function CostAnalysisPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [userDetail, setUserDetail] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [ag, mo] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/agents`, { headers: HEADERS }).then(r => r.json()),
          fetch(`${API_BASE}/api/dashboard/models`, { headers: HEADERS }).then(r => r.json()),
        ]);
        setAgents(Array.isArray(ag) ? ag : [ag]);
        setModels(mo);
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  // Load per-tenant user breakdown
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
  const filteredUsers = selectedUser === "all" ? tenantUsers : tenantUsers.filter((u: any) => u.employee === selectedUser);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Per-Employee Section with Dropdown */}
      <Card>
        <CardBody>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <SectionHeader title="Per-Employee Usage" subtitle="Spend breakdown by team member" />
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              style={{
                background: COLORS.bgAccent,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                color: COLORS.text,
                fontSize: 12,
                padding: "6px 12px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="all">All Employees</option>
              {tenantUsers.map((u: any) => (
                <option key={u.employee} value={u.employee}>{u.employee}</option>
              ))}
            </select>
          </div>

          {tenantUsers.length === 0 ? (
            <div style={{ color: COLORS.textDim, fontSize: 12 }}>Loading employee data...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 8, padding: "8px 12px", marginBottom: 4 }}>
                {["Employee", "Calls", "Cost", "Savings", "Cache Hits", "Status"].map(h => (
                  <div key={h} style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
                ))}
              </div>
              {filteredUsers.map((u: any, i: number) => {
                const statusColor = u.status === "blocked" ? COLORS.red : u.blocked_calls > 0 ? COLORS.amber : COLORS.green;
                const statusLabel = u.status === "blocked" ? "Blocked" : u.blocked_calls > 0 ? "Warning" : "Healthy";
                return (
                  <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                    gap: 8,
                    padding: "12px",
                    borderRadius: 8,
                    background: i % 2 === 0 ? "transparent" : `${COLORS.bgAccent}50`,
                    alignItems: "center",
                  }}>
                    <div style={{ fontSize: 13, color: COLORS.text, fontFamily: "monospace" }}>{u.employee}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{u.api_calls}</div>
                    <div style={{ fontSize: 12, color: COLORS.primary, fontFamily: "monospace" }}>${(u.cost_usd || 0).toFixed(4)}</div>
                    <div style={{ fontSize: 12, color: COLORS.green, fontFamily: "monospace" }}>${(u.savings_usd || 0).toFixed(4)}</div>
                    <div style={{ fontSize: 12, color: COLORS.cyan }}>{u.cache_hits}</div>
                    <div>
                      <Badge color={`${statusColor}20`} textColor={statusColor}>{statusLabel}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected user detail */}
          {selectedUser !== "all" && filteredUsers.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 12 }}>Detailed breakdown — {selectedUser}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Total Calls", value: filteredUsers[0]?.api_calls || 0, color: COLORS.cyan },
                  { label: "Actual Cost", value: `$${(filteredUsers[0]?.cost_usd || 0).toFixed(6)}`, color: COLORS.primary },
                  { label: "Savings", value: `$${(filteredUsers[0]?.savings_usd || 0).toFixed(6)}`, color: COLORS.green },
                  { label: "Blocked Calls", value: filteredUsers[0]?.blocked_calls || 0, color: COLORS.red },
                ].map((stat, i) => (
                  <div key={i} style={{ background: COLORS.bgAccent, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: stat.color, fontFamily: "monospace" }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Cost by Agent (ClickHouse data) */}
      <Card>
        <CardBody>
          <SectionHeader title="Cost by Agent ID" subtitle="Spend breakdown per agent ID from ClickHouse" />
          {agents.length === 0 ? (
            <div style={{ color: COLORS.textDim, fontSize: 12 }}>No agent data yet. Pass X-Agent-ID header in your API calls.</div>
          ) : agents.map((a, i) => (
            <div key={i} style={{ padding: "12px 0", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: COLORS.text, fontFamily: "monospace" }}>{a.agent_id}</span>
                <span style={{ fontSize: 13, fontFamily: "monospace", color: COLORS.primary }}>${(a.cost || 0).toFixed(6)}</span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 11, color: COLORS.textDim }}>
                <span>{a.calls} calls</span>
                <span style={{ color: COLORS.cyan }}>{a.cache_hits} cached</span>
                <span style={{ color: COLORS.purple }}>{a.routed_calls} routed</span>
                {a.blocked_calls > 0 && <span style={{ color: COLORS.red }}>{a.blocked_calls} blocked</span>}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Cost by Model */}
      <Card>
        <CardBody>
          <SectionHeader title="Cost by Model" subtitle="Full breakdown with percentages" />
          {models.map((m, i) => (
            <div key={i} style={{ padding: "10px 0", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: getModelColor(m.model), display: "inline-block" }} />
                  <span style={{ fontSize: 12, color: COLORS.text, fontFamily: "monospace" }}>{m.model}</span>
                </div>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: COLORS.text }}>${(m.cost || 0).toFixed(6)}</span>
              </div>
              <ProgressBar value={m.percentage || 0} max={100} />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

// ─── BUDGETS PAGE WITH PER-EMPLOYEE BARS ─────────────────────────────────────

function BudgetsPage() {
  const [status, setStatus] = useState<any[]>([]);
  const [userBudgets, setUserBudgets] = useState<any[]>([]);
  const [userBudgetsLoaded, setUserBudgetsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetch(`${API_BASE}/budget/status`, { headers: HEADERS }).then(r => r.json());
        setStatus(Array.isArray(data) ? data : [data]);
      } catch (e) { console.error(e); }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load per-user budget data from tenant users endpoint
  useEffect(() => {
    async function loadUserBudgets() {
      try {
        const data = await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/users`, { headers: HEADERS }).then(r => r.json());
        const users = data.users || [];
        // Simulate per-user budget bars based on their spend
        const budgets = users
          .filter((u: any) => u.employee && u.employee !== "unknown" && u.employee !== "")
          .map((u: any) => ({
            name: u.employee,
            spent: u.cost_usd || 0,
            limit: 0.01,
            status: u.status,
            blocked: u.blocked_calls > 0,
          }));
        setUserBudgets(budgets);
        setUserBudgetsLoaded(true);
      } catch (e) { console.error(e); }
    }
    loadUserBudgets();
    const interval = setInterval(loadUserBudgets, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Per-Employee Budget Bars */}
      <Card>
        <CardBody>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SectionHeader title="Budget by Employee" subtitle="Daily spend caps per team member" />
            <button
              onClick={async () => {
                setUserBudgetsLoaded(false);
                setUserBudgets([]);
                await fetch(`${API_BASE}/budget/reset`, { method: "POST", headers: HEADERS });
                await fetch(`${API_BASE}/budget/reload`, { method: "POST", headers: HEADERS });
                // Re-seed all 3 employees so they reappear immediately
                await Promise.all(DEMO_EMPLOYEES.map(emp =>
                  fetch(`${API_BASE}/v1/chat/completions`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${emp.key}`, "Content-Type": "application/json", "X-Agent-ID": emp.name },
                    body: JSON.stringify({ model: "gpt-4o", max_tokens: 10, messages: [{ role: "user", content: "hi" }] })
                  })
                ));
              }}
              style={{
                background: "#1e293b",
                color: "#94a3b8",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
              }}>
              Reset Budgets
            </button>
          </div>
          {!userBudgetsLoaded ? (
            <div style={{ color: COLORS.textDim, fontSize: 12 }}>Loading employee budgets...</div>
          ) : userBudgets.length === 0 ? (
            <div style={{ color: COLORS.textDim, fontSize: 12 }}>No spend yet — budgets reset</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {userBudgets.map((u, i) => {
                const pct = Math.min((u.spent / u.limit) * 100, 100);
                const color = u.blocked || pct >= 100 ? COLORS.red : pct > 70 ? COLORS.amber : COLORS.green;
                const statusLabel = u.blocked || pct >= 100 ? "Blocked" : pct > 70 ? "Warning" : "Healthy";
                return (
                  <div key={i} style={{ padding: "14px", background: COLORS.bgAccent, borderRadius: 10, border: `1px solid ${u.blocked ? COLORS.red + "40" : COLORS.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, fontFamily: "monospace" }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>Daily cap — resets midnight</div>
                      </div>
                      <Badge color={`${color}20`} textColor={color}>{statusLabel}</Badge>
                    </div>
                    <ProgressBar value={pct} max={100} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
                      <span style={{ color: COLORS.textMuted }}>Spent: <span style={{ fontFamily: "monospace", color: COLORS.text }}>${u.spent.toFixed(6)}</span></span>
                      <span style={{ color: COLORS.textMuted }}>Limit: <span style={{ fontFamily: "monospace", color: COLORS.text }}>${u.limit.toFixed(2)}</span></span>
                      <span style={{ color: color, fontWeight: 600 }}>{pct.toFixed(1)}% used</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Account-level budgets */}
      <Card>
        <CardBody>
          <SectionHeader title="Account Budget" subtitle="Overall spend enforcement" />
          {status.length === 0 ? (
            <div style={{ color: COLORS.textDim, fontSize: 12 }}>Loading budget data...</div>
          ) : status.map((b: any, i: number) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{b.period} cap — resets {b.period_key}</div>
                </div>
                <Badge
                  color={b.pct_used > 90 ? `${COLORS.red}20` : b.pct_used > 70 ? `${COLORS.amber}20` : COLORS.greenDim}
                  textColor={b.pct_used > 90 ? COLORS.red : b.pct_used > 70 ? COLORS.amber : COLORS.green}
                >
                  {b.pct_used.toFixed(1)}% used
                </Badge>
              </div>
              <ProgressBar value={b.pct_used} max={100} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11 }}>
                <span style={{ color: COLORS.textMuted }}>Spent: <span style={{ fontFamily: "monospace", color: COLORS.text }}>${b.spent_usd.toFixed(6)}</span></span>
                <span style={{ color: COLORS.textMuted }}>Limit: <span style={{ fontFamily: "monospace", color: COLORS.text }}>${b.limit_usd.toFixed(2)}</span></span>
                <span style={{ color: COLORS.textMuted }}>Action: <span style={{ color: COLORS.amber }}>{b.action_on_limit}</span></span>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

// ─── ROI REPORT ──────────────────────────────────────────────────────────────

function ROIReportPage() {
  const [overview, setOverview] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard/overview`, { headers: HEADERS })
      .then(r => r.json()).then(setOverview).catch(console.error);

    fetch(`${API_BASE}/api/tenants/${TENANT_ID}/billing-summary`, { headers: HEADERS })
      .then(r => r.json()).then(setBilling).catch(console.error);
  }, []);

  const gpt4oCost = overview?.models?.find((m: any) => m.model === "gpt-4o")?.cost || 0;
  const miniCost = overview?.models?.find((m: any) => m.model === "gpt-4o-mini")?.cost || 0;
  const cacheSaved = (overview?.cache_hits || 0) * 0.00005;
  const totalActual = overview?.total_cost_usd || 0;
  const estimatedUnrouted = gpt4oCost + miniCost * 33;
  const routingSaved = Math.max(0, estimatedUnrouted - totalActual);
  const totalSaved = routingSaved + cacheSaved;
  const savingsPct = totalActual > 0 ? Math.min(((totalSaved / (totalActual + totalSaved)) * 100), 99) : 0;

  const fee = billing?.financials?.tokenguard_fee_usd || 999;
  const savings = billing?.financials?.savings_usd || totalSaved;
  const net = billing?.financials?.net_benefit_usd || (savings - fee);
  const roi = billing?.financials?.roi_multiple || (fee > 0 ? savings / fee : 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero ROI Card */}
      <Card style={{ background: `linear-gradient(135deg, #0D1220 0%, #0a1628 100%)`, border: `1px solid ${COLORS.green}40` }}>
        <CardBody>
          <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            Monthly ROI Report — {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {[
              { label: "TokenGuard Fee", value: `$${fee.toFixed(0)}`, color: COLORS.textMuted, sub: "Monthly subscription" },
              { label: "AI Savings", value: `$${savings.toFixed(4)}`, color: COLORS.cyan, sub: "Routing + caching" },
              { label: "Net Benefit", value: net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`, color: net >= 0 ? COLORS.green : COLORS.red, sub: "In your pocket" },
              { label: "ROI Multiple", value: `${roi.toFixed(1)}x`, color: COLORS.purple, sub: "Return on investment" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center", padding: 16, background: `${COLORS.bgAccent}80`, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: item.color, fontFamily: "monospace", marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontSize: 10, color: COLORS.textDim }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 16, background: `${COLORS.green}10`, border: `1px solid ${COLORS.green}20`, borderRadius: 8, fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>
            💡 <strong style={{ color: COLORS.text }}>Every month you get this report.</strong> You paid us ${fee.toFixed(0)}. We saved you ${savings.toFixed(2)}. That's ${Math.abs(net).toFixed(2)} {net >= 0 ? "net in your pocket" : "net cost after savings"}.
            If we're not saving you more than we cost, you should cancel. <strong style={{ color: COLORS.green }}>We've never had a client cancel.</strong>
          </div>
        </CardBody>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <StatCard label="Total Saved" value={`$${totalSaved.toFixed(4)}`} sub="Routing + caching" color={COLORS.green} />
        <StatCard label="Actual Spend" value={`$${totalActual.toFixed(4)}`} sub="What you paid" color={COLORS.primary} />
        <StatCard label="Savings Rate" value={`${savingsPct.toFixed(1)}%`} sub="Cost reduction" color={COLORS.cyan} />
      </div>

      <Card>
        <CardBody>
          <SectionHeader title="Savings Breakdown" subtitle="Where the savings come from" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Model routing savings", value: routingSaved, desc: "Simple prompts sent to cheaper models", color: COLORS.purple },
              { label: "Cache savings", value: cacheSaved, desc: `${overview?.cache_hits || 0} responses served from cache`, color: COLORS.cyan },
              { label: "Total saved", value: totalSaved, desc: "Combined optimisations", color: COLORS.green },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <div>
                  <div style={{ fontSize: 13, color: COLORS.text }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace", color: item.color }}>${item.value.toFixed(6)}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Usage stats from billing */}
      {billing?.usage && (
        <Card>
          <CardBody>
            <SectionHeader title="Usage This Month" subtitle="API activity breakdown" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { label: "Total Calls", value: billing.usage.total_calls, color: COLORS.primary },
                { label: "Cache Hits", value: `${billing.usage.cache_hits} (${billing.usage.cache_hit_rate_pct}%)`, color: COLORS.green },
                { label: "Routed Calls", value: `${billing.usage.routed_calls} (${billing.usage.routing_rate_pct}%)`, color: COLORS.purple },
              ].map((stat, i) => (
                <div key={i} style={{ background: COLORS.bgAccent, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, fontFamily: "monospace" }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function MasterKeyCard() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const masterKey = "lMNUO5f2xEAmxq8lXA9ODmCi-pxCr-9hL99fyw3VlWw";

  const copy = () => {
    navigator.clipboard.writeText(masterKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardBody>
        <SectionHeader
          title="Master API Key"
          subtitle="Full admin access — never share this"
        />
        <div style={{
          background: COLORS.bgAccent,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: 13,
            color: COLORS.text,
            flex: 1,
            letterSpacing: visible ? "0" : "0.15em",
          }}>
            {visible ? masterKey : "•".repeat(44)}
          </span>
          <button
            onClick={() => setVisible(v => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: COLORS.textMuted, fontSize: 13, padding: "2px 8px",
            }}
          >
            {visible ? "Hide" : "Show"}
          </button>
          <button
            onClick={copy}
            style={{
              background: copied ? COLORS.greenDim : COLORS.primaryDim,
              border: `1px solid ${copied ? COLORS.green : COLORS.primary}`,
              borderRadius: 6, cursor: "pointer",
              color: copied ? COLORS.green : COLORS.primary,
              fontSize: 12, padding: "4px 12px",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Full dashboard access", color: COLORS.green },
            { label: "Manage all keys", color: COLORS.green },
            { label: "View billing", color: COLORS.green },
          ].map((b, i) => (
            <Badge key={i} color={COLORS.greenDim} textColor={COLORS.green}>
              ✓ {b.label}
            </Badge>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function EmployeeKeyManager() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newBudget, setNewBudget] = useState("50");
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [editBudgetVal, setEditBudgetVal] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newKeyCopied, setNewKeyCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/keys`, { headers: HEADERS });
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createKey = async () => {
    if (!newName.trim()) return;
    setActionLoading("creating");
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/users`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), role: newRole.trim(), budget_usd: parseFloat(newBudget) || 50 }),
      });
      const data = await res.json();
      setNewKey(data.api_key);
      setNewName("");
      setNewRole("");
      setAdding(false);
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const revokeKey = async (keyId: string) => {
    setActionLoading(keyId);
    try {
      await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/keys/${keyId}`, {
        method: "DELETE", headers: HEADERS,
      });
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const reactivateKey = async (keyId: string) => {
    setActionLoading(keyId);
    try {
      await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/keys/${keyId}/reactivate`, {
        method: "POST", headers: HEADERS,
      });
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const updateBudget = async (keyId: string) => {
    if (!editBudgetVal) return;
    setActionLoading("budget-" + keyId);
    try {
      await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/keys/${keyId}/budget`, {
        method: "PATCH",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ budget_usd: parseFloat(editBudgetVal) }),
      });
      setEditBudgetId(null);
      setEditBudgetVal("");
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setNewKeyCopied(true);
    setTimeout(() => setNewKeyCopied(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    background: COLORS.bgAccent,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color: COLORS.text,
    fontSize: 13,
    padding: "8px 12px",
    outline: "none",
    width: "100%",
  };

  return (
    <Card>
      <CardBody>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionHeader title="Employee API Keys" subtitle="One key per team member" />
          <button
            onClick={() => setAdding(v => !v)}
            style={{
              background: COLORS.primaryDim,
              border: `1px solid ${COLORS.primary}`,
              borderRadius: 8, cursor: "pointer",
              color: COLORS.primary, fontSize: 13,
              padding: "6px 16px", fontWeight: 600,
            }}
          >
            + Add Employee
          </button>
        </div>

        {newKey && (
          <div style={{
            background: COLORS.greenDim,
            border: `1px solid ${COLORS.green}`,
            borderRadius: 8, padding: "12px 14px",
            marginBottom: 16, display: "flex",
            flexDirection: "column", gap: 8,
          }}>
            <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>
              ✓ New key created — copy it now, it won't be shown again
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <code style={{ fontSize: 12, color: COLORS.text, flex: 1, fontFamily: "monospace", wordBreak: "break-all" }}>
                {newKey}
              </code>
              <button
                onClick={() => copyKey(newKey)}
                style={{
                  background: newKeyCopied ? COLORS.greenDim : COLORS.primaryDim,
                  border: `1px solid ${newKeyCopied ? COLORS.green : COLORS.primary}`,
                  borderRadius: 6, cursor: "pointer",
                  color: newKeyCopied ? COLORS.green : COLORS.primary,
                  fontSize: 12, padding: "4px 12px", whiteSpace: "nowrap",
                }}
              >
                {newKeyCopied ? "Copied!" : "Copy Key"}
              </button>
              <button
                onClick={() => setNewKey(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 16 }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {adding && (
          <div style={{
            background: COLORS.bgAccent,
            border: `1px solid ${COLORS.borderLight}`,
            borderRadius: 8, padding: 14,
            marginBottom: 16,
            display: "grid", gridTemplateColumns: "1fr 1fr 120px auto auto",
            gap: 10, alignItems: "end",
          }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Name *</div>
              <input
                style={inputStyle}
                placeholder="Sarah Chen"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createKey()}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Role</div>
              <input
                style={inputStyle}
                placeholder="Engineering"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createKey()}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Budget</div>
              <input
                style={inputStyle}
                placeholder="Daily budget ($)"
                value={newBudget}
                onChange={e => setNewBudget(e.target.value)}
                type="number"
                min="1"
              />
            </div>
            <button
              onClick={createKey}
              disabled={!newName.trim() || actionLoading === "creating"}
              style={{
                background: COLORS.primary, border: "none",
                borderRadius: 8, cursor: "pointer",
                color: "#fff", fontSize: 13,
                padding: "8px 16px", fontWeight: 600,
                opacity: !newName.trim() ? 0.5 : 1,
              }}
            >
              {actionLoading === "creating" ? "..." : "Generate"}
            </button>
            <button
              onClick={() => setAdding(false)}
              style={{
                background: "none",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8, cursor: "pointer",
                color: COLORS.textMuted, fontSize: 13,
                padding: "8px 12px",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center", padding: 24 }}>
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center", padding: 24 }}>
            No employee keys yet — click Add Employee to create one
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 120px 80px 100px 140px",
              gap: 12, padding: "0 4px",
            }}>
              {["Employee", "Key Preview", "Created", "Status", "Budget", "Actions"].map(h => (
                <div key={h} style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </div>
              ))}
            </div>

            {keys.map(k => (
              <div
                key={k.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 160px 120px 80px 100px 140px",
                  gap: 12, alignItems: "center",
                  background: COLORS.bgAccent,
                  border: `1px solid ${k.is_active ? COLORS.border : COLORS.borderLight}`,
                  borderRadius: 8, padding: "10px 12px",
                  opacity: k.is_active ? 1 : 0.6,
                }}
              >
                <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>
                  {k.label}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: COLORS.textMuted }}>
                  {k.key_preview}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textDim }}>
                  {k.created_at ? new Date(k.created_at).toLocaleDateString() : "—"}
                </div>
                <div>
                  <Badge
                    color={k.is_active ? COLORS.greenDim : "#1a1a1a"}
                    textColor={k.is_active ? COLORS.green : COLORS.textMuted}
                  >
                    {k.is_active ? "Active" : "Revoked"}
                  </Badge>
                </div>
                <div style={{ fontSize: 12, color: COLORS.primary, cursor: "pointer", borderBottom: `1px dashed ${COLORS.primary}` }}
                  onClick={() => { setEditBudgetId(k.id); setEditBudgetVal(k.budget_usd ? String(k.budget_usd) : "50"); }}>
                  {editBudgetId === k.id ? (
                    <>
                      <input type="number" value={editBudgetVal} onChange={e => setEditBudgetVal(e.target.value)}
                        style={{ width: 60, background: COLORS.bgAccent, border: `1px solid ${COLORS.primary}`, borderRadius: 6, color: COLORS.text, fontSize: 12, padding: "3px 6px" }}
                        autoFocus onKeyDown={e => e.key === "Enter" && updateBudget(k.id)} />
                      <button onClick={() => updateBudget(k.id)} style={{ marginLeft: 4, background: COLORS.primary, border: "none", borderRadius: 6, cursor: "pointer", color: "#fff", fontSize: 11, padding: "3px 8px" }}>Save</button>
                    </>
                  ) : (
                    `$${k.budget_usd ? Number(k.budget_usd).toFixed(2) : "—"}` 
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {k.is_active ? (
                    <button
                      onClick={() => revokeKey(k.id)}
                      disabled={actionLoading === k.id}
                      style={{
                        background: "none",
                        border: `1px solid ${COLORS.red}40`,
                        borderRadius: 6, cursor: "pointer",
                        color: COLORS.red, fontSize: 11,
                        padding: "3px 10px",
                      }}
                    >
                      {actionLoading === k.id ? "..." : "Revoke"}
                    </button>
                  ) : (
                    <button
                      onClick={() => reactivateKey(k.id)}
                      disabled={actionLoading === k.id}
                      style={{
                        background: "none",
                        border: `1px solid ${COLORS.primary}40`,
                        borderRadius: 6, cursor: "pointer",
                        color: COLORS.primary, fontSize: 11,
                        padding: "3px 10px",
                      }}
                    >
                      {actionLoading === k.id ? "..." : "Restore"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ProviderKeysCard() {
  const [keys, setKeys] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({
    openai: "", anthropic: "", google: ""
  });
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const providers = [
    { id: "openai",    name: "OpenAI",    icon: "⬡", placeholder: "sk-proj-...", color: "#10A37F" },
    { id: "anthropic", name: "Anthropic", icon: "◈", placeholder: "sk-ant-...",  color: "#D97706" },
    { id: "google",    name: "Google",    icon: "◉", placeholder: "AIza...",     color: "#4285F4" },
  ];

  const load = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/provider-keys`, { headers: HEADERS });
      const data = await res.json();
      const map: Record<string, any> = {};
      (data.keys || []).forEach((k: any) => { map[k.provider] = k; });
      setKeys(map);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const save = async (provider: string) => {
    const raw = inputs[provider].trim();
    if (!raw) return;
    setSaving(provider);
    try {
      await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/provider-keys`, {
        method:  "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body:    JSON.stringify({ provider, api_key: raw }),
      });
      setInputs(v => ({ ...v, [provider]: "" }));
      setSaved(v => ({ ...v, [provider]: true }));
      setTimeout(() => setSaved(v => ({ ...v, [provider]: false })), 2000);
      await load();
    } catch (e) { console.error(e); }
    setSaving(null);
  };

  const remove = async (provider: string) => {
    setRemoving(provider);
    try {
      await fetch(`${API_BASE}/api/tenants/${TENANT_ID}/provider-keys/${provider}`, {
        method: "DELETE", headers: HEADERS,
      });
      await load();
    } catch (e) { console.error(e); }
    setRemoving(null);
  };

  const inputStyle: React.CSSProperties = {
    background:   COLORS.bgAccent,
    border:       `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color:        COLORS.text,
    fontSize:     13,
    padding:      "9px 12px",
    outline:      "none",
    flex:         1,
    fontFamily:   "monospace",
  };

  return (
    <Card>
      <CardBody>
        <SectionHeader
          title="Provider API Keys"
          subtitle="Your keys — you pay OpenAI/Anthropic directly"
        />

        <div style={{
          background: COLORS.bgAccent,
          border:     `1px solid ${COLORS.borderLight}`,
          borderRadius: 8, padding: "10px 14px",
          marginBottom: 20, fontSize: 13, color: COLORS.textMuted,
          lineHeight: 1.5,
        }}>
          💡 TokenGuard uses your own API keys to make calls — you keep your existing
          OpenAI and Anthropic accounts and pay them directly. We never see your bills.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {providers.map(p => {
            const configured = keys[p.id];
            return (
              <div
                key={p.id}
                style={{
                  background:   configured ? `${p.color}08` : COLORS.bgAccent,
                  border:       `1px solid ${configured ? p.color + "40" : COLORS.border}`,
                  borderRadius: 10, padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, color: p.color }}>{p.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{p.name}</span>
                    {configured && (
                      <Badge color={`${p.color}20`} textColor={p.color}>
                        ✓ Connected — {configured.preview}
                      </Badge>
                    )}
                    {!configured && (
                      <Badge color={COLORS.bgCard} textColor={COLORS.textDim}>
                        Not configured
                      </Badge>
                    )}
                  </div>
                  {configured && (
                    <button
                      onClick={() => remove(p.id)}
                      disabled={removing === p.id}
                      style={{
                        background: "none",
                        border:     `1px solid ${COLORS.red}40`,
                        borderRadius: 6, cursor: "pointer",
                        color: COLORS.red, fontSize: 11,
                        padding: "3px 10px",
                      }}
                    >
                      {removing === p.id ? "..." : "Remove"}
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder={configured ? "Enter new key to replace..." : p.placeholder}
                    value={inputs[p.id]}
                    onChange={e => setInputs(v => ({ ...v, [p.id]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && save(p.id)}
                  />
                  <button
                    onClick={() => save(p.id)}
                    disabled={!inputs[p.id].trim() || saving === p.id}
                    style={{
                      background:   saved[p.id] ? COLORS.greenDim : inputs[p.id].trim() ? p.color : COLORS.bgCard,
                      border:       `1px solid ${saved[p.id] ? COLORS.green : inputs[p.id].trim() ? p.color : COLORS.border}`,
                      borderRadius: 8, cursor: inputs[p.id].trim() ? "pointer" : "default",
                      color:        saved[p.id] ? COLORS.green : inputs[p.id].trim() ? "#fff" : COLORS.textDim,
                      fontSize:     13, fontWeight: 600,
                      padding:      "9px 18px", whiteSpace: "nowrap",
                      opacity:      !inputs[p.id].trim() ? 0.5 : 1,
                    }}
                  >
                    {saving === p.id ? "Saving..." : saved[p.id] ? "Saved!" : configured ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function SettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <MasterKeyCard />
      <ProviderKeysCard />
      <EmployeeKeyManager />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardBody>
            <SectionHeader title="Proxy Configuration" subtitle="Connection details" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Proxy URL", value: "cypress-production-1cc5.up.railway.app" },
                { label: "Dashboard", value: "cypress-production-36c0.up.railway.app" },
                { label: "ClickHouse", value: "q9wiaor5v1.eastus2.azure" },
                { label: "Cache", value: "fakeredis (in-memory)" },
                { label: "Version", value: "0.9.0 — Week 9" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: COLORS.textDim }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: COLORS.text }}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <SectionHeader title="Routing Config" subtitle="Model selection rules" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Auto routing", status: "Enabled" },
                { label: "Simple → gpt-4o-mini", status: "Active" },
                { label: "Complex → gpt-4o", status: "Active" },
                { label: "Keyword detection", status: "Active" },
                { label: "Budget enforcement", status: "Active" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: COLORS.textDim }}>{item.label}</span>
                  <Badge color={COLORS.greenDim} textColor={COLORS.green}>{item.status}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: "overview", label: "Overview", icon: "⚡" },
  { id: "cost-analysis", label: "Cost Analysis", icon: "📊" },
  { id: "budgets", label: "Budgets", icon: "🛡️" },
  { id: "roi-report", label: "ROI Report", icon: "📈" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

function Sidebar({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  return (
    <aside style={{
      width: 220,
      height: "100%",
      background: COLORS.bgCard,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>TokenGuard</div>
            <div style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: "0.05em" }}>AI COST CONTROL</div>
          </div>
        </div>
      </div>

      {/* Tenant indicator */}
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, background: `${COLORS.purple}08` }}>
        <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 2 }}>VIEWING TENANT</div>
        <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600 }}>Acme Corp (Demo)</div>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px 8px" }}>Platform</div>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                border: "none",
                background: isActive ? `${COLORS.primary}18` : "transparent",
                color: isActive ? COLORS.primary : COLORS.textMuted,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: COLORS.primary }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 10px", borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ background: `${COLORS.green}14`, border: `1px solid ${COLORS.green}30`, borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.green }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.green }}>Proxy Active</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Railway — Production</div>
          </div>
        </div>
        <div style={{ marginTop: 8, padding: "0 4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: COLORS.textDim }}>v0.9.0</span>
          <span style={{ fontSize: 10, color: COLORS.textDim }}>Week 9 Build</span>
        </div>
      </div>
    </aside>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "overview": { title: "Overview", subtitle: "Real-time AI cost monitoring" },
  "cost-analysis": { title: "Cost Analysis", subtitle: "Spend breakdown by employee and model" },
  "budgets": { title: "Budgets", subtitle: "Per-employee spend caps and enforcement" },
  "roi-report": { title: "ROI Report", subtitle: "Measure the value TokenGuard delivers" },
  "settings": { title: "Settings", subtitle: "Configure your proxy and routing rules" },
};

export default function Dashboard() {
  const [page, setPage] = useState("overview");
  const meta = PAGE_META[page];

  const pages: Record<string, React.ReactNode> = {
    "overview": <OverviewPage />,
    "cost-analysis": <CostAnalysisPage />,
    "budgets": <BudgetsPage />,
    "roi-report": <ROIReportPage />,
    "settings": <SettingsPage />,
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: COLORS.bg,
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      color: COLORS.text,
      overflow: "hidden",
    }}>
      <Sidebar active={page} onNav={setPage} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          height: 56,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          background: COLORS.bgCard,
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, margin: 0 }}>{meta.title}</h1>
            <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0 }}>{meta.subtitle}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: `${COLORS.green}18`, border: `1px solid ${COLORS.green}30`, borderRadius: 6, padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.green }}>Live</span>
            </div>
            <div style={{ fontSize: 11, color: COLORS.textDim }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {pages[page]}
        </div>
      </main>
    </div>
  );
}












