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

interface KanbanCardProps {
  task: Operation
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

  const priorityColor = {
    planning: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    active: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    on_hold: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    archived: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  }[task.status]

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
            {task.name}
          </h4>
          <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-normal", priorityColor)}>
            {task.status}
          </Badge>
          {task.missionId && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
              Mission: {task.missionId.slice(0, 8)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px]">
              {task.targetDate ? format(new Date(task.targetDate), 'MMM d') : 'No date'}
            </span>
          </div>

          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6 border-2 border-card">
              <AvatarImage src={`https://avatar.vercel.sh/${task.ownerId}`} />
              <AvatarFallback className="text-[8px]">{task.ownerId.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  )
}
