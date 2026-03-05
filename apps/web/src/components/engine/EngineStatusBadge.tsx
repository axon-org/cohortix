import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEngineHealth } from '@/hooks/use-engine-health';
import { Loader2 } from 'lucide-react';

interface EngineStatusBadgeProps {
  cohortId: string;
  className?: string;
}

export function EngineStatusBadge({ cohortId, className }: EngineStatusBadgeProps) {
  const { data: health, isLoading, isError } = useEngineHealth(cohortId);

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn('bg-background gap-1.5', className)}>
        <Loader2 className="h-2 w-2 animate-spin" />
        Checking
      </Badge>
    );
  }

  if (isError || !health) {
    return (
      <Badge
        variant="outline"
        className={cn('bg-background text-destructive border-destructive/50 gap-1.5', className)}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
        </span>
        Error
      </Badge>
    );
  }

  const statusConfig = {
    online: {
      label: 'Online',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    offline: {
      label: 'Offline',
      color: 'bg-slate-400',
      textColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-800',
    },
    error: {
      label: 'Error',
      color: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    provisioning: {
      label: 'Setup',
      color: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    not_connected: {
      label: 'Not Connected',
      color: 'bg-amber-500',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  };

  const config = statusConfig[health.status] || statusConfig.offline;

  return (
    <Badge
      variant="outline"
      className={cn('bg-background gap-1.5', config.textColor, config.borderColor, className)}
    >
      <span className="relative flex h-2 w-2">
        {health.status === 'online' && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              config.color
            )}
          ></span>
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', config.color)}></span>
      </span>
      {config.label}
    </Badge>
  );
}
