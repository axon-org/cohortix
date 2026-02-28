import { Suspense } from 'react';
import { AgentEvolutionDashboard } from '@/components/agents/agent-evolution-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { getAgentEvolution } from '@/server/db/queries/agents';

export const metadata = {
  title: 'Agent Evolution | Cohortix',
};

export default async function AgentEvolutionPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { id, orgSlug } = await params;

  return (
    <div className="flex flex-col h-full space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Agent Evolution</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Visual history of agent growth, learning events, corrections, and milestone achievements.
        </p>
      </div>

      <Suspense fallback={<EvolutionSkeleton />}>
        <AgentEvolutionDashboard agentId={id} orgSlug={orgSlug} />
      </Suspense>
    </div>
  );
}

function EvolutionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
