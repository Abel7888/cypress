"use client";
import Link from "next/link";
import React, { useState } from "react";
import { BRAND as C, Logo, LogoMark } from "./brand";
import { UseCaseCards } from "./UseCaseCards";

// ─── PRICING ─────────────────────────────────────────────────────────────────
type Plan = {
  id: string;
  name: string;
  priceLabel: string;
  priceSub: string;
  tagline: string;
  cta: string;
  popular?: boolean;
  highlights: string[];
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    priceSub: "/month",
    tagline: "Test it out — 7 days, no credit card.",
    cta: "Start 7-Day Trial",
    highlights: [
      "7-day free trial · 10,000 API calls",
      "1 asset · 1 provider",
      "Auto-Router + asset tracking",
      "No credit card required",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$49",
    priceSub: "/month",
    tagline: "For small teams shipping AI features.",
    cta: "Start Starter",
    highlights: [
      "Up to 100,000 calls/month",
      "10 assets · all providers",
      "Full routing + caching + analytics",
      "Audit-ready logs",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    priceLabel: "$149",
    priceSub: "/month",
    tagline: "For production AI workloads.",
    cta: "Start Growth",
    popular: true,
    highlights: [
      "Up to 1,000,000 calls/month",
      "Unlimited assets",
      "Priority support · CSV export",
      "Custom routing rules",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    priceLabel: "$399",
    priceSub: "/month",
    tagline: "For agencies and regulated industries.",
    cta: "Contact Us",
    highlights: [
      "Unlimited calls · unlimited assets",
      "SLA + dedicated support",
      "Compliance exports",
      "White-label option for agencies",
    ],
  },
];

// ─── FEATURES ────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: ZapIcon,
    title: "Auto-Router",
    desc: "Routes each API call to the right model automatically. Simple prompts go cheap. Complex ones stay premium.",
  },
  {
    icon: ChartIcon,
    title: "Asset Tracking",
    desc: "See exactly what every agent, bot, or workflow is spending. Per-asset cost breakdown in real time.",
  },
  {
    icon: ShieldIcon,
    title: "Spend Guards",
    desc: "Set daily and monthly caps per asset or for your whole account. Hard blocks prevent surprise bills.",
  },
  {
    icon: PlayIcon,
    title: "Routing Playground",
    desc: "Test how any prompt would be routed before it goes live. See the model, score, and estimated cost.",
  },
  {
    icon: SparkleIcon,
    title: "Spend Copilot",
    desc: "Ask questions about your AI spend in plain English. \u201cWhat would switching to Haiku save me this month?\u201d",
  },
  {
    icon: LogIcon,
    title: "Audit-Ready Logs",
    desc: "Every prompt logged with timestamp, model, user, and cost. Exportable for compliance or legal review.",
  },
];

// ─── BUYER MESSAGES ──────────────────────────────────────────────────────────
type Audience = {
  id: string;
  label: string;
  headline: string;
  body: string;
};

