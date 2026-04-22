"use client";
import React from "react";

// High-end light theme — white/blue palette.
export const BRAND = {
  // Surfaces
  bg: "#FFFFFF",
  bgSoft: "#F7F9FC",
  bgTint: "#EEF3FB",
  bgCard: "#FFFFFF",
  bgAccent: "#F1F5FB",
  bgDark: "#0A1F3D",       // used only for inverted hero/CTA blocks
  bgDarkSoft: "#112A4F",

  // Borders
  border: "#E3EAF3",
  borderStrong: "#D3DDEB",

  // Brand blues
  primary: "#2563EB",      // royal blue
  primaryHover: "#1D4FD7",
  primarySoft: "#DBE7FE",
  primaryDark: "#0A1F3D",
  accent: "#3B82F6",
  sky: "#0EA5E9",

  // Support
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  purple: "#6366F1",

  // Text (on light bg)
  text: "#0A1F3D",
  textMuted: "#4B6584",
  textDim: "#7A8CA5",
  textFaint: "#A7B5C9",
  textOnDark: "#F1F6FF",
  textMutedOnDark: "#B4C5DE",
};

/** Refined logo mark — a stylized "C" shield with an upward notch suggesting growth/savings. */
export function LogoMark({ size = 36 }: { size?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="Cypress TokenGuard">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id={`g2-${id}`} x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Shield */}
      <path
        d="M20 2.5 L34 7 V19.5 C34 28 28 34.5 20 37.5 C12 34.5 6 28 6 19.5 V7 Z"
        fill={`url(#g-${id})`}
      />
      <path
        d="M20 2.5 L34 7 V19.5 C34 28 28 34.5 20 37.5 C12 34.5 6 28 6 19.5 V7 Z"
        fill={`url(#g2-${id})`}
      />
      {/* Upward chart/arrow — growth */}
      <path
        d="M13.5 23.5 L17.5 19.5 L21 22.5 L27 16"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="27" cy="16" r="1.7" fill="#FFFFFF" />
    </svg>
  );
}

export function Logo({ size = 36, dark = false }: { size?: number; dark?: boolean }) {
  const textColor = dark ? "#FFFFFF" : BRAND.text;
  const subColor = dark ? BRAND.textMutedOnDark : BRAND.textDim;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <LogoMark size={size} />
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontSize: size * 0.52, fontWeight: 700, color: textColor,
          letterSpacing: "-0.02em",
        }}>
          Cypress<span style={{ color: BRAND.primary }}> TokenGuard</span>
        </div>
        <div style={{
          fontSize: size * 0.27, color: subColor,
          letterSpacing: "0.14em", marginTop: 4, fontWeight: 600,
        }}>
          AI COST GOVERNANCE
        </div>
      </div>
    </div>
  );
}

export function LogoMini({ size = 32 }: { size?: number }) {
  return <LogoMark size={size} />;
}
