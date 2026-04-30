// ─── SHARED CONSTANTS ────────────────────────────────────────────────────────

export const COLORS = {
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
  blue: "#3B82F6",
  text: "#F0F4FF",
  textMuted: "#6B7FA3",
  textDim: "#3D4F72",
};

export const MODEL_COLORS: Record<string, string> = {
  "gpt-4o": "#8B5CF6",
  "gpt-4o-mini": "#06B6D4",
  "claude-3.5-sonnet": "#F59E0B",
  "claude-3.5-haiku": "#22C55E",
  "cache": "#4F8EF7",
  "blocked": "#6B7FA3",
};

export function getModelColor(model: string): string {
  return MODEL_COLORS[model] || "#4F8EF7";
}

export const FONTS = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
export const API_KEY = typeof window !== "undefined" ? localStorage.getItem("tg_api_key") : null;
export const TENANT_ID = typeof window !== "undefined" ? localStorage.getItem("tg_tenant_id") : null;
export const HEADERS = { Authorization: `Bearer ${API_KEY}` };

// DEMO_EMPLOYEES removed - use real tenant keys

