"use client";
import { useRouter } from "next/navigation";
import useTrialStatus from "@/hooks/useTrialStatus";
import { BRAND, LogoMark } from "@/components/brand";

export default function TrialBanner() {
  const router = useRouter();
  const { isLoading, isTrial, isExpired, daysLeft } = useTrialStatus();

  // Don't render anything while loading or if not a trial user
  if (isLoading || !isTrial) return null;

  // ─── EXPIRED: Full-page overlay ─────────────────────────────────────────
  if (isExpired) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(10, 31, 61, 0.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: 48,
            maxWidth: 440,
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <LogoMark size={40} />
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: BRAND.text,
              margin: "0 0 8px",
            }}
          >
            Your Trial Has Ended
          </h2>
          <p
            style={{
              fontSize: 15,
              color: BRAND.textMuted,
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            You had full access for 7 days. Ready to keep the momentum going?
          </p>
          <button
            type="button"
            onClick={() => router.push("/settings?tab=billing")}
            style={{
              background: BRAND.primary,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              width: "100%",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Upgrade to Continue →
          </button>
          <a
            href="mailto:support@tokenguard.io"
            style={{
              fontSize: 12,
              color: BRAND.textMuted,
              marginTop: 16,
              display: "block",
              textDecoration: "none",
            }}
          >
            Questions? Contact us
          </a>
        </div>
      </div>
    );
  }

  // ─── ACTIVE TRIAL: Slim top banner ─────────────────────────────────────
  return (
    <div
      style={{
        background: BRAND.primarySoft,
        borderBottom: `1px solid ${BRAND.primary}`,
        padding: "10px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.primary }}>
        🎉 Free Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
      </div>
      <button
        type="button"
        onClick={() => router.push("/settings?tab=billing")}
        style={{
          background: BRAND.primary,
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          padding: "6px 16px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Upgrade Now →
      </button>
    </div>
  );
}
