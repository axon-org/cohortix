import { cn } from '@/lib/utils';

export type CohortStatus = 'active' | 'paused' | 'at-risk' | 'completed';

interface StatusChipProps {
  status: CohortStatus;
  className?: string;
}

const statusConfig: Record<CohortStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-[#10B981] text-white',
  },
  paused: {
    label: 'Paused',
    className: 'bg-[#F59E0B] text-background',
  },
  'at-risk': {
    label: 'At-Risk',
    className: 'bg-[#EF4444] text-white',
  },
  completed: {
    label: 'Completed',
    className: 'bg-muted text-foreground',
  },
};

export function StatusChip({ status, className }: StatusChipProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
