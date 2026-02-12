import { cn } from '@/lib/utils'

export type AgentStatus = 'active' | 'idle' | 'busy' | 'offline' | 'error'

interface AgentStatusChipProps {
  status: AgentStatus
  className?: string
}

const statusConfig: Record<AgentStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-[#10B981] text-white' },
  idle: { label: 'Idle', className: 'bg-muted text-foreground' },
  busy: { label: 'Busy', className: 'bg-[#F59E0B] text-background' },
  offline: { label: 'Offline', className: 'bg-muted text-muted-foreground' },
  error: { label: 'Error', className: 'bg-[#EF4444] text-white' },
}

export function AgentStatusChip({ status, className }: AgentStatusChipProps) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', config.className, className)}>
      {config.label}
    </span>
  )
}
