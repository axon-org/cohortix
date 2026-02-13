import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { getCurrentUser } from '@/server/db/queries/dashboard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let currentUser = null
  
  if (process.env.BYPASS_AUTH === 'true') {
    // Dev mode: skip auth, use mock user
    currentUser = { id: 'dev-user', email: 'test@cohortix.dev', name: 'Ahmad (Dev)', role: 'admin', avatar_url: null }
  } else {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/sign-in')
    }
    currentUser = await getCurrentUser()
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={currentUser} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
