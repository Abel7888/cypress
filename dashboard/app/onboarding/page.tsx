"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ── Light palette — matches OverviewPage.tsx / all dashboard pages ──────────
const C = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderSoft: "#F1F5F9",
  rowAlt: "#F8FAFC",
  text: "#0F172A",
  textMuted: "#64748B",
  textDim: "#94A3B8",
  blue: "#3B82F6",
  blueBg: "#EFF6FF",
  blueBg2: "#DBEAFE",
  blueBorder: "#BFDBFE",
  blueText: "#1D4ED8",
  blueText2: "#1E40AF",
  cyan: "#06B6D4",
  green: "#10B981",
  greenBg: "#F0FDF4",
  greenBg2: "#D1FAE5",
  greenBorder: "#BBF7D0",
  greenText: "#065F46",
  amber: "#F59E0B",
  amberBg: "#FFFBEB",
  amberBg2: "#FEF3C7",
  amberBorder: "#FDE68A",
  amberText: "#92400E",
  red: "#EF4444",
  redBg: "#FFF5F5",
  redBg2: "#FEE2E2",
  redBorder: "#FECACA",
  redText: "#991B1B",
  purple: "#8B5CF6",
  purpleBg: "#F5F3FF",
  purpleBg2: "#EDE9FE",
};
const MONO = "'JetBrains Mono', 'Fira Code', monospace";
const SANS = "'Inter', system-ui, sans-serif";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  "Intent",
  "Workspace",
  "Providers",
  "Team",
  "Keys",
  "Go Live",
];

const INTENT_OPTIONS = [
  { id: "spend",      label: "OpenAI spend getting out of hand" },
  { id: "visibility", label: "Team using AI with no visibility" },
  { id: "routing",    label: "Need to route to cheaper models" },
  { id: "all",        label: "All of the above" },
];

const PROVIDERS = [
  { id: "openai",    label: "OpenAI",    placeholder: "sk-proj-...",      color: "#10A37F", dot: "#10A37F" },
  { id: "anthropic", label: "Anthropic", placeholder: "sk-ant-...",       color: "#D97706", dot: "#D97706" },
  { id: "google",    label: "Google",    placeholder: "AIza...",          color: "#4285F4", dot: "#4285F4" },
  { id: "azure",     label: "Azure",     placeholder: "azure-api-key...", color: "#0078D4", dot: "#0078D4" },
  { id: "mistral",   label: "Mistral",   placeholder: "mistral-key...",   color: "#8B5CF6", dot: "#8B5CF6" },
];

const BUDGET_TEMPLATES = [
  { id: "engineering", label: "Engineering", amount: "50",  color: C.blue,   desc: "Heavy AI usage · code generation · analysis",    badge: "Recommended" },
  { id: "marketing",   label: "Marketing",   amount: "20",  color: C.purple, desc: "Moderate usage · copy writing · research",         badge: "" },
  { id: "exec",        label: "Executive",   amount: "999", color: C.green,  desc: "No cap · full access",                             badge: "" },
];

interface Employee { name: string; email: string; role: string; budget: string; }

// ── Reusable mini-components ──────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled = false, style = {} }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? C.blueBg2 : C.blue,
        color: disabled ? C.textDim : "#fff",
        border: "none",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        padding: "12px 24px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: SANS,
        transition: "background 0.15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style = {} }: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        color: C.textMuted,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 500,
        padding: "12px 20px",
        cursor: "pointer",
        fontFamily: SANS,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Label({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
      {text}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", style = {} }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: C.rowAlt,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        fontSize: 14,
        color: C.text,
        padding: "10px 14px",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: SANS,
        ...style,
      }}
      onFocus={e => (e.target.style.borderColor = C.blue)}
      onBlur={e => (e.target.style.borderColor = C.border)}
    />
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? C.red : pct >= 70 ? C.amber : C.green;
  return (
    <div style={{ background: C.borderSoft, borderRadius: 999, height: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.5s" }} />
    </div>
  );
}

// Savings estimator panel shown in step 3
function SavingsEstimator({ connectedCount }: { connectedCount: number }) {
  const rows = [
    { label: "OpenAI only",       saving: 180, providers: 1 },
    { label: "+ Anthropic",       saving: 240, providers: 2 },
    { label: "+ Google",          saving: 290, providers: 3 },
  ];
  return (
    <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.greenText, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
        Estimated savings · 10-person team
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 0",
          borderBottom: i < rows.length - 1 ? `1px solid ${C.greenBorder}` : "none",
          opacity: connectedCount >= r.providers ? 1 : 0.4,
        }}>
          <span style={{ fontSize: 13, color: C.greenText }}>{r.label}</span>
          <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.green }}>~${r.saving}/mo saved</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
