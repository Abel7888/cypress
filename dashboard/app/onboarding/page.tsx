"use client";
import { useState, useEffect } from "react";

const API_BASE = "https://cypress-production-1cc5.up.railway.app";
const ADMIN_KEY = "lMNUO5f2xEAmxq8lXA9ODmCi-pxCr-9hL99fyw3VlWw";
const HEADERS = { Authorization: `Bearer ${ADMIN_KEY}`, "Content-Type": "application/json" };

const C = {
  bg: "#080C14",
  bgCard: "#0D1220",
  bgAccent: "#141B2D",
  border: "#1E2A42",
  borderLight: "#243249",
  primary: "#4F8EF7",
  primaryDim: "#1E3A6B",
  green: "#22C55E",
  greenDim: "#14532D",
  amber: "#F59E0B",
  text: "#F0F4FF",
  textMuted: "#6B7FA3",
  textDim: "#3D4F72",
  purple: "#8B5CF6",
};

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: 299,
    seats: 10,
    features: ["10 employee keys", "Budget enforcement", "Cache savings", "Dashboard access", "Email support"],
    color: C.primary,
  },
  {
    id: "growth",
    name: "Growth",
    price: 999,
    seats: 30,
    features: ["30 employee keys", "Everything in Starter", "Dedicated Redis", "Priority support", "Custom routing rules"],
    color: C.purple,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 2499,
    seats: 100,
    features: ["100 employee keys", "Everything in Growth", "AI agent monitoring", "SLA guarantee", "Dedicated success manager"],
    color: C.amber,
  },
];

