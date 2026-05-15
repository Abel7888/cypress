"use client";
import React from "react";

export function UseCaseCards() {
  const [active, setActive] = React.useState<number | null>(null);

  const cases: {
    icon: string;
    title: string;
    industry: string;
    pain: string;
    scenario: string;
    features: string[];
    integration: string;
    saving: string;
  }[] = [
    {
      icon: "🤖",
      title: "AI Support Agent",
      industry: "Customer support",
      pain: "Your bot calls GPT-4o on every ticket. 60% don't need it.",
      scenario: "A support agent handles thousands of tickets a day. Every call — including 'What are your hours?' — hits your most expensive model. You don't notice until the monthly invoice arrives.",
      features: [
        "Smart routing drops simple tickets to efficient models automatically",
        "Per-agent daily and monthly budget caps block runaway spend in real time",
        "Dashboard shows cost per agent, per model, per day",
      ],
      integration: "Swap your OpenAI base URL. All daily calls are now routed, tracked, and capped.",
      saving: "Up to 70% cost reduction on high-volume support agents",
    },
    {
      icon: "⚖️",
      title: "Legal AI / Contract Review",
      industry: "LegalTech",
      pain: "500K tokens per contract review. No record of who ran what.",
      scenario: "Your contract review agent processes dozens of documents a day at 500K tokens each. Your compliance team needs an audit trail before approving AI in production. You have neither the logs nor the cost breakdown by matter.",
      features: [
        "Every call logged with timestamp, model, token count, and exact cost",
        "Per-asset budget caps prevent any agent from exceeding spend limits",
        "Full audit log exportable for legal discovery and compliance reporting",
      ],
      integration: "One API key swap → every contract review is logged, budgeted, and audit-ready.",
      saving: "Compliance sign-off and cost visibility in a single integration",
    },
    {
      icon: "💻",
      title: "AI Coding Tools",
      industry: "Developer tools",
      pain: "Autocomplete is hitting Claude Opus. It should be hitting Haiku.",
      scenario: "Your IDE plugin calls your premium model for every keystroke, every autocomplete, every inline comment. It's overkill for 80% of those operations — and it's your most frequent call. You're paying 20x more than necessary.",
      features: [
        "Routing classifies autocomplete vs deep generation automatically",
        "Complex architecture and code generation stays on premium models",
        "Per-feature cost breakdown shows which part of your product costs most",
      ],
      integration: "Replace base URL → routing immediately separates autocomplete from generation.",
      saving: "Up to 94% cost reduction on autocomplete and simple code ops",
    },
    {
      icon: "🏦",
      title: "Fintech / Fraud Detection",
      industry: "Financial services",
      pain: "One rogue agent can run $5,000 in API calls before anyone notices.",
      scenario: "Your fraud detection agent processes transactions in real time. A misconfiguration, a loop, an edge case — and it starts calling your premium model thousands of times per minute. No provider sends a real-time alert. You see the damage on your next invoice.",
      features: [
        "Hard budget cap blocks the agent the moment the daily limit is hit — not after",
        "Slack and email alerts fire at 70%, 90%, and 100% of daily and monthly budget",
        "Full per-agent call log for compliance and financial audit",
      ],
      integration: "Set a $50/day cap on your fraud agent. If it ever loops — it stops automatically.",
      saving: "Real-time blocking that no AI provider offers natively",
    },
    {
      icon: "📋",
      title: "AI Consultants & Agencies",
      industry: "AI services",
      pain: "Your client asks what AI cost this month. You have no answer.",
      scenario: "You built AI features for multiple clients across OpenAI and Anthropic. You manage the keys. At month end you have one combined invoice and zero per-client breakdown. Your client wants a cost report. You can't produce one.",
      features: [
        "Per-asset keys mean every client's calls are tracked and billed separately",
        "Cost report shows each client exactly what their AI investment cost and saved",
        "Routing optimization becomes a value-add service you offer clients",
      ],
      integration: "One Cypress Vision account. One key per client asset. Instant per-client reports.",
      saving: "Turn AI cost management into a service you charge clients for",
    },
    {
      icon: "🔧",
      title: "Internal AI Tools",
      industry: "Engineering teams",
      pain: "4 internal bots, one surprise bill, no idea which one caused it.",
      scenario: "Your team built a document summarizer, an internal Q&A bot, a data pipeline assistant, and a Slack integration. All on the same API key. One invoice per month. No breakdown. The CFO asks what each tool costs. You have no answer.",
      features: [
        "Each tool gets its own asset key with its own spend line in the dashboard",
        "Routing cuts costs on simple internal queries automatically",
        "Real-time overview shows total spend by tool, by day, right now",
      ],
      integration: "Give each internal tool its own asset key — per-tool visibility starts immediately.",
      saving: "Answer 'what does each tool cost?' in real time, not next month",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
      {cases.map((c, i) => (
        <div
          key={i}
          onClick={() => setActive(active === i ? null : i)}
          style={{
            background: active === i ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
            border: active === i ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "22px",
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: "rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", marginBottom: 2, lineHeight: 1.3 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.industry}</div>
            </div>
          </div>

          {/* Pain line — always visible */}
          <div style={{
            fontSize: 13, color: "#94A3B8", lineHeight: 1.6,
            paddingBottom: active === i ? 14 : 0,
            borderBottom: active === i ? "1px solid rgba(255,255,255,0.08)" : "none",
            marginBottom: active === i ? 16 : 0,
          }}>
            {c.pain}
          </div>

          {/* Expanded content */}
          {active === i && (
            <div>
              {/* Scenario */}
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 16 }}>
                {c.scenario}
              </div>

              {/* Features */}
              <div style={{ marginBottom: 14 }}>
                {c.features.map((f, fi) => (
                  <div key={fi} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(99,102,241,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: "#A5B4FC", marginTop: 2,
                    }}>✓</div>
                    <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5 }}>{f}</div>
                  </div>
                ))}
              </div>

              {/* Integration pill */}
              <div style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: 8, padding: "9px 14px", marginBottom: 10,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#818CF8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>How to connect</div>
                <div style={{ fontSize: 12, color: "#C7D2FE", lineHeight: 1.6 }}>{c.integration}</div>
              </div>

              {/* Saving pill */}
              <div style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 8, padding: "8px 14px",
              }}>
                <div style={{ fontSize: 12, color: "#6EE7B7", fontWeight: 500, lineHeight: 1.5 }}>{c.saving}</div>
              </div>
            </div>
          )}

          {/* Collapse/expand hint */}
          <div style={{ marginTop: active === i ? 14 : 10, fontSize: 11, color: "#334155", userSelect: "none" }}>
            {active === i ? "▲ collapse" : "▼ see how it works"}
          </div>
        </div>
      ))}
    </div>
  );
}
