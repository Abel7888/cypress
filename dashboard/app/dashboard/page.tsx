import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Dashboard from "@/components/Dashboard"

export default async function DashboardPage() {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Dashboard />
    </div>
  )
}
