import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Dashboard from "@/components/Dashboard"
import TrialBanner from "@/components/TrialBanner"

export default async function DashboardPage() {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/signin')
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", 
      width: "100vw", height: "100vh", overflow: "hidden" }}>
      <TrialBanner />
      <div style={{ display: "flex", flex: 1, overflow: "hidden",
        width: "100%" }}>
        <Dashboard />
      </div>
    </div>
  )
}
