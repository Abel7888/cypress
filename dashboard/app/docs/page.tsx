"use client";
import Link from "next/link";
import { useState } from "react";

const C = {
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderSoft: "#F1F5F9",
  text: "#0F172A",
  textMuted: "#64748B",
  textDim: "#94A3B8",
  blue: "#3B82F6",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",
  blueText: "#1D4ED8",
  green: "#10B981",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  greenText: "#065F46",
  amber: "#F59E0B",
  amberBg: "#FFFBEB",
  amberBorder: "#FDE68A",
  amberText: "#92400E",
  red: "#EF4444",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  redText: "#991B1B",
};

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"business" | "technical">("business");

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "quick-start", label: "Quick Start" },
    { id: "routing", label: "How Routing Works" },
    { id: "budgets", label: "Spend Guards & Budgets" },
    { id: "assets", label: "Asset Tracking" },
    { id: "ask-ai", label: "Ask AI (Spend Copilot)" },
    { id: "infrastructure", label: "Infrastructure & Security" },
    { id: "compliance", label: "Compliance & Audit Logs" },
    { id: "pricing", label: "Pricing & Plans" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Top Nav */}
      <nav style={{
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        padding: "16px 32px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Cypress Vision Docs</div>
          <Link href="/dashboard" style={{
            color: C.blue,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}>
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto" }}>
        {/* Left Sidebar */}
        <aside style={{
          width: 240,
          position: "sticky",
          top: 73,
          height: "calc(100vh - 73px)",
          overflowY: "auto",
          padding: "32px 24px",
          borderRight: `1px solid ${C.border}`,
          background: C.card,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16 }}>
            Navigation
          </div>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                fontSize: 14,
                color: C.text,
                background: "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                marginBottom: 4,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.borderSoft)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {section.label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: "48px 64px", maxWidth: 900 }}>
          {/* SECTION 1 — OVERVIEW */}
          <section id="overview" style={{ marginBottom: 80 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12 }}>What is Cypress Vision?</h1>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              Choose your view:
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <button
                onClick={() => setActiveTab("business")}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${activeTab === "business" ? C.blue : C.border}`,
                  background: activeTab === "business" ? C.blueBg : C.card,
                  color: activeTab === "business" ? C.blueText : C.text,
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                For Business Leaders
              </button>
              <button
                onClick={() => setActiveTab("technical")}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${activeTab === "technical" ? C.blue : C.border}`,
                  background: activeTab === "technical" ? C.blueBg : C.card,
                  color: activeTab === "technical" ? C.blueText : C.text,
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                For Technical Teams
              </button>
            </div>

            <div style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 32,
            }}>
              {activeTab === "business" ? (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>For Business Leaders</h3>
                  <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, margin: 0 }}>
                    Cypress Vision is AI spend management software. It sits between your product and your AI providers (OpenAI, Anthropic, Google) and automatically routes every AI call to the right model — saving 50–70% on API costs with no quality loss. You get real-time dashboards showing exactly what every agent, bot, workflow, or team member is spending, with hard budget caps that block overspend before it happens. Every prompt is logged with a full audit trail for compliance. One integration, 30 seconds to set up.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>For Technical Teams</h3>
                  <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, margin: 0 }}>
                    Cypress Vision is a drop-in API proxy. Change one <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 13 }}>base_url</code> in your config — from <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 13 }}>api.openai.com</code> to your Cypress Vision proxy URL — and every API call is automatically scored across 10 signals, routed to the optimal model, cached where possible, and logged to ClickHouse for real-time analytics. Budget enforcement runs in Redis with sub-millisecond latency. Full OpenAI and Anthropic API compatibility — same request/response format, no SDK changes required.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2 — QUICK START */}
          <section id="quick-start" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 12 }}>Quick Start</h2>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              Up and running in 30 seconds
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Step 1 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8 }}>STEP 1</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Sign up and get your proxy URL</h3>
                <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 12, lineHeight: 1.7 }}>
                  Go to <Link href="https://cypress-production-36c0.up.railway.app/signup" style={{ color: C.blue, textDecoration: "none" }}>cypress-production-36c0.up.railway.app/signup</Link>
                </p>
                <p style={{ fontSize: 14, color: C.textMuted, margin: 0, lineHeight: 1.7 }}>
                  Your proxy URL is shown immediately after signup.
                </p>
              </div>

              {/* Step 2 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8 }}>STEP 2</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>Add your provider key in Settings</h3>
                <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 8, lineHeight: 1.7 }}>
                  Navigate to Settings → Provider Keys
                </p>
                <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 8, lineHeight: 1.7 }}>
                  Add your OpenAI, Anthropic, or Google API key
                </p>
                <p style={{ fontSize: 14, color: C.textMuted, margin: 0, lineHeight: 1.7 }}>
                  Cypress Vision stores it encrypted. You never change your key again.
                </p>
              </div>

              {/* Step 3 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8 }}>STEP 3</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>Change one line in your code</h3>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Python</div>
                  <pre style={{
                    background: C.borderSoft,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: C.text,
                    overflowX: "auto",
                    margin: 0,
                    lineHeight: 1.6,
                  }}>
{`from openai import OpenAI
client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url="https://YOUR-PROXY.cypressvision.app/v1"  # ← only change
)`}
                  </pre>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Node.js</div>
                  <pre style={{
                    background: C.borderSoft,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: C.text,
                    overflowX: "auto",
                    margin: 0,
                    lineHeight: 1.6,
                  }}>
{`import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://YOUR-PROXY.cypressvision.app/v1", // ← only change
});`}
                  </pre>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>curl</div>
                  <pre style={{
                    background: C.borderSoft,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: C.text,
                    overflowX: "auto",
                    margin: 0,
                    lineHeight: 1.6,
                  }}>
{`curl https://YOUR-PROXY.cypressvision.app/v1/chat/completions \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello"}]}'`}
                  </pre>
                </div>

                <div style={{
                  background: C.blueBg,
                  border: `1px solid ${C.blueBorder}`,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 13,
                  color: C.blueText,
                  lineHeight: 1.6,
                }}>
                  <strong>Note:</strong> Works with Anthropic and Google too — same pattern, just use your Anthropic or Google key. Cypress Vision detects the provider from the model name automatically.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3 — HOW ROUTING WORKS */}
          <section id="routing" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 12 }}>How Routing Works</h2>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              Smart routing — how it works
            </p>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>What it does</h3>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, margin: 0 }}>
                Every AI call is automatically analyzed and sent to the most cost-effective model that can handle it. Simple tasks (short questions, lookups, summaries) go to efficient models. Complex tasks (code generation, legal analysis, multi-step reasoning) stay on premium models. No code changes. No quality tradeoff. Happens in under 1ms.
              </p>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>The scoring engine</h3>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 24 }}>
                Every prompt is scored across 10 signals before being forwarded:
              </p>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: C.borderSoft }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Signal</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>What it detects</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Prompt length", "Token count of the message", ">500 tokens = complexity +2"],
                      ["Tool/function calls", "Whether tools are attached", "Tools present = complexity +2"],
                      ["Code markers", "Presence of code blocks or syntax", "```python = complexity +1"],
                      ["Conversation depth", "Number of turns in history", ">5 turns = complexity +1"],
                      ["Structured output", "JSON mode or schema requested", "JSON mode = complexity +1"],
                      ["System prompt length", "Size of system instructions", ">200 tokens = complexity +1"],
                      ["Reasoning keywords", "Words like \"analyze\", \"architect\", \"compare\"", "Match = complexity +1"],
                      ["Math/logic markers", "Equations or logical operators", "Match = complexity +1"],
                      ["Multi-language", "Non-English content detected", "Match = complexity +1"],
                      ["Temperature", "High temp = creative = complex", "temp>0.8 = complexity +1"],
                    ].map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, color: C.text }}>{row[0]}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, color: C.textMuted }}>{row[1]}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, color: C.textDim, fontFamily: "monospace", fontSize: 12 }}>{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 24, padding: 16, background: C.borderSoft, borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Score thresholds:</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.text, lineHeight: 1.8 }}>
                  <li>Score 0–2 → Simple → routes to cheaper model (saves 60–94%)</li>
                  <li>Score 3–5 → Moderate → passes through to requested model</li>
                  <li>Score 6+ → Complex → keeps premium model, no downgrade</li>
                </ul>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>Downgrade map</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: C.borderSoft }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Requested Model</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Downgrade Target</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Cost Saving</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["gpt-4o", "gpt-4o-mini", "~94%"],
                      ["gpt-4.1", "gpt-4.1-mini or nano", "~85–97%"],
                      ["claude-opus", "claude-haiku", "~80%"],
                      ["claude-sonnet", "claude-haiku", "~70%"],
                      ["gemini-pro", "gemini-flash", "~75%"],
                    ].map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, color: C.text, fontFamily: "monospace", fontSize: 13 }}>{row[0]}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, color: C.text, fontFamily: "monospace", fontSize: 13 }}>{row[1]}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, color: C.green, fontWeight: 600 }}>{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{
              background: C.blueBg,
              border: `1px solid ${C.blueBorder}`,
              borderRadius: 8,
              padding: 16,
              fontSize: 14,
              color: C.blueText,
              lineHeight: 1.6,
            }}>
              <strong>Routing Playground:</strong> Use the Routing Playground in your dashboard to test exactly how any prompt would be scored and routed before it goes live. See the score breakdown, the target model, and the estimated cost.
            </div>
          </section>

          {/* SECTION 4 — SPEND GUARDS & BUDGETS */}
          <section id="budgets" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 12 }}>Spend Guards & Budgets</h2>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              Hard limits that actually work
            </p>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>For business</h3>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, margin: 0 }}>
                Set a daily and monthly cap for your whole account, or per individual asset (agent, bot, workflow, team member). When an asset hits 70% of its budget, you get an email and Slack alert. At 90%, another alert. At 100%, the asset is hard-blocked — it returns a 429 error instead of making the API call. Your bill cannot exceed what you set. Period.
              </p>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>For technical</h3>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 16 }}>
                Budget state lives in Redis for sub-millisecond enforcement on every request. The flow is:
              </p>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.text, lineHeight: 1.8 }}>
                <li>Request arrives at proxy</li>
                <li><code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>check_budget()</code> reads current spend from Redis for that tenant + asset</li>
                <li>If spend &gt;= limit: return HTTP 429 immediately, no upstream call made</li>
                <li>If spend &lt; limit: forward to AI provider</li>
                <li>On response: <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>record_spend()</code> increments Redis counter by actual token cost</li>
                <li>At 70%, 90%, 100% thresholds: fire alert via Resend (email) + Slack webhook</li>
              </ol>
              <p style={{ fontSize: 14, color: C.textMuted, marginTop: 16, lineHeight: 1.7 }}>
                Daily caps reset at 00:00 UTC. Monthly caps reset on the 1st of each month. Management API endpoints (dashboard, settings, analytics) are never blocked — only AI proxy calls are subject to budget enforcement.
              </p>
            </div>

            <div style={{ background: C.borderSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Budget enforcement flow</h4>
              <pre style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 16,
                fontSize: 12,
                fontFamily: "monospace",
                color: C.text,
                overflowX: "auto",
                margin: 0,
                lineHeight: 1.8,
              }}>
{`Incoming request
  → check_budget() [Redis, <1ms]
    → BLOCKED? → return 429 {"error": "budget_exceeded"}
    → OK? → forward to OpenAI/Anthropic/Google
      → response received
      → record_spend() [Redis increment]
      → check thresholds → fire alerts if needed
      → return response to caller`}
              </pre>
            </div>
          </section>

          {/* SECTION 5 — ASSET TRACKING */}
          <section id="assets" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 12 }}>Asset Tracking</h2>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              Know what everything costs
            </p>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32 }}>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 16 }}>
                "Assets" are what Cypress Vision calls agents, bots, workflows, employees, or clients — any named entity making AI calls through the proxy. Each asset gets:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, color: C.text, lineHeight: 1.8 }}>
                <li>Its own API key (used as the Authorization header)</li>
                <li>Its own daily and monthly budget cap</li>
                <li>Its own spend dashboard with cost-by-day, calls-by-model, routing efficiency</li>
                <li>Status badge: Healthy / Warning / Blocked</li>
                <li>CSV export of all usage</li>
              </ul>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, marginTop: 16, margin: 0 }}>
                Assets scale without limit — you can have 1 or 1,000. Consultants and agencies use assets to track per-client spend. Startups use assets to track per-feature or per-agent spend. Internal tool teams use assets to track per-department or per-workflow spend.
              </p>
            </div>
          </section>

          {/* SECTION 6 — ASK AI */}
          <section id="ask-ai" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 12 }}>Ask AI (Spend Copilot)</h2>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              Your Spend Copilot
            </p>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 24 }}>
                This is a conversational AI assistant built into your dashboard, trained on your live usage data. Ask it anything about your AI spend:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "What would switching my recommendation agent to Haiku save me this month?",
                  "Which agent is driving the most cost this week?",
                  "Show me my 7-day spend trend",
                  "How much did I save through routing last month?",
                  "Which calls are hitting my budget cap most often?",
                ].map((q, i) => (
                  <div key={i} style={{
                    background: C.blueBg,
                    border: `1px solid ${C.blueBorder}`,
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    color: C.blueText,
                    fontStyle: "italic",
                  }}>
                    "{q}"
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 14, color: C.textMuted, marginTop: 24, margin: 0, lineHeight: 1.7 }}>
                The Spend Copilot has full context of your tenant data — your models, your assets, your spend history, your routing decisions. It is available on the Growth plan and above. During soft launch, it is available to all premium users.
              </p>
            </div>
          </section>

          {/* SECTION 7 — INFRASTRUCTURE & SECURITY */}
          <section id="infrastructure" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 12 }}>Infrastructure & Security</h2>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              How it's built and secured
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              <div style={{
                background: C.blueBg,
                border: `1px solid ${C.blueBorder}`,
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.blueText, marginBottom: 8 }}>Option A</div>
                <div style={{ fontSize: 14, color: C.blueText }}>Cypress Vision Cloud (default)</div>
              </div>
              <div style={{
                background: C.greenBg,
                border: `1px solid ${C.greenBorder}`,
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.greenText, marginBottom: 8 }}>Option B</div>
                <div style={{ fontSize: 14, color: C.greenText }}>Self-hosted / on-premise</div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>Infrastructure overview</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: C.borderSoft }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Component</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Technology</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Proxy / API gateway", "FastAPI (Python) on Railway", "Receives all AI calls, runs routing, enforces budgets"],
                      ["Event store", "ClickHouse", "Immutable log of every API call — model, tokens, cost, latency, asset, timestamp. Powers all real-time analytics."],
                      ["Budget enforcement", "Redis", "Sub-millisecond spend tracking and hard-block enforcement. Resets on schedule."],
                      ["Auth & tenant data", "Supabase (Postgres)", "User accounts, tenant configuration, API keys, routing rules"],
                      ["Dashboard", "Next.js on Railway", "Real-time spend dashboard, routing analytics, budget management"],
                      ["Alerts", "Resend (email) + Slack webhook", "Threshold alerts at 70%, 90%, 100% of budget"],
                    ].map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, color: C.text, fontWeight: 600 }}>{row[0]}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, color: C.textMuted, fontFamily: "monospace", fontSize: 12 }}>{row[1]}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderSoft}`, color: C.textMuted, fontSize: 13 }}>{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>Security</h3>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.text, lineHeight: 1.8 }}>
                <li>All API keys stored encrypted at rest in Supabase (Postgres). Never logged. Never exposed in responses.</li>
                <li>ClickHouse event logs contain model name, token counts, cost, latency, asset ID, and timestamp. Prompt content is logged only when audit mode is enabled — off by default.</li>
                <li>All traffic between your application and the proxy is HTTPS/TLS. All traffic between the proxy and AI providers is HTTPS/TLS.</li>
                <li>Tenant isolation: every request is scoped to a tenant ID. One tenant cannot access another tenant's data, keys, or logs at any level of the stack.</li>
                <li>CORS is locked to your dashboard domain only.</li>
                <li>Budget enforcement cannot be bypassed — it runs at the proxy layer before any upstream call is made.</li>
                <li>No prompt data is used for training or shared with any third party.</li>
              </ul>
            </div>

            <div style={{
              background: C.greenBg,
              border: `1px solid ${C.greenBorder}`,
              borderRadius: 12,
              padding: 24,
            }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: C.greenText, marginBottom: 12 }}>Self-hosted option (Scale / Enterprise)</h4>
              <p style={{ fontSize: 14, color: C.greenText, lineHeight: 1.7, marginBottom: 12 }}>
                For teams with strict data residency requirements — LegalTech, HealthTech, financial services — Cypress Vision can be deployed entirely within your own infrastructure:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.greenText, lineHeight: 1.7 }}>
                <li>Deploy the FastAPI proxy to your own Railway, AWS, GCP, or Azure environment</li>
                <li>Connect your own ClickHouse instance (cloud or self-managed)</li>
                <li>Connect your own Redis instance</li>
                <li>Connect your own Supabase or Postgres database</li>
                <li>Your AI call data never leaves your network</li>
              </ul>
              <p style={{ fontSize: 14, color: C.greenText, lineHeight: 1.7, marginTop: 12, margin: 0 }}>
                Available on Scale plan ($399/month) and Enterprise (custom). Contact <a href="mailto:info@cypressvision.xyz" style={{ color: C.greenText, fontWeight: 600 }}>info@cypressvision.xyz</a> to get started.
              </p>
            </div>
          </section>

          {/* SECTION 8 — COMPLIANCE & AUDIT LOGS */}
          <section id="compliance" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 12 }}>Compliance & Audit Logs</h2>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              Full audit trail for every AI call
            </p>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, marginBottom: 16 }}>
                Every API call through Cypress Vision is logged to ClickHouse with:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.text, lineHeight: 1.8 }}>
                <li>Timestamp (UTC)</li>
                <li>Tenant ID and asset ID</li>
                <li>Original requested model</li>
                <li>Actual model used (after routing)</li>
                <li>Input token count</li>
                <li>Output token count</li>
                <li>Cost in USD</li>
                <li>Latency in milliseconds</li>
                <li>Routing decision (simple / moderate / complex) and score</li>
                <li>Cache hit status</li>
              </ul>
            </div>

            <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: C.amberText, marginBottom: 12 }}>When audit mode is enabled (Scale / Enterprise)</h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.amberText, lineHeight: 1.7 }}>
                <li>Full prompt content logged</li>
                <li>User identifier logged</li>
                <li>Exportable as CSV for legal discovery</li>
                <li>Retention configurable (30 days to indefinite)</li>
              </ul>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>This makes Cypress Vision suitable for:</h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.text, lineHeight: 1.8 }}>
                <li>LegalTech teams needing AI usage audit trails</li>
                <li>HealthTech teams needing to document AI-assisted decisions</li>
                <li>FinTech teams subject to model risk management requirements</li>
                <li>Any team needing to demonstrate responsible AI usage to regulators or clients</li>
              </ul>
            </div>
          </section>

          {/* SECTION 9 — PRICING & PLANS */}
          <section id="pricing" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 12 }}>Pricing & Plans</h2>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              Simple, transparent pricing
            </p>

            <div style={{ overflowX: "auto", marginBottom: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: C.borderSoft }}>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Plan</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Price</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Calls/month</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Assets</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}` }}>Features</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Free", "$0", "10,000", "1", "Auto-Router, basic analytics, 7-day trial"],
                    ["Starter", "$49/mo", "100,000", "10", "Full routing, caching, audit logs, all providers"],
                    ["Growth", "$149/mo", "1,000,000", "Unlimited", "+ Spend Copilot, CSV export, custom rules, priority support"],
                    ["Scale", "$399/mo", "Unlimited", "Unlimited", "+ SLA, compliance exports, white-label, self-hosted option"],
                    ["Enterprise", "Custom", "Unlimited", "Unlimited", "+ On-premise, SSO, dedicated support, custom contracts"],
                  ].map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: "16px", borderBottom: i < 4 ? `1px solid ${C.borderSoft}` : "none", color: C.text, fontWeight: 600 }}>{row[0]}</td>
                      <td style={{ padding: "16px", borderBottom: i < 4 ? `1px solid ${C.borderSoft}` : "none", color: C.text }}>{row[1]}</td>
                      <td style={{ padding: "16px", borderBottom: i < 4 ? `1px solid ${C.borderSoft}` : "none", color: C.textMuted }}>{row[2]}</td>
                      <td style={{ padding: "16px", borderBottom: i < 4 ? `1px solid ${C.borderSoft}` : "none", color: C.textMuted }}>{row[3]}</td>
                      <td style={{ padding: "16px", borderBottom: i < 4 ? `1px solid ${C.borderSoft}` : "none", color: C.textMuted, fontSize: 13 }}>{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="https://cypress-production-36c0.up.railway.app/signup" style={{
                background: C.blue,
                color: "#fff",
                padding: "12px 24px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}>
                Sign up →
              </Link>
              <a href="https://calendly.com/abelassefa19/cypress-tokenguard-premium" target="_blank" rel="noreferrer" style={{
                background: C.card,
                color: C.blue,
                border: `1px solid ${C.border}`,
                padding: "12px 24px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}>
                Book a demo
              </a>
            </div>
          </section>

          {/* SECTION 10 — FAQ */}
          <section id="faq" style={{ marginBottom: 80 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 12 }}>FAQ</h2>
            <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.7 }}>
              Frequently asked questions
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                {
                  q: "Does Cypress Vision work with my existing OpenAI SDK?",
                  a: "Yes. Change one line — the base_url — and your existing SDK, API key, and model names all stay the same. No other code changes required.",
                },
                {
                  q: "Does Cypress Vision see my prompt content?",
                  a: "By default, only metadata is logged (model, tokens, cost, latency). Full prompt logging is opt-in and available on Scale/Enterprise plans for compliance purposes.",
                },
                {
                  q: "What happens if Cypress Vision goes down?",
                  a: "You can point your base_url back to api.openai.com in under 30 seconds. We recommend keeping your original provider URL in an environment variable for exactly this reason. Our uptime SLA on Scale plan is 99.9%.",
                },
                {
                  q: "Can I use multiple AI providers at the same time?",
                  a: "Yes. Cypress Vision supports OpenAI, Anthropic, and Google out of the box. Add all three provider keys in Settings. Routing works across all three automatically.",
                },
                {
                  q: "How does Cypress Vision handle my API keys?",
                  a: "Your provider API keys are stored encrypted in Supabase (Postgres). They are used only to forward requests to your provider. They are never logged, never returned in API responses, and never shared.",
                },
                {
                  q: "Can I white-label Cypress Vision for my clients?",
                  a: "Yes, on the Scale plan. You can use your own domain, your own branding, and bill clients directly. Contact info@cypressvision.xyz.",
                },
                {
                  q: "How many assets can I track?",
                  a: "Unlimited on Growth and above. Assets can be agents, bots, workflows, employees, clients — anything making AI calls through the proxy.",
                },
                {
                  q: "Is there a free trial?",
                  a: "Yes — the Free plan includes 10,000 API calls and 7 days of full access with no credit card required.",
                },
              ].map((faq, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>{faq.q}</h4>
                  <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FOOTER */}
          <footer style={{
            background: C.blueBg,
            border: `1px solid ${C.blueBorder}`,
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
          }}>
            <p style={{ fontSize: 15, color: C.blueText, lineHeight: 1.7, margin: 0 }}>
              Questions not answered here? Email us at{" "}
              <a href="mailto:info@cypressvision.xyz" style={{ color: C.blue, fontWeight: 600, textDecoration: "none" }}>
                info@cypressvision.xyz
              </a>
              {" "}or book a call at{" "}
              <a href="https://calendly.com/abelassefa19/cypress-tokenguard-premium" target="_blank" rel="noreferrer" style={{ color: C.blue, fontWeight: 600, textDecoration: "none" }}>
                calendly.com/abelassefa19/cypress-tokenguard-premium
              </a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