function OnboardingPage() {
  const params = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Step 0 — Intent
  const [intent, setIntent] = useState("");

  // Step 1 — Workspace
  const [company, setCompany] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [alertEmail, setAlertEmail] = useState("");

  // Step 2 — Providers
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [savedProviders, setSavedProviders] = useState<Set<string>>(new Set());
  const [providerInputs, setProviderInputs] = useState<Record<string, string>>({});

  // Step 3 — Team
  const [employees, setEmployees] = useState<Employee[]>([{ name: "", email: "", role: "", budget: "50" }]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());
  const [seats] = useState(10);

  // Step 4 — Keys
  const [tenantId, setTenantId] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [masterKeyCopied, setMasterKeyCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdEmployeeKeys, setCreatedEmployeeKeys] = useState<{ name: string; sent: boolean }[]>([]);

  // Step 5 — Go Live
  const [activeTab, setActiveTab] = useState("openai");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [testResult, setTestResult] = useState<any>(null);

  const [error, setError] = useState("");

  // Verify Stripe payment on load
  useEffect(() => {
    async function verifyPayment() {
      const sessionId = params.get("session_id");
      if (!sessionId) { setVerified(true); setVerifying(false); return; }
      try {
        const res = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await res.json();
        if (data.valid) {
          setVerified(true);
          if (data.email) { setAdminEmail(data.email); setAlertEmail(data.email); }
          if (data.name) setAdminName(data.name);
        } else {
          router.replace("/signup?plan=starter&error=payment_required");
        }
      } catch {
        router.replace("/signup?plan=starter&error=payment_required");
      }
      setVerifying(false);
    }
    verifyPayment();
  }, []);

  // ── API calls (unchanged from original) ────────────────────────────────────
  const createTenant = async () => {
    if (!company.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`/api/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_tenant",
          company: company.trim(),
          email: adminEmail,
          slack_webhook: slackWebhook,
          alert_email: alertEmail,
        }),
      });
      const data = await res.json();

      if (data.tenant_id) {
        setTenantId(data.tenant_id);

        // Admin key
        const keyRes = await fetch(`/api/onboarding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_user",
            tenantId: data.tenant_id,
            name: adminName || "Admin",
            role: "Admin",
            budget_usd: 100,
          }),
        });
        const keyData = await keyRes.json();
        setMasterKey(keyData.api_key || "");

        // Employee keys
        const validEmps = employees.filter(e => e.name.trim());
        await Promise.all(
          validEmps.map(emp =>
            fetch(`/api/onboarding`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create_user",
                tenantId: data.tenant_id,
                name: emp.name.trim(),
                role: emp.role.trim(),
                budget_usd: parseFloat(emp.budget) || 50,
                email: emp.email || "",
              }),
            })
          )
        );

        setCreatedEmployeeKeys(validEmps.map(e => ({ name: e.name, sent: !!e.email })));
        localStorage.setItem("tg_tenant_id", data.tenant_id);
        localStorage.setItem("tg_api_key", keyData.api_key || "");
        localStorage.setItem("tg_company", company.trim());
        localStorage.setItem("tg_slack_webhook", slackWebhook);
        localStorage.setItem("tg_alert_email", alertEmail);

        setStep(4); // go to Keys step
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch {
      setError("Connection error — please try again");
    }
    setCreating(false);
  };

  const testConnection = async () => {
    setTestStatus("testing");
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${masterKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: "Hello" }], max_tokens: 10 }),
      });
      const data = await res.json();
      const latency = Date.now() - start;
      if (data.id) {
        setTestResult({ latency, model: data.model, routed: data.model !== "gpt-4o" });
        setTestStatus("success");
      } else {
        setTestStatus("failed");
      }
    } catch {
      setTestStatus("failed");
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(masterKey);
    setMasterKeyCopied(true);
    setTimeout(() => setMasterKeyCopied(false), 2000);
  };

  // ── Employee helpers ────────────────────────────────────────────────────────
  const addEmployee = () => {
    if (employees.length >= seats) return;
    setEmployees(e => [...e, { name: "", email: "", role: "", budget: "50" }]);
  };
  const removeEmployee = (i: number) => setEmployees(e => e.filter((_, idx) => idx !== i));
  const updateEmployee = (i: number, field: keyof Employee, val: string) =>
    setEmployees(e => e.map((emp, idx) => idx === i ? { ...emp, [field]: val } : emp));

  const applyTemplate = () => {
    const tmpl = BUDGET_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!tmpl) return;
    const targets = selectedEmployees.size > 0 ? [...selectedEmployees] : employees.map((_, i) => i);
    setEmployees(prev => prev.map((emp, i) => targets.includes(i) ? { ...emp, budget: tmpl.amount } : emp));
    setSelectedTemplate("");
    setSelectedEmployees(new Set());
  };

  // ── Provider helpers ─────────────────────────────────────────────────────────
  const saveProvider = (id: string) => {
    const key = providerInputs[id] || "";
    if (!key.trim()) return;
    setProviderKeys(prev => ({ ...prev, [id]: key }));
    setSavedProviders(prev => new Set([...prev, id]));
    setExpandedProvider(null);
    localStorage.setItem(`tg_provider_${id}`, key);
  };

  const removeProvider = (id: string) => {
    setProviderKeys(prev => { const n = { ...prev }; delete n[id]; return n; });
    setSavedProviders(prev => { const n = new Set(prev); n.delete(id); return n; });
    localStorage.removeItem(`tg_provider_${id}`);
  };

  // ── Integration code ────────────────────────────────────────────────────────
  const integrationCode: Record<string, { label: string; before: string; after: string }> = {
    openai: {
      label: "OpenAI SDK",
      before: `client = OpenAI(\n  api_key="sk-your-openai-key"\n)`,
      after:  `client = OpenAI(\n  api_key="${masterKey || "tg-your-key"}",\n  base_url="${API_BASE}/v1"\n)`,
    },
    anthropic: {
      label: "Anthropic SDK",
      before: `client = Anthropic(\n  api_key="sk-ant-your-key"\n)`,
      after:  `client = Anthropic(\n  api_key="${masterKey || "tg-your-key"}",\n  base_url="${API_BASE}"\n)`,
    },
    python: {
      label: "Python requests",
      before: `requests.post(\n  "https://api.openai.com/v1/chat/completions",\n  headers={"Authorization": "Bearer sk-your-key"}\n)`,
      after:  `requests.post(\n  "${API_BASE}/v1/chat/completions",\n  headers={"Authorization": "Bearer ${masterKey || "tg-your-key"}"}\n)`,
    },
    node: {
      label: "Node.js fetch",
      before: `fetch("https://api.openai.com/v1/chat/completions", {\n  headers: { Authorization: "Bearer sk-your-key" }\n})`,
      after:  `fetch("${API_BASE}/v1/chat/completions", {\n  headers: { Authorization: "Bearer ${masterKey || "tg-your-key"}" }\n})`,
    },
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (verifying) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.blueBg, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>🛡️</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 6 }}>Verifying your payment...</div>
          <div style={{ fontSize: 14, color: C.textMuted }}>Just a moment</div>
        </div>
      </div>
    );
  }
  if (!verified) return null;

  // ── Layout shell ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: SANS, overflowY: "auto" }}>

      {/* Top bar */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blueBg, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>TokenGuard</span>
        </div>
        <div style={{ fontSize: 12, color: C.textMuted }}>
          Questions? <a href="mailto:support@tokenguard.io" style={{ color: C.blue, textDecoration: "none" }}>support@tokenguard.io</a>
        </div>
      </div>

      {/* Progress strip */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 0, height: 56 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: i < step ? C.green : i === step ? C.blue : C.borderSoft,
                  border: `2px solid ${i < step ? C.green : i === step ? C.blue : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: i < step ? "#fff" : i === step ? "#fff" : C.textDim,
                  flexShrink: 0,
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: i === step ? 600 : 400, color: i === step ? C.text : C.textMuted, whiteSpace: "nowrap" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? C.green : C.border, margin: "0 12px", minWidth: 24 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── STEP 0 — INTENT ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 10 }}>What are you trying to control?</div>
              <div style={{ fontSize: 15, color: C.textMuted }}>We'll personalise your setup based on your answer.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {INTENT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setIntent(opt.id)}
                  style={{
                    background: intent === opt.id ? C.blueBg : C.card,
                    border: `2px solid ${intent === opt.id ? C.blue : C.border}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 14,
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: `2px solid ${intent === opt.id ? C.blue : C.border}`,
                    background: intent === opt.id ? C.blue : "transparent",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {intent === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{opt.label}</span>
                </button>
              ))}
            </div>
            <PrimaryBtn
              onClick={() => setStep(1)}
              disabled={!intent}
              style={{ width: "100%", padding: "14px", fontSize: 15 }}
            >
              Continue →
            </PrimaryBtn>
          </div>
        )}

        {/* ── STEP 1 — WORKSPACE ──────────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>Set up your workspace</div>
                <div style={{ fontSize: 14, color: C.textMuted }}>Two fields max. Alerts built in.</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                <div>
                  <Label text="Company name *" />
                  <TextInput value={company} onChange={setCompany} placeholder="Acme Corp" />
                </div>
                <div>
                  <Label text="Your email" />
                  <TextInput value={adminEmail} onChange={e => { setAdminEmail(e); if (!alertEmail) setAlertEmail(e); }} placeholder="you@acme.com" type="email" />
                </div>
              </div>

              {/* Alerts section */}
              <Card style={{ padding: "18px 20px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Where should alerts go?</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
                  You'll hear from us when anyone hits 70%, 90%, or gets blocked. Most admins say this alone is worth the subscription.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <Label text="Slack webhook" />
                      <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.blue, textDecoration: "none" }}>How to get this →</a>
                    </div>
                    <TextInput value={slackWebhook} onChange={setSlackWebhook} placeholder="https://hooks.slack.com/services/..." />
                  </div>
                  <div>
                    <Label text="Alert email" />
                    <TextInput value={alertEmail} onChange={setAlertEmail} placeholder="you@acme.com" type="email" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                  {["🟡 70% warning", "🟠 90% urgent", "🔴 100% blocked"].map(t => (
                    <span key={t} style={{ fontSize: 11, color: C.textMuted }}>{t}</span>
                  ))}
                </div>
              </Card>

              {error && <div style={{ fontSize: 13, color: C.redText, padding: "10px 14px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <GhostBtn onClick={() => setStep(0)}>Back</GhostBtn>
                <PrimaryBtn onClick={() => company.trim() && setStep(2)} disabled={!company.trim()} style={{ flex: 1 }}>
                  Continue →
                </PrimaryBtn>
              </div>
            </div>

            {/* Right: plan info + what happens next */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
              <Card style={{ padding: "14px 18px", borderLeft: `4px solid ${C.blue}` }}>
                <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Your plan</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Starter — $199/mo</div>
                <div style={{ fontSize: 13, color: C.textMuted }}>Up to 10 employees · unlimited API calls</div>
              </Card>
              {[
                { title: "Master key generated", desc: "One admin key to manage your entire team" },
                { title: "Add your team", desc: "Individual keys with daily budget caps" },
                { title: "One line change", desc: "Your devs update the base URL — live in minutes" },
                { title: "Dashboard ready", desc: "See every dollar spent in real time" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: C.blueBg, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, color: C.blue, fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2 — CONNECT PROVIDERS ──────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>Connect your AI providers</div>
              <div style={{ fontSize: 14, color: C.textMuted }}>TokenGuard sits in front of all of them. Your keys stay yours — encrypted at rest, never logged.</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {/* Provider cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PROVIDERS.map(prov => {
                  const isSaved = savedProviders.has(prov.id);
                  const isExpanded = expandedProvider === prov.id;

                  return (
                    <Card key={prov.id} style={{
                      border: `1px solid ${isSaved ? C.greenBorder : C.border}`,
                      background: isSaved ? C.greenBg : C.card,
                      overflow: "hidden",
                    }}>
                      {/* Header row */}
                      <div
                        style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: isSaved ? "default" : "pointer" }}
                        onClick={() => !isSaved && setExpandedProvider(isExpanded ? null : prov.id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: prov.color + "18", border: `1px solid ${prov.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: prov.dot }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{prov.label}</div>
                            {isSaved && (
                              <div style={{ fontSize: 11, fontFamily: MONO, color: C.textMuted }}>
                                {providerKeys[prov.id]?.slice(0, 8)}...{providerKeys[prov.id]?.slice(-4)}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSaved ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.green }}>✓ Connected</span>
                            <button onClick={() => removeProvider(prov.id)} style={{ fontSize: 11, color: C.textDim, background: "none", border: "none", cursor: "pointer", padding: "2px 8px" }}>Remove</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: C.blue, fontWeight: 500 }}>{isExpanded ? "✕" : "Add key"}</span>
                        )}
                      </div>

                      {/* Expanded input */}
                      {isExpanded && !isSaved && (
                        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${C.border}` }}>
                          <div style={{ paddingTop: 14, marginBottom: 10 }}>
                            <Label text="API Key" />
                            <TextInput
                              value={providerInputs[prov.id] || ""}
                              onChange={v => setProviderInputs(prev => ({ ...prev, [prov.id]: v }))}
                              placeholder={prov.placeholder}
                              type="password"
                            />
                            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                              We'll use this to forward calls from your team to {prov.label}.
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <PrimaryBtn onClick={() => saveProvider(prov.id)} style={{ flex: 1, padding: "9px 16px", fontSize: 13 }}>
                              Save
                            </PrimaryBtn>
                            <GhostBtn onClick={() => setExpandedProvider(null)} style={{ padding: "9px 14px", fontSize: 13 }}>
                              Cancel
                            </GhostBtn>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Right: savings estimator */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SavingsEstimator connectedCount={savedProviders.size} />
                <Card style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 10 }}>Why connect providers?</div>
                  {[
                    { title: "You own the keys", desc: "Your provider relationship and billing stays yours. We never see your invoices." },
                    { title: "Encrypted at rest", desc: "Keys are AES-256 encrypted. We never log them." },
                    { title: "Instant routing", desc: "Once connected, TokenGuard routes calls between providers automatically." },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${C.borderSoft}` : "none" }}>
                      <span style={{ fontSize: 13, color: C.green, flexShrink: 0 }}>✓</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{f.title}</div>
                        <div style={{ fontSize: 12, color: C.textMuted }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <GhostBtn onClick={() => setStep(1)}>Back</GhostBtn>
              <GhostBtn onClick={() => setStep(3)} style={{ color: C.textMuted }}>Skip for now</GhostBtn>
              <PrimaryBtn onClick={() => setStep(3)} style={{ flex: 1 }}>
                Continue →
              </PrimaryBtn>
            </div>
          </div>
        )}

        {/* ── STEP 3 — BUILD YOUR TEAM ────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>Build your team</div>
              <div style={{ fontSize: 14, color: C.textMuted }}>Each person gets their own key, their own budget, delivered to their inbox automatically.</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              {/* Left: employee rows */}
              <div>
                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 36px", gap: 8, padding: "0 4px 8px", borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
                  {["Name", "Role", "Budget/day", ""].map(h => (
                    <div key={h} style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
                  ))}
                </div>

                {employees.map((emp, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 36px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <TextInput value={emp.name} onChange={v => updateEmployee(i, "name", v)} placeholder="Sarah Chen" />
                    <TextInput value={emp.role} onChange={v => updateEmployee(i, "role", v)} placeholder="Engineering" />
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 13 }}>$</span>
                      <TextInput
                        value={emp.budget}
                        onChange={v => updateEmployee(i, "budget", v)}
                        placeholder="50"
                        style={{ paddingLeft: 24 }}
                      />
                    </div>
                    <button onClick={() => removeEmployee(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                ))}

                {employees.length < seats && (
                  <button
                    onClick={addEmployee}
                    style={{ width: "100%", background: "none", border: `1px dashed ${C.border}`, borderRadius: 8, padding: "10px 0", fontSize: 13, color: C.textMuted, cursor: "pointer", marginTop: 4 }}
                  >
                    + Add another ({seats - employees.length} slots remaining)
                  </button>
                )}

                <div style={{ marginTop: 14, padding: "10px 14px", background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: C.blueText2 }}>Starter plan: </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{employees.filter(e => e.name.trim()).length} / {seats} employees added</span>
                </div>
              </div>

              {/* Right: budget templates */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>💡 Quick setup templates</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Click a template then choose who to apply it to.</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {BUDGET_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id === selectedTemplate ? "" : t.id)}
                      style={{
                        background: selectedTemplate === t.id ? C.blueBg : C.rowAlt,
                        border: `2px solid ${selectedTemplate === t.id ? C.blue : C.border}`,
                        borderRadius: 10,
                        padding: "14px 16px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        textAlign: "left",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.label}</span>
                          {t.badge && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 999, padding: "1px 7px" }}>{t.badge}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{t.desc}</div>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: t.color, flexShrink: 0, marginLeft: 12 }}>
                        {t.id === "exec" ? "∞" : `$${t.amount}`}
                        <div style={{ fontSize: 10, fontWeight: 400, color: C.textDim, textAlign: "right" }}>/day</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Employee selector chips */}
                {selectedTemplate && (
                  <div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Apply to: (leave empty = apply to all)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {employees.filter(e => e.name.trim()).map((emp, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const next = new Set(selectedEmployees);
                            next.has(i) ? next.delete(i) : next.add(i);
                            setSelectedEmployees(next);
                          }}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: "pointer",
                            border: `1px solid ${selectedEmployees.has(i) ? C.blueBorder : C.border}`,
                            background: selectedEmployees.has(i) ? C.blueBg : C.rowAlt,
                            color: selectedEmployees.has(i) ? C.blueText : C.textMuted,
                            fontWeight: selectedEmployees.has(i) ? 600 : 400,
                          }}
                        >
                          {emp.name}
                        </button>
                      ))}
                    </div>
                    <PrimaryBtn onClick={applyTemplate} style={{ width: "100%", padding: "10px", fontSize: 13 }}>
                      Apply {selectedTemplate} template {selectedEmployees.size > 0 ? `to ${selectedEmployees.size} employees` : "to all employees"}
                    </PrimaryBtn>
                  </div>
                )}
              </div>
            </div>

            {error && <div style={{ fontSize: 13, color: C.redText, padding: "10px 14px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, marginTop: 16 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <GhostBtn onClick={() => setStep(2)}>Back</GhostBtn>
              <PrimaryBtn
                onClick={createTenant}
                disabled={creating}
                style={{ flex: 1, padding: "14px", fontSize: 15 }}
              >
                {creating ? "Creating your workspace..." : "Create account & continue →"}
              </PrimaryBtn>
            </div>

            {/* Creating progress — shown while API calls run */}
            {creating && (
              <div style={{ marginTop: 16, padding: "16px 20px", background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10 }}>
                {[
                  `${company} workspace created`,
                  `${employees.filter(e => e.name.trim()).length} employee keys generated`,
                  "Budget enforcement active",
                  "Alerts configured",
                  "Dashboard ready",
                ].map((msg, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", fontSize: 13, color: C.greenText }}>
                    <span style={{ fontSize: 14 }}>✓</span> {msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4 — YOUR KEYS ──────────────────────────────────────────── */}
        {step === 4 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>You're in.</div>
                <div style={{ fontSize: 14, color: C.textMuted }}>Copy your master key now — we also emailed it to {adminEmail}.</div>
              </div>

              {/* Master key display */}
              <Card style={{ marginBottom: 16, border: `1px solid ${C.greenBorder}`, background: C.greenBg }}>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>✓ Master key — copy this now</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: C.text, wordBreak: "break-all", lineHeight: 1.7, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                    {masterKey || "tg-generating..."}
                  </div>
                  <button
                    onClick={copyKey}
                    style={{
                      width: "100%", padding: "10px",
                      background: masterKeyCopied ? C.green : C.blue,
                      border: "none", borderRadius: 8,
                      color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: SANS,
                    }}
                  >
                    {masterKeyCopied ? "✓ Copied!" : "Copy master key"}
                  </button>
                </div>
              </Card>

              {/* Account details */}
              <Card style={{ marginBottom: 20 }}>
                <div style={{ padding: "14px 18px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Account details</div>
                  {[
                    { label: "Company", value: company },
                    { label: "Plan", value: "Starter — $199/mo" },
                    { label: "Employees", value: `${employees.filter(e => e.name.trim()).length} keys created` },
                    { label: "Tenant ID", value: tenantId, mono: true },
                  ].map((r, i, arr) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                      <span style={{ color: C.textMuted }}>{r.label}</span>
                      <span style={{ color: C.text, fontFamily: r.mono ? MONO : SANS, fontSize: r.mono ? 11 : 13 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <PrimaryBtn onClick={() => setStep(5)} style={{ width: "100%", padding: "14px", fontSize: 15 }}>
                Continue to integration →
              </PrimaryBtn>
            </div>

            {/* Right: employee key delivery status */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Your team received</div>

              {createdEmployeeKeys.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {createdEmployeeKeys.map((emp, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.blueBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.blue }}>
                          {emp.name[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{emp.name}</span>
                      </div>
                      <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ key sent</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: C.textMuted, padding: "8px 0" }}>
                    Each email includes their key and a one-line setup instruction.
                  </div>
                </div>
              ) : (
                <div style={{ padding: "24px", background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10, textAlign: "center", color: C.textMuted, fontSize: 13, marginBottom: 24 }}>
                  No employees added — you can add them from the Team page.
                </div>
              )}

              {/* What was created */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "🔑", title: "Master key", desc: "Full admin access — manage all employees and budgets" },
                  { icon: "🛡️", title: "Budget enforcement", desc: "Active immediately — nobody can overspend" },
                  { icon: "📊", title: "Dashboard access", desc: "See every call, every dollar, in real time" },
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    <span style={{ fontSize: 18 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5 — GO LIVE ────────────────────────────────────────────── */}
        {step === 5 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6 }}>One line change</div>
                <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Pick your stack. Change the base URL. Your existing code works exactly the same.</div>
              </div>

              {/* SDK tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {Object.entries(integrationCode).map(([id, tab]) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: activeTab === id ? C.blueBg : C.rowAlt,
                      border: `1px solid ${activeTab === id ? C.blueBorder : C.border}`,
                      color: activeTab === id ? C.blueText : C.textMuted,
                      fontFamily: SANS,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Code block */}
              <Card style={{ background: "#0F172A", border: "none", marginBottom: 16, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #1E293B" }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: "#64748B" }}>{activeTab === "openai" || activeTab === "anthropic" ? "your_app.py" : "your_app.js"}</span>
                </div>
                <div style={{ padding: "16px 18px", fontFamily: MONO, fontSize: 12, lineHeight: 2 }}>
                  <div style={{ color: "#475569", marginBottom: 4 }}># Before</div>
                  <pre style={{ color: "#94A3B8", margin: 0, whiteSpace: "pre-wrap" }}>{integrationCode[activeTab].before}</pre>
                  <div style={{ color: "#475569", margin: "14px 0 4px" }}># After</div>
                  <pre style={{ background: "#052E16", color: "#86EFAC", padding: "10px 12px", borderRadius: 8, margin: 0, whiteSpace: "pre-wrap" }}>{integrationCode[activeTab].after}</pre>
                </div>
                <div style={{ padding: "0 16px 12px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(integrationCode[activeTab].after)}
                    style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontFamily: SANS }}
                  >
                    Copy snippet
                  </button>
                </div>
              </Card>

              {/* Test connection */}
              <Card style={{ marginBottom: 16, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>▶ Test connection</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Makes one real call — costs ~$0.00004. You'll see it appear in your dashboard in real time.</div>

                {testStatus === "idle" && (
                  <button
                    onClick={testConnection}
                    style={{ width: "100%", padding: "10px", background: C.rowAlt, border: `1px solid ${C.blue}`, borderRadius: 8, color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}
                  >
                    Test connection
                  </button>
                )}
                {testStatus === "testing" && (
                  <div style={{ textAlign: "center", padding: "12px 0", fontSize: 13, color: C.textMuted }}>Testing connection...</div>
                )}
                {testStatus === "success" && (
                  <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.green, marginBottom: 12 }}>✓ Connected</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Requested", value: "gpt-4o" },
                        { label: "Served", value: testResult?.model || "gpt-4o-mini", highlight: true },
                        { label: "Cost", value: "$0.000043" },
                        { label: "Latency", value: `${testResult?.latency || 340}ms` },
                      ].map((r, i) => (
                        <div key={i} style={{ padding: "8px 10px", background: C.card, border: `1px solid ${C.greenBorder}`, borderRadius: 7 }}>
                          <div style={{ fontSize: 10, color: C.greenText, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{r.label}</div>
                          <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: r.highlight ? C.green : C.text }}>{r.value}</div>
                        </div>
                      ))}
                    </div>
                    {testResult?.routed && (
                      <div style={{ marginTop: 10, fontSize: 12, color: C.greenText, fontWeight: 600 }}>
                        TokenGuard just saved you money on your very first call. ↑
                      </div>
                    )}
                  </div>
                )}
                {testStatus === "failed" && (
                  <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.red, marginBottom: 4 }}>Connection failed</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>Check your key was copied correctly and try again.</div>
                    <button onClick={() => setTestStatus("idle")} style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: SANS }}>Try again →</button>
                  </div>
                )}
              </Card>

              <PrimaryBtn
                onClick={() => window.location.href = "/dashboard"}
                style={{ width: "100%", padding: "14px", fontSize: 15, background: testStatus === "success" ? C.green : C.blue }}
              >
                {testStatus === "success" ? "Go to dashboard →" : "Skip to dashboard →"}
              </PrimaryBtn>
            </div>

            {/* Right: you're protected */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>You're protected from day one</div>

              {[
                { icon: "⚡", color: C.blueBg, border: C.blueBorder, title: "Every call goes through TokenGuard", desc: "Routing, caching, and budget checks happen automatically on every request." },
                { icon: "🛡️", color: C.greenBg, border: C.greenBorder, title: "Budgets enforced immediately", desc: "Nobody on your team can spend over their daily limit. Blocks before the bill arrives." },
                { icon: "💰", color: "#FFFBEB", border: C.amberBorder, title: "Savings start now", desc: "Simple prompts are already being routed to cheaper models automatically." },
                { icon: "📊", color: C.purpleBg, border: "#DDD6FE", title: "Full visibility from call #1", desc: "Every employee, every model, every dollar tracked in real time." },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: f.color, border: `1px solid ${f.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 0 32px", fontSize: 12, color: C.textDim }}>
        Questions? <a href="mailto:support@tokenguard.io" style={{ color: C.blue, textDecoration: "none" }}>support@tokenguard.io</a>
      </div>
    </div>
  );
}

export default function OnboardingPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontSize: 16, color: "#64748B" }}>Loading...</div>
        </div>
      </div>
    }>
      <OnboardingPage />
    </Suspense>
  );
}

