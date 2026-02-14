'use client'

import { useRouter } from 'next/navigation'
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OperationStatusChip } from '@/components/ui/operation-status-chip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Operation } from '@/lib/api/client'

interface OperationCardProps {
  operation: Operation
  className?: string
}

const priorityConfig = {
  urgent: { 
    label: 'Urgent', 
    icon: TrendingUp, 
    className: 'text-red-500' 
  },
  high: { 
    label: 'High', 
    icon: TrendingUp, 
    className: 'text-orange-500' 
  },
  medium: { 
    label: 'Medium', 
    icon: Minus, 
    className: 'text-blue-500' 
  },
  low: { 
    label: 'Low', 
    icon: TrendingDown, 
    className: 'text-gray-500' 
  },
}

// Mock data for demo - in real app, these would come from API
const getMockMetadata = (operation: Operation) => {
  const metadata = [
    operation.settings?.client || 'Internal',
    operation.settings?.type || 'Project',
    operation.settings?.duration || '2 weeks',
  ]
  return metadata.filter(Boolean).join(' • ')
}

const getMockProgress = (operation: Operation) => {
  // Mock progress data - would come from API
  if (operation.status === 'completed') return { completed: 5, total: 5, percent: 100 }
  if (operation.status === 'active') return { completed: 2, total: 5, percent: 40 }
  if (operation.status === 'planning') return { completed: 0, total: 4, percent: 0 }
  return { completed: 1, total: 3, percent: 33 }
}

const getMockPriority = (operation: Operation) => {
  return (operation.settings?.priority || 'medium') as keyof typeof priorityConfig
}

export function OperationCard({ operation, className }: OperationCardProps) {
  const router = useRouter()
  const metadata = getMockMetadata(operation)
  const progress = getMockProgress(operation)
  const priority = getMockPriority(operation)
  const priorityInfo = priorityConfig[priority]
  const PriorityIcon = priorityInfo.icon

  const handleClick = () => {
    router.push(`/operations/${operation.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative w-full min-w-[320px] max-w-[400px] cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:scale-[1.02] hover:shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground line-clamp-1">
          {operation.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {metadata}
        </p>
      </div>

      {/* Status & Date Row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <OperationStatusChip status={operation.status} />
        {operation.targetDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(operation.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Priority Row */}
      <div className="mb-4 flex items-center gap-1.5">
        <PriorityIcon className={cn('h-4 w-4', priorityInfo.className)} />
        <span className={cn('text-sm font-medium', priorityInfo.className)}>
          {priorityInfo.label}
        </span>
      </div>

      {/* Footer: Progress & Avatar */}
      <div className="flex items-center justify-between">
        {/* Progress Ring & Tasks */}
        <div className="flex items-center gap-3">
          {/* Progress Ring */}
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90 transform">
              {/* Background circle */}
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress.percent / 100)}`}
                strokeLinecap="round"
                className={cn(
                  'transition-all duration-300',
                  progress.percent === 100 ? 'text-green-500' :
                  progress.percent > 50 ? 'text-blue-500' :
                  progress.percent > 0 ? 'text-orange-500' :
                  'text-muted-foreground'
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold">
                {progress.percent}%
              </span>
            </div>
          </div>

          {/* Task Count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-mono">{progress.completed} / {progress.total}</span>
            <span>Tasks</span>
          </div>
        </div>

        {/* Assignee Avatar */}
        <Avatar type={operation.ownerType === 'agent' ? 'ai' : 'human'} className="h-8 w-8">
          <AvatarImage src={operation.settings?.avatarUrl as string} />
          <AvatarFallback className="text-xs">
            {operation.settings?.ownerName 
              ? (operation.settings.ownerName as string).split(' ').map(n => n[0]).join('').toUpperCase()
              : operation.ownerType === 'agent' ? 'AI' : 'U'
            }
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
