"use client";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BRAND as C, Logo } from "@/components/brand";
import { createClient, SUPABASE_CONFIGURED } from "@/lib/supabase";

function SignInInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const provider = params.get("provider");
    if (provider === "google" || provider === "azure") {
      handleOAuth(provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOAuth = async (provider: "google" | "azure") => {
    if (!SUPABASE_CONFIGURED) {
      setNotice("Supabase not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setError(error.message);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!SUPABASE_CONFIGURED) {
      setNotice("Auth not configured - redirecting to dashboard for demo.");
      setTimeout(() => router.push("/dashboard"), 800);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/dashboard");
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", padding: "32px 24px",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <Logo size={36} />
        </Link>

        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: "40px 36px",
        }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: "0 0 4px" }}>
            For existing customers only — sign in to access your dashboard.
          </p>
          <p style={{ fontSize: 13, color: C.textFaint, margin: "0 0 28px" }}>
            New customer? <Link href="/signup" style={{ color: C.primary, fontWeight: 600, textDecoration: "none" }}>Get started here</Link>
          </p>

          {notice && (
            <div style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}40`, color: C.amber, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
              {notice}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            <button onClick={() => handleOAuth("google")} style={oauthBtn}>
              <GoogleIcon /> <span>Continue with Google</span>
            </button>
            <button onClick={() => handleOAuth("azure")} style={oauthBtn}>
              <MicrosoftIcon /> <span>Continue with Microsoft</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <div style={{ fontSize: 11, color: C.textFaint, fontWeight: 600, letterSpacing: "0.08em" }}>OR EMAIL</div>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <form onSubmit={handleEmailSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email" placeholder="you@company.com" required
              value={email} onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password" placeholder="Password" required
              value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
            {error && <div style={{ color: C.red, fontSize: 13, padding: "4px 2px" }}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              background: C.primary, color: "#fff", border: "none",
              borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 600,
              cursor: "pointer", marginTop: 6, opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: C.textFaint, marginTop: 24 }}>
          <Link href="/" style={{ color: C.textFaint, textDecoration: "none" }}>Back to home</Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ background: C.bg, minHeight: "100vh" }} />}>
      <SignInInner />
    </Suspense>
  );
}

const inputStyle: React.CSSProperties = {
  background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 10,
  color: C.text, fontSize: 14, padding: "12px 14px", outline: "none",
  width: "100%", boxSizing: "border-box",
};

const oauthBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, justifyContent: "center",
  background: C.bgAccent, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.text,
  cursor: "pointer", width: "100%",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.7 7.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.5-5.2L31.3 34c-2 1.4-4.5 2.3-7.3 2.3-5.2 0-9.6-3.1-11.3-7.5L6.3 33.7C9.6 41 16.2 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.1 5.1C41.9 35 45 29.9 45 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="12" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="12" width="9" height="9" fill="#00A4EF"/>
      <rect x="12" y="12" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}
