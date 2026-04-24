import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PROXY_URL = process.env.NEXT_PUBLIC_API_BASE || "";
const ADMIN_KEY = process.env.TOKENGUARD_SECRET_KEY || "";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

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

      // Create Supabase auth user so they can sign in
      if (result.tenant_id && data.email) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const tempPassword = "TG-" + Math.random().toString(36).slice(2, 10) + "!";
          const { error: authError } = await supabase.auth.admin.createUser({
            email: data.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              tenant_id: result.tenant_id,
              company: data.company,
            },
          });
          if (authError) {
            console.error("[onboarding] Supabase user creation failed:", authError.message);
          }
          // Send password reset email so they set their own password
          await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          });
          return NextResponse.json({ ...result, auth_email_sent: !authError });
        }
      }

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
          email: data.email || "",
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
