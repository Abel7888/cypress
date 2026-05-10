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
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <TrialBanner />
      <div className="flex flex-1 overflow-hidden w-full">
        <Dashboard />
      </div>
    </div>
  )
}
