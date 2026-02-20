'use client';

import { useUser, useOrganizationList } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Rocket, ArrowRight, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { createOrganization, setActive, isLoaded: orgLoaded } = useOrganizationList();
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'welcome' | 'create-org'>('welcome');

  useEffect(() => {
    if (userLoaded && !user) {
      router.push('/sign-in');
    }
  }, [userLoaded, user, router]);

  if (!userLoaded || !orgLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0A0A0B' }}
      >
        <Loader2 className="w-8 h-8 text-[#5E6AD2] animate-spin" />
      </div>
    );
  }

  const handleCreateOrg = async () => {
    if (!orgName.trim() || !createOrganization) return;
    setIsCreating(true);
    try {
      const org = await createOrganization({ name: orgName.trim() });
      // Set the new org as active so auth() returns the orgId server-side
      if (setActive && org) {
        await setActive({ organization: org.id });
      }
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to create organization:', err);
      setIsCreating(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

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
            background: 'radial-gradient(circle, #5E6AD2 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
              <Rocket className="w-8 h-8 text-[#0A0A0B]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to Cohortix{user?.firstName ? `, ${user.firstName}` : ''}!
              </h1>
              <p className="text-[#9CA3AF] text-base">
                Your AI crew is ready. Let&apos;s set up your workspace.
              </p>
            </div>
            <button
              onClick={() => setStep('create-org')}
              className="flex items-center gap-2 px-6 py-3 bg-[#5E6AD2] hover:bg-[#7C8ADE] text-white rounded-lg font-medium transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'create-org' && (
          <div className="bg-[#101012] border border-[#27282D] rounded-xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Create your organization</h2>
            <p className="text-[#9CA3AF] text-sm mb-6">
              This is where your AI allies and missions will live.
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="org-name"
                  className="block text-sm font-medium text-[#D1D5DB] mb-1.5"
                >
                  Organization name
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2.5 bg-[#0A0A0B] border border-[#27282D] rounded-lg text-[#F2F2F2] placeholder-[#6B7280] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] outline-none transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateOrg()}
                  autoFocus
                />
              </div>

              <button
                onClick={handleCreateOrg}
                disabled={!orgName.trim() || isCreating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5E6AD2] hover:bg-[#7C8ADE] disabled:opacity-50 disabled:hover:bg-[#5E6AD2] text-white rounded-lg font-medium transition-colors"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Organization
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleSkip}
                className="w-full text-center text-sm text-[#6B7280] hover:text-[#9CA3AF] transition-colors py-2"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
