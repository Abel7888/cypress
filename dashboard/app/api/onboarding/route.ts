import { NextRequest, NextResponse } from "next/server";

const PROXY_URL = process.env.NEXT_PUBLIC_API_BASE || "";
const ADMIN_KEY = process.env.TOKENGUARD_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tenantId, ...data } = body;

    const headers = {
      Authorization: `Bearer ${ADMIN_KEY}`,
      "Content-Type": "application/json",
    };

    // Create tenant
    if (action === "create_tenant") {
      const res = await fetch(`${PROXY_URL}/api/tenants`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          name: data.company, 
          plan: "starter",
          slack_webhook: data.slack_webhook || "",
          alert_email: data.alert_email || "",
        }),
      });
      const result = await res.json();
      return NextResponse.json(result);
    }

    // Create user/employee
    if (action === "create_user") {
      const res = await fetch(`${PROXY_URL}/api/tenants/${tenantId}/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: data.name,
          role: data.role,
          budget_usd: data.budget_usd,
        }),
      });
      const result = await res.json();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("[onboarding]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
