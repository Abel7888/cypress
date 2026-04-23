"use client";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BRAND as C, Logo } from "@/components/brand";
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
      // Fallback â€” if Stripe not configured, go straight to onboarding
      setNotice("Stripe not configured yet. Proceeding to onboarding (demo mode)...");
      setTimeout(() => (window.location.href = "/onboarding"), 800);
    } catch {
      setNotice("Couldn't reach payments â€” proceeding to onboarding.");
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
                {loading ? "Creating account..." : `Continue to payment â€” $${selected.price}/mo â†’`}
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
                  <span style={{ color: C.green }}>âœ“</span>
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
          <Link href="/" style={{ color: C.textFaint, textDecoration: "none" }}>â† Back to home</Link>
        </div>
      </div>
    </div>
  );
}

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


