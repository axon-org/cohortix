'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EngineSetupWizard } from '@/components/engine/EngineSetupWizard';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags';

export default function EngineSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = use(params);

  if (!isFeatureEnabled(FEATURE_FLAGS.ENGINE_BYOH_CONNECTION)) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-2">Engine Integration</h2>
        <p className="text-muted-foreground">This feature is not yet available. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${orgSlug}/cohorts/${id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Engine Settings</h1>
          <p className="text-muted-foreground">
            Connect your OpenClaw gateway to enable AI agent execution.
          </p>
        </div>
      </div>

      <EngineSetupWizard cohortId={id} />
    </div>
  );
}
