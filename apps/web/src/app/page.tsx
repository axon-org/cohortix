'use client';

import { useEffect } from 'react';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

/**
 * Root page — redirects authenticated users to their org dashboard.
 * Middleware handles unauthenticated users.
 */
export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: isOrgLoaded, organization } = useOrganization();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isOrgLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    if (organization?.slug) {
      router.replace(`/${organization.slug}`);
    } else if (organization && !organization.slug) {
      console.error('Organization exists but has no slug:', organization.id);
      router.replace('/onboarding?error=missing-slug');
    } else {
      router.replace('/onboarding');
    }
  }, [isLoaded, isOrgLoaded, isSignedIn, organization, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Cohortix</h1>
        <p className="text-muted-foreground mt-2">Redirecting...</p>
      </div>
    </div>
  );
}
