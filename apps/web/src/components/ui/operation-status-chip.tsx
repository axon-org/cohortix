import { cn } from '@/lib/utils'

// Operation = Bounded initiative with start/end date that achieves a Mission
export type OperationStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'

interface OperationStatusChipProps {
  status: OperationStatus
  className?: string
}

const statusConfig: Record<OperationStatus, { label: string; className: string }> = {
  planning: { label: 'Planning', className: 'bg-blue-500/20 text-blue-400' },
  active: { label: 'Active', className: 'bg-[#10B981] text-white' },
  on_hold: { label: 'On Hold', className: 'bg-[#F59E0B] text-background' },
  completed: { label: 'Completed', className: 'bg-muted text-foreground' },
  archived: { label: 'Archived', className: 'bg-muted text-muted-foreground' },
}

export function OperationStatusChip({ status, className }: OperationStatusChipProps) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', config.className, className)}>
      {config.label}
    </span>
  )
}
