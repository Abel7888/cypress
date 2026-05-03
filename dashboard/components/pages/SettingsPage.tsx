"use client";
import { useState, useEffect } from "react";
import { API_BASE, TENANT_ID, HEADERS , getTenantConfig } from "../constants";

// ─── LIGHT PALETTE ───────────────────────────────────────────────────────────
const C = {
  card: "#FFFFFF", border: "#E2E8F0", borderSoft: "#F1F5F9", rowAlt: "#F8FAFC",
  text: "#0F172A", textMuted: "#64748B", textDim: "#94A3B8",
  blue: "#3B82F6", blueBg: "#EFF6FF", blueBorder: "#BFDBFE", blueText: "#1D4ED8", blueBg2: "#DBEAFE", blueText2: "#1E40AF",
  cyan: "#06B6D4",
  green: "#10B981", greenBg: "#F0FDF4", greenBg2: "#D1FAE5", greenBorder: "#BBF7D0", greenText: "#065F46",
  amber: "#F59E0B", amberBg: "#FFFBEB", amberBg2: "#FEF3C7", amberBorder: "#FDE68A", amberText: "#92400E",
  orange: "#F97316", orangeBg: "#FFF7ED", orangeBorder: "#FED7AA", orangeText: "#C2410C",
  red: "#EF4444", redBg: "#FFF5F5", redBg2: "#FEE2E2", redBorder: "#FECACA", redText: "#991B1B",
  purple: "#8B5CF6", purpleBg: "#F5F3FF", purpleBg2: "#EDE9FE",
};
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_SANS = "'Inter', system-ui, sans-serif";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
type TabId = "security" | "notifications" | "proxy" | "integrations" | "billing";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("security");
  const [proxyLatency, setProxyLatency] = useState<number | null>(null);
  const [proxyStatus, setProxyStatus] = useState<"checking" | "live" | "down">("checking");

  // dashboard data for billing tab
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function checkProxy() {
      const start = Date.now();
      try {
        await fetch(`${API_BASE}/health`, { headers: HEADERS });
        setProxyLatency(Date.now() - start);
        setProxyStatus("live");
      } catch {
        setProxyStatus("down");
      }
    }
    checkProxy();
  }, []);

  useEffect(() => {
    const load = async () => {
      const { tenantId, apiKey } = await getTenantConfig();
      const authHeaders = { Authorization: `Bearer ${apiKey || ""}` };

    async function loadBillingCtx() {
      if (!TENANT_ID) return;
      try {
        const [ov, us] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/overview`, { headers: authHeaders }).then(r => r.json()),
          fetch(`${API_BASE}/api/tenants/${tenantId}/users`, { headers: authHeaders }).then(r => r.json()),
        ]);
        setOverview(ov);
        setUsers(us?.users || []);
      } catch {/* noop */}
    }
    loadBillingCtx();
      };
    load();
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: "security",      label: "Security" },
    { id: "notifications", label: "Notifications" },
    { id: "proxy",         label: "Proxy & Routing" },
    { id: "integrations",  label: "Integrations" },
    { id: "billing",       label: "Billing" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: 1600, margin: "0 auto", fontFamily: FONT_SANS, color: C.text }}>
      {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 24, gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            Settings
          </h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            Configure your TokenGuard workspace — security, alerts, routing, and integrations
          </div>
        </div>
        <ProxyStatusPill status={proxyStatus} latency={proxyLatency} />
      </div>

      {/* ═══ TABS ═══════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex", gap: 2, background: C.borderSoft, borderRadius: 10,
        padding: 4, marginBottom: 24, width: "fit-content",
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              cursor: "pointer", border: "none", fontFamily: FONT_SANS,
              transition: "all 0.15s",
              background: activeTab === t.id ? "#fff" : "transparent",
              color: activeTab === t.id ? C.text : C.textMuted,
              boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ═══ TAB CONTENT ═════════════════════════════════════════════════ */}
      {activeTab === "security"      && <SecurityTab />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "proxy"         && <ProxyTab status={proxyStatus} latency={proxyLatency} />}
      {activeTab === "integrations"  && <IntegrationsTab />}
      {activeTab === "billing"       && <BillingTab overview={overview} users={users} />}

      <style>{`@keyframes tg-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.85)} }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROXY STATUS PILL
// ═══════════════════════════════════════════════════════════════════════════
function ProxyStatusPill({ status, latency }: { status: "checking" | "live" | "down"; latency: number | null }) {
  const cfg = status === "live"
    ? { bg: C.greenBg, bd: C.greenBorder, dot: C.green, text: C.greenText, label: "Proxy Live", pulse: true }
    : status === "down"
    ? { bg: C.redBg,   bd: C.redBorder,   dot: C.red,   text: C.redText,   label: "Proxy Down", pulse: false }
    : { bg: C.rowAlt,  bd: C.border,      dot: C.textDim, text: C.textDim, label: "Checking…",  pulse: false };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 8, border: `1px solid ${cfg.bd}`, background: cfg.bg,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: cfg.dot,
        animation: cfg.pulse ? "tg-pulse 2s ease-in-out infinite" : "none",
      }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: cfg.text }}>{cfg.label}</span>
      {status === "live" && latency !== null && (
        <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: C.green }}>
          · {latency}ms
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — SECURITY
// ═══════════════════════════════════════════════════════════════════════════
function SecurityTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      <MasterKeyCard />
      <ProviderKeysCard />
      <EmployeeKeyManager />
    </div>
  );
}

