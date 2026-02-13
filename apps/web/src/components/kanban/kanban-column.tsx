'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanCard } from './kanban-card'
import { type Operation } from '@/lib/api/client'
import { type KanbanStatus } from './kanban-board'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Operation[]
  onCardClick?: (task: Operation) => void
}

export function KanbanColumn({ id, title, tasks, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: 'Column',
      id,
    },
  })

  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="flex flex-col w-[320px] bg-muted/30 rounded-lg border border-border/50 max-h-full">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono">
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-3 overflow-y-auto min-h-[150px] transition-colors",
          isOver && "bg-muted/50"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onCardClick?.(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
