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
  const supabase = await createServerSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get user profile with organization
  const currentUser = await getCurrentUser()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
