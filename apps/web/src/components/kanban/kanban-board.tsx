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
import { TaskDetailSheet } from './task-detail-sheet'
import { type Operation } from '@/lib/api/client'
import { useUpdateOperation } from '@/hooks/use-operations'

export type KanbanStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
export type GroupBy = 'status' | 'mission' | 'owner'

const COLUMNS: { id: KanbanStatus; title: string }[] = [
  { id: 'planning', title: 'Todo' },
  { id: 'active', title: 'In Progress' },
  { id: 'on_hold', title: 'Review' },
  { id: 'completed', title: 'Done' },
]

interface KanbanBoardProps {
  initialTasks: Operation[]
  groupBy?: GroupBy
}

export function KanbanBoard({ initialTasks, groupBy = 'status' }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Operation[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Operation | null>(null)
  const [selectedTask, setSelectedTask] = useState<Operation | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  const updateOperation = useUpdateOperation()

  // Dynamic columns based on grouping
  const columns = useMemo(() => {
    if (groupBy === 'status') return COLUMNS
    
    // For Mission or Ally, we extract unique IDs from tasks
    const uniqueIds = Array.from(new Set(tasks.map(t => 
      groupBy === 'mission' ? (t.missionId || 'unassigned') : t.ownerId
    )))
    
    return uniqueIds.map(id => ({
      id: id as any,
      title: id === 'unassigned' ? 'No Mission' : (id.length > 8 ? id.slice(0, 8) : id)
    }))
  }, [groupBy, tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const tasksByGroup = useMemo(() => {
    return columns.reduce((acc, col) => {
      acc[col.id] = tasks.filter((t) => {
        if (groupBy === 'status') return t.status === col.id
        if (groupBy === 'mission') return (t.missionId || 'unassigned') === col.id
        return t.ownerId === col.id
      })
      return acc
    }, {} as Record<string, Operation[]>)
  }, [tasks, columns, groupBy])

  function handleCardClick(task: Operation) {
    setSelectedTask(task)
    setIsSheetOpen(true)
  }

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

        if (groupBy === 'status' && tasks[activeIndex].status !== tasks[overIndex].status) {
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
        if (groupBy === 'status') {
          tasks[activeIndex].status = overId as KanbanStatus
        } else if (groupBy === 'mission') {
          tasks[activeIndex].missionId = overId === 'unassigned' ? undefined : String(overId)
        } else {
          tasks[activeIndex].ownerId = String(overId)
        }
        return arrayMove(tasks, activeIndex, activeIndex)
      })
    }
  }

  function handleDragEnd(event: DragEnd) {
    const { active, over } = event
    if (!over) {
      setActiveTask(null)
      return
    }

    const activeId = active.id
    const activeTask = tasks.find((t) => t.id === activeId)
    
    if (activeTask) {
      const updateData: Partial<Operation> = {}
      if (groupBy === 'status') updateData.status = activeTask.status
      if (groupBy === 'mission') updateData.missionId = activeTask.missionId
      if (groupBy === 'owner') updateData.ownerId = activeTask.ownerId

      updateOperation.mutate({
        id: activeTask.id,
        data: updateData as any,
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
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasksByGroup[col.id] || []}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailSheet 
        task={selectedTask} 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
      />
    </div>
  )
}

