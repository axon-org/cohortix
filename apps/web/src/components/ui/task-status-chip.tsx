import { cn } from '@/lib/utils';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';

interface TaskStatusChipProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  backlog: {
    label: 'Backlog',
    className: 'bg-slate-500/10 text-slate-300 border border-slate-500/20',
  },
  todo: { label: 'Todo', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  },
  review: {
    label: 'Review',
    className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  },
  done: {
    label: 'Done',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  },
};

export function TaskStatusChip({ status, className }: TaskStatusChipProps) {
  const config = statusConfig[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    className: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  };
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