const AUDIENCES: Audience[] = [
  {
    id: "startups",
    label: "AI Startups",
    headline: "Stop burning runway on your most expensive model.",
    body: "Your API bill is probably 50–70% higher than it needs to be. You're using your most expensive model for tasks a 94% cheaper model handles just as well. Cypress Vision routes automatically. One line change. Most customers save their subscription cost back in the first week.",
  },
  {
    id: "consultants",
    label: "AI Consultants",
    headline: "Show every client exactly what their AI is costing — and saving.",
    body: "You're building AI solutions for clients but you have no easy way to show them what their AI investment actually costs or saves. Cypress Vision gives you per-client dashboards, automatic cost optimization, and a shareable ROI report. Your clients see the value. You look like the expert who thought of everything.",
  },
  {
    id: "compliance",
    label: "LegalTech & HealthTech",
    headline: "Compliance sign-off and cost savings — in one integration.",
    body: "Your compliance team needs an audit trail before they'll approve AI in your product. Cypress Vision logs every prompt, every model, every user, every timestamp — exportable for legal discovery. Compliance sign-off AND automatic cost optimization in one 30-second integration.",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [audienceTab, setAudienceTab] = useState<string>(AUDIENCES[0].id);

  const CALENDLY_URL = "https://calendly.com/abelassefa19/cypress-vision-premium";

  const handleCheckout = async (planId: string) => {
    if (planId === "free") {
      window.location.href = `/signup?plan=${planId}`;
      return;
    }
    if (planId === "scale") {
      window.open(CALENDLY_URL, "_blank");
      return;
    }
    setCheckoutLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = `/signup?plan=${planId}`;
      }
    } catch {
      window.location.href = `/signup?plan=${planId}`;
    }
    setCheckoutLoading(null);
  };

  const activeAudience = AUDIENCES.find(a => a.id === audienceTab) || AUDIENCES[0];

  return (
    <div style={{
      background: C.bgDark, color: C.textOnDark, minHeight: "100vh",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* Responsive helper */}
      <style>{`
        @media (max-width: 960px) {
          .cv-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .cv-grid-3 { grid-template-columns: 1fr !important; }
          .cv-grid-2 { grid-template-columns: 1fr !important; }
          .cv-hero-h1 { font-size: 44px !important; }
          .cv-stats { grid-template-columns: 1fr !important; }
          .cv-nav-links { display: none !important; }
        }
        @media (max-width: 640px) {
          .cv-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,31,61,0.78)", backdropFilter: "saturate(180%) blur(14px)",
        borderBottom: `1px solid #ffffff15`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}><Logo size={34} dark /></Link>
          <div className="cv-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#features" style={navLinkDark}>Features</a>
            <a href="#use-cases" style={navLinkDark}>Use Cases</a>
            <a href="#how-it-works" style={navLinkDark}>How It Works</a>
            <a href="#audiences" style={navLinkDark}>Who it&apos;s for</a>
            <a href="#pricing" style={navLinkDark}>Pricing</a>
            <a href="/docs" style={navLinkDark}>Docs</a>
            <Link href="/signin" style={navLinkDark}>Sign in</Link>
            <Link href="/signup" style={primaryBtn()}>Start Free</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{
        padding: "96px 32px 80px", position: "relative", overflow: "hidden",
        background: `
          radial-gradient(ellipse 1200px 600px at 50% -10%, ${C.primary}33 0%, transparent 60%),
          linear-gradient(180deg, ${C.bgDark} 0%, ${C.bgDarkSoft} 100%)
        `,
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none",
          backgroundImage: `linear-gradient(#ffffff20 1px, transparent 1px), linear-gradient(90deg, #ffffff20 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 900px 500px at 50% 0%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 900px 500px at 50% 0%, #000 30%, transparent 75%)",
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={pillDark()}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", boxShadow: `0 0 0 3px #34D39933` }} />
            For builders shipping AI products
          </div>

          <h1 className="cv-hero-h1" style={{
            fontSize: 76, fontWeight: 800, letterSpacing: "-0.04em",
            lineHeight: 1.02, margin: "28px 0 22px", color: "#fff",
          }}>
            Your AI bill is <span style={{
              background: `linear-gradient(120deg, ${C.primary} 0%, ${C.sky} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>50–70% higher</span><br />than it needs to be.
          </h1>
          <p style={{
            fontSize: 22, color: C.textMutedOnDark, lineHeight: 1.5,
            maxWidth: 760, margin: "0 auto 18px", fontWeight: 500,
          }}>
            Stop overpaying for AI. One line change.
          </p>
          <p style={{
            fontSize: 17, color: "#9CB1D1", lineHeight: 1.6,
            maxWidth: 760, margin: "0 auto 36px",
          }}>
            Cypress Vision routes your AI calls automatically — cheap models for simple tasks, premium for complex ones. Full visibility. Hard spend limits. One 30-second setup.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <Link href="/signup" style={{ ...primaryBtn(), fontSize: 16, padding: "16px 28px" }}>
              Start Free — No Credit Card →
            </Link>
            <a href="#demo" style={{ ...ghostBtnDark(), fontSize: 16, padding: "16px 28px" }}>
              ▸ See a Live Demo
            </a>
          </div>
          <div style={{ fontSize: 13, color: "#7A8CA5" }}>
            Works with OpenAI, Anthropic &amp; Google · Setup in 30 seconds · Cancel anytime
          </div>

          {/* ─── Code snippet ─── */}
          <div id="demo" style={{
            marginTop: 56, maxWidth: 720, marginLeft: "auto", marginRight: "auto",
            background: "#06152C", border: `1px solid #ffffff15`,
            borderRadius: 14, overflow: "hidden", textAlign: "left",
            boxShadow: `0 24px 60px -20px ${C.primary}40, 0 10px 30px -15px #00000060`,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", borderBottom: `1px solid #ffffff10`,
              background: "#0A1F3D",
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F56" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFBD2E" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#27C93F" }} />
              </div>
              <span style={{ fontSize: 11, color: "#7A8CA5", fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em" }}>
                client.py · one line change
              </span>
              <span style={{ fontSize: 11, color: C.sky, fontWeight: 600 }}>30 sec</span>
            </div>
            <pre style={{
              margin: 0, padding: "20px 22px", fontSize: 14, lineHeight: 1.7,
              fontFamily: "ui-monospace, SFMono-Regular, 'JetBrains Mono', monospace",
              color: "#E6EDF7", overflowX: "auto",
            }}>
{`from openai import OpenAI

client = OpenAI(
  api_key=os.environ["OPENAI_API_KEY"],`}
              <span style={{ color: "#7A8CA5" }}>{"\n  # change this one line ↓"}</span>
              <span style={{ color: "#34D399", fontWeight: 600 }}>{"\n  base_url=\"https://api.cypressvision.io/v1\""}</span>
{`
)

# everything else stays the same
client.chat.completions.create(model="gpt-4o", messages=[...])`}
            </pre>
          </div>

          {/* ─── Stats callouts ─── */}
          <div className="cv-stats" style={{
            marginTop: 64, display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0, maxWidth: 980, margin: "64px auto 0",
            background: "#0A1F3DAA", border: `1px solid #ffffff15`, borderRadius: 20,
            overflow: "hidden",
            boxShadow: `0 24px 60px -20px ${C.primary}30`,
          }}>
            {[
              { num: "50–70%", label: "average reduction in AI API costs", alt: false },
              { num: "30 sec", label: "integration — change one URL", alt: false },
              { num: "OpenAI · Anthropic · Google", label: "works with all three out of the box", alt: true },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "32px 24px", textAlign: "center",
                borderLeft: i > 0 ? `1px solid #ffffff15` : "none",
              }}>
                <div style={{
                  fontSize: s.alt ? 20 : 40, fontWeight: 800, letterSpacing: "-0.03em",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.sky})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  marginBottom: 8, lineHeight: 1.2,
                }}>{s.num}</div>
                <div style={{ fontSize: 14, color: C.textMutedOnDark, lineHeight: 1.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding: "110px 32px", background: C.bgDark }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 60px" }}>
            <SectionTag>What you get</SectionTag>
            <SectionTitle>Everything you need to control AI spend</SectionTitle>
            <SectionSub>
              Cypress Vision sits between your code and AI providers. Every call is routed, tracked, and budgeted — automatically.
            </SectionSub>
          </div>

          <div className="cv-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: "#0A1F3D", border: `1px solid #ffffff15`,
                borderRadius: 16, padding: 28,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${C.primary}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 18, color: C.sky,
                }}>
                  <f.icon />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</div>
                <div style={{ fontSize: 14, color: C.textMutedOnDark, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AUDIENCES ═══ */}
      <section id="audiences" style={{
        padding: "110px 32px", background: C.bgDarkSoft,
        borderTop: `1px solid #ffffff10`, borderBottom: `1px solid #ffffff10`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
            <SectionTag>Who it&apos;s for</SectionTag>
            <SectionTitle>Built for the builders</SectionTitle>
            <SectionSub>
              5–50 person teams shipping AI products. Consultants. Compliance-bound builders. Pick your role:
            </SectionSub>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
            {AUDIENCES.map(a => {
              const active = a.id === audienceTab;
              return (
                <button
                  key={a.id}
                  onClick={() => setAudienceTab(a.id)}
                  style={{
                    background: active ? C.primary : "transparent",
                    color: active ? "#fff" : C.textMutedOnDark,
                    border: `1px solid ${active ? C.primary : "#ffffff20"}`,
                    borderRadius: 100, padding: "10px 22px",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s", fontFamily: "inherit",
                  }}>
                  {a.label}
                </button>
              );
            })}
          </div>

          <div style={{
            background: "#0A1F3D", border: `1px solid #ffffff15`,
            borderRadius: 20, padding: "44px 48px", maxWidth: 880, margin: "0 auto",
            boxShadow: `0 30px 80px -30px ${C.primary}40`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: C.sky,
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14,
            }}>
              For {activeAudience.label}
            </div>
            <h3 style={{
              fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em",
              color: "#fff", margin: "0 0 18px", lineHeight: 1.25,
            }}>
              {activeAudience.headline}
            </h3>
            <p style={{ fontSize: 16, color: C.textMutedOnDark, lineHeight: 1.7, margin: 0 }}>
              {activeAudience.body}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section id="use-cases" style={{
        padding: "100px 32px", background: C.bgDark,
        borderTop: `1px solid #ffffff10`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 64px" }}>
            <SectionTag>Use Cases</SectionTag>
            <SectionTitle>Built for every team shipping AI</SectionTitle>
            <SectionSub>
              Whether you run agents, build products, or manage a team — one integration gives you routing, budgets, and full visibility across every call.
            </SectionSub>
          </div>
          <UseCaseCards />
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" style={{ padding: "100px 32px", background: C.bgDarkSoft }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{
              display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#93C5FD", background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)", borderRadius: 20, padding: "4px 14px", marginBottom: 16,
            }}>How It Works</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.textOnDark, margin: "0 0 14px", lineHeight: 1.2 }}>
              One integration. Full control over every AI call.
            </h2>
            <p style={{ fontSize: 16, color: C.textMutedOnDark, maxWidth: 580, margin: "0 auto", lineHeight: 1.7 }}>
              Cypress Vision sits between your application and your AI provider.
              Nothing changes in your code except the base URL — and suddenly every call is tracked, optimized, and under control.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {/* Connector line */}
            <div style={{
              position: "absolute", left: 31, top: 48, bottom: 48,
              width: 2, background: `linear-gradient(to bottom, ${C.primary}, #16A34A)`,
              opacity: 0.5,
            }} />

            {[
              {
                num: "1",
                color: C.primary,
                title: "Connect your AI provider",
                body: "Add your OpenAI, Anthropic, or Google API key once. Cypress Vision securely stores it and uses it on every call — your provider never changes, only the route does.",
                detail: "Works with every OpenAI, Anthropic, Google, and Grok model — all providers, all tiers.",
              },
              {
                num: "2",
                color: C.primaryHover,
                title: "Add your assets — agents, bots, or team members",
                body: "Create an asset for each agent, bot, workflow, or team member calling the API. Each gets its own key, daily and monthly budget caps, real-time spend alerts, and full usage analytics. You see everything — they notice nothing.",
                detail: "Daily and monthly caps per asset. Slack + email alerts at 70%, 90%, 100%. Hard block before damage is done.",
              },
              {
                num: "3",
                color: "#16A34A",
                title: "Replace your base URL — that's it",
                body: "One line change in your app config. Your application calls Cypress Vision's proxy exactly like it called OpenAI or Anthropic directly. Same format, same response, same speed.",
                detail: "Before: api.openai.com  →  After: your-proxy.cypressvision.app",
              },
              {
                num: "4",
                color: "#D97706",
                title: "Smart routing starts immediately",
                body: "Every prompt is scored across 10 signals in under 1ms — prompt length, tool use, code markers, conversation depth. Simple tasks route to efficient models automatically, saving 60–94% on those calls. Complex tasks stay on premium. No quality compromise, no code changes.",
                detail: "\"4+4\" → GPT-4.1 nano.  \"Architect a fault-tolerant payment system\" → GPT-5.5. Automatic, every time.",
              },
              {
                num: "5",
                color: C.text,
                title: "Watch your costs drop in real time",
                body: "Your dashboard shows every call, every asset, every dollar in real time — broken down by model, by provider, by day. See which agents drive costs, which are near their cap, and exactly how much routing saved you. Exportable for your CFO, audit-ready for compliance.",
                detail: "Cost by asset · cost by model · cost by day · routing savings · budget burn rate · all in one view.",
              },
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: 24, padding: "32px 0",
                borderBottom: i < 4 ? `1px solid ${C.border}` : "none",
                alignItems: "flex-start",
              }}>
                {/* Number bubble */}
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                  background: step.color, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 18, fontWeight: 800,
                  color: "#fff", position: "relative", zIndex: 1,
                  boxShadow: `0 0 0 4px ${C.bgDarkSoft}, 0 0 0 6px ${step.color}22`,
                }}>{step.num}</div>

                {/* Content */}
                <div style={{ flex: 1, paddingTop: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.textOnDark, marginBottom: 8 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 15, color: C.textMutedOnDark, lineHeight: 1.7, marginBottom: 10 }}>
                    {step.body}
                  </div>
                  <div style={{
                    fontSize: 12, color: step.color, fontFamily: "monospace",
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 6, padding: "6px 12px", display: "inline-block",
                    fontWeight: 500,
                  }}>
                    {step.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{
            marginTop: 64, textAlign: "center", padding: "40px 32px",
            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.textOnDark, marginBottom: 10 }}>
              Ready to stop overpaying for AI?
            </div>
            <div style={{ fontSize: 15, color: C.textMutedOnDark, marginBottom: 24 }}>
              Free plan available. No credit card required. Setup in under 2 minutes.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup?plan=free" style={{
                background: C.primary, color: "#fff", padding: "12px 28px",
                borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: "none",
              }}>
                Start free →
              </Link>
              <Link href="/signup?plan=starter" style={{
                background: "rgba(255,255,255,0.1)", color: C.textOnDark, padding: "12px 28px",
                border: `1px solid ${C.border}`, borderRadius: 8,
                fontWeight: 600, fontSize: 15, textDecoration: "none",
              }}>
                See Starter plan — $49/mo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{ padding: "110px 32px", background: C.bgDark }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 60px" }}>
            <SectionTag>Pricing</SectionTag>
            <SectionTitle>Simple, transparent pricing</SectionTitle>
            <SectionSub>Pay one flat fee. We save you multiples of that every month.</SectionSub>
          </div>

          <div className="cv-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "stretch" }}>
            {PLANS.filter(p => p.id === "free" || p.id === "starter").map(p => {
              const isPopular = !!p.popular;
              return (
                <div key={p.id} style={{
                  background: isPopular ? "#0F2A52" : "#0A1F3D",
                  border: `1px solid ${isPopular ? `${C.sky}60` : "#ffffff15"}`,
                  color: "#fff",
                  borderRadius: 18, padding: "32px 26px", position: "relative",
                  display: "flex", flexDirection: "column",
                  transform: isPopular ? "translateY(-10px)" : "none",
                  boxShadow: isPopular
                    ? `0 30px 80px -20px ${C.primary}50, 0 12px 36px -12px #00000060`
                    : `0 2px 6px #00000020`,
                }}>
                  {isPopular && (
                    <div style={{
                      position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                      background: `linear-gradient(90deg, ${C.primary}, ${C.sky})`,
                      color: "#fff", fontSize: 10, fontWeight: 700,
                      padding: "5px 12px", borderRadius: 100, letterSpacing: "0.08em",
                      boxShadow: `0 8px 20px -4px ${C.primary}60`, whiteSpace: "nowrap",
                    }}>MOST POPULAR</div>
                  )}
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: isPopular ? C.sky : "#9CB1D1",
                    letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase",
                  }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>{p.priceLabel}</span>
                    <span style={{ fontSize: 14, color: C.textMutedOnDark }}>{p.priceSub}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.textMutedOnDark, marginBottom: 22, minHeight: 38 }}>{p.tagline}</div>
                  <button
                    onClick={() => handleCheckout(p.id)}
                    disabled={checkoutLoading === p.id}
                    style={{
                      ...(isPopular
                        ? { background: "#fff", color: C.bgDark }
                        : { background: C.primary, color: "#fff" }),
                      border: "none", borderRadius: 10,
                      padding: "12px 0", fontSize: 14, fontWeight: 700,
                      cursor: "pointer", width: "100%", marginBottom: 22,
                      opacity: checkoutLoading === p.id ? 0.7 : 1, fontFamily: "inherit",
                    }}>
                    {checkoutLoading === p.id ? "Loading…" : p.cta}
                  </button>
                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    {p.highlights.map((h, j) => (
                      <div key={j} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        fontSize: 13, color: C.textMutedOnDark, lineHeight: 1.5,
                      }}>
                        <CheckIcon color={isPopular ? C.sky : C.primary} />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: "100px 32px", background: C.bgDark }}>
        <div style={{
          maxWidth: 1000, margin: "0 auto", position: "relative",
          background: `linear-gradient(135deg, ${C.bgDarkSoft} 0%, ${C.primary} 140%)`,
          border: `1px solid #ffffff15`,
          borderRadius: 28, padding: "72px 48px", textAlign: "center",
          color: "#fff", overflow: "hidden",
          boxShadow: `0 30px 80px -20px ${C.primary}50`,
        }}>
          <div style={{
            position: "absolute", top: -200, right: -200, width: 500, height: 500,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.sky}40 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative" }}>
            <h2 style={{
              fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em",
              margin: "0 0 16px", lineHeight: 1.1, color: "#fff",
            }}>
              Stop overpaying for AI. One line change.
            </h2>
            <p style={{
              fontSize: 17, color: "#C9D9F2", lineHeight: 1.6,
              maxWidth: 620, margin: "0 auto 32px",
            }}>
              Free tier. 10,000 calls/month. No credit card. 30 seconds to integrate.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup" style={{
                background: "#fff", color: C.bgDark, border: "none", borderRadius: 12,
                padding: "16px 32px", fontSize: 16, fontWeight: 700, textDecoration: "none",
              }}>
                Start Free — No Credit Card →
              </Link>
              <a href="#demo" style={{
                background: "transparent", color: "#fff", border: "1px solid #ffffff40",
                borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 600,
                textDecoration: "none",
              }}>
                See a Live Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: `1px solid #ffffff15`, padding: "40px 32px", background: C.bgDark }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LogoMark size={28} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Cypress Vision</div>
              <div style={{ fontSize: 12, color: "#7A8CA5" }}>AI spend management for builders.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
            <a href="/docs" style={footerLinkDark}>Docs</a>
            <a href="#pricing" style={footerLinkDark}>Pricing</a>
            <a href="https://github.com/" target="_blank" rel="noreferrer" style={footerLinkDark}>GitHub</a>
            <a href="mailto:abel@cypresspartners.com" style={footerLinkDark}>Contact</a>
          </div>
          <div style={{ fontSize: 12, color: "#7A8CA5" }}>© 2026 Cypress Vision</div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Shared UI ─── */

