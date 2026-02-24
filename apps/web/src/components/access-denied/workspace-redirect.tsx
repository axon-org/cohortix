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
        <Loader2 className="w-4 h-4 text-[#6B7280] animate-spin" />
      </div>
    );
  }

  if (variant === 'primary') {
    return (
      <button
        onClick={handleRedirect}
        disabled={isRedirecting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5E6AD2] hover:bg-[#7C8ADE] disabled:opacity-50 disabled:hover:bg-[#5E6AD2] text-white rounded-lg font-medium transition-colors"
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
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-[#1C1917] disabled:opacity-50 text-[#9CA3AF] hover:text-white border border-[#27282D] rounded-lg font-medium transition-colors"
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