const STEPS = ["Welcome", "Setup", "Plan", "Your Keys", "Go Live"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [seats, setSeats] = useState(10);
  const [tier, setTier] = useState("starter");
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

  const btn = (variant: "primary" | "ghost" = "primary", extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: variant === "primary" ? C.primary : "transparent",
    border: variant === "primary" ? "none" : `1px solid ${C.border}`,
    borderRadius: 10,
    color: variant === "primary" ? "#fff" : C.textMuted,
    fontSize: 15,
    fontWeight: 600,
    padding: "13px 28px",
    cursor: "pointer",
    transition: "opacity 0.15s",
    ...extra,
  });

  const createTenant = async () => {
    if (!company.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/tenants`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ name: company.trim(), plan: tier }),
      });
      const data = await res.json();
      if (data.tenant_id) {
        setTenantId(data.tenant_id);
        const keyRes = await fetch(`${API_BASE}/api/tenants/${data.tenant_id}/users`, {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({ name: adminName || "Admin", role: "Admin" }),
        });
        const keyData = await keyRes.json();
        setMasterKey(keyData.api_key || "");
        setStep(3);
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (e) {
      setError("Connection error — check proxy is running");
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

  const selectedTier = TIERS.find(t => t.id === tier) || TIERS[0];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          🛡️
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>TokenGuard</div>
          <div style={{ fontSize: 11, color: C.textDim, letterSpacing: "0.06em" }}>AI COST CONTROL</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 48, width: "100%", maxWidth: 560 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: i < step ? C.green : i === step ? C.primary : C.bgAccent,
                border: `2px solid ${i < step ? C.green : i === step ? C.primary : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
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
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: "40px 44px", width: "100%", maxWidth: 560, boxSizing: "border-box" }}>

        {/* ── STEP 0: WELCOME ── */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: 10 }}>
                Stop surprise AI bills.
              </div>
              <div style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6 }}>
                TokenGuard gives your team full AI access while you stay in control of every dollar spent. Setup takes 60 seconds — your developers change one line of code.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "⚡", text: "One line of code to integrate — no SDK, no rewriting prompts" },
                { icon: "🛡️", text: "Budget caps per employee — blocks before the bill arrives" },
                { icon: "💰", text: "Intelligent routing saves 30–70% on AI costs automatically" },
                { icon: "📊", text: "See exactly who spent what, down to the API call" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", background: C.bgAccent, borderRadius: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5 }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button style={btn()} onClick={() => setStep(1)}>Get started →</button>
          </div>
        )}

        {/* ── STEP 1: SETUP ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 6 }}>Set up your account</div>
              <div style={{ fontSize: 14, color: C.textMuted }}>Takes 30 seconds. No credit card yet.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>COMPANY NAME *</div>
                <input style={inp()} placeholder="Acme Corp" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>YOUR NAME</div>
                <input style={inp()} placeholder="Sarah Chen" value={adminName} onChange={e => setAdminName(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>WORK EMAIL</div>
                <input style={inp()} type="email" placeholder="sarah@acme.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>TEAM SIZE</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[10, 25, 50, 100].map(n => (
                    <button
                      key={n}
                      onClick={() => setSeats(n)}
                      style={{
                        flex: 1, padding: "10px 0",
                        background: seats === n ? C.primaryDim : C.bgAccent,
                        border: `1px solid ${seats === n ? C.primary : C.border}`,
                        borderRadius: 8, cursor: "pointer",
                        color: seats === n ? C.primary : C.textMuted,
                        fontSize: 14, fontWeight: seats === n ? 700 : 400,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div style={{ fontSize: 13, color: "#EF4444", padding: "10px 14px", background: "#1a0808", borderRadius: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btn("ghost")} onClick={() => setStep(0)}>Back</button>
              <button style={{ ...btn(), flex: 1, opacity: !company.trim() ? 0.5 : 1 }} onClick={() => company.trim() && setStep(2)}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PLAN ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 6 }}>Choose your plan</div>
              <div style={{ fontSize: 14, color: C.textMuted }}>Cancel anytime. No long-term contracts.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TIERS.map(t => (
                <div
                  key={t.id}
                  onClick={() => setTier(t.id)}
                  style={{
                    background: tier === t.id ? C.bgAccent : "transparent",
                    border: `2px solid ${tier === t.id ? t.color : C.border}`,
                    borderRadius: 12, padding: "16px 18px",
                    cursor: "pointer", position: "relative",
                    transition: "all 0.2s",
                  }}
                >
                  {t.popular && (
                    <div style={{
                      position: "absolute", top: -10, right: 14,
                      background: C.purple, color: "#fff",
                      fontSize: 11, fontWeight: 700, padding: "2px 10px",
                      borderRadius: 20, letterSpacing: "0.04em",
                    }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: tier === t.id ? t.color : C.border, border: `2px solid ${tier === t.id ? t.color : C.border}` }} />
                      <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{t.name}</span>
                      <span style={{ fontSize: 13, color: C.textMuted }}>{t.seats} seats</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: tier === t.id ? t.color : C.text }}>${t.price}</span>
                      <span style={{ fontSize: 13, color: C.textMuted }}>/mo</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {t.features.map((f, i) => (
                      <span key={i} style={{ fontSize: 12, color: C.textMuted, background: C.bgAccent, borderRadius: 6, padding: "3px 8px" }}>
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {error && <div style={{ fontSize: 13, color: "#EF4444", padding: "10px 14px", background: "#1a0808", borderRadius: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btn("ghost")} onClick={() => setStep(1)}>Back</button>
              <button
                style={{ ...btn(), flex: 1, opacity: creating ? 0.7 : 1 }}
                onClick={createTenant}
                disabled={creating}
              >
                {creating ? "Creating account..." : `Start with ${selectedTier.name} — $${selectedTier.price}/mo →`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: YOUR KEYS ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 6 }}>Your account is ready 🎉</div>
              <div style={{ fontSize: 14, color: C.textMuted }}>Copy your master API key — you'll need it to connect. It's only shown once.</div>
            </div>
            <div style={{ background: C.bgAccent, border: `1px solid ${C.green}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 10, letterSpacing: "0.04em" }}>
                ✓ MASTER API KEY — COPY NOW
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <code style={{ flex: 1, fontFamily: "monospace", fontSize: 13, color: C.text, wordBreak: "break-all", lineHeight: 1.5 }}>
                  {masterKey}
                </code>
                <button
                  onClick={copyKey}
                  style={{
                    background: masterKeyCopied ? C.greenDim : C.primaryDim,
                    border: `1px solid ${masterKeyCopied ? C.green : C.primary}`,
                    borderRadius: 8, cursor: "pointer",
                    color: masterKeyCopied ? C.green : C.primary,
                    fontSize: 13, padding: "8px 16px",
                    fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
                  }}
                >
                  {masterKeyCopied ? "Copied!" : "Copy Key"}
                </button>
              </div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                Store this in your password manager. Your team's keys are created separately in the dashboard.
              </div>
            </div>
            <div style={{ background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>ACCOUNT DETAILS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Company", value: company },
                  { label: "Plan", value: `${selectedTier.name} — $${selectedTier.price}/mo` },
                  { label: "Seats", value: `${selectedTier.seats} employees` },
                  { label: "Tenant ID", value: tenantId },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: C.textDim }}>{r.label}</span>
                    <span style={{ color: C.text, fontFamily: i === 3 ? "monospace" : "inherit", fontSize: i === 3 ? 11 : 13 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <button style={{ ...btn(), width: "100%" }} onClick={() => setStep(4)}>
              Continue to integration →
            </button>
          </div>
        )}

        {/* ── STEP 4: GO LIVE ── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 6 }}>One line change</div>
              <div style={{ fontSize: 14, color: C.textMuted }}>That's all your developers need to do. Everything else stays the same.</div>
            </div>
            {/* Code diff */}
            <div style={{ background: "#0a0f1a", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>
                your_app.py
              </div>
              <div style={{ padding: 16, fontFamily: "monospace", fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ color: "#6B7FA3" }}># BEFORE — your existing code</div>
                <div style={{ color: "#9CA3AF" }}>from openai import OpenAI</div>
                <div style={{ color: "#9CA3AF" }}>client = OpenAI(</div>
                <div style={{ background: "#2d1010", color: "#F87171", padding: "2px 0" }}>
                  {'    '}api_key=<span style={{ color: "#86EFAC" }}>"sk-your-openai-key"</span>
                </div>
                <div style={{ color: "#9CA3AF" }}>)</div>
                <div style={{ marginTop: 12, color: "#6B7FA3" }}># AFTER — change these two lines</div>
                <div style={{ color: "#9CA3AF" }}>from openai import OpenAI</div>
                <div style={{ color: "#9CA3AF" }}>client = OpenAI(</div>
                <div style={{ background: "#0d2d1a", color: "#86EFAC", padding: "2px 0" }}>
                  {'    '}api_key=<span style={{ color: "#86EFAC" }}>"{masterKey || "tg-your-key-here"}"</span>,
                </div>
                <div style={{ background: "#0d2d1a", color: "#86EFAC", padding: "2px 0" }}>
                  {'    '}base_url=<span style={{ color: "#86EFAC" }}>"https://cypress-production-1cc5.up.railway.app/v1"</span>
                </div>
                <div style={{ color: "#9CA3AF" }}>)</div>
              </div>
            </div>

            {/* Test connection */}
            <div style={{ background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>
                Verify your integration is working before going to the dashboard.
              </div>
              {testStatus === "idle" && (
                <button
                  onClick={testConnection}
                  style={{ ...btn(), width: "100%", background: C.bgCard, border: `1px solid ${C.primary}`, color: C.primary }}
                >
                  Test connection
                </button>
              )}
              {testStatus === "testing" && (
                <div style={{ textAlign: "center", padding: "12px 0", color: C.textMuted, fontSize: 14 }}>
                  Testing connection...
                </div>
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
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#EF4444" }}>Connection failed</div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Check that your key was copied correctly and try again.</div>
                  <button onClick={() => setTestStatus("idle")} style={{ ...btn("ghost"), marginTop: 10, fontSize: 13, padding: "8px 16px" }}>Try again</button>
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.href = "/"}
              style={{ ...btn(), width: "100%", background: testStatus === "success" ? C.green : C.primary }}
            >
              {testStatus === "success" ? "Go to dashboard →" : "Skip to dashboard →"}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, fontSize: 13, color: C.textDim, textAlign: "center" }}>
        Questions? Email <span style={{ color: C.primary }}>support@tokenguard.io</span>
      </div>
    </div>
  );
}
