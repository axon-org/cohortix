'use client'

import React, { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStart,
  DragOver,
  DragEnd,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { type Operation } from '@/lib/api/client'
import { useUpdateOperation } from '@/hooks/use-operations'

export type KanbanStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'

const COLUMNS: { id: KanbanStatus; title: string }[] = [
  { id: 'planning', title: 'Todo' },
  { id: 'active', title: 'In Progress' },
  { id: 'on_hold', title: 'Review' },
  { id: 'completed', title: 'Done' },
]

interface KanbanBoardProps {
  initialTasks: Operation[]
}

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Operation[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Operation | null>(null)
  
  const updateOperation = useUpdateOperation()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const tasksByStatus = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id)
      return acc
    }, {} as Record<KanbanStatus, Operation[]>)
  }, [tasks])

  function handleDragStart(event: DragStart) {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  function handleDragOver(event: DragOver) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveATask = active.data.current?.type === 'Task'
    const isOverATask = over.data.current?.type === 'Task'
    const isOverAColumn = over.data.current?.type === 'Column'

    if (!isActiveATask) return

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        const overIndex = tasks.findIndex((t) => t.id === overId)

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status
          return arrayMove(tasks, activeIndex, overIndex - 1)
        }

        return arrayMove(tasks, activeIndex, overIndex)
      })
    }

    // Dropping a Task over a Column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        tasks[activeIndex].status = overId as KanbanStatus
        return arrayMove(tasks, activeIndex, activeIndex)
      })
    }
  }

  function handleDragEnd(event: DragEnd) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeTask = tasks.find((t) => t.id === activeId)
    if (activeTask) {
      // API Call for persistence (optimistic update already happened in state)
      updateOperation.mutate({
        id: activeTask.id,
        data: { status: activeTask.status },
      })
    }

    setActiveTask(null)
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 items-start">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasksByStatus[col.id] || []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
