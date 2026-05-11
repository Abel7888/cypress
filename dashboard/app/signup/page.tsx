"use client";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BRAND as C, Logo, LogoMark } from "@/components/brand";
import { createClient, SUPABASE_CONFIGURED } from "@/lib/supabase";

const PLAN_INFO: Record<string, { name: string; price: number; seats: string }> = {
  starter: { name: "Starter", price: 199, seats: "Up to 10 employees" },
  growth: { name: "Growth", price: 399, seats: "Up to 25 employees" },
  business: { name: "Business", price: 799, seats: "Up to 75 employees" },
};

function SignUpInner() {
  const params = useSearchParams();
  const preselected = params.get("plan") || "growth";
  const [plan, setPlan] = useState(preselected in PLAN_INFO ? preselected : "growth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showTrialForm, setShowTrialForm] = useState(false);

  const CALENDLY_URL = "https://calendly.com/abelassefa19/cypress-tokenguard-premium";

  const handleSubmit = async (e: React.FormEvent) => {
    if (plan === "growth" || plan === "business") {
      window.open(CALENDLY_URL, "_blank");
      return;
    }
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1) Create Supabase account if configured
    if (SUPABASE_CONFIGURED) {
      try {
        const supabase = createClient();
        const { error: sErr } = await supabase.auth.signUp({
          email, password,
          options: { data: { company }, emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (sErr) {
          setError(sErr.message);
          setLoading(false);
          return;
        }
      } catch (e: any) {
        setError(e?.message || "Signup failed");
        setLoading(false);
        return;
      }
    }

    // 2) Start Stripe checkout for the selected plan
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email, company }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      // Fallback — if Stripe not configured, go straight to onboarding
      setNotice("Stripe not configured yet. Proceeding to onboarding (demo mode)...");
      setTimeout(() => (window.location.href = "/onboarding"), 800);
    } catch {
      setNotice("Couldn't reach payments — proceeding to onboarding.");
      setTimeout(() => (window.location.href = "/onboarding"), 800);
    }
    setLoading(false);
  };

  const selected = PLAN_INFO[plan];

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      display: "flex", padding: "32px 24px 60px",
      alignItems: "flex-start", justifyContent: "center",
      fontFamily: "system-ui, sans-serif", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 960 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <Logo size={36} />
        </Link>

        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20,
          padding: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48,
        }}>
          {/* LEFT: Signup form */}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              Create your account
            </h1>
            <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 24px" }}>
              Sign up and start your onboarding in under 60 seconds.
            </p>

            {notice && (
              <div style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}40`, color: C.amber, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>COMPANY NAME</label>
                <input required value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>WORK EMAIL</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@acme.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PASSWORD</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} style={inputStyle} />
              </div>

              {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}

              <button type="submit" disabled={loading} style={{
                background: C.primary, color: "#fff", border: "none",
                borderRadius: 10, padding: "14px 0", fontSize: 15, fontWeight: 700,
                cursor: "pointer", marginTop: 10, opacity: loading ? 0.7 : 1,
              }}>
                {loading ? "Creating account..." : `Continue to payment — $${selected.price}/mo →`}
              </button>

              <div style={{ fontSize: 12, color: C.textFaint, textAlign: "center", marginTop: 4 }}>
                You'll be redirected to Stripe to complete your subscription.
              </div>
            </form>

            <div style={{ textAlign: "center", fontSize: 13, color: C.textMuted, marginTop: 24 }}>
              Already have an account?{" "}
              <Link href="/signin" style={{ color: C.primary, fontWeight: 600, textDecoration: "none" }}>
                Sign in
              </Link>
            </div>
          </div>

          {/* RIGHT: Plan selector */}
          <div>
            <div style={{ fontSize: 12, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 14 }}>
              Choose your plan
            </div>

            {/* â”€â”€â”€â”€â”€ FREE TRIAL CARD â”€â”€â”€â”€â”€ */}
            <div style={{
              background: C.bgTint, border: `2px solid ${C.primary}`, borderRadius: 12,
              padding: "16px 18px", marginBottom: 14,
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{
                display: "inline-block", alignSelf: "flex-start",
                background: C.primarySoft, color: C.primary,
                fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                padding: "4px 10px", borderRadius: 999,
              }}>
                No Credit Card
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Free Trial</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                  7 days · 1 seat · full dashboard access
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrialForm(true)}
                style={{
                  background: C.primary, color: "#fff", border: "none",
                  borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", width: "100%",
                }}
              >
                Request Free Trial Access
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {Object.entries(PLAN_INFO).map(([key, p]) => (
                <label key={key} style={{
                  display: "block", cursor: "pointer",
                  background: plan === key ? C.bgAccent : C.bgAccent,
                  border: `2px solid ${plan === key ? C.primary : C.border}`,
                  borderRadius: 12, padding: "14px 16px",
                }}>
                  <input type="radio" checked={plan === key} onChange={() => setPlan(key)} style={{ display: "none" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{p.seats}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: plan === key ? C.primary : C.text }}>
                      ${p.price}<span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>/mo</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ background: C.bgAccent, borderRadius: 12, padding: "18px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                What's included
              </div>
              {[
                "Real-time budget blocking",
                "Employee key management",
                "Intelligent ML routing",
                "Per-employee visibility",
                "Monthly ROI report",
                "Cancel anytime",
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: C.textMuted, padding: "4px 0" }}>
                  <span style={{ color: C.green }}>&#10003;</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, fontSize: 12, color: C.textFaint, lineHeight: 1.6 }}>
              Payments handled by <span style={{ color: "#635BFF", fontWeight: 600 }}>Stripe</span>. We never store your card.
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: C.textFaint, marginTop: 24 }}>
          <Link href="/" style={{ color: C.textFaint, textDecoration: "none" }}>← Back to home</Link>
        </div>
      </div>

      {showTrialForm && <TrialModal onClose={() => setShowTrialForm(false)} />}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TRIAL MODAL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function TrialModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  // Step 2
  const [teamSize, setTeamSize] = useState("");
  const [currentTracking, setCurrentTracking] = useState("");
  const [hopingFor, setHopingFor] = useState("");
  // Step 3
  const [agreed, setAgreed] = useState(false);

  const step1Valid = name.trim() && email.trim() && company.trim();
  const step2Valid = teamSize && currentTracking;

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xgodkbdp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name, email, company, teamSize, currentTracking, hopingFor,
          source: "trial-request",
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError("Something went wrong. Please try again or email support@tokenguard.io.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, zIndex: 1000,
      }}
    >
      <div
        className="tg-trial-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFFFFF", borderRadius: 16, padding: 32,
          maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: 8,
            background: "transparent", border: "none",
            fontSize: 22, color: C.textMuted, cursor: "pointer", lineHeight: 1,
          }}
        >Ã—</button>

        {submitted ? (
          <SuccessView email={email} onHome={() => router.push("/")} />
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <LogoMark size={32} />
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, textAlign: "center" }}>
              Request Trial Access
            </h2>
            <p style={{ margin: "6px 0 20px", fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 1.5 }}>
              Tell us a little about your team and we'll get you set up within 24 hours.
            </p>

            {/* Step indicator */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 22 }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: n <= step ? C.primary : C.border,
                  transition: "background 0.15s",
                }} />
              ))}
            </div>

            {/* Step content */}
            {step === 1 && (
              <>
                <SectionTitle>About You</SectionTitle>
                <Field label="Full Name">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" style={trialInputStyle} />
                </Field>
                <Field label="Work Email">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={trialInputStyle} />
                </Field>
                <Field label="Company Name">
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" style={trialInputStyle} />
                </Field>
                <NavRow>
                  <span />
                  <button
                    type="button"
                    disabled={!step1Valid}
                    onClick={() => setStep(2)}
                    style={{ ...primaryBtnStyle, opacity: step1Valid ? 1 : 0.5, cursor: step1Valid ? "pointer" : "not-allowed" }}
                  >
                    Next →
                  </button>
                </NavRow>
              </>
            )}

            {step === 2 && (
              <>
                <SectionTitle>Your Team</SectionTitle>
                <Field label="Team Size">
                  <select value={teamSize} onChange={e => setTeamSize(e.target.value)} style={trialInputStyle}>
                    <option value="">Select team size…</option>
                    <option value="Just me">Just me</option>
                    <option value="2–10">2–10</option>
                    <option value="11–50">11–50</option>
                    <option value="51–200">51–200</option>
                    <option value="200+">200+</option>
                  </select>
                </Field>
                <Field label="How is your team currently managing AI costs?">
                  <select value={currentTracking} onChange={e => setCurrentTracking(e.target.value)} style={trialInputStyle}>
                    <option value="">Select an option…</option>
                    <option value="We're not — it's a problem">We're not — it's a problem</option>
                    <option value="Spreadsheets / manual tracking">Spreadsheets / manual tracking</option>
                    <option value="Another tool">Another tool</option>
                    <option value="Just getting started with AI">Just getting started with AI</option>
                  </select>
                </Field>
                <Field label="What are you hoping TokenGuard helps with? (optional)">
                  <textarea
                    value={hopingFor}
                    onChange={e => setHopingFor(e.target.value)}
                    rows={3}
                    placeholder="e.g. control spend, get visibility, route to cheaper models..."
                    style={{ ...trialInputStyle, resize: "vertical", fontFamily: "Inter, system-ui, sans-serif" }}
                  />
                </Field>
                <NavRow>
                  <button type="button" onClick={() => setStep(1)} style={secondaryBtnStyle}>← Back</button>
                  <button
                    type="button"
                    disabled={!step2Valid}
                    onClick={() => setStep(3)}
                    style={{ ...primaryBtnStyle, opacity: step2Valid ? 1 : 0.5, cursor: step2Valid ? "pointer" : "not-allowed" }}
                  >
                    Next →
                  </button>
                </NavRow>
              </>
            )}

            {step === 3 && (
              <>
                <SectionTitle>Review & Submit</SectionTitle>
                <div style={{
                  background: C.bgTint, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.7,
                }}>
                  <SummaryRow label="Name" value={name} />
                  <SummaryRow label="Email" value={email} />
                  <SummaryRow label="Company" value={company} />
                  <SummaryRow label="Team Size" value={teamSize} />
                </div>
                <label style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  fontSize: 13, color: C.text, cursor: "pointer", marginBottom: 16, lineHeight: 1.5,
                }}>
                  <input
                    type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop: 3, accentColor: C.primary }}
                  />
                  <span>I agree to be contacted by the TokenGuard team</span>
                </label>

                {submitError && (
                  <div style={{
                    background: `${C.red}15`, color: C.red, border: `1px solid ${C.red}40`,
                    borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 12,
                  }}>{submitError}</div>
                )}

                <NavRow>
                  <button type="button" onClick={() => setStep(2)} style={secondaryBtnStyle}>← Back</button>
                  <button
                    type="button"
                    disabled={!agreed || submitting}
                    onClick={handleSubmit}
                    style={{ ...primaryBtnStyle, opacity: (!agreed || submitting) ? 0.5 : 1, cursor: (!agreed || submitting) ? "not-allowed" : "pointer" }}
                  >
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>
                </NavRow>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        .tg-trial-modal input:focus,
        .tg-trial-modal select:focus,
        .tg-trial-modal textarea:focus {
          border-color: ${C.primary} !important;
        }
      `}</style>
    </div>
  );
}

