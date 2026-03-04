'use client';

import { useMissions } from '@/hooks/use-missions';
import { MissionsTable, type MissionRow } from './missions-table';
import { Skeleton } from '@/components/ui/skeleton';

export function MissionsTableClient() {
  const { data, isLoading, error } = useMissions();

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

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <p className="text-destructive font-medium">Failed to load missions</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No missions found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first mission to get started.
        </p>
      </div>
    );
  }

  const tableData: MissionRow[] = data.data.map((mission: any) => ({
    id: mission.id,
    title: mission.name || mission.title,
    status: mission.status,
    startDate: mission.start_date || null,
    targetDate: mission.target_date || null,
    completedAt: mission.completed_at || null,
    operationCount: mission.operation_count?.[0]?.count ?? 0,
    progress: mission.progress ?? 0,
  }));

  return <MissionsTable data={tableData} />;
}
