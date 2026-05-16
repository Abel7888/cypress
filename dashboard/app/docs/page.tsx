"use client";
import Link from "next/link";

const C = {
  card: "#FFFFFF", border: "#E2E8F0", borderSoft: "#F1F5F9", rowAlt: "#F8FAFC",
  text: "#0F172A", textMuted: "#64748B", textDim: "#94A3B8",
  blue: "#3B82F6", blueBg: "#EFF6FF", blueBorder: "#BFDBFE", blueText: "#1D4ED8",
  green: "#10B981", greenBg: "#F0FDF4", greenBorder: "#BBF7D0", greenText: "#065F46",
  amber: "#F59E0B", amberBg: "#FFFBEB", amberBorder: "#FDE68A", amberText: "#92400E",
  red: "#EF4444", redBg: "#FEF2F2", redBorder: "#FECACA", redText: "#991B1B",
  navy: "#0A1628",
};

export default function DocsPage() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  
  const sections = [
    { id: "what-is", label: "What is Cypress Vision" },
    { id: "quick-start", label: "Quick Start" },
    { id: "router", label: "How the Router Works" },
    { id: "budgets", label: "Spend Guards & Budgets" },
    { id: "assets", label: "Asset Tracking" },
    { id: "cache", label: "Response Cache" },
    { id: "ask-ai", label: "Ask AI — Spend Copilot" },
    { id: "infrastructure", label: "Infrastructure" },
    { id: "security", label: "Security" },
    { id: "compliance", label: "Compliance & Audit Logs" },
    { id: "scaling", label: "Scaling" },
    { id: "pricing", label: "Pricing" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#FAFBFC", minHeight: "100vh" }}>
      {/* Sticky top nav */}
      <nav style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "18px 32px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: C.text }}>Cypress Vision Docs</div>
          <Link href="/dashboard" style={{ color: C.blue, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Back to Dashboard</Link>
        </div>
      </nav>

      {/* Two-column layout */}
      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto" }}>
        {/* Left sidebar - 260px sticky */}
        <aside style={{ width: 260, position: "sticky", top: 73, height: "calc(100vh - 73px)", overflowY: "auto", padding: "40px 24px", borderRight: `1px solid ${C.border}`, background: C.card }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>Contents</div>
          {sections.map((s) => (
            <button 
              key={s.id} 
              onClick={() => scrollTo(s.id)} 
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", fontSize: 14, color: C.text, background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", marginBottom: 4, fontWeight: 500 }} 
              onMouseEnter={(e) => (e.currentTarget.style.background = C.borderSoft)} 
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {s.label}
            </button>
          ))}
        </aside>

        {/* Main content area - max-width 860px */}
        <main style={{ flex: 1, padding: "56px 72px 120px", maxWidth: 860 }}>
          
          {/* SECTION 1 — What is Cypress Vision */}
          <section id="what-is" style={{ marginBottom: 96 }}>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: C.text, marginBottom: 16, lineHeight: 1.2 }}>What is Cypress Vision?</h1>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 32 }}>
              {/* Left card - blue border */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.blue}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blueText, marginBottom: 16 }}>For Business Leaders</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Cypress Vision is AI spend management. It sits between your product and your AI providers — OpenAI, Anthropic, and Google — and automatically routes every AI call to the most cost-effective model that can handle it. Simple tasks go to efficient models. Complex tasks stay on premium. Result: 50–70% lower AI API bills with no change in output quality. Every agent, bot, workflow, or team member gets its own budget with real-time spend tracking, email and Slack alerts, and hard caps that block overspend before it happens. Every call is logged with a full audit trail. One URL change. 30 seconds to integrate.
                </p>
              </div>

              {/* Right card - green border */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.green}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.greenText, marginBottom: 16 }}>For Engineering Teams</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Cypress Vision is a drop-in OpenAI/Anthropic/Google-compatible proxy. Change <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>base_url</code> — nothing else. Every request is scored in under 1ms across complexity signals (token count, tool use, code markers, conversation depth, output length, JSON mode, keyword analysis), routed to the optimal model, checked against Redis budget state, served from cache if available, and logged asynchronously to ClickHouse. Full API compatibility — same request shape, same response shape, same streaming support. Works with every current model across all three providers.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2 — Quick Start */}
          <section id="quick-start" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Quick Start</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 12 }}>Up and running in 30 seconds</p>
            <p style={{ fontSize: 15, color: C.textDim, marginBottom: 40 }}>Three steps. No SDK changes. No infrastructure work.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* STEP 1 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 10, letterSpacing: "0.05em" }}>STEP 1</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 14 }}>Create your account</h3>
                <p style={{ fontSize: 15, color: C.text, marginBottom: 10 }}>
                  Sign up at <Link href="https://cypress-production-36c0.up.railway.app/signup" style={{ color: C.blue, textDecoration: "none", fontWeight: 600 }}>cypress-production-36c0.up.railway.app/signup</Link>. Your proxy URL appears immediately after signup.
                </p>
                <div style={{ background: C.borderSoft, padding: "12px 16px", borderRadius: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: C.text }}>
                  https://YOUR-TENANT.cypressvision.app/v1
                </div>
              </div>

              {/* STEP 2 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 10, letterSpacing: "0.05em" }}>STEP 2</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 14 }}>Add your provider key</h3>
                <p style={{ fontSize: 15, color: C.text, marginBottom: 8 }}>Settings → Provider Keys → paste your OpenAI, Anthropic, or Google key</p>
                <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>Stored encrypted. Never logged.</p>
              </div>

              {/* STEP 3 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 10, letterSpacing: "0.05em" }}>STEP 3</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20 }}>Change one line in your code</h3>

                {/* Python code block */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Python</div>
                  <pre style={{ background: "#0F172A", border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#E2E8F0", overflowX: "auto", margin: 0, lineHeight: 1.7 }}>
{`from openai import OpenAI
client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    `}<span style={{ color: "#10B981" }}>base_url="https://YOUR-TENANT.cypressvision.app/v1"</span>{`,  # ← this line only
)`}
                  </pre>
                </div>

                {/* Node.js code block */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Node.js</div>
                  <pre style={{ background: "#0F172A", border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#E2E8F0", overflowX: "auto", margin: 0, lineHeight: 1.7 }}>
{`import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  `}<span style={{ color: "#10B981" }}>baseURL: "https://YOUR-TENANT.cypressvision.app/v1"</span>{`, // ← this line only
});`}
                  </pre>
                </div>

                {/* curl code block */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>curl</div>
                  <pre style={{ background: "#0F172A", border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#E2E8F0", overflowX: "auto", margin: 0, lineHeight: 1.7 }}>
{`curl `}<span style={{ color: "#10B981" }}>https://YOUR-TENANT.cypressvision.app/v1/chat/completions</span>{` \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'`}
                  </pre>
                </div>

                {/* Blue info box */}
                <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 8, padding: 16, fontSize: 14, color: C.blueText, lineHeight: 1.7 }}>
                  <strong>Works identically with Anthropic and Google.</strong> Cypress Vision detects the provider from the model name automatically. claude-* → Anthropic. gemini-* → Google. gpt-* and o* → OpenAI.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3 — How the Router Works */}
          <section id="router" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>How the Router Works</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>Intelligent routing — decided in under 1ms</p>

            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, marginBottom: 40 }}>
              Every prompt arriving at Cypress Vision is scored by a multi-signal complexity classifier before it reaches any AI provider. The classifier runs in under 1ms and produces a score. Simple tasks route automatically to the most cost-effective model in the same provider family. Complex tasks stay on the premium model requested. Response quality does not change — only the cost of calls that do not need a premium model.
            </p>

            {/* Scoring engine */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>The scoring engine</h3>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.borderSoft }}>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Signal</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Weight</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Triggered by</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Tool / function calls</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+4</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Any tools array in the request</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Code markers</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+3</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Presence of ``` blocks, def, class, function, import, SELECT</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Very long context (3000+ tokens)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+3</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Estimated prompt token count</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Deep conversation (12+ turns)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+3</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Message count in the request</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Hard complexity keywords</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+4</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>"architect", "fault-tolerant", "distributed system", "microservice", "active-active"</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Long context 1500–3000 tokens</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+2</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Estimated prompt token count</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Multi-turn 6–12 messages</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+2</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Message count</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Moderate keywords</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+2 each, max +4</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>"implement", "refactor", "debug", "optimize", "analyze", "compare and contrast"</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>JSON / structured output</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+1</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>response_format: json_object</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Long output requested 1000+ tokens</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>+1</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>max_tokens in request</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Simple question indicators</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>−2 each</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>"what is", "define", "who is", "translate", "calculate", "yes or no"</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Very short prompt under 20 chars</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>−3</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>e.g. "4+4", "hello", "what time is it"</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Score result badges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 40 }}>
              <div style={{ background: C.greenBg, border: `2px solid ${C.greenBorder}`, borderRadius: 10, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.greenText, marginBottom: 8 }}>SIMPLE</div>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>Score 0–2</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>routes to efficient model</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.greenText }}>saves 70–97%</div>
              </div>
              <div style={{ background: C.amberBg, border: `2px solid ${C.amberBorder}`, borderRadius: 10, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.amberText, marginBottom: 8 }}>MODERATE</div>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>Score 3–5</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>passes through unchanged</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.amberText }}>no change</div>
              </div>
              <div style={{ background: C.blueBg, border: `2px solid ${C.blueBorder}`, borderRadius: 10, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.blueText, marginBottom: 8 }}>COMPLEX</div>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>Score 6+</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>keeps premium model</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.blueText }}>no downgrade</div>
              </div>
            </div>

            {/* Model routing table */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>Model routing table — May 2026</h3>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.borderSoft }}>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>You request</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Simple task routes to</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Cost saving per call</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: C.rowAlt }}>
                    <td colSpan={3} style={{ padding: "10px 20px", fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>OpenAI</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-5.5 ($8.00/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-4.1-mini ($0.40/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>95% cheaper</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-5 ($5.00/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-4.1-mini ($0.40/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>92% cheaper</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-4o ($2.50/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-4o-mini ($0.15/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>94% cheaper</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-4.1 ($2.00/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-4.1-mini ($0.40/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>80% cheaper</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-4.1-mini ($0.40/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gpt-4.1-nano ($0.10/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>75% cheaper</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>o3 ($10.00/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>o4-mini ($1.10/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>89% cheaper</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ padding: "10px 20px", fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", background: C.rowAlt }}>Anthropic</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>claude-opus-4-6 ($15.00/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>claude-haiku-4-5 ($0.80/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>95% cheaper</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>claude-sonnet-4-6 ($3.00/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>claude-haiku-4-5 ($0.80/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>73% cheaper</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td colSpan={3} style={{ padding: "10px 20px", fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Google</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gemini-2.5-pro ($3.50/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gemini-2.5-flash ($0.075/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>98% cheaper</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gemini-2.0-flash ($0.10/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>gemini-2.5-flash-lite ($0.02/M)</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.greenText, fontWeight: 700 }}>80% cheaper</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: 16, fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: 40 }}>
              <strong>Routing table updated continuously as providers release new models.</strong> All model names above are current production models as of May 2026.
            </div>

            {/* Routing Playground */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 16 }}>Routing Playground</h3>
            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
              The Routing Playground in your dashboard lets you test exactly how any prompt scores before it goes live. Enter any prompt, see the score breakdown, the target model, and the estimated cost saving. No live API call is made.
            </p>
          </section>
          
          {/* SECTION 4 — Spend Guards & Budgets */}
          <section id="budgets" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Spend Guards & Budgets</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>Hard limits enforced at the proxy layer</p>

            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, marginBottom: 40 }}>
              Set a daily cap, a monthly cap, or both — for your whole account or per individual asset. At 70% spend you get an email and Slack alert. At 90%, another alert. At 100% the asset is hard-blocked — the proxy returns HTTP 429 before any call reaches the AI provider. Your bill cannot exceed what you set. This is enforced at the network layer, not a soft warning.
            </p>

            {/* Technical flow diagram */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>Technical flow</h3>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32, marginBottom: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.blue, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>1</div>
                  <div style={{ fontSize: 15, color: C.text }}>Request arrives at Cypress Vision proxy</div>
                </div>
                <div style={{ width: 2, height: 20, background: C.border, marginLeft: 15 }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.blue, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>2</div>
                  <div style={{ fontSize: 15, color: C.text }}>
                    <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>check_budget()</code> reads Redis key → <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>tg:budget:{"{tenant_id}:{budget_id}:{YYYY-MM-DD}"}</code>
                  </div>
                </div>
                <div style={{ width: 2, height: 20, background: C.border, marginLeft: 15 }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.blue, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>3</div>
                  <div style={{ fontSize: 15, color: C.text }}>
                    <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>spent_usd &gt;= limit_usd</code>? → <strong style={{ color: C.red }}>YES</strong>: return HTTP 429 immediately, no upstream call made
                  </div>
                </div>
                <div style={{ width: 2, height: 20, background: C.border, marginLeft: 15 }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.blue, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>4</div>
                  <div style={{ fontSize: 15, color: C.text }}>
                    <strong style={{ color: C.green }}>NO</strong> → forward request to OpenAI / Anthropic / Google
                  </div>
                </div>
                <div style={{ width: 2, height: 20, background: C.border, marginLeft: 15 }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.blue, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>5</div>
                  <div style={{ fontSize: 15, color: C.text }}>Response received from provider</div>
                </div>
                <div style={{ width: 2, height: 20, background: C.border, marginLeft: 15 }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.blue, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>6</div>
                  <div style={{ fontSize: 15, color: C.text }}>
                    <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>record_spend()</code> increments Redis counter by <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>cost_usd × 1,000,000</code> (stored as integer microseconds — no float drift)
                  </div>
                </div>
                <div style={{ width: 2, height: 20, background: C.border, marginLeft: 15 }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.blue, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>7</div>
                  <div style={{ fontSize: 15, color: C.text }}>Check thresholds 70% / 90% / 100% → fire Resend email + Slack webhook in background thread if newly crossed</div>
                </div>
                <div style={{ width: 2, height: 20, background: C.border, marginLeft: 15 }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.blue, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>8</div>
                  <div style={{ fontSize: 15, color: C.text }}>Return response to your application</div>
                </div>
              </div>
            </div>

            {/* Info boxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
              <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 8, padding: 16, fontSize: 14, color: C.text, lineHeight: 1.7 }}>
                <strong>Daily caps reset at 00:00 UTC.</strong> Monthly caps reset on the 1st of each month. Redis TTL: daily = 87,600s, monthly = 31 days + 1hr buffer.
              </div>
              <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: 16, fontSize: 14, color: C.text, lineHeight: 1.7 }}>
                <strong>Management endpoints</strong> — dashboard, settings, analytics — are never blocked. Only AI proxy calls are subject to budget enforcement.
              </div>
              <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: 16, fontSize: 14, color: C.text, lineHeight: 1.7 }}>
                <strong>Budget state is stored in Redis as integer microseconds.</strong> $1.234567 is stored as 1,234,567. No floating-point precision loss.
              </div>
            </div>

            {/* Alert threshold table */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>Alert thresholds</h3>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "16px 20px", fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>70%</td>
                    <td style={{ padding: "16px 20px", fontSize: 15, color: C.text }}>Email + Slack alert. Calls continue.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "16px 20px", fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>90%</td>
                    <td style={{ padding: "16px 20px", fontSize: 15, color: C.text }}>Email + Slack alert. Calls continue.</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "16px 20px", fontSize: 16, fontWeight: 700, color: C.red, fontFamily: "'JetBrains Mono', monospace" }}>100%</td>
                    <td style={{ padding: "16px 20px", fontSize: 15, color: C.text }}><strong>Hard block.</strong> HTTP 429. No upstream call. Email + Slack alert.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Reset options */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 16 }}>Reset options</h3>
            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
              Reset a single asset from Settings → Assets → Reset Spend. Reset all assets from Budgets page → Reset All (confirmation required). Resets clear the Redis spend counter only — ClickHouse event logs are permanent.
            </p>
          </section>
          
          {/* SECTION 5 — Asset Tracking */}
          <section id="assets" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Asset Tracking</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>Know exactly what every agent, bot, and workflow costs</p>

            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, marginBottom: 40 }}>
              In Cypress Vision an asset is any named entity making AI calls through the proxy — an agent, a bot, a workflow, a team member, a client, or a feature. Each asset gets its own API key (passed as the Authorization header), its own daily and monthly budget caps, its own real-time spend dashboard, and its own status. The system tracks everything automatically from the moment the first call comes through.
            </p>

            {/* Feature list with checkmarks */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>What each asset shows</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</div>
                <div style={{ fontSize: 15, color: C.text }}>Total spend today and this month</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</div>
                <div style={{ fontSize: 15, color: C.text }}>Total API calls and routed calls</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</div>
                <div style={{ fontSize: 15, color: C.text }}>Routing efficiency % (routed / total calls)</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</div>
                <div style={{ fontSize: 15, color: C.text }}>Live budget progress bar — green under 70%, amber 70–99%, red at 100%</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</div>
                <div style={{ fontSize: 15, color: C.text }}>Status badge: Healthy / Warning / Blocked</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</div>
                <div style={{ fontSize: 15, color: C.text }}>Cost breakdown by model</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</div>
                <div style={{ fontSize: 15, color: C.text }}>CSV export of full usage history</div>
              </div>
            </div>

            {/* Green info box */}
            <div style={{ background: C.greenBg, border: `2px solid ${C.greenBorder}`, borderRadius: 10, padding: 24, fontSize: 15, color: C.text, lineHeight: 1.75 }}>
              <strong>Assets scale without limit.</strong> 1 asset or 10,000 — performance is identical. AI consultants use assets to track per-client spend. Startups use assets per agent or feature. Internal teams use assets per department or workflow. There is no technical ceiling.
            </div>
          </section>
          
          {/* SECTION 6 — Response Cache */}
          <section id="cache" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Response Cache</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>Zero cost on repeated prompts</p>

            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, marginBottom: 40 }}>
              Cypress Vision includes a Redis-backed exact-match response cache. When the same prompt is sent more than once by the same tenant, the cached response is returned immediately — no upstream API call, no token cost, sub-millisecond response time from the cache.
            </p>

            {/* How it works - numbered steps */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>How it works</h3>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32, marginBottom: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.blue, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>1.</div>
                  <div style={{ fontSize: 15, color: C.text }}>Incoming messages array is extracted and joined into prompt text</div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.blue, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>2.</div>
                  <div style={{ fontSize: 15, color: C.text }}>Text is normalized (trimmed, lowercased) and hashed with MD5</div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.blue, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>3.</div>
                  <div style={{ fontSize: 15, color: C.text }}>
                    Redis lookup on key: <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>tg:cache:{"{tenant_id}:{md5_hash}"}</code>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.green, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>4.</div>
                  <div style={{ fontSize: 15, color: C.text }}>
                    <strong style={{ color: C.green }}>HIT</strong> → cached response returned instantly. No provider call. No token cost.
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.amber, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>5.</div>
                  <div style={{ fontSize: 15, color: C.text }}>
                    <strong style={{ color: C.amber }}>MISS</strong> → request forwarded normally. Response stored with 24-hour TTL.
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.blue, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>6.</div>
                  <div style={{ fontSize: 15, color: C.text }}>
                    Streaming requests (<code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>stream: true</code>) are not cached — requires a complete response
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.blue, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>7.</div>
                  <div style={{ fontSize: 15, color: C.text }}>Prompts under 4 words are not cached</div>
                </div>
              </div>
            </div>

            {/* Result table */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ background: C.greenBg }}>
                    <td style={{ padding: "16px 20px", fontSize: 16, fontWeight: 700, color: C.greenText, fontFamily: "'JetBrains Mono', monospace" }}>Cache HIT</td>
                    <td style={{ padding: "16px 20px", fontSize: 15, color: C.text }}>Response returned in under 1ms. No upstream call. No token cost. Zero provider latency.</td>
                  </tr>
                  <tr style={{ background: C.amberBg }}>
                    <td style={{ padding: "16px 20px", fontSize: 16, fontWeight: 700, color: C.amberText, fontFamily: "'JetBrains Mono', monospace" }}>Cache MISS</td>
                    <td style={{ padding: "16px 20px", fontSize: 15, color: C.text }}>Request forwarded normally. Response cached for 24 hours for future identical requests.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Info box */}
            <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 8, padding: 16, fontSize: 14, color: C.text, lineHeight: 1.7 }}>
              <strong>Cache is per-tenant</strong> — one tenant's cache never affects another. Cache stats (total cached prompts, hit rate) are visible on your Overview page.
            </div>
          </section>
          
          {/* SECTION 7 — Ask AI — Spend Copilot */}
          <section id="ask-ai" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Ask AI — Spend Copilot</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>Built into your dashboard</p>

            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, marginBottom: 40 }}>
              Every Cypress Vision dashboard includes a conversational AI assistant with full context of your live tenant data — your assets, models, spend history, routing decisions, and budget state. Ask it questions in plain English and get instant answers backed by your real usage data.
            </p>

            {/* Example questions as pills */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>Example questions</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
              <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 20, padding: "10px 18px", fontSize: 14, color: C.blueText }}>
                "What would switching my recommendation agent from claude-sonnet to claude-haiku save me this month?"
              </div>
              <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 20, padding: "10px 18px", fontSize: 14, color: C.blueText }}>
                "Which asset is driving the most cost this week?"
              </div>
              <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 20, padding: "10px 18px", fontSize: 14, color: C.blueText }}>
                "Show me my 7-day spend trend by model"
              </div>
              <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 20, padding: "10px 18px", fontSize: 14, color: C.blueText }}>
                "How much did smart routing save me last month?"
              </div>
              <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 20, padding: "10px 18px", fontSize: 14, color: C.blueText }}>
                "Which agents are near their budget cap right now?"
              </div>
              <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 20, padding: "10px 18px", fontSize: 14, color: C.blueText }}>
                "What is my projected monthly spend at current burn rate?"
              </div>
              <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 20, padding: "10px 18px", fontSize: 14, color: C.blueText }}>
                "Which of my calls are being routed and which are passing through?"
              </div>
              <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 20, padding: "10px 18px", fontSize: 14, color: C.blueText }}>
                "Compare my OpenAI vs Anthropic spend this month"
              </div>
            </div>

            {/* Info box */}
            <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: 8, padding: 16, fontSize: 14, color: C.text, lineHeight: 1.7 }}>
              <strong>Spend Copilot is available on Growth plan and above.</strong> During soft launch it is available to all premium accounts.
            </div>
          </section>
          
          {/* SECTION 8 — Infrastructure */}
          <section id="infrastructure" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Infrastructure</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>What runs under the hood</p>

            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, marginBottom: 40 }}>
              Cypress Vision is built on four production-grade services. Each is chosen for a specific role in the request path. Every component that adds latency runs in-process or in Redis — under 1ms. ClickHouse logging runs asynchronously and never touches your response time.
            </p>

            {/* Infrastructure table */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.borderSoft }}>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Component</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Technology</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: C.text }}>Proxy / API gateway</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>FastAPI (Python) on Railway</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Receives every AI call. Scores complexity, checks Redis budget, looks up cache, routes to optimal model, forwards to provider, logs event async to ClickHouse. Your application talks only to this.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: C.text }}>Event store</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>ClickHouse (cloud, columnar)</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Immutable append-only log of every API call. Stores 13 fields per event: timestamp, client_id, agent_id, model_requested, model_used, prompt_tokens, completion_tokens, total_tokens, cost_usd, cache_hit, was_routed, blocked, latency_ms. Powers all real-time analytics. Column-oriented — analytical queries over millions of rows complete in milliseconds.</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: C.text }}>Budget + Cache</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>Redis</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Two uses: (1) Budget enforcement — spend counters stored as integer microseconds per tenant per period, checked in under 1ms on every request. (2) Prompt cache — MD5-keyed response store with 24hr TTL. Both use namespaced keys for full tenant isolation.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: C.text }}>Auth & config</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>Supabase (Postgres)</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>User accounts, tenant records, API keys (encrypted at rest), routing rules, budget configuration, provider key storage. Never in the request hot path.</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: C.text }}>Dashboard</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>Next.js on Railway</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Real-time spend analytics, routing performance, budget management, asset tracking, Spend Copilot, CSV export, ROI report. Polls proxy API every 30 seconds for live data.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: C.text }}>Alerts</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>Resend (email) + Slack webhook</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>Fired in a background thread at 70%, 90%, 100% of budget. Never blocks the request path. Zero latency impact.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Green info box */}
            <div style={{ background: C.greenBg, border: `2px solid ${C.greenBorder}`, borderRadius: 10, padding: 24, fontSize: 15, color: C.text, lineHeight: 1.75 }}>
              <strong>The request path</strong> — budget check (Redis) + cache lookup (Redis) + routing decision (in-process) — adds under 1ms to every call. ClickHouse logging is async in a background thread. Your application sees the same response time as calling the AI provider directly.
            </div>
          </section>
          
          {/* SECTION 9 — Security */}
          <section id="security" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Security</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>Built into every layer</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Encrypted key storage */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Encrypted key storage</h3>
                </div>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0, paddingLeft: 36 }}>
                  OpenAI, Anthropic, and Google API keys are stored encrypted at rest in Supabase Postgres. Never returned in API responses. Never written to any log. Never accessible outside the proxy's secure environment.
                </p>
              </div>

              {/* Complete tenant isolation */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Complete tenant isolation</h3>
                </div>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0, paddingLeft: 36 }}>
                  Every object in the system — Redis budget keys, Redis cache keys, ClickHouse events, Postgres records — is namespaced by tenant_id. Format: <code style={{ background: C.borderSoft, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>tg:{"{type}:{tenant_id}:{...}"}</code>. One tenant cannot read, write, or affect another tenant's data at any layer.
                </p>
              </div>

              {/* TLS everywhere */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>TLS everywhere</h3>
                </div>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0, paddingLeft: 36 }}>
                  All traffic between your application and the proxy is HTTPS/TLS. All traffic between the proxy and AI providers is HTTPS/TLS. No plaintext at any point in the chain.
                </p>
              </div>

              {/* No prompt storage by default */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>No prompt storage by default</h3>
                </div>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0, paddingLeft: 36 }}>
                  Only metadata is stored by default: model, token counts, cost_usd, latency_ms, routing decision, cache status. Prompt content is never logged unless audit mode is explicitly enabled. Your data is never used for training or shared with any third party.
                </p>
              </div>

              {/* Budget enforcement cannot be bypassed */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Budget enforcement cannot be bypassed</h3>
                </div>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0, paddingLeft: 36 }}>
                  Budget checks execute at the proxy layer before any upstream call. There is no API path that skips budget enforcement for AI calls. Dashboard and management endpoints are excluded by design.
                </p>
              </div>

              {/* CORS locked to your domain */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>CORS locked to your domain</h3>
                </div>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0, paddingLeft: 36 }}>
                  The proxy accepts requests only from your registered dashboard origin. Cross-origin requests from other domains are rejected by middleware.
                </p>
              </div>

              {/* Self-hosted deployment available */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.green, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Self-hosted deployment available</h3>
                </div>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0, paddingLeft: 36 }}>
                  For teams with strict data residency requirements — LegalTech, HealthTech, FinTech — Cypress Vision can be deployed entirely within your own infrastructure. Your own Railway, AWS, GCP, or Azure. Your own Redis, ClickHouse, and Postgres. AI call data never leaves your network. Available on Scale ($399/mo) and Enterprise.
                </p>
              </div>
            </div>
          </section>
          
          {/* SECTION 10 — Compliance & Audit Logs */}
          <section id="compliance" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Compliance & Audit Logs</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>Every call logged, immutably, forever</p>

            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, marginBottom: 40 }}>
              Every API call through Cypress Vision is written to ClickHouse — a column-oriented analytical database designed for exactly this workload: append-only, immutable, fast on large datasets, and queryable in milliseconds even at millions of rows.
            </p>

            {/* ClickHouse schema table */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>ClickHouse schema</h3>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.borderSoft }}>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Field</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Type</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>What it captures</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>timestamp</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>DateTime UTC</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Exact moment of the API call</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>client_id</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>String</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Your tenant identifier</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>agent_id</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>String</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>The asset that made the call</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>model_requested</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>String</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>The model your code asked for</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>model_used</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>String</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>The model actually used after routing</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>prompt_tokens</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Int</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Input token count</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>completion_tokens</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Int</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Output token count</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>total_tokens</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Int</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Combined token count</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>cost_usd</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Float</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Actual USD cost of this call</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>cache_hit</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Boolean</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Was this returned from cache?</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>was_routed</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Boolean</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Did routing change the model?</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>blocked</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Boolean</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Was this call blocked by budget?</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>latency_ms</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.text }}>Int</td>
                    <td style={{ padding: "12px 20px", fontSize: 14, color: C.textMuted }}>Full round-trip latency in milliseconds</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ClickHouse properties */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>ClickHouse properties</h3>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28, marginBottom: 32 }}>
              <ul style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0, paddingLeft: 20 }}>
                <li><strong>Append-only</strong> — events cannot be modified or deleted through normal operations</li>
                <li><strong>Column-oriented</strong> — sum, group, and filter over millions of rows in milliseconds</li>
                <li><strong>Real-time</strong> — events appear in your dashboard within seconds of the API call</li>
              </ul>
            </div>

            {/* Compliance use-case cards */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 20 }}>Compliance use cases</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>LegalTech</div>
                <p style={{ fontSize: 14, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Full AI usage audit trail. Which model was used for which task, by which user, at what time. Exportable for legal discovery or client reporting.
                </p>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>HealthTech</div>
                <p style={{ fontSize: 14, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Document AI-assisted decisions with model version, timestamp, and asset. Data residency available via self-hosted deployment.
                </p>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>FinTech</div>
                <p style={{ fontSize: 14, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Model risk management documentation. Every inference logged with model, version, cost, and latency. Exportable for regulatory review.
                </p>
              </div>
            </div>
          </section>
          
          {/* SECTION 11 — Scaling */}
          <section id="scaling" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Scaling</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>Scales from your first agent to your entire company</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 32 }}>
              {/* Card 1 - Startups */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>Startups & Small Teams</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  1 to 50 assets. Free and Starter plans. One integration covers your whole product. Routing starts saving money on day one. Fully managed — no ops work required.
                </p>
              </div>

              {/* Card 2 - Growing Companies */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>Growing Companies</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  50 to 1,000 assets. Growth plan. Unlimited assets and routing rules. Per-project and per-client cost tracking. Spend Copilot answers cost questions instantly. CSV export for finance and reporting.
                </p>
              </div>

              {/* Card 3 - Agencies & Enterprise */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>Agencies & Enterprise</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Unlimited assets. Scale and Enterprise plans. White-label option — your brand, your domain. Self-hosted for data residency. SLA with dedicated support. Compliance exports. Custom contracts.
                </p>
              </div>
            </div>

            {/* Green info box */}
            <div style={{ background: C.greenBg, border: `2px solid ${C.greenBorder}`, borderRadius: 10, padding: 24, fontSize: 15, color: C.text, lineHeight: 1.75 }}>
              <strong>There is no technical limit on assets, routing rules, or API call volume.</strong> The system is designed to scale horizontally. Contact info@cypressvision.xyz for enterprise volume pricing.
            </div>
          </section>
          
          {/* SECTION 12 — Pricing */}
          <section id="pricing" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>Pricing</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 8 }}>Simple, transparent pricing</p>
            <p style={{ fontSize: 15, color: C.textDim, marginBottom: 40 }}>Pay one flat fee. We save you multiples of that every month.</p>

            {/* Pricing table */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.borderSoft }}>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Plan</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Price</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Calls/month</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Assets</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border}` }}>Key features</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: C.text }}>Free</td>
                    <td style={{ padding: "14px 20px", fontSize: 15, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>$0</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>10,000</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>1</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted }}>Auto-Router, basic analytics, 7-day full access, no credit card required</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: C.text }}>Starter</td>
                    <td style={{ padding: "14px 20px", fontSize: 15, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>$49/mo</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>100,000</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>10</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted }}>Full routing + caching + audit logs, all providers, email alerts</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: C.text }}>Growth</td>
                    <td style={{ padding: "14px 20px", fontSize: 15, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>$149/mo</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>1,000,000</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>Unlimited</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted }}>+ Spend Copilot, CSV export, custom routing rules, priority support</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: C.text }}>Scale</td>
                    <td style={{ padding: "14px 20px", fontSize: 15, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>$399/mo</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>Unlimited</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>Unlimited</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted }}>+ SLA, compliance exports, white-label, self-hosted option</td>
                  </tr>
                  <tr style={{ background: C.rowAlt }}>
                    <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: C.text }}>Enterprise</td>
                    <td style={{ padding: "14px 20px", fontSize: 15, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>Custom</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>Unlimited</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.text }}>Unlimited</td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted }}>+ On-premise, SSO, dedicated support, custom contracts</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <Link href="/signup" style={{ display: "inline-block", background: C.blue, color: "#FFF", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15, boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)" }}>
                Start Free — No Credit Card
              </Link>
              <a href="https://calendly.com/abelassefa19/cypress-tokenguard-premium" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "transparent", color: C.blue, padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15, border: `2px solid ${C.blue}` }}>
                Book a Demo
              </a>
            </div>
          </section>
          
          {/* SECTION 13 — FAQ */}
          <section id="faq" style={{ marginBottom: 96 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>FAQ</h2>
            <p style={{ fontSize: 17, color: C.textMuted, marginBottom: 40 }}>Frequently asked questions</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Q1 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>Does this work with my existing OpenAI SDK?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Yes. One line — base_url. Your SDK, your API key, your model names all stay exactly the same. Works with openai-python, openai-node, and any HTTP client that accepts a base URL.
                </p>
              </div>

              {/* Q2 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>Does it work with Anthropic and Google too?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Yes. Add your Anthropic or Google key in Settings → Provider Keys. Cypress Vision detects the provider from the model name. claude-* goes to Anthropic. gemini-* goes to Google. gpt-* and o* go to OpenAI. All three simultaneously.
                </p>
              </div>

              {/* Q3 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>Will routing change the quality of my responses?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  For simple tasks — no. The classifier is calibrated so that tasks requiring reasoning, long context, code generation, or tool use stay on premium models. Only genuinely simple tasks (short factual questions, translations, basic lookups) route to efficient models. Test any prompt in the Routing Playground before it goes live.
                </p>
              </div>

              {/* Q4 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>Does Cypress Vision see my prompt content?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  By default, no. Only metadata is stored — model, tokens, cost, latency, routing decision. Full prompt logging is opt-in on Scale and Enterprise plans for compliance purposes only.
                </p>
              </div>

              {/* Q5 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>What happens if Cypress Vision goes down?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Point base_url back to api.openai.com in 30 seconds. Keep your original provider URL as a fallback environment variable. Scale plan includes 99.9% uptime SLA.
                </p>
              </div>

              {/* Q6 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>How are my provider API keys protected?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Stored encrypted at rest in Supabase Postgres. Never returned in API responses. Never written to any log. Used only by the proxy to forward your requests.
                </p>
              </div>

              {/* Q7 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>Can I write my own routing rules?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Yes. Custom rules override the automatic classifier — by agent ID, workflow ID, model name, or token range. Evaluated in priority order before the classifier runs. Available on Growth and above.
                </p>
              </div>

              {/* Q8 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>How many assets can I have?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Unlimited on Growth and above. No performance impact at any scale.
                </p>
              </div>

              {/* Q9 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>Is there a free trial?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Yes. Free plan — 10,000 calls, 7 days full access, no credit card.
                </p>
              </div>

              {/* Q10 */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.blue, marginBottom: 12 }}>Can I white-label this for my clients?</h3>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, margin: 0 }}>
                  Yes. Scale plan includes white-label — your domain, your brand. Contact info@cypressvision.xyz.
                </p>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: 32, background: C.card, textAlign: "center" }}>
        <p style={{ fontSize: 15, color: C.text, margin: 0 }}>
          Still have questions? Email us at <a href="mailto:info@cypressvision.xyz" style={{ color: C.blue, textDecoration: "none", fontWeight: 600 }}>info@cypressvision.xyz</a> or <a href="https://calendly.com/abelassefa19/cypress-tokenguard-premium" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none", fontWeight: 600 }}>book a 15-minute call</a>.
        </p>
      </footer>
    </div>
  );
}