function SuccessView({ email, onHome }: { email: string; onHome: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: `${C.green}18`, color: C.green,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "8px auto 16px", fontSize: 26, fontWeight: 700,
      }}>✓</div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>
        Request Received! ðŸŽ‰
      </h2>
      <p style={{ margin: "10px 0 22px", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
        We'll review your request and send your trial credentials within 24 hours.
        Check your inbox at <strong style={{ color: C.text }}>{email}</strong>.
      </p>
      <button type="button" onClick={onHome} style={{ ...primaryBtnStyle, width: "100%" }}>
        Back to Home
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: C.primary,
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14,
    }}>{children}</div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={trialLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function NavRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 18 }}>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <span style={{ color: C.text, fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}

const trialInputStyle: React.CSSProperties = {
  width: "100%", border: `1px solid ${C.border}`, borderRadius: 8,
  padding: "10px 12px", fontSize: 14, fontFamily: "Inter, system-ui, sans-serif",
  color: C.text, background: "#fff", outline: "none", boxSizing: "border-box",
};

const trialLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: C.textMuted,
  marginBottom: 4, display: "block",
};

const primaryBtnStyle: React.CSSProperties = {
  background: C.primary, color: "#fff", border: "none",
  borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "transparent", color: C.textMuted, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div style={{ background: C.bg, minHeight: "100vh" }} />}>
      <SignUpInner />
    </Suspense>
  );
}

const inputStyle: React.CSSProperties = {
  background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 10,
  color: C.text, fontSize: 14, padding: "12px 14px", outline: "none",
  width: "100%", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, color: C.textMuted, fontWeight: 600,
  letterSpacing: "0.06em", marginBottom: 6,
};





