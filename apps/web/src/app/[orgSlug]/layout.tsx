import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { getCurrentUser } from '@/server/db/queries/dashboard';
import { getAuthContext } from '@/lib/auth-helper';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  try {
    // getAuthContext() handles everything:
    // - Checks Clerk auth (throws UnauthorizedError if not signed in)
    // - Auto-provisions user profile if missing from Supabase
    // - Auto-provisions org from Clerk if missing from Supabase
    // - Falls back to org membership lookup
    // - Throws ForbiddenError if no org at all
    await getAuthContext();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    if (error instanceof ForbiddenError) {
      redirect('/onboarding');
    }
    // Unexpected error — redirect to sign-in as fallback
    redirect('/sign-in');
  }

  const currentUser = await getCurrentUser();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={currentUser} orgSlug={orgSlug} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={currentUser} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