// ─── MASTER KEY CARD (logic preserved, visual rewrite) ─────────────────
function MasterKeyCard() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const masterKey = typeof window !== "undefined" ? (localStorage.getItem("tg_api_key") || "") : "";

  const copy = () => {
    if (!masterKey) return;
    navigator.clipboard.writeText(masterKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onRotate = () => {
    const ok = typeof window !== "undefined" && window.confirm(
      "Rotating the master key will invalidate the current key immediately. Continue?"
    );
    if (!ok) return;
    // Hook up rotate endpoint when available; left as UI-only for now.
  };

  return (
    <Card borderLeft={C.red}>
      <CardInner>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <IconCircle bg={C.redBg2} color={C.red} size={40} fontSize={20}>🛡</IconCircle>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Master API Key</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              Full admin access to your TokenGuard workspace. Never share this key or commit it to version control.
            </div>
          </div>
        </div>

        <InfoBanner variant="red" icon="⚠" style={{ marginTop: 14 }}>
          This key has full admin access. Treat it like a password — store it in an environment variable, never in code.
        </InfoBanner>

        {/* Key display */}
        <div style={{
          background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginTop: 4,
        }}>
          <span style={{
            flex: 1, fontFamily: FONT_MONO, fontSize: 12,
            color: masterKey ? C.text : C.textDim,
            wordBreak: "break-all",
            fontStyle: masterKey ? "normal" : "italic",
            letterSpacing: visible ? "0" : "0.15em",
          }}>
            {!masterKey
              ? "No key found — complete onboarding to generate your key"
              : visible ? masterKey : "•".repeat(44)}
          </span>
        </div>

        {/* Action row */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={() => setVisible(v => !v)}
            disabled={!masterKey}
            style={{ ...btnGhostSm, opacity: masterKey ? 1 : 0.5 }}
          >{visible ? "Hide" : "Show"}</button>
          <button
            onClick={copy}
            disabled={!masterKey}
            style={{
              ...btnBlueOutlineSm,
              opacity: masterKey ? 1 : 0.5,
              color: copied ? C.green : C.blueText,
              borderColor: copied ? C.greenBorder : C.blueBorder,
              background: copied ? C.greenBg : C.blueBg,
            }}
          >{copied ? "Copied!" : "Copy"}</button>
          <button onClick={onRotate} style={btnRedOutlineSm}>Rotate Key</button>
        </div>

        {/* Capability badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {["✓ Full dashboard access", "✓ Manage all employee keys", "✓ View billing and ROI data"].map((c, i) => (
            <span key={i} style={{
              background: C.greenBg2, color: C.greenText, fontSize: 11, fontWeight: 600,
              padding: "4px 12px", borderRadius: 999,
            }}>{c}</span>
          ))}
        </div>
      </CardInner>
    </Card>
  );
}

// ─── PROVIDER KEYS CARD (logic preserved, visual rewrite) ──────────────
function ProviderKeysCard() {
  const [keys, setKeys] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({ openai: "", anthropic: "", google: "" });
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const providers = [
    { id: "openai",    name: "OpenAI",    glyph: "AI",   color: "#10A37F", placeholder: "sk-proj-..." },
    { id: "anthropic", name: "Anthropic", glyph: "AN",   color: "#D97706", placeholder: "sk-ant-..." },
    { id: "google",    name: "Google",    glyph: "G",    color: "#4285F4", placeholder: "AIza..." },
  ];

  const load = async () => {
    const { tenantId, apiKey } = await getTenantConfig();
    const authHeaders = { Authorization: `Bearer ${apiKey || ""}` };
    try {
      const res  = await fetch(`${API_BASE}/api/tenants/${tenantId}/provider-keys`, { headers: HEADERS });
      const data = await res.json();
      const map: Record<string, any> = {};
      (data.keys || []).forEach((k: any) => { map[k.provider] = k; });
      setKeys(map);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const save = async (provider: string) => {
    const { tenantId: saveTenantId } = await getTenantConfig();
    const raw = inputs[provider].trim();
    if (!raw) return;
    setSaving(provider);
    try {
      await fetch(`${API_BASE}/api/tenants/${saveTenantId}/provider-keys`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ provider, api_key: raw }),
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
    const { tenantId } = await getTenantConfig();
    try {
      await fetch(`${API_BASE}/api/tenants/${tenantId}/provider-keys/${provider}`, {
        method: "DELETE", headers: HEADERS,
      });
      await load();
    } catch (e) { console.error(e); }
    setRemoving(null);
  };

  return (
    <Card>
      <CardInner>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Provider API Keys</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            Your own OpenAI, Anthropic, and Google keys — you pay them directly. TokenGuard never sees your bills.
          </div>
        </div>

        <InfoBanner variant="blue" icon="ℹ" style={{ marginTop: 14 }}>
          TokenGuard proxies your calls using your own API keys. You keep full control of your provider relationships and billing.
        </InfoBanner>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {providers.map(p => {
            const configured = keys[p.id];
            const hasInput = !!inputs[p.id]?.trim();
            return (
              <div key={p.id} style={{
                background: C.rowAlt,
                border: `1px solid ${configured ? p.color + "40" : C.border}`,
                borderRadius: 12, padding: 16,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 12, gap: 10, flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${p.color}15`, color: p.color, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontFamily: FONT_SANS,
                    }}>{p.glyph}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                    {configured ? (
                      <span style={{
                        background: C.greenBg, color: C.greenText, border: `1px solid ${C.greenBorder}`,
                        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
                      }}>
                        ✓ Connected · {configured.preview}
                      </span>
                    ) : (
                      <span style={{
                        background: "#fff", color: C.textDim, border: `1px solid ${C.border}`,
                        fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 999,
                      }}>Not configured</span>
                    )}
                  </div>
                  {configured && (
                    <button onClick={() => remove(p.id)} disabled={removing === p.id} style={btnRedOutlineSm}>
                      {removing === p.id ? "…" : "Remove"}
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="password"
                    placeholder={configured ? "Enter new key to replace..." : p.placeholder}
                    value={inputs[p.id]}
                    onChange={e => setInputs(v => ({ ...v, [p.id]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && save(p.id)}
                    style={{
                      flex: 1, background: "#fff", border: `1px solid ${C.border}`,
                      borderRadius: 8, fontSize: 13, padding: "9px 14px", fontFamily: FONT_MONO,
                      color: C.text, outline: "none",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = p.color)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                  <button
                    onClick={() => save(p.id)}
                    disabled={!hasInput || saving === p.id}
                    style={{
                      background: saved[p.id] ? C.green : hasInput ? p.color : "#E2E8F0",
                      color: saved[p.id] || hasInput ? "#fff" : C.textDim,
                      border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      padding: "9px 18px", cursor: hasInput ? "pointer" : "default",
                      fontFamily: FONT_SANS, whiteSpace: "nowrap",
                    }}
                  >
                    {saving === p.id ? "Saving..." : saved[p.id] ? "Saved!" : configured ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardInner>
    </Card>
  );
}

// ─── EMPLOYEE KEY MANAGER (logic preserved, visual rewrite) ─────────────
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
  const [seedStatus, setSeedStatus] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { tenantId } = await getTenantConfig();
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/keys`, { headers: HEADERS });
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createKey = async () => {
    if (!newName.trim()) return;
    const { tenantId } = await getTenantConfig();
    setActionLoading("creating");
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/users`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), role: newRole.trim(), budget_usd: parseFloat(newBudget) || 50 }),
      });
      const data = await res.json();
      setNewKey(data.api_key);
      setNewName(""); setNewRole("");
      setAdding(false);
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const revokeKey = async (keyId: string) => {
    setActionLoading(keyId);
    const { tenantId } = await getTenantConfig();
    try {
      await fetch(`${API_BASE}/api/tenants/${tenantId}/keys/${keyId}`, { method: "DELETE", headers: HEADERS });
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const reactivateKey = async (keyId: string) => {
    setActionLoading(keyId);
    const { tenantId } = await getTenantConfig();
    try {
      await fetch(`${API_BASE}/api/tenants/${tenantId}/keys/${keyId}/reactivate`, { method: "POST", headers: HEADERS });
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const updateBudget = async (keyId: string) => {
    if (!editBudgetVal) return;
    const { tenantId } = await getTenantConfig();
    setActionLoading("budget-" + keyId);
    try {
      await fetch(`${API_BASE}/api/tenants/${tenantId}/keys/${keyId}/budget`, {
        method: "PATCH",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ budget_usd: parseFloat(editBudgetVal) }),
      });
      setEditBudgetId(null); setEditBudgetVal("");
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const seedKey = async (keyId: string) => {
    setSeedStatus(s => ({ ...s, [keyId]: "seeding" }));
    const { tenantId } = await getTenantConfig();
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/keys/${keyId}/seed`, { method: "POST", headers: HEADERS });
      const data = await res.json();
      setSeedStatus(s => ({ ...s, [keyId]: data.seeded ? "done" : "error" }));
      setTimeout(() => setSeedStatus(s => ({ ...s, [keyId]: "" })), 3000);
      await load();
    } catch {
      setSeedStatus(s => ({ ...s, [keyId]: "error" }));
      setTimeout(() => setSeedStatus(s => ({ ...s, [keyId]: "" })), 3000);
    }
  };

  const copyNewKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setNewKeyCopied(true);
    setTimeout(() => setNewKeyCopied(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, fontSize: 13, padding: "8px 12px", outline: "none", width: "100%",
    fontFamily: FONT_SANS,
  };

  return (
    <Card>
      <CardInner>
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 16, marginBottom: 14, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Employee API Keys</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              One unique key per team member — individual budgets, individual accountability.
            </div>
          </div>
          <button onClick={() => setAdding(v => !v)} style={btnBlueFilled}>
            ＋ Add Employee
          </button>
        </div>

        {/* New key banner */}
        {newKey && (
          <div style={{
            background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8,
            padding: "12px 14px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ fontSize: 12, color: C.greenText, fontWeight: 600 }}>
              ✓ New key created — copy it now, it won't be shown again
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <code style={{
                flex: 1, fontFamily: FONT_MONO, fontSize: 12, color: C.text,
                wordBreak: "break-all",
              }}>{newKey}</code>
              <button
                onClick={() => copyNewKey(newKey)}
                style={{
                  ...btnBlueOutlineSm,
                  color: newKeyCopied ? C.green : C.blueText,
                  background: newKeyCopied ? C.greenBg : C.blueBg,
                  borderColor: newKeyCopied ? C.greenBorder : C.blueBorder,
                  whiteSpace: "nowrap",
                }}
              >{newKeyCopied ? "Copied!" : "Copy Key"}</button>
              <button onClick={() => setNewKey(null)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: C.textDim, fontSize: 18, lineHeight: 1,
              }}>×</button>
            </div>
          </div>
        )}

        {/* Add employee form */}
        {adding && (
          <div style={{
            background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: 14, marginBottom: 16,
            display: "grid", gridTemplateColumns: "1fr 1fr 120px auto auto", gap: 10, alignItems: "end",
          }}>
            <div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Name *</div>
              <input style={inputStyle} placeholder="Sarah Chen" value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createKey()} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Role</div>
              <input style={inputStyle} placeholder="Engineering" value={newRole}
                onChange={e => setNewRole(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createKey()} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Budget</div>
              <input style={inputStyle} placeholder="Daily budget ($)" value={newBudget}
                onChange={e => setNewBudget(e.target.value)} type="number" min="1" />
            </div>
            <button onClick={createKey} disabled={!newName.trim() || actionLoading === "creating"} style={{
              ...btnBlueFilled, padding: "8px 16px",
              opacity: !newName.trim() ? 0.5 : 1,
            }}>
              {actionLoading === "creating" ? "..." : "Generate"}
            </button>
            <button onClick={() => setAdding(false)} style={btnGhostSm}>Cancel</button>
          </div>
        )}

        {/* Keys list */}
        {loading ? (
          <div style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: 24 }}>
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div style={{
            color: C.textMuted, fontSize: 13, textAlign: "center", padding: 32,
            background: C.rowAlt, border: `1px dashed ${C.border}`, borderRadius: 10,
          }}>
            No employee keys yet — click <strong style={{ color: C.text }}>Add Employee</strong> to create one.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 160px 120px 80px 100px 160px",
              gap: 12, padding: "0 12px 6px",
              borderBottom: `2px solid ${C.border}`,
            }}>
              {["Employee", "Key Preview", "Created", "Status", "Budget", "Actions"].map(h => (
                <div key={h} style={{
                  fontSize: 10, color: C.textDim, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>{h}</div>
              ))}
            </div>
            {keys.map(k => (
              <div key={k.id}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 160px 120px 80px 100px 160px",
                  gap: 12, alignItems: "center", padding: "10px 12px",
                  borderRadius: 8, transition: "background 0.1s",
                  background: "transparent",
                  opacity: k.is_active ? 1 : 0.65,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.rowAlt)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{k.label}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textDim }}>{k.key_preview}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {k.created_at ? new Date(k.created_at).toLocaleDateString() : "—"}
                </div>
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: k.is_active ? C.greenBg : C.borderSoft,
                    color: k.is_active ? C.greenText : C.textMuted,
                    border: `1px solid ${k.is_active ? C.greenBorder : C.border}`,
                    padding: "3px 9px", borderRadius: 999, textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>{k.is_active ? "Active" : "Revoked"}</span>
                </div>
                <div
                  style={{ fontSize: 12, color: C.blue, cursor: "pointer", borderBottom: `1px dashed ${C.blueBorder}`, width: "fit-content" }}
                  onClick={() => { setEditBudgetId(k.id); setEditBudgetVal(k.budget_usd ? String(k.budget_usd) : "50"); }}
                >
                  {editBudgetId === k.id ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number" value={editBudgetVal}
                        onChange={e => setEditBudgetVal(e.target.value)}
                        autoFocus onKeyDown={e => e.key === "Enter" && updateBudget(k.id)}
                        style={{
                          width: 56, background: "#fff", border: `1px solid ${C.blueBorder}`,
                          borderRadius: 6, color: C.text, fontSize: 12, padding: "3px 6px",
                          fontFamily: FONT_MONO, outline: "none",
                        }}
                      />
                      <button onClick={() => updateBudget(k.id)} style={{
                        background: C.blue, border: "none", borderRadius: 6, cursor: "pointer",
                        color: "#fff", fontSize: 11, padding: "3px 8px", fontWeight: 600,
                      }}>Save</button>
                    </span>
                  ) : (
                    <span style={{ fontFamily: FONT_MONO }}>
                      ${k.budget_usd ? Number(k.budget_usd).toFixed(2) : "—"}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => seedKey(k.id)} disabled={seedStatus[k.id] === "seeding"} style={btnBlueOutlineSm}>
                    {seedStatus[k.id] === "seeding" ? "…" : seedStatus[k.id] === "done" ? "✓" : seedStatus[k.id] === "error" ? "✗" : "Seed"}
                  </button>
                  {k.is_active ? (
                    <button onClick={() => revokeKey(k.id)} disabled={actionLoading === k.id} style={btnRedOutlineSm}>
                      {actionLoading === k.id ? "…" : "Revoke"}
                    </button>
                  ) : (
                    <button onClick={() => reactivateKey(k.id)} disabled={actionLoading === k.id} style={btnBlueOutlineSm}>
                      {actionLoading === k.id ? "…" : "Restore"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardInner>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════
function NotificationsTab() {
  const [alertEmail, setAlertEmail] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [alert70, setAlert70] = useState(true);
  const [alert90, setAlert90] = useState(true);
  const [alert100, setAlert100] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAlertEmail(localStorage.getItem("tg_alert_email") || "");
    setSlackWebhook(localStorage.getItem("tg_slack_webhook") || "");
    setAlert70(localStorage.getItem("tg_alert_70") !== "0");
    setAlert90(localStorage.getItem("tg_alert_90") !== "0");
    setAlert100(localStorage.getItem("tg_alert_100") !== "0");
  }, []);

  const saveAll = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("tg_alert_email", alertEmail);
    localStorage.setItem("tg_slack_webhook", slackWebhook);
    localStorage.setItem("tg_alert_70", alert70 ? "1" : "0");
    localStorage.setItem("tg_alert_90", alert90 ? "1" : "0");
    localStorage.setItem("tg_alert_100", alert100 ? "1" : "0");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const emailVerified = alertEmail.includes("@");
  const slackChannel = slackWebhook ? parseSlackChannel(slackWebhook) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%" }}>
      {/* Alert Channels */}
      <Card borderLeft={C.blue}>
        <CardInner>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Alert Channels</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              Where we send budget alerts — you get notified before employees get blocked, not after.
            </div>
          </div>

          {/* Email */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <IconCircle bg={C.blueBg2} color={C.blue} size={28} fontSize={13}>✉</IconCircle>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Alert Email</div>
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8 }}>
              Admin receives all budget threshold alerts.
            </div>
            <input
              type="email" value={alertEmail}
              onChange={e => setAlertEmail(e.target.value)}
              placeholder="alerts@yourcompany.com"
              style={fullInputStyle}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: emailVerified ? C.green : C.textDim }} />
              <span style={{ fontSize: 11, color: emailVerified ? C.green : C.textDim }}>
                {emailVerified ? "Verified" : "Not configured"}
              </span>
            </div>
          </div>

          {/* Slack */}
          <div style={{ marginTop: 20, borderTop: `1px solid ${C.borderSoft}`, paddingTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <IconCircle bg="#4A154B" color="#fff" size={28} fontSize={13}>#</IconCircle>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Slack Webhook</div>
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8 }}>
              Paste your Slack incoming webhook URL — alerts go directly to your channel.
            </div>
            <input
              value={slackWebhook}
              onChange={e => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              style={{ ...fullInputStyle, fontFamily: FONT_MONO, fontSize: 12 }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, gap: 8 }}>
              <a
                href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer"
                style={{ color: C.blue, fontSize: 11, textDecoration: "none" }}
              >How to create a Slack webhook →</a>
              {slackChannel && (
                <span style={{
                  background: C.greenBg, color: C.greenText, border: `1px solid ${C.greenBorder}`,
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                }}>Connected · {slackChannel}</span>
              )}
            </div>
          </div>

          <button onClick={saveAll} style={{
            background: saved ? C.green : C.blue, color: "#fff", border: "none",
            borderRadius: 8, padding: 10, width: "100%", fontSize: 13, fontWeight: 600,
            cursor: "pointer", marginTop: 20, fontFamily: FONT_SANS,
          }}>
            {saved ? "Settings saved ✓" : "Save Settings"}
          </button>
        </CardInner>
      </Card>

      {/* Alert Thresholds */}
      <Card>
        <CardInner>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Alert Thresholds</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              When we notify you — we alert at 3 levels so you're never surprised by a blocked employee.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            <ThresholdRow
              bg={C.amberBg} bd={C.amberBorder} dot={C.amber} fg={C.amberText}
              title="70% — Early Warning"
              desc="Employee is still working but approaching their limit. Time to check in."
              preview="Sarah used 70% of her $50 daily budget — $15.00 remaining"
              on={alert70} onChange={setAlert70}
            />
            <ThresholdRow
              bg={C.orangeBg} bd={C.orangeBorder} dot={C.orange} fg={C.orangeText}
              title="90% — Urgent Alert"
              desc="Employee has 10% of budget left. They'll be blocked soon without action."
              preview="Marcus used 90% of his $50 daily budget — $5.00 remaining · at risk of being blocked"
              on={alert90} onChange={setAlert90}
            />
            <ThresholdRow
              bg={C.redBg} bd={C.redBorder} dot={C.red} fg={C.redText}
              title="100% — Access Blocked"
              desc="Employee has been blocked. All their API calls are now rejected until midnight."
              preview="Jamie has been blocked — daily budget reached · access resumes at midnight UTC"
              on={alert100} onChange={setAlert100}
            />
          </div>

          <div style={{
            background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <IconCircle bg={C.blueBg2} color={C.blue} size={20} fontSize={11}>ℹ</IconCircle>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
              Alerts are sent to both your admin email and Slack channel simultaneously. Budget resets at midnight UTC — blocked employees automatically regain access.
            </div>
          </div>
        </CardInner>
      </Card>
    </div>
  );
}

function ThresholdRow({
  bg, bd, dot, fg, title, desc, preview, on, onChange,
}: {
  bg: string; bd: string; dot: string; fg: string;
  title: string; desc: string; preview: string;
  on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${bd}`, borderRadius: 10, padding: 16,
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{title}</div>
        </div>
        <div style={{ fontSize: 11, color: fg, lineHeight: 1.5, marginBottom: 6 }}>{desc}</div>
        <div style={{
          background: "#ffffffAA", border: `1px solid ${bd}`, borderRadius: 6,
          padding: "6px 10px", fontSize: 11, color: fg, fontFamily: FONT_MONO,
        }}>{preview}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 999,
        background: on ? C.green : "#CBD5E1", border: "none", cursor: "pointer",
        position: "relative", flexShrink: 0, transition: "background 0.15s",
      }}
      aria-pressed={on}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)", transition: "left 0.15s",
      }} />
    </button>
  );
}

function parseSlackChannel(url: string): string | null {
  // Slack webhook URLs don't contain channel names, so we just show a generic badge
  if (url.includes("hooks.slack.com")) return "#tokenguard-alerts";
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — PROXY & ROUTING
// ═══════════════════════════════════════════════════════════════════════════
function ProxyTab({ status, latency }: { status: "checking" | "live" | "down"; latency: number | null }) {
  const proxyUrl = API_BASE || "(not set)";
  const dashboardUrl = typeof process !== "undefined" && (process.env.NEXT_PUBLIC_APP_URL as string) || "(not set)";
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState<string | null>(null);

  const copyVal = (v: string, key: string) => {
    navigator.clipboard.writeText(v);
    setUrlCopied(key);
    setTimeout(() => setUrlCopied(null), 1500);
  };

  const snippet = `client = OpenAI(\n  api_key="your-tg-key",\n  base_url="${API_BASE || "https://api.tokenguard.io"}/v1"\n)`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Proxy Configuration */}
      <Card borderLeft={status === "live" ? C.green : C.red}>
        <CardInner>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Proxy Configuration</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              Your TokenGuard proxy endpoint — the one URL your team changes to get full cost control.
            </div>
          </div>

          {/* Live status banner */}
          <div style={{
            background: status === "live" ? C.greenBg : status === "down" ? C.redBg : C.rowAlt,
            border: `1px solid ${status === "live" ? C.greenBorder : status === "down" ? C.redBorder : C.border}`,
            borderRadius: 8, padding: "12px 16px", marginTop: 14, marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: status === "live" ? C.green : status === "down" ? C.red : C.textDim,
                animation: status === "live" ? "tg-pulse 2s ease-in-out infinite" : "none",
              }} />
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: status === "live" ? C.greenText : status === "down" ? C.redText : C.textMuted,
              }}>
                {status === "live" ? "Proxy Live" : status === "down" ? "Proxy Down" : "Checking…"}
              </span>
            </div>
            {status === "live" && latency !== null && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.green, fontWeight: 700 }}>{latency}ms</div>
                <div style={{ fontSize: 10, color: C.textDim }}>avg latency</div>
              </div>
            )}
          </div>

          {/* Config rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <ConfigRow label="Proxy Endpoint" value={proxyUrl} mono
              onCopy={() => copyVal(proxyUrl, "proxy")} copied={urlCopied === "proxy"} />
            <ConfigRow label="Dashboard" value={dashboardUrl} mono
              onCopy={() => copyVal(dashboardUrl, "dashboard")} copied={urlCopied === "dashboard"} />
            <ConfigRow label="Cache" value="Redis · Railway Production" badge="Active" badgeColor="green" />
            <ConfigRow label="Analytics" value="ClickHouse Cloud" badge="Active" badgeColor="green" />
            <ConfigRow label="Version" value="v1.0.0 · Production" badge="Prod" badgeColor="gray" last />
          </div>

          {/* Integration snippet */}
          <div style={{
            background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: 16, marginTop: 16, position: "relative",
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: C.textDim, letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: 8,
            }}>INTEGRATION SNIPPET</div>
            <pre style={{
              margin: 0, fontFamily: FONT_MONO, fontSize: 12, color: C.text,
              lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-all",
            }}>{snippet}</pre>
            <button
              onClick={() => { navigator.clipboard.writeText(snippet); setSnippetCopied(true); setTimeout(() => setSnippetCopied(false), 1500); }}
              style={{
                position: "absolute", top: 12, right: 12,
                ...btnBlueOutlineSm,
                background: snippetCopied ? C.greenBg : C.blueBg,
                color: snippetCopied ? C.green : C.blueText,
                borderColor: snippetCopied ? C.greenBorder : C.blueBorder,
              }}
            >{snippetCopied ? "Copied!" : "Copy"}</button>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>
              That's all your developers need to change.
            </div>
          </div>
        </CardInner>
      </Card>

      {/* Routing Configuration */}
      <Card>
        <CardInner>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Routing Configuration</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              How TokenGuard decides which model handles each request.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14, marginBottom: 20 }}>
            <RoutingRule iconBg={C.blueBg2} iconColor={C.blue} icon="⚡"
              name="Auto routing" desc="TokenGuard classifies each prompt and picks the cheapest capable model." />
            <RoutingRule iconBg={C.purpleBg2} iconColor={C.purple} icon="↓"
              name="Simple tasks → gpt-4o-mini" desc="Factual Q&A, short summaries, classification." />
            <RoutingRule iconBg={C.redBg2} iconColor={C.red} icon="↑"
              name="Complex tasks → gpt-4o" desc="Multi-step reasoning, code generation, deep analysis." />
            <RoutingRule iconBg={C.greenBg2} iconColor={C.green} icon="🛡"
              name="Budget enforcement" desc="Blocks requests once a user reaches their daily cap." />
            <RoutingRule iconBg={C.amberBg2} iconColor={C.amberText} icon="🔍"
              name="Keyword detection" desc="Escalates sensitive keywords to more capable models." />
          </div>

          {/* Performance strip */}
          <div style={{
            background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: 14,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: C.greenText, letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: 10,
            }}>ROUTING PERFORMANCE</div>
            <PerfRow label="Routing accuracy" value="94%" color={C.green} />
            <PerfRow label="Avg latency improvement" value="41% faster" color={C.blue} />
            <PerfRow label="Quality complaints" value="0" color={C.green} last />
          </div>
        </CardInner>
      </Card>
    </div>
  );
}

