'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { Sparkline } from '@/components/ui/sparkline';
import { useDashboardKPIs } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export function KpiCardsClient() {
  const { data, isLoading, error } = useDashboardKPIs();

  if (isLoading) {
    return <KpiSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <p className="text-destructive font-medium">Failed to load KPIs</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const kpiData = [
    {
      label: 'ACTIVE COHORTS',
      value: data.kpis.activeCohortsCount,
      change: data.trends.activeCohortsChange,
      changeLabel: `${data.trends.activeCohortsChange > 0 ? '+' : ''}${data.trends.activeCohortsChange}%`,
      isPositive: data.trends.activeCohortsChange >= 0,
      sparklineData: generateSparklineData(data.kpis.activeCohortsCount),
    },
    {
      label: 'TOTAL AGENTS',
      value: data.kpis.totalAgents,
      change: data.trends.totalAgentsChange,
      changeLabel: `${data.trends.totalAgentsChange > 0 ? '+' : ''}${data.trends.totalAgentsChange}%`,
      isPositive: data.trends.totalAgentsChange >= 0,
      sparklineData: generateSparklineData(data.kpis.totalAgents),
    },
    {
      label: 'AVG ENGAGEMENT',
      value: data.kpis.avgEngagement,
      change: data.trends.avgEngagementChange,
      changeLabel: `${data.kpis.avgEngagement}%`,
      isPositive: data.trends.avgEngagementChange >= 0,
      isPercentage: true,
      sparklineData: generateSparklineData(data.kpis.avgEngagement),
    },
    {
      label: 'AT-RISK COHORTS',
      value: data.kpis.atRiskCount,
      change: data.trends.atRiskChange,
      changeLabel: `${data.trends.atRiskChange > 0 ? '+' : ''}${data.trends.atRiskChange}%`,
      isPositive: data.trends.atRiskChange <= 0, // Lower is better for at-risk
      sparklineData: generateSparklineData(data.kpis.atRiskCount),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpiData.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  change: number;
  changeLabel: string;
  isPositive: boolean;
  isPercentage?: boolean;
  isCurrency?: boolean;
  sparklineData: number[];
}

function KpiCard({
  label,
  value,
  change,
  changeLabel,
  isPositive,
  isPercentage,
  isCurrency,
  sparklineData,
}: KpiCardProps) {
  const formatValue = () => {
    if (isPercentage) return `${value}%`;
    return formatNumber(value);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Label */}
      <div className="text-xs font-medium text-muted-foreground tracking-wider mb-2">{label}</div>

      {/* Value & Change */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-3xl font-bold">{formatValue()}</div>
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span
              className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}
            >
              {changeLabel}
            </span>
          </div>
        </div>

        {/* Sparkline - Monochrome white */}
        <div className="w-24 h-12">
          <Sparkline data={sparklineData} color="#F2F2F2" />
        </div>
      </div>
    </div>
  );
}

// Helper to generate sparkline data based on current value
function generateSparklineData(currentValue: number): number[] {
  const base = Math.max(1, Math.floor(currentValue * 0.7));
  const variance = Math.max(1, Math.floor(currentValue * 0.3));

  return Array.from({ length: 8 }, (_, i) => {
    if (i === 7) return currentValue;
    return base + Math.floor(Math.random() * variance);
  });
}
