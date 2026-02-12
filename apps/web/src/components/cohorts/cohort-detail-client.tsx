'use client'

import { CohortHeader } from './cohort-header'
import { EngagementTimeline } from './engagement-timeline'
import { BatchMembers } from './batch-members'
import { ActivityLog } from './activity-log'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCohortDetail,
  useCohortMembers,
  useCohortTimeline,
  useCohortActivity,
} from '@/hooks/use-cohort-detail'
import type { CohortStatus } from '@/components/ui/status-chip'

interface CohortDetailClientProps {
  id: string
}

export function CohortDetailClient({ id }: CohortDetailClientProps) {
  const { data: cohort, isLoading: cohortLoading, error: cohortError } = useCohortDetail(id)
  const { data: membersData, isLoading: membersLoading } = useCohortMembers(id)
  const { data: timelineData, isLoading: timelineLoading } = useCohortTimeline(id, 30)
  const { data: activityData, isLoading: activityLoading } = useCohortActivity(id, 20)

  // Error state
  if (cohortError) {
    return (
      <div className="space-y-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-12 text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Failed to Load Cohort
          </h2>
          <p className="text-sm text-muted-foreground">
            {cohortError.message || 'An error occurred while loading the cohort details.'}
          </p>
        </div>
      </div>
    )
  }

  // Loading state
  if (cohortLoading) {
    return <CohortDetailSkeleton />
  }

  if (!cohort) {
    return (
      <div className="space-y-8">
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Cohort not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <CohortHeader
        name={cohort.name}
        status={cohort.status as CohortStatus}
        startDate={cohort.start_date}
        endDate={cohort.end_date}
      />

      {/* Engagement Timeline */}
      {timelineLoading ? (
        <Skeleton className="h-[360px] w-full" />
      ) : timelineData?.timeline ? (
        <EngagementTimeline data={timelineData.timeline} days={30} />
      ) : null}

      {/* Two Column Layout: Batch Members & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Batch Members - Takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
          {membersLoading ? (
            <Skeleton className="h-[500px] w-full" />
          ) : membersData?.members ? (
            <BatchMembers members={membersData.members} />
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-sm text-muted-foreground">No members yet</p>
            </div>
          )}
        </div>

        {/* Activity Log - Takes 1/3 width on large screens */}
        <div className="lg:col-span-1">
          {activityLoading ? (
            <Skeleton className="h-[500px] w-full" />
          ) : activityData?.activities ? (
            <ActivityLog activities={activityData.activities} />
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CohortDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Timeline Skeleton */}
      <Skeleton className="h-[360px] w-full" />

      {/* Two Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-[500px] w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    </div>
  )
}