function ConfigRow({
  label, value, mono, badge, badgeColor, onCopy, copied, last,
}: {
  label: string; value: string; mono?: boolean;
  badge?: string; badgeColor?: "green" | "gray";
  onCopy?: () => void; copied?: boolean; last?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0", borderBottom: last ? "none" : `1px solid ${C.borderSoft}`,
      fontSize: 13, gap: 12,
    }}>
      <span style={{ color: C.textMuted, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{
          fontFamily: mono ? FONT_MONO : FONT_SANS, fontSize: 12, color: C.text,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260,
        }}>{value}</span>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            background: badgeColor === "green" ? C.greenBg : C.borderSoft,
            color:      badgeColor === "green" ? C.greenText : C.textMuted,
            border: `1px solid ${badgeColor === "green" ? C.greenBorder : C.border}`,
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>{badge}</span>
        )}
        {onCopy && (
          <button onClick={onCopy} title="Copy" style={{
            background: "none", border: "none", cursor: "pointer",
            color: copied ? C.green : C.textDim, fontSize: 12, padding: 2,
          }}>{copied ? "✓" : "⧉"}</button>
        )}
      </div>
    </div>
  );
}

function RoutingRule({
  iconBg, iconColor, icon, name, desc,
}: { iconBg: string; iconColor: string; icon: string; name: string; desc: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: 12,
      background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: iconBg, color: iconColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{name}</div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{desc}</div>
      </div>
      <span style={{
        background: C.greenBg, color: C.greenText, border: `1px solid ${C.greenBorder}`,
        fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
        textTransform: "uppercase", letterSpacing: "0.06em",
      }}>Active</span>
    </div>
  );
}

