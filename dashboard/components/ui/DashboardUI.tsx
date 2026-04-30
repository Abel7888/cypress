"use client";
import { COLORS } from "../constants";

// ─── SHARED UI COMPONENTS ────────────────────────────────────────────────────

export function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
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

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 20 }}>{children}</div>;
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

export function Badge({ children, color, textColor }: { children: React.ReactNode; color: string; textColor: string }) {
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

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
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

export function StatCard({ label, value, sub, color = COLORS.primary }: {
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

export function AreaChartSVG({ data, dataKey, color, height = 80 }: {
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
