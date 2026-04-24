import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.ALERT_FROM_EMAIL || "alerts@abelprojects.xyz";

interface AlertPayload {
  tenant_id: string;
  employee_name: string;
  budget_usd: number;
  spent_usd: number;
  percentage: number;
  threshold: 70 | 90 | 100;
  slack_webhook_url?: string;
  alert_email?: string;
  company: string;
}

function getThresholdMessage(payload: AlertPayload) {
  const remaining = (payload.budget_usd - payload.spent_usd).toFixed(4);
  const spent = payload.spent_usd.toFixed(4);
  const budget = payload.budget_usd.toFixed(2);

  if (payload.threshold === 100) {
    return {
      emoji: "🔴",
      subject: `${payload.employee_name} has been blocked — daily budget reached`,
      headline: `${payload.employee_name} hit 100% of their daily budget and has been blocked.`,
      detail: `They spent $${spent} of their $${budget} daily limit. Access will resume tomorrow.`,
      color: "#EF4444",
    };
  }
  if (payload.threshold === 90) {
    return {
      emoji: "🟠",
      subject: `${payload.employee_name} is at 90% of their daily budget`,
      headline: `${payload.employee_name} has used 90% of their daily budget.`,
      detail: `They've spent $${spent} of $${budget}. Only $${remaining} remaining today.`,
      color: "#F59E0B",
    };
  }
  return {
    emoji: "🟡",
    subject: `${payload.employee_name} is at 70% of their daily budget`,
    headline: `${payload.employee_name} has used 70% of their daily budget.`,
    detail: `They've spent $${spent} of $${budget}. $${remaining} remaining today.`,
    color: "#F59E0B",
  };
}

async function sendSlackAlert(webhookUrl: string, payload: AlertPayload, msg: ReturnType<typeof getThresholdMessage>) {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${msg.emoji} TokenGuard Budget Alert — ${payload.company}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${msg.headline}*\n${msg.detail}`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Tenant ID: ${payload.tenant_id} • <https://app.tokenguard.io/dashboard|View Dashboard>`,
            },
          ],
        },
      ],
    }),
  });
}

async function sendEmailAlert(email: string, payload: AlertPayload, msg: ReturnType<typeof getThresholdMessage>) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${msg.emoji} ${msg.subject}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <span style="font-size: 32px;">🛡️</span>
          <div>
            <div style="font-size: 20px; font-weight: 800; color: #0D1220;">TokenGuard</div>
            <div style="font-size: 12px; color: #6B7FA3;">AI COST CONTROL</div>
          </div>
        </div>
        <div style="background: #F8FAFC; border-left: 4px solid ${msg.color}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 18px; font-weight: 700; color: #0D1220; margin-bottom: 8px;">${msg.headline}</div>
          <div style="font-size: 15px; color: #6B7FA3;">${msg.detail}</div>
        </div>
        <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E2E8F0;">
            <span style="color: #6B7FA3; font-size: 13px;">Employee</span>
            <span style="font-weight: 600; font-size: 13px;">${payload.employee_name}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E2E8F0;">
            <span style="color: #6B7FA3; font-size: 13px;">Daily Budget</span>
            <span style="font-weight: 600; font-size: 13px;">$${payload.budget_usd.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E2E8F0;">
            <span style="color: #6B7FA3; font-size: 13px;">Amount Spent</span>
            <span style="font-weight: 600; font-size: 13px;">$${payload.spent_usd.toFixed(4)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0;">
            <span style="color: #6B7FA3; font-size: 13px;">Usage</span>
            <span style="font-weight: 700; font-size: 13px; color: ${msg.color};">${payload.percentage}%</span>
          </div>
        </div>
        <a href="https://app.tokenguard.io/dashboard" style="display: block; background: #4F8EF7; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          View Dashboard →
        </a>
        <div style="margin-top: 24px; font-size: 12px; color: #6B7FA3; text-align: center;">
          TokenGuard · AI Cost Control · <a href="mailto:support@tokenguard.io" style="color: #4F8EF7;">support@tokenguard.io</a>
        </div>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload: AlertPayload = await req.json();

    if (!payload.tenant_id || !payload.employee_name || !payload.threshold) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const msg = getThresholdMessage(payload);
    const results: string[] = [];

    if (payload.slack_webhook_url) {
      await sendSlackAlert(payload.slack_webhook_url, payload, msg);
      results.push("slack");
    }

    if (payload.alert_email) {
      await sendEmailAlert(payload.alert_email, payload, msg);
      results.push("email");
    }

    return NextResponse.json({ success: true, sent_via: results });
  } catch (err) {
    console.error("[alerts]", err);
    return NextResponse.json({ error: "Failed to send alert" }, { status: 500 });
  }
}
