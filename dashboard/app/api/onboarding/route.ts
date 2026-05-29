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

      // Write tenant_id into Supabase user metadata so alert emails route correctly
      if (result.tenant_id && data.email) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          try {
            // User already exists from signup — find them and update metadata
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existing = users.find((u: { email?: string }) => u.email === data.email);
            if (existing) {
              await supabase.auth.admin.updateUserById(existing.id, {
                user_metadata: {
                  ...existing.user_metadata,
                  tenant_id: result.tenant_id,
                  company: data.company,
                },
              });
              console.log("[onboarding] Wrote tenant_id to Supabase metadata for", data.email);
            } else {
              // Edge case: user doesn't exist yet — create them
              const tempPassword = "TG-" + Math.random().toString(36).slice(2, 10) + "!";
              await supabase.auth.admin.createUser({
                email: data.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                  tenant_id: result.tenant_id,
                  company: data.company,
                },
              });
              console.log("[onboarding] Created new Supabase user with tenant_id for", data.email);
            }
          } catch (e) {
            console.error("[onboarding] Could not write tenant_id to Supabase metadata:", e);
          }
          return NextResponse.json({ ...result, auth_email_sent: true });
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

      // If this is the admin key (role === "Admin"), save api_key to Supabase metadata
      if (data.role === "Admin" && result.api_key && data.email) {
        try {
          const supabase = getSupabaseAdmin();
          if (supabase) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const user = users.find(u => u.email === data.email);
            if (user) {
              await supabase.auth.admin.updateUserById(user.id, {
                user_metadata: {
                  ...user.user_metadata,
                  api_key: result.api_key,
                  tenant_id: tenantId,
                },
              });
              console.log("[onboarding] Saved api_key to Supabase metadata for", data.email);
            }
          }
        } catch (e) {
          console.error("[onboarding] Could not update user_metadata with api_key:", e);
        }
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("[onboarding]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

