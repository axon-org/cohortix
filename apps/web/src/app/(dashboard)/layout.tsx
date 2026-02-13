import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { getCurrentUser } from '@/server/db/queries/dashboard'
import { getAuthContext } from '@/lib/auth-helper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let authContext;
  try {
    authContext = await getAuthContext()
  } catch {
    redirect('/sign-in')
  }
  const currentUser = await getCurrentUser()

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
