'use client';

import { useSearchParams } from 'next/navigation';
import { Globe, ShieldX, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense, useState } from 'react';
import { WorkspaceRedirect } from '@/components/access-denied/workspace-redirect';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams?.get('reason') || 'not-found';
  const org = searchParams?.get('org');

  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleRequestAccess = async () => {
    if (!org) return;

    setIsRequesting(true);
    setRequestError(null);
    try {
      const response = await fetch('/api/v1/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgSlug: org }),
      });

      if (response.ok) {
        setRequestSuccess(true);
      } else {
        const data = await response.json().catch(() => ({}));
        setRequestError(data.error || 'Failed to send request. Please try again.');
      }
    } catch (error) {
      console.error('Failed to request access:', error);
      setRequestError('Network error. Please check your connection and try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Variant A: Not Found
  if (reason === 'not-found') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        style={{ backgroundColor: '#0A0A0B' }}
      >
        {/* Radial gradient glow effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
            style={{
              background: 'radial-gradient(circle, #EF4444 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-[#101012] border border-[#27282D] rounded-xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 bg-[#1C1917] border border-[#44403C] rounded-2xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-[#EF4444]" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Workspace not found</h1>
                <p className="text-[#9CA3AF] text-base">
                  The workspace you&apos;re looking for doesn&apos;t exist or may have been removed.
                </p>
              </div>

              <WorkspaceRedirect />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant B: Not Member
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: '#0A0A0B' }}
    >
      {/* Radial gradient glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #F97316 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#101012] border border-[#27282D] rounded-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center gap-6">
            {!requestSuccess ? (
              <>
                <div className="w-16 h-16 bg-[#1C1917] border border-[#44403C] rounded-2xl flex items-center justify-center">
                  <ShieldX className="w-8 h-8 text-[#F97316]" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    You don&apos;t have access to{' '}
                    <span className="text-[#5E6AD2]">{org || 'this workspace'}</span>
                  </h1>
                  <p className="text-[#9CA3AF] text-base">
                    You&apos;re not a member of this workspace. You can request access from the
                    workspace admin.
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <Button
                    onClick={handleRequestAccess}
                    disabled={isRequesting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5E6AD2] hover:bg-[#7C8ADE] disabled:opacity-50 disabled:hover:bg-[#5E6AD2] text-white rounded-lg font-medium transition-colors"
                  >
                    {isRequesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      'Request Access'
                    )}
                  </Button>

                  <WorkspaceRedirect variant="secondary" />

                  {requestError && (
                    <p className="text-xs text-[#EF4444] text-center">{requestError}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#14532D] border border-[#166534] rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-[#22C55E]" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">Access requested</h1>
                  <p className="text-[#9CA3AF] text-base">
                    The workspace admin will review your request. You&apos;ll be notified once your
                    access is approved.
                  </p>
                </div>

                <WorkspaceRedirect />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: '#0A0A0B' }}
        >
          <Loader2 className="w-8 h-8 text-[#5E6AD2] animate-spin" />
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
