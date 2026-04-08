const API_BASE = process.env.NEXT_PUBLIC_PROXY_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// ── Overview / Dashboard ──────────────────────────────────────
export interface OverviewStats {
  total_cost_usd: number;
  total_savings_usd: number;
  total_requests: number;
  cache_hit_rate: number;
  avg_latency_ms: number;
  active_budgets: number;
}

export interface CostTrend {
  date: string;
  cost: number;
  savings: number;
  requests: number;
}

export interface ModelBreakdown {
  model: string;
  cost: number;
  requests: number;
  tokens: number;
  percentage: number;
}

export interface AgentBreakdown {
  agent_id: string;
  cost: number;
  requests: number;
  savings: number;
}

export async function fetchOverviewStats(token: string): Promise<OverviewStats> {
  return apiFetch("/api/dashboard/overview", { token });
}

export async function fetchCostTrends(token: string, days: number = 30): Promise<CostTrend[]> {
  return apiFetch(`/api/dashboard/cost-trends?days=${days}`, { token });
}

export async function fetchModelBreakdown(token: string): Promise<ModelBreakdown[]> {
  return apiFetch("/api/dashboard/models", { token });
}

export async function fetchAgentBreakdown(token: string): Promise<AgentBreakdown[]> {
  return apiFetch("/api/dashboard/agents", { token });
}

// ── Budgets ───────────────────────────────────────────────────
export interface Budget {
  budget_id: string;
  name: string;
  scope: string;
  scope_id?: string;
  period: string;
  limit_usd: number;
  spent_usd: number;
  pct_used: number;
  action_on_limit: string;
}

export async function fetchBudgets(token: string): Promise<Budget[]> {
  const res = await apiFetch<{ budgets: Budget[] }>("/v1/budgets/status", { token });
  return res.budgets;
}

// ── Cache ─────────────────────────────────────────────────────
export interface CacheStats {
  enabled: boolean;
  ttl_seconds: number;
  keyspace_hits: number;
  keyspace_misses: number;
}

export async function fetchCacheStats(token: string): Promise<CacheStats> {
  const res = await apiFetch<{ cache: CacheStats }>("/v1/cache/stats", { token });
  return res.cache;
}

// ── Recommendations ───────────────────────────────────────────
export interface Recommendation {
  id: string;
  rec_type: string;
  title: string;
  description: string;
  estimated_savings_usd: number;
  status: string;
  created_at: string;
}

export async function fetchRecommendations(token: string): Promise<Recommendation[]> {
  return apiFetch("/api/dashboard/recommendations", { token });
}

// ── Settings ──────────────────────────────────────────────────
export interface ApiKey {
  id: string;
  name: string;
  provider: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at?: string;
}

export async function fetchApiKeys(token: string): Promise<ApiKey[]> {
  return apiFetch("/api/settings/api-keys", { token });
}

export interface ProxyKey {
  id: string;
  name: string;
  key_prefix: string;
  rate_limit_rpm: number;
  is_active: boolean;
  created_at: string;
}

export async function fetchProxyKeys(token: string): Promise<ProxyKey[]> {
  return apiFetch("/api/settings/proxy-keys", { token });
}
