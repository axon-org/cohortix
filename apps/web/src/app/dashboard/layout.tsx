import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware should handle the redirect, but as a fallback:
  const { orgSlug } = await auth();

  if (orgSlug) {
    redirect(`/${orgSlug}/`);
  }

  redirect('/onboarding');
}
