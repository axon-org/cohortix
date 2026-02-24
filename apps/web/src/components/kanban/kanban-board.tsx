'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { TaskDetailSheet } from './task-detail-sheet';
import { type Operation } from '@/lib/api/client';
import { useUpdateOperation } from '@/hooks/use-operations';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
  projectId?: string;
  projects?: { id: string; name: string; status: string };
  createdAt: string;
  updatedAt?: string;
};

export type KanbanStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type GroupBy = 'status' | 'mission' | 'owner';

const OPERATION_COLUMNS: { id: KanbanStatus; title: string }[] = [
  { id: 'planning', title: 'Todo' },
  { id: 'active', title: 'In Progress' },
  { id: 'on_hold', title: 'Review' },
  { id: 'completed', title: 'Done' },
];

const TASK_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'Todo' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

interface KanbanBoardProps {
  initialTasks: Operation[] | Task[];
  groupBy?: GroupBy;
}

export function KanbanBoard({ initialTasks, groupBy = 'status' }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<(Operation | Task)[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Operation | Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Operation | Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const updateOperation = useUpdateOperation();
  const isTaskView = initialTasks.length > 0 && initialTasks[0] && 'title' in initialTasks[0];

  // Type guard to check if item is an Operation
  const isOperation = (item: Operation | Task): item is Operation => {
    return 'missionId' in item && 'ownerId' in item;
  };

  // Dynamic columns based on grouping
  const columns = useMemo(() => {
    if (groupBy === 'status') return isTaskView ? TASK_COLUMNS : OPERATION_COLUMNS;

    // For Mission or Agent, we extract unique IDs from tasks
    const uniqueIds = Array.from(
      new Set(
        tasks.map((t) => {
          if (groupBy === 'mission') {
            return isOperation(t) ? t.missionId || 'unassigned' : 'unassigned';
          }
          return isOperation(t) ? t.ownerId : t.assigneeId || undefined;
        })
      )
    );

    return uniqueIds
      .filter((id): id is string => id !== undefined)
      .map((id) => ({
        id: id as any,
        title: id === 'unassigned' ? 'No Mission' : id.length > 8 ? id.slice(0, 8) : id,
      }));
  }, [groupBy, tasks, isTaskView]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tasksByGroup = useMemo(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.id] = tasks.filter((t) => {
          if (groupBy === 'status') return t.status === col.id;
          if (groupBy === 'mission') {
            const missionId = 'missionId' in t ? t.missionId : undefined;
            return (missionId || 'unassigned') === col.id;
          }
          const ownerId = 'ownerId' in t ? t.ownerId : 'assigneeId' in t ? t.assigneeId : undefined;
          return ownerId === col.id;
        });
        return acc;
      },
      {} as Record<string, (Operation | Task)[]>
    );
  }, [tasks, columns, groupBy]);

  function handleCardClick(task: Operation | Task) {
    setSelectedTask(task);
    setIsSheetOpen(true);
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveATask) return;

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (activeIndex === -1 || overIndex === -1) return tasks;

        if (groupBy === 'status' && tasks[activeIndex]!.status !== tasks[overIndex]!.status) {
          tasks[activeIndex]!.status = tasks[overIndex]!.status;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Dropping a Task over a Column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return tasks;

        const task = tasks[activeIndex];
        if (!task) return tasks;

        if (groupBy === 'status') {
          task.status = overId as string;
        } else if (groupBy === 'mission' && isOperation(task)) {
          task.missionId = overId === 'unassigned' ? undefined : String(overId);
        } else if (groupBy === 'owner' && isOperation(task)) {
          task.ownerId = String(overId);
        }
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id;
    const activeTask = tasks.find((t) => t.id === activeId);

    if (activeTask && isOperation(activeTask)) {
      const updateData: Partial<Operation> = {};
      if (groupBy === 'status') updateData.status = activeTask.status as KanbanStatus;
      if (groupBy === 'mission') updateData.missionId = activeTask.missionId;
      if (groupBy === 'owner') updateData.ownerId = activeTask.ownerId;

      updateOperation.mutate({
        id: activeTask.id,
        data: updateData as any,
      });
    }

    setActiveTask(null);
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

        <DragOverlay>{activeTask ? <KanbanCard task={activeTask} /> : null}</DragOverlay>
      </DndContext>

      <TaskDetailSheet task={selectedTask} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </div>
  );
}
