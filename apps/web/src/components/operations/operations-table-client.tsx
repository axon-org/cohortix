'use client';

import { useMemo } from 'react';
import { useOperations } from '@/hooks/use-operations';
import { useMissions } from '@/hooks/use-missions';
import { useAgents } from '@/hooks/use-agents';
import { OperationsTable, type Operation } from './operations-table';
import { Skeleton } from '@/components/ui/skeleton';

export function OperationsTableClient() {
  const { data, isLoading, error } = useOperations();
  const { data: missionsData } = useMissions({ limit: 1000 });
  const { data: agentsData } = useAgents({ limit: 1000 });

  // Lookup maps
  const missionLookup = useMemo(() => {
    if (!missionsData?.data) return new Map();
    return new Map(missionsData.data.map((m) => [m.id, m.name]));
  }, [missionsData]);

  const agentLookup = useMemo(() => {
    if (!agentsData?.data) return new Map();
    return new Map(agentsData.data.map((a) => [a.id, a.name]));
  }, [agentsData]);

  if (isLoading) {
    return <OperationsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <p className="text-destructive font-medium">Failed to load operations</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No operations found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first operation to get started.
        </p>
      </div>
    );
  }

  // Transform API data to table format with names
  const tableData: Operation[] = data.data.map((operation) => ({
    id: operation.id,
    name: operation.name,
    status: operation.status,
    missionName:
      (operation as any).missions?.title ||
      (operation.missionId ? missionLookup.get(operation.missionId) : undefined),
    ownerName: operation.ownerId ? agentLookup.get(operation.ownerId) : 'Unassigned',
    startDate: operation.startDate,
    targetDate: operation.targetDate,
    createdAt: operation.created_at,
  }));

  return (
    <OperationsTable
      data={tableData}
      missions={missionsData?.data || []}
      agents={agentsData?.data || []}
    />
  );
}

function OperationsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search & Filters Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
