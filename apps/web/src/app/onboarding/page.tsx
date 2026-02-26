'use client';

import { useUser, useOrganizationList } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Rocket, ArrowRight, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { generateSlug, isValidSlug } from '@/lib/slug-utils';
import { useSlugCheck } from '@/hooks/use-slug-check';

export default function OnboardingPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { createOrganization, setActive, isLoaded: orgLoaded } = useOrganizationList();
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [step, setStep] = useState<'welcome' | 'create-org'>('welcome');

  // Auto-generate slug from org name when not manually edited
  useEffect(() => {
    if (!slugTouched && orgName) {
      setSlug(generateSlug(orgName));
    }
  }, [orgName, slugTouched]);

  // Slug validation and availability check
  const validation = isValidSlug(slug);
  const { status: slugStatus, suggestion, error: slugError } = useSlugCheck(slug);

  useEffect(() => {
    if (userLoaded && !user) {
      router.push('/sign-in');
    }
  }, [userLoaded, user, router]);

  if (!userLoaded || !orgLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const handleCreateOrg = async () => {
    if (!orgName.trim() || !slug.trim() || !createOrganization) return;

    // Final validation before submission
    if (!validation.valid || slugStatus !== 'available') {
      return;
    }

    setIsCreating(true);
    setCreationError(null);
    try {
      const org = await createOrganization({ name: orgName.trim(), slug: slug.trim() });
      // Set the new org as active so auth() returns the orgId server-side
      if (setActive && org) {
        await setActive({ organization: org.id });
      }
      // Redirect to the new org's dashboard using the slug
      router.push(`/${org.slug}/`);
    } catch (err) {
      console.error('Failed to create organization:', err);
      setCreationError(
        'Failed to create organization. The URL may have been taken by another user. Please try a different URL.'
      );
      setIsCreating(false);
    }
  };

  const canSubmit =
    orgName.trim().length > 0 &&
    slug.trim().length > 0 &&
    validation.valid &&
    slugStatus === 'available' &&
    !isCreating;

  const getSlugStatusIcon = () => {
    if (!slug) return null;
    if (slugStatus === 'checking') {
      return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />;
    }
    if (slugStatus === 'available' && validation.valid) {
      return <Check className="w-4 h-4 text-success" />;
    }
    if (slugStatus === 'taken' || !validation.valid) {
      return <X className="w-4 h-4 text-destructive" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Radial gradient glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, hsl(var(--primary, 235 58% 60%)) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
              <Rocket className="w-8 h-8 text-background" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome to Cohortix{user?.firstName ? `, ${user.firstName}` : ''}!
              </h1>
              <p className="text-muted-foreground text-base">
                Your AI crew is ready. Let&apos;s set up your workspace.
              </p>
            </div>
            <button
              onClick={() => setStep('create-org')}
              className="flex items-center gap-2 px-6 py-3 bg-foreground text-background hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] rounded-lg font-medium transition-all"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'create-org' && (
          <div className="bg-card-elevated border border-border rounded-xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-1">Create your organization</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This is where your AI agents and missions will live.
            </p>

            <div className="space-y-5">
              {/* Organization Name Input */}
              <div>
                <label
                  htmlFor="org-name"
                  className="block text-sm font-medium text-foreground/90 mb-1.5"
                >
                  Organization name
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={orgName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-ring outline-none transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleCreateOrg()}
                  autoFocus
                />
              </div>

              {/* Slug Input */}
              <div>
                <label
                  htmlFor="org-slug"
                  className="block text-sm font-medium text-foreground/90 mb-1.5"
                >
                  Workspace URL
                </label>
                <div className="relative">
                  <div className="flex items-center">
                    <span className="text-muted-foreground text-sm pr-1">cohortix.ai/</span>
                    <input
                      id="org-slug"
                      type="text"
                      value={slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setSlug(e.target.value.toLowerCase());
                        setSlugTouched(true);
                        setCreationError(null);
                      }}
                      placeholder="acme-corp"
                      className="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-1 focus:ring-ring outline-none transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleCreateOrg()}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getSlugStatusIcon()}
                    </div>
                  </div>
                </div>

                {/* URL Preview */}
                <div className="mt-1.5 text-xs text-muted-foreground">
                  Your workspace URL:{' '}
                  <span className="text-muted-foreground/80">cohortix.ai/{slug || '...'}</span>
                </div>

                {/* Validation Error */}
                {slug && !validation.valid && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{validation.error}</span>
                  </div>
                )}

                {/* Availability Error + Suggestion */}
                {slug &&
                  validation.valid &&
                  (slugStatus === 'taken' || (slugStatus === 'idle' && slugError)) && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-start gap-1.5 text-xs text-destructive">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{slugError || 'This URL is already taken'}</span>
                      </div>
                      {suggestion && (
                        <button
                          onClick={() => {
                            setSlug(suggestion);
                            setSlugTouched(true);
                          }}
                          className="text-xs text-primary hover:text-primary-hover transition-colors"
                        >
                          Try &quot;{suggestion}&quot; instead
                        </button>
                      )}
                    </div>
                  )}

                {/* Success Message */}
                {slug && validation.valid && slugStatus === 'available' && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-success">
                    <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>This URL is available</span>
                  </div>
                )}

                {/* Warning */}
                <div className="mt-2 flex items-start gap-1.5 text-xs text-warning">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>⚠️ This URL cannot be changed later</span>
                </div>
              </div>

              {/* Creation Error */}
              {creationError && (
                <div className="flex items-start gap-1.5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{creationError}</span>
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreateOrg}
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
