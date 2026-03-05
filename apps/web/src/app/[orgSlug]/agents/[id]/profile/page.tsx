'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAgentDetail, useAgentEvolution } from '@/hooks/use-agent-detail';
import { WorkspaceFileEditor } from '@/components/engine/WorkspaceFileEditor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Brain, Cpu, Activity, Clock, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgentProfilePage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = use(params);
  const router = useRouter();
  const { data: agent, isLoading: isAgentLoading } = useAgentDetail(id);
  const { data: evolution, isLoading: isEvolutionLoading } = useAgentEvolution(id, 5); // Limit to recent 5

  if (isAgentLoading) {
    return <ProfileSkeleton />;
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-xl font-semibold">Agent not found</h2>
        <Button variant="ghost" onClick={() => router.push(`/${orgSlug}/agents`)} className="mt-4">
          Back to Agents
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/${orgSlug}/agents/${id}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
              {agent.status}
            </Badge>
          </div>
          <p className="text-muted-foreground pl-6">Workspace Configuration & Profile</p>
        </div>
        <div className="flex items-center gap-2">{/* Placeholder for future actions */}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Workspace Files */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-6">
            <WorkspaceFileEditor
              cohortId={agent.scopeId} // Assuming scopeId is cohortId for now, or fallback to handling personal/org scopes later
              agentId={agent.id}
              filePath="SOUL.md"
            />

            <WorkspaceFileEditor
              cohortId={agent.scopeId}
              agentId={agent.id}
              filePath="IDENTITY.md"
            />
          </div>
        </div>

        {/* Sidebar: Configuration & Evolution */}
        <div className="space-y-6">
          {/* Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cpu className="h-5 w-5 text-primary" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">Model</span>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {agent.runtimeConfig?.model || 'Default Model'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Tasks Completed
                </span>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{agent.totalTasksCompleted}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Last Active
                </span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {agent.lastActiveAt ? new Date(agent.lastActiveAt).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Workspace Path
                </span>
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs bg-muted px-1 py-0.5 rounded break-all">
                    ~/.openclaw/workspace-{agent.slug}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evolution Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Evolution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEvolutionLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-2">
                      <Skeleton className="h-2 w-2 rounded-full mt-2" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (evolution?.events || []).length > 0 ? (
                <div className="space-y-6 relative pl-2">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                  {evolution?.events.map((event, i) => (
                    <div key={i} className="relative pl-6">
                      <div
                        className={cn(
                          'absolute left-[5px] top-1.5 h-2 w-2 rounded-full border border-background',
                          event.eventType === 'learning'
                            ? 'bg-blue-500'
                            : event.eventType === 'correction'
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        )}
                      />
                      <p className="text-sm font-medium leading-none mb-1">{event.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleDateString()} • {event.eventType}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No recent evolution events.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}
