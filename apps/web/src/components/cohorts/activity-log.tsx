'use client'

import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CohortActivity } from '@/lib/api/client'

interface ActivityLogProps {
  activities: CohortActivity[]
}

const actionConfig: Record<string, { color: string; icon: string }> = {
  joined_cohort: { color: 'text-success', icon: '●' },
  left_cohort: { color: 'text-muted-foreground', icon: '●' },
  engagement_spike: { color: 'text-success', icon: '●' },
  engagement_drop: { color: 'text-warning', icon: '●' },
  status_change: { color: 'text-info', icon: '●' },
  default: { color: 'text-muted-foreground', icon: '●' },
}

export function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Activity Log</h2>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          activities.map((activity) => {
            const config =
              actionConfig[activity.action] ?? actionConfig.default
            const timeAgo = formatDistanceToNow(parseISO(activity.created_at), {
              addSuffix: true,
            })

            return (
              <div
                key={activity.id}
                className="px-6 py-4 hover:bg-background/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className={cn('text-lg leading-none', config?.color ?? 'text-muted-foreground')}>
                    {config?.icon ?? '●'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeAgo}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
