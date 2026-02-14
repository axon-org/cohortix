'use client';

import { useCohorts } from '@/hooks/use-cohorts';
import { CohortsTable, type Cohort } from './cohorts-table';
import { Skeleton } from '@/components/ui/skeleton';

export function CohortsTableClient() {
  const { data, isLoading, error } = useCohorts();

  if (isLoading) {
    return <CohortsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <p className="text-destructive font-medium">Failed to load cohorts</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No cohorts found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first cohort to get started.
        </p>
      </div>
    );
  }

  // Transform API data to table format
  const tableData: Cohort[] = data.data.map((cohort) => ({
    id: cohort.id,
    name: cohort.name,
    status: cohort.status,
    members: cohort.member_count,
    engagement: parseFloat(cohort.engagement_percent),
    startDate: cohort.start_date || cohort.created_at,
  }));

  return <CohortsTable data={tableData} />;
}

function CohortsTableSkeleton() {
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
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
