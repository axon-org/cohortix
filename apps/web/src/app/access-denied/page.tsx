'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams?.get('reason') || 'not-found';
  const org = searchParams?.get('org');

  const messages = {
    'not-found': {
      title: "Workspace doesn't exist",
      description: "The workspace you're trying to access doesn't exist or has been removed.",
    },
    'not-member': {
      title: `You don't have access to ${org ? `"${org}"` : 'this workspace'}`,
      description: 'You need to be invited by a workspace administrator to access this workspace.',
    },
  };

  const message = messages[reason as keyof typeof messages] || messages['not-found'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{message.title}</h1>
          <p className="text-muted-foreground">{message.description}</p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          {reason === 'not-member' && org && <Button variant="primary">Request Access</Button>}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to your workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="pt-4 text-xs text-muted-foreground">
          If you believe this is an error, please contact your administrator.
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
