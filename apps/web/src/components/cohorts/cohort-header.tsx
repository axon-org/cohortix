import { StatusChip, type CohortStatus } from '@/components/ui/status-chip'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface CohortHeaderProps {
  name: string
  status: CohortStatus
  startDate?: string
  endDate?: string
}

export function CohortHeader({
  name,
  status,
  startDate,
  endDate,
}: CohortHeaderProps) {
  const formatDateRange = () => {
    if (!startDate && !endDate) return null
    
    const start = startDate ? format(parseISO(startDate), 'MMM d, yyyy') : '—'
    const end = endDate ? format(parseISO(endDate), 'MMM d, yyyy') : '—'
    
    return `${start} - ${end}`
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <StatusChip status={status} />
        </div>
        {(startDate || endDate) && (
          <p className="text-sm text-muted-foreground font-mono">
            {formatDateRange()}
          </p>
        )}
      </div>
      
      <Button className="gap-2">
        <Plus className="w-4 h-4" />
        Invite AI Ally
      </Button>
    </div>
  )
}
