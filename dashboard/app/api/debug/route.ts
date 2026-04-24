import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    api_base: !!process.env.NEXT_PUBLIC_API_BASE,
  });
}
