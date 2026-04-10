"use client";

import { useState, useEffect } from "react";

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

// proxy url from env
const API_BASE = process.env.NEXT_PUBLIC_PROXY_API_URL || "http://localhost:8000";
const API_KEY = "lMNUO5f2xEAmxq8lXA9ODmCi-pxCr-9hL99fyw3VlWw";
const HEADERS = { Authorization: `Bearer ${API_KEY}` };

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
  const color = pct > 90 ? COLORS.red : pct > 70 ? COLORS.amber : COLORS.primary;
  return (
    <div style={{ background: COLORS.bgAccent, borderRadius: 999, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.5s ease" }} />
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
  if (!overview) return <div style={{ color: COLORS.red, padding: 40, fontSize: 13 }}>Could not connect to proxy. Make sure it is running on port 8000.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Total Spend" value={`$${(overview.total_cost_usd || 0).toFixed(4)}`} sub="All time" color={COLORS.primary} />
        <StatCard label="Total Requests" value={(overview.total_requests || 0).toLocaleString()} sub="API calls + cache hits" color={COLORS.cyan} />
        <StatCard label="Cache Hit Rate" value={`${(overview.cache_hit_rate || 0).toFixed(1)}%`} sub={`${overview.cache_hits || 0} free responses`} color={COLORS.green} />
        <StatCard label="Routed Calls" value={(overview.models || []).filter((m: any) => m.model !== "cache" && m.model !== "blocked").length.toString()} sub="Model types active" color={COLORS.purple} />
      </div>

      {/* Charts */}
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

        <Card>
          <CardBody>
            <SectionHeader title="Call Volume" subtitle="Calls per day" />
            <AreaChartSVG data={trends} dataKey="total_calls" color={COLORS.cyan} height={120} />
          </CardBody>
        </Card>
      </div>

      {/* Model Table */}
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
                  <td style={{ padding: "12px", minWidth: 100 }}>
                    <ProgressBar value={m.percentage || 0} max={100} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function CostAnalysisPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <CardBody>
          <SectionHeader title="Cost by Agent" subtitle="Spend breakdown per agent ID" />
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

      <Card>
        <CardBody>
          <SectionHeader title="Cost by Model" subtitle="Full breakdown with percentages" />
          {models.map((m: any, i: number) => (
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

function BudgetsPage() {
  const [status, setStatus] = useState<any[]>([]);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {status.length === 0 ? (
        <Card><CardBody><div style={{ color: COLORS.textDim, fontSize: 12 }}>Loading budget data...</div></CardBody></Card>
      ) : status.map((b: any, i: number) => (
        <Card key={i}>
          <CardBody>
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
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function ROIReportPage() {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard/overview`, { headers: HEADERS })
      .then(r => r.json())
      .then(setOverview)
      .catch(console.error);
  }, []);

  const gpt4oCost = overview?.models?.find((m: any) => m.model === "gpt-4o")?.cost || 0;
  const miniCost = overview?.models?.find((m: any) => m.model === "gpt-4o-mini")?.cost || 0;
  const cacheSaved = (overview?.cache_hits || 0) * 0.00005;
  const totalActual = overview?.total_cost_usd || 0;
  const estimatedUnrouted = gpt4oCost + miniCost * 33;
  const routingSaved = Math.max(0, estimatedUnrouted - totalActual);
  const totalSaved = routingSaved + cacheSaved;
  const savingsPct = totalActual > 0 ? Math.min(((totalSaved / (totalActual + totalSaved)) * 100), 99) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

      <Card>
        <CardBody>
          <SectionHeader title="Value Proposition" subtitle="What TokenGuard delivers" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "30-70% cost reduction", status: "Active" },
              { label: "Zero prompt storage", status: "Active" },
              { label: "Real-time budget enforcement", status: "Active" },
              { label: "Automatic model routing", status: "Active" },
              { label: "ClickHouse analytics", status: "Active" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: COLORS.textMuted }}>{item.label}</span>
                <Badge color={COLORS.greenDim} textColor={COLORS.green}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function SettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardBody>
            <SectionHeader title="Proxy Configuration" subtitle="Connection details" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Proxy URL", value: "localhost:8000" },
                { label: "LiteLLM URL", value: "localhost:4000" },
                { label: "ClickHouse", value: "q9wiaor5v1.eastus2.azure" },
                { label: "Cache", value: "fakeredis (in-memory)" },
                { label: "Version", value: "0.6.0 — Week 6" },
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
            <div style={{ fontSize: 10, color: COLORS.textDim }}>localhost:8000</div>
          </div>
        </div>
        <div style={{ marginTop: 8, padding: "0 4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: COLORS.textDim }}>v0.6.0</span>
          <span style={{ fontSize: 10, color: COLORS.textDim }}>Week 6 Build</span>
        </div>
      </div>
    </aside>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "overview": { title: "Overview", subtitle: "Real-time AI cost monitoring" },
  "cost-analysis": { title: "Cost Analysis", subtitle: "Spend breakdown by model and agent" },
  "budgets": { title: "Budgets", subtitle: "Spend caps, alerts, and enforcement" },
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