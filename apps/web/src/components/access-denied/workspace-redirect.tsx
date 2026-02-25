'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface WorkspaceRedirectProps {
  variant?: 'primary' | 'secondary';
}

export function WorkspaceRedirect({ variant = 'primary' }: WorkspaceRedirectProps) {
  const { isLoaded, userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleRedirect = () => {
    if (!isLoaded) return;

    setIsRedirecting(true);

    // Get first organization
    const firstOrg = userMemberships.data?.[0]?.organization;

    if (firstOrg?.slug) {
      router.push(`/${firstOrg.slug}/`);
    } else {
      router.push('/onboarding');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (variant === 'primary') {
    return (
      <button
        onClick={handleRedirect}
        disabled={isRedirecting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] disabled:opacity-50 rounded-lg font-medium transition-all"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            Go to your workspace
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleRedirect}
      disabled={isRedirecting}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-secondary disabled:opacity-50 text-muted-foreground hover:text-foreground border border-border rounded-lg font-medium transition-colors"
    >
      {isRedirecting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        <>
          Go to your workspace
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}
