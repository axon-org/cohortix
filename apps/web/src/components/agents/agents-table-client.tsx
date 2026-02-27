'use client';

import { useAgents } from '@/hooks/use-agents';
import { AgentsTable, type AgentRow } from './agents-table';
import { Skeleton } from '@/components/ui/skeleton';

export function AgentsTableClient() {
  const { data, isLoading, error } = useAgents();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-20" />
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <p className="text-destructive font-medium">Failed to load agents</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No agents found.</p>
        <p className="text-sm text-muted-foreground mt-1">Add your first agent to get started.</p>
      </div>
    );
  }

  const tableData: AgentRow[] = data.data.map((agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role || null,
    status: agent.status,
    capabilities: agent.capabilities,
    totalTasksCompleted: agent.totalTasksCompleted,
    lastActiveAt: agent.lastActiveAt || null,
  }));

  return <AgentsTable data={tableData} />;
}
