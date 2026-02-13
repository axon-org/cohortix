'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type Operation } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'

type Task = {
  id: string
  title: string
  status: string
  priority?: string
  dueDate?: string
  assigneeId?: string
  projectId?: string
  projects?: { id: string; name: string; status: string }
}

interface KanbanCardProps {
  task: Operation | Task
  onClick?: () => void
}

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    // We only trigger onClick if it's a simple click, not a drag start
    // However, dnd-kit uses pointer events too. 
    // A better way is to let the user click the card and distinguish from drag.
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-accent/10 border-2 border-primary/50 border-dashed rounded-lg h-[120px] opacity-50"
      />
    )
  }

  const isTask = 'title' in task
  const displayName = isTask ? task.title : task.name
  const displayStatus = task.status
  const displayDate = isTask ? task.dueDate : task.targetDate
  const displayOwnerId = isTask ? task.assigneeId : task.ownerId

  const operationStatusColors = {
    planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    active: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
    on_hold: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    archived: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  }

  const taskStatusColors = {
    backlog: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    todo: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    in_progress: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    review: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    done: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const priorityColors = {
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    high: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const statusColor = isTask 
    ? (taskStatusColors as any)[displayStatus] || taskStatusColors.backlog
    : (operationStatusColors as any)[displayStatus] || operationStatusColors.planning

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group relative bg-card hover:bg-accent/50 border border-border rounded-lg p-4 shadow-sm transition-all cursor-grab active:cursor-grabbing",
        "hover:border-primary/30"
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight line-clamp-2">
            {displayName}
          </h4>
          <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-normal", statusColor)}>
            {displayStatus.replace('_', ' ')}
          </Badge>
          {isTask && task.priority && (
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-normal", (priorityColors as any)[task.priority])}>
              {task.priority}
            </Badge>
          )}
          {isTask && task.projects && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
              {task.projects.name}
            </span>
          )}
          {!isTask && (task as any).missions && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {(task as any).missions.title}
            </span>
          )}
          {!isTask && (task as any).task_count?.[0]?.count > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {(task as any).task_count[0].count} tasks
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px]">
              {displayDate ? format(new Date(displayDate), 'MMM d') : 'No date'}
            </span>
          </div>

          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6 border-2 border-card">
              <AvatarImage src={`https://avatar.vercel.sh/${displayOwnerId}`} />
              <AvatarFallback className="text-[8px]">{(displayOwnerId || 'NA').slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  )
}
