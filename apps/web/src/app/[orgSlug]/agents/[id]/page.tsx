'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAgent, useDeleteAgent } from '@/hooks/use-agents';
import { useAgentEvolution, useAgentStats } from '@/hooks/use-agent-detail';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bot, Zap, History, BarChart3, Clock, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success',
  idle: 'bg-warning',
  busy: 'bg-info',
  offline: 'bg-muted-foreground',
  error: 'bg-destructive',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  learning: 'text-primary bg-primary/10',
  correction: 'text-warning bg-warning/10',
  milestone: 'text-success bg-success/10',
};

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = use(params);
  const router = useRouter();
  const { data: agent, isLoading, error } = useAgent(id);
  const { data: evolutionData } = useAgentEvolution(id);
  const { data: statsData } = useAgentStats(id);
  const deleteMutation = useDeleteAgent();

  if (isLoading) return <DetailSkeleton />;
  if (error || !agent) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Agent not found</p>
        <Link
          href={`/${orgSlug}/agents`}
          className="text-sm text-foreground underline mt-2 inline-block"
        >
          Back to Agents
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push(`/${orgSlug}/agents`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/${orgSlug}/agents`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Agents
        </Link>
        <DeleteDialog
          title="Delete agent"
          description={`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      </div>

      {/* Header Profile Section */}
      <div className="bg-card border border-border rounded-xl p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 bg-secondary rounded-2xl flex items-center justify-center flex-shrink-0 border border-border overflow-hidden">
          {agent.avatarUrl ? (
            <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
          ) : (
            <Bot className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider w-fit mx-auto md:mx-0">
              {agent.scopeType || 'personal'}
            </span>
          </div>
          <p className="text-lg text-muted-foreground mb-4">{agent.role || 'General Assistant'}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[agent.status])} />
              {agent.status}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Zap className="w-4 h-4" />
              {agent.runtimeType || 'Managed'}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Created {new Date(agent.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Tasks Completed" value={agent.totalTasksCompleted || 0} icon={Check} />
        <StatsCard
          label="Success Rate"
          value={`${statsData?.successRate ?? 0}%`}
          icon={BarChart3}
        />
        <StatsCard label="Sessions Completed" value={statsData?.completedCount ?? 0} icon={Zap} />
        <StatsCard
          label="Avg Response"
          value={`${statsData?.avgResponseTimeMs ?? 0}ms`}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Capabilities */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            <Field label="Bio">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {agent.description || 'No description provided.'}
              </p>
            </Field>
            <Field label="Enabled Skills">
              <div className="flex flex-wrap gap-2 mt-2">
                {(agent.capabilities || []).map((skill: string) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-secondary rounded-md text-xs font-medium border border-border"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Field>
          </div>
        </div>

        {/* Right Column: Evolution Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Evolution Timeline
              </h2>
            </div>

            <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-border">
              {(evolutionData?.events || []).length > 0 ? (
                evolutionData?.events.map((event: any, i: number) => (
                  <div key={i} className="relative pl-8">
                    <div
                      className={cn(
                        'absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-background z-10',
                        event.eventType === 'learning'
                          ? 'bg-primary'
                          : event.eventType === 'correction'
                            ? 'bg-warning'
                            : 'bg-success'
                      )}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                          EVENT_TYPE_COLORS[event.eventType]
                        )}
                      >
                        {event.eventType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{event.summary}</p>
                    {event.metadata && (
                      <p className="text-xs text-muted-foreground mt-1 bg-secondary/30 p-2 rounded-md border border-border/50 italic">
                        {event.metadata.note}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-muted-foreground italic">
                  No evolution events recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 col-span-2 rounded-xl" />
      </div>
    </div>
  );
}
