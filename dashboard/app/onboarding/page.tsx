"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_BASE = "https://cypress-production-1cc5.up.railway.app";
const ADMIN_KEY = "lMNUO5f2xEAmxq8lXA9ODmCi-pxCr-9hL99fyw3VlWw";
const HEADERS = { Authorization: `Bearer ${ADMIN_KEY}`, "Content-Type": "application/json" };

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

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) {
      router.replace("/signup?plan=starter");
    }
  }, []);
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [seats, setSeats] = useState(10);
  const [employees, setEmployees] = useState<Employee[]>([
    { name: "", role: "", budget: "50" },
  ]);
  const [tenantId, setTenantId] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [masterKeyCopied, setMasterKeyCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [error, setError] = useState("");

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

  const addEmployee = () => setEmployees(e => [...e, { name: "", role: "", budget: "50" }]);
  const removeEmployee = (i: number) => setEmployees(e => e.filter((_, idx) => idx !== i));
  const updateEmployee = (i: number, field: keyof Employee, val: string) =>
    setEmployees(e => e.map((emp, idx) => idx === i ? { ...emp, [field]: val } : emp));

  const createTenant = async () => {
    if (!company.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/tenants`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ name: company.trim(), plan: "starter" }),
      });
      const data = await res.json();
      if (data.tenant_id) {
        setTenantId(data.tenant_id);
        const keyRes = await fetch(`${API_BASE}/api/tenants/${data.tenant_id}/users`, {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({ name: adminName || "Admin", role: "Admin", budget_usd: 100 }),
        });
        const keyData = await keyRes.json();
        setMasterKey(keyData.api_key || "");

        // Create employee keys
        const validEmps = employees.filter(e => e.name.trim());
        await Promise.all(validEmps.map(emp =>
          fetch(`${API_BASE}/api/tenants/${data.tenant_id}/users`, {
            method: "POST",
            headers: HEADERS,
            body: JSON.stringify({
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
      setError("Connection error â€” check proxy is running");
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
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>ðŸ›¡ï¸</div>
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
                {i < step ? "âœ“" : i + 1}
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

        {/* STEP 0 â€” WELCOME */}
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
                Get started â†’
              </button>
              <div style={{ fontSize: 13, color: C.textDim }}>
                Questions? Email <span style={{ color: C.primary }}>support@tokenguard.io</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "âš¡", title: "One line of code", desc: "No SDK, no rewriting prompts â€” just change the base URL" },
                { icon: "ðŸ›¡ï¸", title: "Budget caps per employee", desc: "Blocks before the bill arrives â€” not after" },
                { icon: "ðŸ’°", title: "Save 30â€“70% automatically", desc: "Intelligent routing to cheaper models on simple tasks" },
                { icon: "ðŸ“Š", title: "Full visibility", desc: "See exactly who spent what, down to the API call" },
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

        {/* STEP 1 â€” SETUP */}
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 8 }}>Set up your account</div>
                <div style={{ fontSize: 15, color: C.textMuted }}>Takes 30 seconds. No credit card yet.</div>
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
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 600, letterSpacing: "0.04em" }}>TEAM SIZE</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[10, 25, 50, 100].map(n => (
                      <button key={n} onClick={() => setSeats(n)} style={{
                        flex: 1, padding: "11px 0",
                        background: seats === n ? C.primaryDim : C.bgAccent,
                        border: `1px solid ${seats === n ? C.primary : C.border}`,
                        borderRadius: 8, cursor: "pointer",
                        color: seats === n ? C.primary : C.textMuted,
                        fontSize: 14, fontWeight: seats === n ? 700 : 400,
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
              {error && <div style={{ fontSize: 13, color: C.red, padding: "10px 14px", background: "#1a0808", borderRadius: 8 }}>{error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button style={btn("ghost")} onClick={() => setStep(0)}>Back</button>
                <button style={{ ...btn(), flex: 1, opacity: !company.trim() ? 0.5 : 1 }} onClick={() => company.trim() && setStep(2)}>Continue â†’</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
              <div style={{ fontSize: 13, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>What happens next</div>
              {[
                { icon: "ðŸ”‘", title: "Master key generated", desc: "One admin key to manage your entire team" },
                { icon: "ðŸ‘¥", title: "Add your team", desc: "Create individual keys with custom budgets per person" },
                { icon: "âš¡", title: "One line change", desc: "Your devs update the base URL â€” they're live in minutes" },
                { icon: "ðŸ“Š", title: "Dashboard ready", desc: "See every dollar spent in real time from day one" },
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

        {/* STEP 2 â€” YOUR TEAM */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 8 }}>Add your team</div>
                <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.6 }}>
                  Give each employee their own key and daily budget. They can't spend a dollar more than you allow.
                </div>
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { icon: "ðŸ›¡ï¸", text: "Each person gets their own spending limit" },
                    { icon: "ðŸ”´", text: "Blocked automatically when they hit their cap" },
                    { icon: "âœï¸", text: "Change budgets anytime from the dashboard" },
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
                    <button onClick={() => removeEmployee(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 18, padding: 0 }}>Ã—</button>
                  </div>
                ))}
                <button onClick={addEmployee} style={{ background: "none", border: `1px dashed ${C.border}`, borderRadius: 10, cursor: "pointer", color: C.textMuted, fontSize: 13, padding: "10px 0", marginTop: 4 }}>
                  + Add another employee
                </button>
              </div>
            </div>
            {error && <div style={{ fontSize: 13, color: C.red, padding: "10px 14px", background: "#1a0808", borderRadius: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
              <button style={btn("ghost")} onClick={() => setStep(1)}>Back</button>
              <button style={{ ...btn(), flex: 1, opacity: creating ? 0.7 : 1 }} onClick={createTenant} disabled={creating}>
                {creating ? "Creating your account..." : "Create account & continue â†’"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 â€” YOUR KEYS */}
        {step === 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 8 }}>Your account is ready ðŸŽ‰</div>
                <div style={{ fontSize: 15, color: C.textMuted }}>Copy your master API key â€” shown once only.</div>
              </div>
              <div style={{ background: C.bgAccent, border: `1px solid ${C.green}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginBottom: 10, letterSpacing: "0.04em" }}>âœ“ MASTER API KEY â€” COPY NOW</div>
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
                  {masterKeyCopied ? "âœ“ Copied!" : "Copy Master Key"}
                </button>
              </div>
              <div style={{ background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Account Details</div>
                {[
                  { label: "Company", value: company },
                  { label: "Plan", value: "Starter â€” $199/mo" },
                  { label: "Employees added", value: `${employees.filter(e => e.name.trim()).length} keys created` },
                  { label: "Tenant ID", value: tenantId },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                    <span style={{ color: C.textDim }}>{r.label}</span>
                    <span style={{ color: C.text, fontFamily: i === 3 ? "monospace" : "inherit", fontSize: i === 3 ? 11 : 13 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <button style={{ ...btn(), width: "100%" }} onClick={() => setStep(4)}>Continue to integration â†’</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
              <div style={{ fontSize: 13, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>What was just created</div>
              {[
                { icon: "ðŸ”‘", title: "Master key", desc: "Full admin access â€” manage all employees and budgets" },
                { icon: "ðŸ‘¥", title: `${employees.filter(e => e.name.trim()).length} employee keys`, desc: "Individual keys with daily budget caps â€” ready to use" },
                { icon: "ðŸ›¡ï¸", title: "Budget enforcement", desc: "Active immediately â€” nobody can overspend" },
                { icon: "ðŸ“Š", title: "Dashboard access", desc: "See every call, every dollar, in real time" },
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

        {/* STEP 4 â€” GO LIVE */}
        {step === 4 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.text, marginBottom: 8 }}>One line change</div>
                <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.6 }}>That's all your developers need to do. Your existing OpenAI key stays the same. Everything else stays the same.</div>
              </div>
              <div style={{ background: "#0a0f1a", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>your_app.py</div>
                <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13, lineHeight: 2 }}>
                  <div style={{ color: "#6B7FA3" }}># BEFORE</div>
                  <div style={{ color: "#9CA3AF" }}>client = OpenAI(</div>
                  <div style={{ background: "#2d1010", color: "#F87171", padding: "2px 8px", borderRadius: 4 }}>
                    {'  '}api_key=<span style={{ color: "#86EFAC" }}>"sk-your-openai-key"</span>
                  </div>
                  <div style={{ color: "#9CA3AF" }}>)</div>
                  <div style={{ marginTop: 16, color: "#6B7FA3" }}># AFTER â€” two lines changed</div>
                  <div style={{ color: "#9CA3AF" }}>client = OpenAI(</div>
                  <div style={{ background: "#0d2d1a", color: "#86EFAC", padding: "2px 8px", borderRadius: 4 }}>
                    {'  '}api_key=<span style={{ color: "#86EFAC" }}>"{masterKey || "tg-your-key-here"}"</span>,
                  </div>
                  <div style={{ background: "#0d2d1a", color: "#86EFAC", padding: "2px 8px", borderRadius: 4 }}>
                    {'  '}base_url=<span style={{ color: "#86EFAC" }}>"https://cypress-production-1cc5.up.railway.app/v1"</span>
                  </div>
                  <div style={{ color: "#9CA3AF" }}>)</div>
                </div>
              </div>
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
                    <span style={{ fontSize: 22 }}>âœ…</span>
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
              <button onClick={() => window.location.href = "/"} style={{ ...btn(testStatus === "success" ? "green" : "primary"), width: "100%", fontSize: 16, padding: "15px 0" }}>
                {testStatus === "success" ? "Go to dashboard â†’" : "Skip to dashboard â†’"}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
              <div style={{ fontSize: 13, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>You're protected from day one</div>
              {[
                { icon: "âš¡", title: "Every call goes through TokenGuard", desc: "Routing, caching, and budget checks happen automatically" },
                { icon: "ðŸ›¡ï¸", title: "Budgets enforced immediately", desc: "Nobody on your team can spend over their limit" },
                { icon: "ðŸ’°", title: "Savings start now", desc: "Simple prompts are already being routed to cheaper models" },
                { icon: "ðŸ“Š", title: "Full visibility from call #1", desc: "Every employee, every model, every dollar tracked" },
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
      <div style={{ marginTop: 24, fontSize: 13, color: C.textDim, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
        <div>Questions? Email <span style={{ color: C.primary }}>support@tokenguard.io</span></div>
        <button onClick={() => { setStep(0); setCompany(""); setAdminName(""); setAdminEmail(""); setEmployees([{ name: "", role: "", budget: "50" }]); setMasterKey(""); setTenantId(""); setError(""); setTestStatus("idle"); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 12, textDecoration: "underline" }}>
          â†º Start over
        </button>
      </div>
    </div>
  );
}





export default function OnboardingPageWrapper() {
  return <Suspense fallback={null}><OnboardingPage /></Suspense>;
}



