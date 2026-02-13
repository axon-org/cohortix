import { cn } from '@/lib/utils'

// Operation = Bounded initiative with start/end date that achieves a Mission
export type OperationStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'

interface OperationStatusChipProps {
  status: OperationStatus
  className?: string
}

const statusConfig: Record<OperationStatus, { label: string; className: string }> = {
  planning: { label: 'Planning', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  active: { label: 'Active', className: 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' },
  on_hold: { label: 'On Hold', className: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' },
  completed: { label: 'Completed', className: 'bg-muted/30 text-muted-foreground border border-border' },
  archived: { label: 'Archived', className: 'bg-muted/10 text-muted-foreground/70 border border-border/50' },
}

export function OperationStatusChip({ status, className }: OperationStatusChipProps) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', config.className, className)}>
      {config.label}
    </span>
  )
}
