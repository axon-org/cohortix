import { Suspense } from 'react';
import { KpiCardsClient } from '@/components/dashboard/kpi-cards-client';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { UrgentAlerts } from '@/components/dashboard/urgent-alerts';
import { GlobalIntelFeed } from '@/components/dashboard/global-intel-feed';
import { getDashboardData } from '@/server/db/queries/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowRight, Users, Bot, Rocket } from 'lucide-react';

function SectionSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();

  if (!dashboardData) {
    return null;
  }

  const { activity, alerts, missions, allies } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your ecosystem</p>
        </div>
        <div className="text-xs font-mono bg-secondary/50 px-2.5 py-1 rounded border border-border text-muted-foreground">
          STABLE · FEB 13 2026
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCardsClient />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStatCard
          icon={<Users className="w-4 h-4" />}
          label="Cohorts"
          count={dashboardData.kpis.activeMissions}
          href="/dashboard/cohorts"
        />
        <QuickStatCard
          icon={<Bot className="w-4 h-4" />}
          label="Allies"
          count={dashboardData.kpis.activeAllies}
          href="/dashboard/allies"
        />
        <QuickStatCard
          icon={<Rocket className="w-4 h-4" />}
          label="Active Missions"
          count={dashboardData.kpis.activeMissions}
          href="/dashboard/missions"
        />
      </div>

      {/* Main Grid: Activity, Alerts and Global Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Suspense fallback={<SectionSkeleton />}>
              <RecentActivity activities={activity} />
            </Suspense>
            <Suspense fallback={<SectionSkeleton />}>
              <UrgentAlerts alerts={alerts} />
            </Suspense>
          </div>

          {/* Active Missions Preview */}
          {missions && missions.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Active Missions</h2>
                <Link
                  href="/dashboard/missions"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {missions.slice(0, 5).map((mission: any) => (
                  <Link
                    key={mission.id}
                    href={`/dashboard/missions/${mission.id}`}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: mission.color || '#5E6AD2' }}
                      />
                      <span className="text-sm font-medium group-hover:text-foreground">
                        {mission.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {mission.stats && (
                        <span className="text-xs text-muted-foreground">
                          {mission.stats.progress}%
                        </span>
                      )}
                      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/60 rounded-full"
                          style={{ width: `${mission.stats?.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 h-full">
          <Suspense fallback={<SectionSkeleton />}>
            <GlobalIntelFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function QuickStatCard({
  icon,
  label,
  count,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-foreground/20 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-secondary rounded-md text-muted-foreground group-hover:text-foreground transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{count}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
