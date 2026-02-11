import { Suspense } from 'react'
import { KpiCardsClient } from '@/components/dashboard/kpi-cards-client'
import { EngagementChart } from '@/components/dashboard/engagement-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UrgentAlerts } from '@/components/dashboard/urgent-alerts'
import { getDashboardData } from '@/server/db/queries/dashboard'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

function ActivitySkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function MissionControlPage() {
  const dashboardData = await getDashboardData()

  // Redirect to auth if no user
  if (!dashboardData) {
    redirect('/sign-in')
  }

  const { activity, alerts } = dashboardData

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold">Mission Control</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your current ecosystem performance.
        </p>
      </div>

      {/* KPI Cards - Now using client-side fetching with loading state */}
      <KpiCardsClient />

      {/* Engagement Velocity Chart */}
      <EngagementChart />

      {/* Recent Activity & Urgent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity activities={activity} />
        </Suspense>
        <Suspense fallback={<ActivitySkeleton />}>
          <UrgentAlerts alerts={alerts} />
        </Suspense>
      </div>
    </div>
  )
}
