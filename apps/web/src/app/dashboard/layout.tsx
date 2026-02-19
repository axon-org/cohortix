import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { getCurrentUser } from '@/server/db/queries/dashboard';
import { getAuthContextBasic } from '@/lib/auth-helper';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect('/sign-in');
  }

  const { supabase, userId } = await getAuthContextBasic();
  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership) {
    redirect('/onboarding');
  }

  const currentUser = await getCurrentUser();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={currentUser} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
