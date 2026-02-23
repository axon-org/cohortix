import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import { Sparkline } from '@/components/ui/sparkline';

interface KpiCardsProps {
  activeMissions: number;
  actionsInProgress: number;
  activeAgents: number;
  completionRate: number;
}

export function KpiCards({
  activeMissions,
  actionsInProgress,
  activeAgents,
  completionRate,
}: KpiCardsProps) {
  const kpiData = [
    {
      label: 'ACTIVE MISSIONS',
      value: activeMissions,
      change: 0,
      changeLabel: 'Missions',
      isPositive: true,
      sparklineData: [1, 2, 2, 3, 3, 3, 3, activeMissions],
    },
    {
      label: 'ACTIONS IN PROGRESS',
      value: actionsInProgress,
      change: 0,
      changeLabel: 'Actions',
      isPositive: true,
      sparklineData: [2, 3, 4, 5, 4, 5, 4, actionsInProgress],
    },
    {
      label: 'ACTIVE AGENTS',
      value: activeAgents,
      change: 0,
      changeLabel: 'AI Agents',
      isPositive: true,
      sparklineData: [2, 2, 3, 3, 4, 4, 4, activeAgents],
    },
    {
      label: 'COMPLETION RATE',
      value: completionRate,
      change: 0,
      changeLabel: `${completionRate}%`,
      isPositive: true,
      isPercentage: true,
      sparklineData: [10, 20, 30, 40, 50, 60, 70, completionRate],
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
    if (isCurrency) return formatCurrency(value);
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
