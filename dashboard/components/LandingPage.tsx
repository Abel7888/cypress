"use client";
import Link from "next/link";
import { useState } from "react";
import { BRAND as C, Logo, LogoMark } from "./brand";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 199,
    seats: "Up to 10 employees",
    highlights: [
      "Real-time budget blocking",
      "Employee key management",
      "Intelligent routing (ML-powered)",
      "Per-employee visibility",
      "Monthly ROI report",
      "AI agent monitoring (up to 5)",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 399,
    seats: "Up to 25 employees",
    popular: true,
    highlights: [
      "Everything in Starter, plus:",
      "Advanced AI agent monitoring (up to 15)",
      "Agent cost tracking per workflow",
      "Department-level budgets",
      "Slack alerts for overspending",
      "Usage trends dashboard",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 799,
    seats: "Up to 75 employees",
    highlights: [
      "Everything in Growth, plus:",
      "Unlimited AI agents",
      "Multi-model routing optimization",
      "Custom budget policies",
      "Team & department analytics",
      "API access",
      "Weekly ROI reporting",
      "SSO (Google / Microsoft)",
    ],
  },
];

export default function LandingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const CALENDLY_URL = "https://calendly.com/abelassefa19/cypress-tokenguard-premium";

  const handleCheckout = async (planId: string) => {
    if (planId === "growth" || planId === "business") {
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

  return (
    <div style={{
      background: C.bg, color: C.text, minHeight: "100vh",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* ═══ NAV ═══ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.85)", backdropFilter: "saturate(180%) blur(14px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}><Logo size={34} /></Link>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <a href="#features" style={navLink}>Features</a>
            <a href="#how" style={navLink}>How it works</a>
            <a href="#pricing" style={navLink}>Pricing</a>
            <a href="/docs" style={navLink}>Docs</a>
            <Link href="/signin" style={navLink}>Sign in</Link>
            <Link href="/signup" style={primaryBtn()}>Get started</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{
        padding: "96px 32px 80px", position: "relative", overflow: "hidden",
        background: `
          radial-gradient(ellipse 1200px 600px at 50% -10%, ${C.primarySoft} 0%, transparent 60%),
          linear-gradient(180deg, ${C.bg} 0%, ${C.bgSoft} 100%)
        `,
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none",
          backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 900px 500px at 50% 0%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 900px 500px at 50% 0%, #000 30%, transparent 75%)",
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={pill(C.primary)}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: `0 0 0 3px ${C.green}30` }} />
            Early access · Full launch in 2 weeks
          </div>

          <h1 style={{
            fontSize: 76, fontWeight: 800, letterSpacing: "-0.04em",
            lineHeight: 1.02, margin: "28px 0 22px", color: C.text,
          }}>
            Stop surprise AI bills<br />
            <span style={{
              background: `linear-gradient(120deg, ${C.primary} 0%, ${C.sky} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>before they happen.</span>
          </h1>
          <p style={{
            fontSize: 20, color: C.textMuted, lineHeight: 1.55,
            maxWidth: 720, margin: "0 auto 40px",
          }}>
            Cypress TokenGuard gives your team full AI access while you stay in control of every dollar spent. One line of code to integrate.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 18, flexWrap: "wrap" }}>
            <Link href="/signup" style={{ ...primaryBtn(), fontSize: 16, padding: "16px 30px" }}>
              Start free trial →
            </Link>
            <a href="#how" style={{ ...ghostBtn(), fontSize: 16, padding: "16px 30px" }}>
              ▸ Watch demo
            </a>
          </div>
          <div style={{ fontSize: 13, color: C.textDim }}>
            No credit card required · Setup in 60 seconds · Cancel anytime
          </div>

          <div style={{
            marginTop: 56, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 40, flexWrap: "wrap", opacity: 0.75,
          }}>
            <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Trusted by teams at
            </div>
            {["Acme", "Linear", "Vercel", "Framer", "Notion"].map(name => (
              <div key={name} style={{ fontSize: 18, fontWeight: 700, color: C.textDim, letterSpacing: "-0.02em" }}>{name}</div>
            ))}
          </div>

          <div style={{
            marginTop: 72, display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0, maxWidth: 960, margin: "72px auto 0",
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20,
            overflow: "hidden",
            boxShadow: `0 24px 60px -20px ${C.primary}25, 0 10px 30px -15px ${C.text}10`,
          }}>
            {[
              { num: "40–98%", label: "savings per AI call via smart routing" },
              { num: "60 sec", label: "average onboarding time" },
              { num: "4.4×", label: "average monthly ROI for customers" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "32px 24px", textAlign: "center",
                borderLeft: i > 0 ? `1px solid ${C.border}` : "none",
              }}>
                <div style={{
                  fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.sky})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  marginBottom: 8,
                }}>{s.num}</div>
                <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding: "110px 32px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 60px" }}>
            <SectionTag>What we do</SectionTag>
            <SectionTitle>Everything you need to govern AI spend</SectionTitle>
            <SectionSub>
              TokenGuard sits between your team and the AI providers. Every call is tracked, budgeted, and optimized — automatically.
            </SectionSub>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: ShieldIcon, title: "Real-time budget blocking", desc: "Set daily caps per employee. Requests are blocked automatically when limits are hit — before the bill arrives." },
              { icon: KeyIcon, title: "Employee key management", desc: "Each team member gets their own API key with a custom budget. Add, revoke, or restore access in one click." },
              { icon: ZapIcon, title: "Intelligent routing", desc: "ML scores every prompt and routes it to the right model automatically. Simple tasks go cheap, complex tasks stay premium." },
              { icon: UsersIcon, title: "Per-employee visibility", desc: "Click any team member and see every AI call they made, what model, what it cost, and what we saved — down to the cent." },
              { icon: ChartIcon, title: "Monthly ROI report", desc: "Every month: what you paid us, what we saved you, net benefit. 4.4× average return. If we're not saving you more than we cost, cancel." },
              { icon: RocketIcon, title: "60-second onboarding", desc: "Change one line of code — your base URL. Your existing OpenAI key stays the same. Nothing else changes." },
            ].map((f, i) => (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "28px",
                boxShadow: `0 1px 3px ${C.text}06`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: C.primarySoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 18, color: C.primary,
                }}>
                  <f.icon />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</div>
                <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" style={{ padding: "110px 32px", background: C.bgSoft, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 60px" }}>
            <SectionTag>How it works</SectionTag>
            <SectionTitle>Live in minutes, not weeks</SectionTitle>
            <SectionSub>Four steps from signup to savings.</SectionSub>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {[
              { n: "01", tag: "Sign up", title: "Create your account", desc: "Company name, plan, and you're in. No credit card needed to start." },
              { n: "02", tag: "Add your team", title: "Set budgets per person", desc: "Add employees, set daily spend caps. 10 seconds per person." },
              { n: "03", tag: "One line change", title: "Point to TokenGuard", desc: "Change the base URL in your code. Your OpenAI key stays as-is." },
              { n: "04", tag: "Done", title: "Watch the savings", desc: "Every call is tracked, routed, and optimized from request #1." },
            ].map((s, i) => (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "28px",
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: C.primary,
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  letterSpacing: "0.06em", marginBottom: 14,
                }}>{s.n} · {s.tag.toUpperCase()}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8, letterSpacing: "-0.01em" }}>{s.title}</div>
                <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{ padding: "110px 32px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 60px" }}>
            <SectionTag>Pricing</SectionTag>
            <SectionTitle>Simple, transparent pricing</SectionTitle>
            <SectionSub>Pay one flat fee. We save you multiples of that every month.</SectionSub>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>
            {PLANS.map(p => {
              const isPopular = !!p.popular;
              return (
                <div key={p.id} style={{
                  background: isPopular ? C.bgDark : C.bgCard,
                  border: `1px solid ${isPopular ? C.bgDark : C.border}`,
                  color: isPopular ? C.textOnDark : C.text,
                  borderRadius: 20, padding: "36px 30px", position: "relative",
                  display: "flex", flexDirection: "column",
                  transform: isPopular ? "translateY(-12px)" : "none",
                  boxShadow: isPopular
                    ? `0 30px 80px -20px ${C.primary}40, 0 12px 36px -12px ${C.text}25`
                    : `0 2px 6px ${C.text}08`,
                }}>
                  {isPopular && (
                    <div style={{
                      position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                      background: `linear-gradient(90deg, ${C.primary}, ${C.sky})`,
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      padding: "6px 14px", borderRadius: 100, letterSpacing: "0.08em",
                      boxShadow: `0 8px 20px -4px ${C.primary}60`,
                    }}>MOST POPULAR</div>
                  )}
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: isPopular ? C.sky : C.primary,
                    letterSpacing: "0.08em", marginBottom: 10,
                  }}>{p.name.toUpperCase()}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em" }}>${p.price}</span>
                    <span style={{ fontSize: 16, color: isPopular ? C.textMutedOnDark : C.textMuted }}>/mo</span>
                  </div>
                  <div style={{ fontSize: 14, color: isPopular ? C.textMutedOnDark : C.textMuted, marginBottom: 24 }}>{p.seats}</div>
                  <button
                    onClick={() => handleCheckout(p.id)}
                    disabled={checkoutLoading === p.id}
                    style={{
                      ...(isPopular
                        ? { background: "#fff", color: C.bgDark }
                        : { background: C.primary, color: "#fff" }),
                      border: "none", borderRadius: 12,
                      padding: "14px 0", fontSize: 15, fontWeight: 700,
                      cursor: "pointer", width: "100%", marginBottom: 28,
                      opacity: checkoutLoading === p.id ? 0.7 : 1,
                    }}>
                    {checkoutLoading === p.id ? "Loading…" : "Get started"}
                  </button>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {p.highlights.map((h, j) => {
                      const isHeader = h.endsWith("plus:");
                      return (
                        <div key={j} style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          fontSize: 14,
                          color: isHeader
                            ? (isPopular ? C.textMutedOnDark : C.textDim)
                            : (isPopular ? C.textOnDark : C.textMuted),
                          fontWeight: isHeader ? 600 : 400,
                        }}>
                          {!isHeader && <CheckIcon color={isPopular ? C.sky : C.primary} />}
                          <span>{h}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ AUTH / SECURITY ═══ */}
      <section style={{ padding: "110px 32px", background: C.bgSoft, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 60px" }}>
            <SectionTag>Authentication & payments</SectionTag>
            <SectionTitle>Secure by default</SectionTitle>
            <SectionSub>
              Sign in with your existing Google or Microsoft account. Payments handled by Stripe — we never see your card.
            </SectionSub>
          </div>

          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 24, padding: "44px",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center",
            boxShadow: `0 10px 40px -12px ${C.text}10`,
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 6, letterSpacing: "-0.02em" }}>Sign in to TokenGuard</div>
              <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 24 }}>Choose your preferred login method</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
                <BadgeTag color={C.green}>Supabase Auth</BadgeTag>
                <BadgeTag color={C.purple}>Stripe Payments</BadgeTag>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/signin?provider=google" style={oauthBtn()}>
                  <GoogleIcon />
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Continue with Google</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Sign in with your Google Workspace account</div>
                  </div>
                  <ArrowIcon />
                </Link>
                <Link href="/signin?provider=azure" style={oauthBtn()}>
                  <MicrosoftIcon />
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Continue with Microsoft</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Sign in with your Microsoft 365 account</div>
                  </div>
                  <ArrowIcon />
                </Link>
              </div>
            </div>
            <div style={{
              background: `linear-gradient(135deg, ${C.bgDark}, ${C.bgDarkSoft})`,
              color: C.textOnDark,
              borderRadius: 18, padding: 32,
            }}>
              <div style={{ fontSize: 12, color: C.sky, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 14 }}>
                Secure payments
              </div>
              <div style={{ fontSize: 16, lineHeight: 1.7, color: "#E8EEFA" }}>
                Payments secured by <span style={{
                  display: "inline-block", padding: "3px 10px", background: "#635BFF",
                  color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13, margin: "0 4px",
                }}>Stripe</span> — we never store your card details. After payment you'll be redirected to complete your team setup.
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 24, paddingTop: 20, borderTop: `1px solid #ffffff20` }}>
                <TrustItem label="PCI-DSS compliant" />
                <TrustItem label="SOC 2 Type II" />
                <TrustItem label="256-bit TLS" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: "110px 32px", background: C.bg }}>
        <div style={{
          maxWidth: 1000, margin: "0 auto", position: "relative",
          background: `linear-gradient(135deg, ${C.bgDark} 0%, ${C.primary} 120%)`,
          borderRadius: 28, padding: "80px 48px", textAlign: "center",
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
              fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em",
              margin: "0 0 18px", lineHeight: 1.1,
            }}>
              Stop the surprise bills for good
            </h2>
            <p style={{
              fontSize: 18, color: "#C9D9F2", lineHeight: 1.6,
              maxWidth: 620, margin: "0 auto 36px",
            }}>
              Full availability in 2 weeks. Join the waitlist for early access or request a free demo for one employee — no commitment.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup" style={{
                background: "#fff", color: C.bgDark, border: "none", borderRadius: 12,
                padding: "16px 32px", fontSize: 16, fontWeight: 700,
                textDecoration: "none",
              }}>
                Join the waitlist →
              </Link>
              <a href="mailto:abel@cypresspartners.com?subject=TokenGuard Demo Request" style={{
                background: "transparent", color: "#fff", border: "1px solid #ffffff40", borderRadius: 12,
                padding: "16px 32px", fontSize: 16, fontWeight: 600,
                textDecoration: "none",
              }}>
                Request a demo
              </a>
            </div>
            <div style={{ fontSize: 13, color: "#8FA5C9", marginTop: 28 }}>
              Questions? Email <a href="mailto:abel@cypresspartners.com" style={{ color: "#fff", textDecoration: "none", fontWeight: 600 }}>abel@cypresspartners.com</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "40px 32px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LogoMark size={28} />
            <div style={{ fontSize: 13, color: C.textDim }}>© 2026 TokenGuard by Cypress Partners</div>
          </div>
          <div style={{ display: "flex", gap: 28, fontSize: 13 }}>
            <a href="/privacy" style={footerLink}>Privacy</a>
            <a href="/terms" style={footerLink}>Terms</a>
            <a href="/docs" style={footerLink}>Docs</a>
            <a href="mailto:abel@cypresspartners.com" style={footerLink}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Shared UI ─── */

const navLink: React.CSSProperties = {
  color: C.textMuted, fontSize: 14, fontWeight: 500, textDecoration: "none",
};

const footerLink: React.CSSProperties = { ...navLink, fontSize: 13, color: C.textDim };

function primaryBtn(): React.CSSProperties {
  return {
    background: C.primary, color: "#fff", border: "none", borderRadius: 10,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
    textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 4px 14px -4px ${C.primary}60`,
  };
}

function ghostBtn(): React.CSSProperties {
  return {
    background: "#fff", color: C.text, border: `1px solid ${C.borderStrong}`, borderRadius: 10,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
    textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
}

function oauthBtn(): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 14,
    background: C.bgCard, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "14px 16px", textDecoration: "none", cursor: "pointer",
  };
}

function pill(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "7px 14px", background: "#fff", border: `1px solid ${color}40`,
    borderRadius: 100, fontSize: 13, color, fontWeight: 600,
    boxShadow: `0 1px 3px ${color}15`,
  };
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, color: C.primary, letterSpacing: "0.14em",
      textTransform: "uppercase", fontWeight: 700, marginBottom: 14,
    }}>{children}</div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em",
      color: C.text, margin: "0 0 14px", lineHeight: 1.15,
    }}>{children}</h2>
  );
}

function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 17, color: C.textMuted, lineHeight: 1.6,
      margin: 0,
    }}>{children}</p>
  );
}

function BadgeTag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", background: `${color}15`, border: `1px solid ${color}35`,
      borderRadius: 100, fontSize: 11, color, fontWeight: 600, letterSpacing: "0.04em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {children}
    </span>
  );
}

function TrustItem({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 12, color: "#B4C5DE", display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: "#34D399" }}>✓</span>
      {label}
    </div>
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
function KeyIcon() { return <Icon><circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></Icon>; }
function ZapIcon() { return <Icon><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>; }
function UsersIcon() { return <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>; }
function ChartIcon() { return <Icon><path d="M3 3v18h18"/><path d="m7 16 4-8 4 4 6-8"/></Icon>; }
function RocketIcon() { return <Icon><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></Icon>; }
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.7 7.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.5-5.2L31.3 34c-2 1.4-4.5 2.3-7.3 2.3-5.2 0-9.6-3.1-11.3-7.5L6.3 33.7C9.6 41 16.2 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.1 5.1C41.9 35 45 29.9 45 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="12" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="12" width="9" height="9" fill="#00A4EF"/>
      <rect x="12" y="12" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

