"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

const C = {
  bg: "#080C14",
  bgCard: "#0D1220",
  bgAccent: "#141B2D",
  border: "#1E2A42",
  primary: "#4F8EF7",
  primaryDim: "#1E3A6B",
  green: "#22C55E",
  greenDim: "#14532D",
  amber: "#F59E0B",
  red: "#EF4444",
  text: "#F0F4FF",
  textMuted: "#6B7FA3",
  textDim: "#3D4F72",
  purple: "#8B5CF6",
};

const STEPS = ["Welcome", "Setup", "Your Team", "Your Keys", "Go Live"];

interface Employee { name: string; role: string; budget: string; }

function OnboardingPage() {
  const params = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [company, setCompany] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [seats] = useState(10);
  const [employees, setEmployees] = useState<Employee[]>([
    { name: "", role: "", budget: "50" },
  ]);
  const [tenantId, setTenantId] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [masterKeyCopied, setMasterKeyCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("openai");

  // Verify Stripe payment on load
  useEffect(() => {
    async function verifyPayment() {
      const sessionId = params.get("session_id");
      if (!sessionId) {
        router.replace("/signup?plan=starter");
        return;
      }
      try {
        const res = await fetch(`/api/verify-session?session_id=${sessionId}`);
        const data = await res.json();
        if (data.valid) {
          setVerified(true);
          if (data.email) setAdminEmail(data.email);
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

  const inp = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: C.bgAccent,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 15,
    padding: "12px 16px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    ...extra,
  });

  const btn = (variant: "primary" | "ghost" | "green" = "primary", extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: variant === "primary" ? C.primary : variant === "green" ? C.green : "transparent",
    border: variant === "ghost" ? `1px solid ${C.border}` : "none",
    borderRadius: 10,
    color: variant === "ghost" ? C.textMuted : "#fff",
    fontSize: 15,
    fontWeight: 600,
    padding: "13px 28px",
    cursor: "pointer",
    ...extra,
  });

  const addEmployee = () => {
    if (employees.length >= seats) return;
    setEmployees(e => [...e, { name: "", role: "", budget: "50" }]);
  };
  const removeEmployee = (i: number) => setEmployees(e => e.filter((_, idx) => idx !== i));
  const updateEmployee = (i: number, field: keyof Employee, val: string) =>
    setEmployees(e => e.map((emp, idx) => idx === i ? { ...emp, [field]: val } : emp));

  const createTenant = async () => {
    if (!company.trim()) return;
    setCreating(true);
    setError("");
    try {
      // Create tenant
      const res = await fetch(`/api/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_tenant", company: company.trim() }),
      });
      const data = await res.json();

      if (data.tenant_id) {
        setTenantId(data.tenant_id);

        // Create admin key
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

        // Create employee keys
        const validEmps = employees.filter(e => e.name.trim());
        await Promise.all(validEmps.map(emp =>
          fetch(`/api/onboarding`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create_user",
              tenantId: data.tenant_id,
              name: emp.name.trim(),
              role: emp.role.trim(),
              budget_usd: parseFloat(emp.budget) || 50,
            }),
          })
        ));

        localStorage.setItem("tg_tenant_id", data.tenant_id);
        localStorage.setItem("tg_api_key", keyData.api_key || "");
        localStorage.setItem("tg_company", company.trim());
        setStep(3);
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (e) {
      setError("Connection error — please try again");
    }
    setCreating(false);
  };

  const testConnection = async () => {
    setTestStatus("testing");
    try {
      const res = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${masterKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10,
        }),
      });
      const data = await res.json();
      setTestStatus(data.id ? "success" : "failed");
    } catch {
      setTestStatus("failed");
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(masterKey);
    setMasterKeyCopied(true);
    setTimeout(() => setMasterKeyCopied(false), 2000);
  };

  // Loading state while verifying payment
  if (verifying) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🛡️</div>
          <div style={{ fontSize: 18, color: C.text, marginBottom: 8 }}>Verifying your payment...</div>
          <div style={{ fontSize: 14, color: C.textMuted }}>Just a moment</div>
        </div>
      </div>
    );
  }

  if (!verified) return null;

  const integrationTabs = [
    { id: "openai", label: "OpenAI SDK" },
    { id: "anthropic", label: "Anthropic SDK" },
    { id: "python", label: "Python requests" },
    { id: "node", label: "Node.js fetch" },
  ];

  const integrationCode: Record<string, { file: string; before: string; after: string }> = {
    openai: {
      file: "your_app.py",
      before: `client = OpenAI(\n  api_key="sk-your-openai-key"\n)`,
      after: `client = OpenAI(\n  api_key="${masterKey || "tg-your-key-here"}",\n  base_url="${API_BASE}/v1"\n)`,
    },
    anthropic: {
      file: "your_app.py",
      before: `client = Anthropic(\n  api_key="sk-ant-your-key"\n)`,
      after: `client = Anthropic(\n  api_key="${masterKey || "tg-your-key-here"}",\n  base_url="${API_BASE}"\n)`,
    },
    python: {
      file: "your_app.py",
      before: `requests.post(\n  "https://api.openai.com/v1/chat/completions",\n  headers={"Authorization": "Bearer sk-your-key"}\n)`,
      after: `requests.post(\n  "${API_BASE}/v1/chat/completions",\n  headers={"Authorization": "Bearer ${masterKey || "tg-your-key-here"}"}\n)`,
    },
    node: {
      file: "your_app.js",
      before: `fetch("https://api.openai.com/v1/chat/completions", {\n  headers: { Authorization: "Bearer sk-your-key" }\n})`,
      after: `fetch("${API_BASE}/v1/chat/completions", {\n  headers: { Authorization: "Bearer ${masterKey || "tg-your-key-here"}" }\n})`,
    },
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      padding: "32px 24px 60px", fontFamily: "system-ui, sans-serif",
      overflowY: "auto",
    }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛡️</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>TokenGuard</div>
          <div style={{ fontSize: 11, color: C.textDim, letterSpacing: "0.06em" }}>AI COST CONTROL</div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 48, width: "100%", maxWidth: 860 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: i < step ? C.green : i === step ? C.primary : C.bgAccent,
                border: `2px solid ${i < step ? C.green : i === step ? C.primary : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700,
                color: i <= step ? "#fff" : C.textDim,
                transition: "all 0.3s",
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 11, color: i === step ? C.text : C.textDim, whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? C.green : C.border, margin: "0 8px", marginBottom: 20, transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "40px 48px",
        width: "100%", maxWidth: 900,
        boxSizing: "border-box" as const,
      }}>

        {/* STEP 0 — WELCOME */}
        {step === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 14 }}>
                  Stop surprise<br />AI bills.
                </div>
                <div style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.7 }}>
                  TokenGuard gives your team full AI access while you stay in control of every dollar spent. Setup takes 60 seconds.
                </div>
              </div>
              <button style={{ ...btn(), fontSize: 16, padding: "15px 32px" }} onClick={() => setStep(1)}>
                Get started →
              </button>
              <div style={{ fontSize: 13, color: C.textDim }}>
                Questions? Email <span style={{ color: C.primary }}>support@tokenguard.io</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "⚡", title: "One line of code", desc: "No SDK, no rewriting prompts — just change the base URL" },
                { icon: "🛡️", title: "Budget caps per employee", desc: "Blocks before the bill arrives — not after" },
                { icon: "💰", title: "Save 30–70% automatically", desc: "Intelligent routing to cheaper models on simple tasks" },
                { icon: "📊", title: "Full visibility", desc: "See exactly who spent what, down to the API call" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: C.bgAccent, borderRadius: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1 — SETUP */}
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 8 }}>Set up your account</div>
                <div style={{ fontSize: 15, color: C.textMuted }}>Takes 30 seconds.</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em" }}>COMPANY NAME *</div>
                  <input style={inp()} placeholder="Acme Corp" value={company} onChange={e => setCompany(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em" }}>YOUR NAME</div>
                  <input style={inp()} placeholder="Sarah Chen" value={adminName} onChange={e => setAdminName(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em" }}>WORK EMAIL</div>
                  <input style={inp()} type="email" placeholder="sarah@acme.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                </div>
                <div style={{ background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: C.textMuted }}>Plan</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>Starter — $199/mo · 10 employees</span>
                </div>
              </div>
              {error && <div style={{ fontSize: 13, color: C.red, padding: "10px 14px", background: "#1a0808", borderRadius: 8 }}>{error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button style={btn("ghost")} onClick={() => setStep(0)}>Back</button>
                <button style={{ ...btn(), flex: 1, opacity: !company.trim() ? 0.5 : 1 }} onClick={() => company.trim() && setStep(2)}>Continue →</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
              <div style={{ fontSize: 13, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>What happens next</div>
              {[
                { icon: "🔑", title: "Master key generated", desc: "One admin key to manage your entire team" },
                { icon: "👥", title: "Add your team", desc: "Create individual keys with custom budgets per person" },
                { icon: "⚡", title: "One line change", desc: "Your devs update the base URL — they're live in minutes" },
                { icon: "📊", title: "Dashboard ready", desc: "See every dollar spent in real time from day one" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: C.bgAccent, borderRadius: 12 }}>
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — YOUR TEAM */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 8 }}>Add your team</div>
                <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.6 }}>
                  Give each employee their own key and daily budget. They can't spend a dollar more than you allow.
                </div>
                <div style={{ marginTop: 16, padding: "12px 16px", background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: C.textMuted }}>Starter plan: </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{employees.length} / {seats} employees added</span>
                </div>
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { icon: "🛡️", text: "Each person gets their own spending limit" },
                    { icon: "🔴", text: "Blocked automatically when they hit their cap" },
                    { icon: "✏️", text: "Change budgets anytime from the dashboard" },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: C.textMuted }}>
                      <span>{f.icon}</span><span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 32px", gap: 8, padding: "0 4px" }}>
                  {["Name", "Role", "Budget/day", ""].map(h => (
                    <div key={h} style={{ fontSize: 11, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
                  ))}
                </div>
                {employees.map((emp, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 32px", gap: 8, alignItems: "center" }}>
                    <input style={inp({ padding: "9px 12px", fontSize: 13 })} placeholder="Sarah Chen" value={emp.name} onChange={e => updateEmployee(i, "name", e.target.value)} />
                    <input style={inp({ padding: "9px 12px", fontSize: 13 })} placeholder="Engineering" value={emp.role} onChange={e => updateEmployee(i, "role", e.target.value)} />
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 13 }}>$</span>
                      <input style={inp({ padding: "9px 12px 9px 22px", fontSize: 13 })} type="number" min="1" value={emp.budget} onChange={e => updateEmployee(i, "budget", e.target.value)} />
                    </div>
                    <button onClick={() => removeEmployee(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 18, padding: 0 }}>×</button>
                  </div>
                ))}
                {employees.length < seats && (
                  <button onClick={addEmployee} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 10, cursor: "pointer", color: C.textMuted, fontSize: 13, padding: "10px 0", marginTop: 4 }}>
                    + Add another employee ({seats - employees.length} remaining)
                  </button>
                )}
              </div>
            </div>
            {error && <div style={{ fontSize: 13, color: C.red, padding: "10px 14px", background: "#1a0808", borderRadius: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
              <button style={btn("ghost")} onClick={() => setStep(1)}>Back</button>
              <button style={{ ...btn(), flex: 1, opacity: creating ? 0.7 : 1 }} onClick={createTenant} disabled={creating}>
                {creating ? "Creating your account..." : "Create account & continue →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — YOUR KEYS */}
        {step === 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 8 }}>Your account is ready 🎉</div>
                <div style={{ fontSize: 15, color: C.textMuted }}>Copy your master API key — shown once only.</div>
              </div>
              <div style={{ background: C.bgAccent, border: `1px solid ${C.green}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginBottom: 10, letterSpacing: "0.04em" }}>✓ MASTER API KEY — COPY NOW</div>
                <code style={{ display: "block", fontFamily: "monospace", fontSize: 12, color: C.text, wordBreak: "break-all", lineHeight: 1.6, marginBottom: 12 }}>
                  {masterKey}
                </code>
                <button onClick={copyKey} style={{
                  background: masterKeyCopied ? C.greenDim : C.primaryDim,
                  border: `1px solid ${masterKeyCopied ? C.green : C.primary}`,
                  borderRadius: 8, cursor: "pointer",
                  color: masterKeyCopied ? C.green : C.primary,
                  fontSize: 13, padding: "9px 20px", fontWeight: 600, width: "100%",
                }}>
                  {masterKeyCopied ? "✓ Copied!" : "Copy Master Key"}
                </button>
              </div>
              <div style={{ background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Account Details</div>
                {[
                  { label: "Company", value: company },
                  { label: "Plan", value: "Starter — $199/mo" },
                  { label: "Employees added", value: `${employees.filter(e => e.name.trim()).length} keys created` },
                  { label: "Tenant ID", value: tenantId },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ color: C.textDim }}>{r.label}</span>
                    <span style={{ color: C.text, fontFamily: i === 3 ? "monospace" : "inherit", fontSize: i === 3 ? 11 : 13 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <button style={{ ...btn(), width: "100%" }} onClick={() => setStep(4)}>Continue to integration →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
              <div style={{ fontSize: 13, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>What was just created</div>
              {[
                { icon: "🔑", title: "Master key", desc: "Full admin access — manage all employees and budgets" },
                { icon: "👥", title: `${employees.filter(e => e.name.trim()).length} employee keys`, desc: "Individual keys with daily budget caps — ready to use" },
                { icon: "🛡️", title: "Budget enforcement", desc: "Active immediately — nobody can overspend" },
                { icon: "📊", title: "Dashboard access", desc: "See every call, every dollar, in real time" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "16px", background: C.bgAccent, borderRadius: 12 }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: C.textMuted }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 — GO LIVE */}
        {step === 4 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 8 }}>One line change</div>
                <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.6 }}>Pick your stack and follow the snippet. Your existing API key stays — just add your TokenGuard key and update the base URL.</div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {integrationTabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    background: activeTab === tab.id ? C.primaryDim : C.bgAccent,
                    border: `1px solid ${activeTab === tab.id ? C.primary : C.border}`,
                    color: activeTab === tab.id ? C.primary : C.textMuted,
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Code block */}
              <div style={{ background: "#0a0f1a", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>
                  {integrationCode[activeTab].file}
                </div>
                <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13, lineHeight: 2 }}>
                  <div style={{ color: "#6B7FA3", marginBottom: 4 }}># BEFORE</div>
                  <pre style={{ color: "#9CA3AF", margin: 0, whiteSpace: "pre-wrap" }}>{integrationCode[activeTab].before}</pre>
                  <div style={{ color: "#6B7FA3", margin: "16px 0 4px" }}># AFTER</div>
                  <pre style={{ background: "#0d2d1a", color: "#86EFAC", padding: "10px", borderRadius: 8, margin: 0, whiteSpace: "pre-wrap" }}>{integrationCode[activeTab].after}</pre>
                </div>
              </div>

              {/* Test connection */}
              <div style={{ background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>Verify your integration before going to the dashboard.</div>
                {testStatus === "idle" && (
                  <button onClick={testConnection} style={{ ...btn(), width: "100%", background: C.bgCard, border: `1px solid ${C.primary}`, color: C.primary }}>
                    Test connection
                  </button>
                )}
                {testStatus === "testing" && (
                  <div style={{ textAlign: "center", padding: "12px 0", color: C.textMuted, fontSize: 14 }}>Testing connection...</div>
                )}
                {testStatus === "success" && (
                  <div style={{ background: C.greenDim, border: `1px solid ${C.green}`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>Connected successfully</div>
                      <div style={{ fontSize: 13, color: C.textMuted }}>Your API calls are now routing through TokenGuard.</div>
                    </div>
                  </div>
                )}
                {testStatus === "failed" && (
                  <div style={{ background: "#1a0808", border: "1px solid #EF4444", borderRadius: 10, padding: "14px 18px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.red }}>Connection failed</div>
                    <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Check your key was copied correctly.</div>
                    <button onClick={() => setTestStatus("idle")} style={{ ...btn("ghost"), marginTop: 10, fontSize: 13, padding: "8px 16px" }}>Try again</button>
                  </div>
                )}
              </div>

              <button onClick={() => window.location.href = "/dashboard"} style={{ ...btn(testStatus === "success" ? "green" : "primary"), width: "100%", fontSize: 16, padding: "15px 0" }}>
                {testStatus === "success" ? "Go to dashboard →" : "Skip to dashboard →"}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
              <div style={{ fontSize: 13, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>You're protected from day one</div>
              {[
                { icon: "⚡", title: "Every call goes through TokenGuard", desc: "Routing, caching, and budget checks happen automatically" },
                { icon: "🛡️", title: "Budgets enforced immediately", desc: "Nobody on your team can spend over their limit" },
                { icon: "💰", title: "Savings start now", desc: "Simple prompts are already being routed to cheaper models" },
                { icon: "📊", title: "Full visibility from call #1", desc: "Every employee, every model, every dollar tracked" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "16px", background: C.bgAccent, borderRadius: 12 }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: C.textMuted }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, fontSize: 13, color: C.textDim, textAlign: "center" }}>
        <div>Questions? Email <span style={{ color: C.primary }}>support@tokenguard.io</span></div>
      </div>
    </div>
  );
}

export default function OnboardingPageWrapper() {
  return <Suspense fallback={null}><OnboardingPage /></Suspense>;
}