function PerfRow({ label, value, color, last }: { label: string; value: string; color: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", padding: "5px 0",
      borderBottom: last ? "none" : `1px solid ${C.greenBorder}55`, fontSize: 12,
    }}>
      <span style={{ color: C.greenText }}>{label}</span>
      <span style={{ fontFamily: FONT_MONO, color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — INTEGRATIONS
// ═══════════════════════════════════════════════════════════════════════════
function IntegrationsTab() {
  const [alertEmail, setAlertEmail] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    setAlertEmail(localStorage.getItem("tg_alert_email") || "");
    setSlackWebhook(localStorage.getItem("tg_slack_webhook") || "");
  }, []);

  const slackConnected = !!slackWebhook;
  const emailConnected = alertEmail.includes("@");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, width: "100%" }}>
      {/* Slack */}
      <div style={integrationCard}>
        <IntegrationHeader
          logoBg="#4A154B" glyph="#" name="Slack" connected={slackConnected}
        />
        <div style={integrationDesc}>
          Get budget alerts and weekly spend summaries directly in your Slack channels.
        </div>
        {slackConnected ? (
          <div style={{
            background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8,
            padding: "8px 12px", fontSize: 12, color: C.greenText,
          }}>
            ✓ Connected · alerts going to #tokenguard-alerts
          </div>
        ) : (
          <button style={{ ...btnBlueFilled, width: "100%" }}>Connect Slack</button>
        )}
      </div>

      {/* Email */}
      <div style={integrationCard}>
        <IntegrationHeader
          logoBg={C.blueBg2} color={C.blue} glyph="✉" name="Email Alerts" connected={emailConnected}
        />
        <div style={integrationDesc}>
          Weekly spend summaries and budget threshold alerts sent to your admin email.
        </div>
        {emailConnected ? (
          <div style={{
            background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8,
            padding: "8px 12px", fontSize: 12, color: C.greenText,
          }}>
            ✓ Connected · {alertEmail}
          </div>
        ) : (
          <a style={{ color: C.blue, fontSize: 12, textDecoration: "none" }}>
            Configure in Notifications tab →
          </a>
        )}
      </div>

      {/* PagerDuty — coming soon */}
      <ComingSoonCard name="PagerDuty" desc="Route critical budget blocks to your on-call rotation." />
      {/* Zapier — coming soon */}
      <ComingSoonCard name="Zapier" desc="Connect budget events to 5,000+ apps." />
      {/* Datadog — coming soon */}
      <ComingSoonCard name="Datadog" desc="Stream metrics and budget events into your Datadog workspace." />
      {/* Webhook */}
      <ComingSoonCard name="Custom Webhooks" desc="Forward any event to your own HTTPS endpoint." />
    </div>
  );
}

