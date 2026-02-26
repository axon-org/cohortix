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

  let authContext;
  try {
    // getAuthContext() handles everything:
    // - Checks Clerk auth (throws UnauthorizedError if not signed in)
    // - Auto-provisions user profile if missing from Supabase
    // - Auto-provisions org from Clerk if missing from Supabase
    // - Falls back to org membership lookup
    // - Throws ForbiddenError if no org at all
    authContext = await getAuthContext();
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

  // Validate that the URL org slug matches the user's organization
  const { data: userOrg } = await authContext.supabase
    .from('organizations')
    .select('slug')
    .eq('id', authContext.organizationId)
    .single();

  if (!userOrg || userOrg.slug !== orgSlug) {
    // User is trying to access an org they don't belong to
    // Redirect to their actual org or onboarding
    if (userOrg?.slug) {
      redirect(`/${userOrg.slug}`);
    }
    redirect('/onboarding');
  }

  const currentUser = await getCurrentUser();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={currentUser} orgSlug={orgSlug} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={currentUser} orgSlug={orgSlug} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