const navLinkDark: React.CSSProperties = {
  color: C.textMutedOnDark, fontSize: 14, fontWeight: 500, textDecoration: "none",
};

const footerLinkDark: React.CSSProperties = {
  color: C.textMutedOnDark, fontSize: 13, textDecoration: "none",
};

function primaryBtn(): React.CSSProperties {
  return {
    background: C.primary, color: "#fff", border: "none", borderRadius: 10,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
    textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 4px 14px -4px ${C.primary}60`,
  };
}

function ghostBtnDark(): React.CSSProperties {
  return {
    background: "transparent", color: "#fff", border: `1px solid #ffffff40`, borderRadius: 10,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
    textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
}

function pillDark(): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "7px 14px", background: "#ffffff0C", border: `1px solid #ffffff20`,
    borderRadius: 100, fontSize: 13, color: C.textMutedOnDark, fontWeight: 600,
  };
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, color: C.sky, letterSpacing: "0.14em",
      textTransform: "uppercase", fontWeight: 700, marginBottom: 14,
    }}>{children}</div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em",
      color: "#fff", margin: "0 0 14px", lineHeight: 1.15,
    }}>{children}</h2>
  );
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 17, color: C.textMutedOnDark, lineHeight: 1.6, margin: 0 }}>{children}</p>
  );
}

/* ─── Icons ─── */

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function ShieldIcon() { return <Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></Icon>; }
function ZapIcon() { return <Icon><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>; }
function ChartIcon() { return <Icon><path d="M3 3v18h18"/><path d="m7 16 4-8 4 4 6-8"/></Icon>; }
function PlayIcon() { return <Icon><polygon points="6 4 20 12 6 20 6 4"/></Icon>; }
function SparkleIcon() { return <Icon><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m5.6 18.4 2.8-2.8"/><path d="m15.6 8.4 2.8-2.8"/></Icon>; }
function LogIcon() { return <Icon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></Icon>; }
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