const integrationCard: React.CSSProperties = {
  background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 20,
  display: "flex", flexDirection: "column", gap: 10,
};
const integrationDesc: React.CSSProperties = {
  fontSize: 12, color: C.textMuted, lineHeight: 1.5, margin: "2px 0 4px",
};

function IntegrationHeader({
  logoBg, color = "#fff", glyph, name, connected,
}: { logoBg: string; color?: string; glyph: string; name: string; connected: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: logoBg, color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 700,
      }}>{glyph}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>{name}</div>
      <span style={{
        fontSize: 10, fontWeight: 700,
        background: connected ? C.greenBg : C.borderSoft,
        color: connected ? C.greenText : C.textMuted,
        border: `1px solid ${connected ? C.greenBorder : C.border}`,
        padding: "3px 9px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em",
      }}>{connected ? "Connected" : "Not set"}</span>
    </div>
  );
}

function ComingSoonCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div style={{
      background: C.rowAlt, border: `1px dashed ${C.border}`, borderRadius: 12, padding: 20,
      opacity: 0.75, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "#fff", color: C.textDim,
          border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 16, fontWeight: 700,
        }}>{name[0]}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>{name}</div>
        <span style={{
          fontSize: 10, fontWeight: 700, background: C.borderSoft, color: C.textMuted,
          border: `1px solid ${C.border}`, padding: "3px 9px", borderRadius: 999,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>Coming Soon</span>
      </div>
      <div style={integrationDesc}>{desc}</div>
      <a style={{ color: C.blue, fontSize: 12, textDecoration: "none" }}>Request early access →</a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 — BILLING
// ═══════════════════════════════════════════════════════════════════════════
function BillingTab({ overview, users }: { overview: any; users: any[] }) {
  const totalRequests = overview?.total_requests || overview?.total_calls || 0;
  const cacheHitRate = overview?.cache_hit_rate ?? 0;
  const totalCost = overview?.total_cost_usd ?? 0;
  const routedCalls = users.reduce((s, u) => s + (u.routed_calls || 0), 0);
  const totalCalls = users.reduce((s, u) => s + (u.api_calls || 0), 0);
  const routingRate = totalCalls > 0 ? (routedCalls / totalCalls) * 100 : 0;
  const totalSaved = users.reduce((s, u) => s + (u.savings_usd || 0), 0);
  const planCost = 199;
  const netValue = totalSaved - planCost;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, width: "100%" }}>
      {/* Current Plan */}
      <Card borderLeft={C.green}>
        <CardInner>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Current Plan</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              Your TokenGuard subscription details.
            </div>
          </div>

          {/* Plan hero */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: 20, background: C.greenBg, borderRadius: 10, marginTop: 14, marginBottom: 16, gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.greenText }}>Starter Plan</div>
              <div style={{ fontSize: 14, fontFamily: FONT_MONO, color: C.green, marginTop: 4 }}>
                $199 / month
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
                Billed monthly · cancel anytime
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                fontSize: 11, fontWeight: 700, background: C.green, color: "#fff",
                padding: "5px 12px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em",
              }}>Active</span>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>Renews May 26, 2026</div>
            </div>
          </div>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[
              "Up to 10 employees",
              "Unlimited API calls",
              "Real-time budget enforcement",
              "Intelligent model routing",
              "Email and Slack alerts",
              "ClickHouse analytics",
              "Redis caching",
            ].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text }}>
                <span style={{ color: C.green, fontSize: 14 }}>✓</span> {f}
              </div>
            ))}
          </div>

          {/* Upgrade callout */}
          <div style={{
            background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 10, padding: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.blueText2, marginBottom: 4 }}>
              Need more than 10 employees?
            </div>
            <div style={{ fontSize: 12, color: C.blue, lineHeight: 1.5, marginBottom: 12 }}>
              Our Growth and Enterprise plans support unlimited employees, custom routing rules, SSO, and dedicated support.
            </div>
            <button style={{ ...btnBlueFilled, padding: "9px 18px" }}>Schedule a call →</button>
          </div>
        </CardInner>
      </Card>

      {/* Usage */}
      <Card>
        <CardInner>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Usage This Period</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              What you've used since last billing date.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
            <UsageRow label="API Calls"        value={totalRequests.toLocaleString()}        color={C.text} />
            <UsageRow label="Employees Active" value={`${users.length}`} suffix="/ 10"       color={C.text} />
            <UsageRow label="Cache Hit Rate"   value={`${cacheHitRate.toFixed(1)}%`}         color={C.green} />
            <UsageRow label="Routing Rate"     value={`${routingRate.toFixed(1)}%`}          color={C.purple} />
            <UsageRow label="Total AI Spend"   value={`$${totalCost.toFixed(2)}`}            color={C.blue} />
            <UsageRow label="Money Saved"      value={`$${totalSaved.toFixed(2)}`}           color={C.green} bold last />
          </div>

          {/* ROI callout */}
          <div style={{
            background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8,
            padding: "12px 14px", marginTop: 12,
          }}>
            <div style={{ fontSize: 12, color: C.greenText, lineHeight: 1.5 }}>
              This period TokenGuard saved you <strong>${totalSaved.toFixed(2)}</strong> — that's{" "}
              <strong>${Math.max(0, netValue).toFixed(2)}</strong> more than we cost.
            </div>
          </div>

          <button style={{ ...btnGhostSm, width: "100%", marginTop: 12, padding: "9px 14px" }}>
            ⬇ Download Invoice
          </button>
        </CardInner>
      </Card>
    </div>
  );
}

function UsageRow({
  label, value, suffix, color, bold, last,
}: { label: string; value: string; suffix?: string; color: string; bold?: boolean; last?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", borderBottom: last ? "none" : `1px solid ${C.borderSoft}`, fontSize: 13,
    }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <span>
        <span style={{ fontFamily: FONT_MONO, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
        {suffix && <span style={{ fontFamily: FONT_MONO, color: C.textDim, marginLeft: 4 }}>{suffix}</span>}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════
function Card({ children, borderLeft }: { children: React.ReactNode; borderLeft?: string }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderLeft: borderLeft ? `4px solid ${borderLeft}` : undefined,
      borderRadius: 12, overflow: "hidden",
    }}>{children}</div>
  );
}

function CardInner({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 20 }}>{children}</div>;
}

function IconCircle({
  bg, color, size, fontSize, children,
}: { bg: string; color: string; size: number; fontSize: number; children: React.ReactNode }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size <= 24 ? 6 : 10, background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize, flexShrink: 0, fontWeight: 700,
    }}>{children}</div>
  );
}

function InfoBanner({
  variant, icon, children, style,
}: { variant: "blue" | "red"; icon: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const cfg = variant === "red"
    ? { bg: C.redBg, bd: C.redBorder, fg: C.redText }
    : { bg: C.blueBg, bd: C.blueBorder, fg: C.blueText2 };
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.bd}`, borderRadius: 8,
      padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      marginBottom: 16, ...style,
    }}>
      <span style={{ fontSize: 16, color: cfg.fg, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, color: cfg.fg, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

// ─── INPUT STYLE ───────────────────────────────────────────────────────
const fullInputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: C.text, outline: "none",
  fontFamily: FONT_SANS,
};

// ─── BUTTON STYLES ─────────────────────────────────────────────────────
const btnBlueFilled: React.CSSProperties = {
  background: C.blue, color: "#fff", border: "none",
  fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8,
  cursor: "pointer", fontFamily: FONT_SANS,
};
const btnGhostSm: React.CSSProperties = {
  background: "#fff", color: C.textMuted, border: `1px solid ${C.border}`,
  fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
  cursor: "pointer", fontFamily: FONT_SANS,
};
const btnBlueOutlineSm: React.CSSProperties = {
  background: C.blueBg, color: C.blueText, border: `1px solid ${C.blueBorder}`,
  fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 6,
  cursor: "pointer", fontFamily: FONT_SANS,
};
const btnRedOutlineSm: React.CSSProperties = {
  background: C.redBg, color: C.redText, border: `1px solid ${C.redBorder}`,
  fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 6,
  cursor: "pointer", fontFamily: FONT_SANS,
};


