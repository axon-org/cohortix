'use client';

import React, { useMemo, useState } from 'react';
import { type Task } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { TaskStatusChip } from '@/components/ui/task-status-chip';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, ChevronDown, List, Clock, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MyTasksTableProps {
  tasks: Task[];
  groupBy: string;
}

const priorityColors = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const sourceColors = {
  personal: 'bg-blue-600/10 text-blue-500 border-blue-600/20',
  org: 'bg-purple-600/10 text-purple-500 border-purple-600/20',
};

export function MyTasksTable({ tasks, groupBy }: MyTasksTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();
    
    tasks.forEach((task) => {
      let groupKey = 'Other';
      if (groupBy === 'status') groupKey = task.status;
      if (groupBy === 'priority') groupKey = task.priority || 'No Priority';
      if (groupBy === 'cohort') groupKey = task.cohort_id || 'Personal';
      
      const current = groups.get(groupKey) || [];
      groups.set(groupKey, [...current, task]);
    });
    
    return Array.from(groups.entries()).map(([key, list]) => ({
      key,
      tasks: list,
    }));
  }, [tasks, groupBy]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      {groupedTasks.map((group) => (
        <div key={group.key} className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => toggleGroup(group.key)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedGroups.has(group.key) ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-semibold capitalize text-sm tracking-tight">{group.key.replace(/_/g, ' ')}</span>
              <Badge variant="secondary" className="px-1.5 h-5 text-[10px] bg-muted/50">
                {group.tasks.length}
              </Badge>
            </div>
          </button>
          
          {expandedGroups.has(group.key) && (
            <div className="divide-y divide-border border-t border-border">
              {group.tasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                  No tasks in this group.
                </div>
              ) : (
                group.tasks.map((task) => (
                  <div key={task.id} className="group grid grid-cols-12 items-center p-4 gap-4 hover:bg-muted/30 transition-colors">
                    <div className="col-span-12 md:col-span-5 flex items-start gap-3">
                      <div className="mt-1 h-4 w-4 rounded-full border-2 border-muted flex items-center justify-center group-hover:border-primary transition-colors cursor-pointer" />
                      <div className="flex flex-col gap-1">
                        <Link 
                          href={task.cohort_id ? `/cohorts/${task.cohort_id}/tasks/${task.id}` : `/my-tasks/${task.id}`}
                          className="font-medium text-sm hover:text-primary transition-colors"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          <span>T-{task.id.split('-')[0]}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>Updated {formatDistanceToNow(new Date(task.updated_at || ''))} ago</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-6 md:col-span-2">
                      <TaskStatusChip status={task.status as any} />
                    </div>
                    
                    <div className="col-span-6 md:col-span-2 flex items-center gap-2">
                      {task.priority && (
                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", priorityColors[task.priority as keyof typeof priorityColors])}>
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="col-span-12 md:col-span-3 flex items-center justify-end gap-2">
                      <Badge variant="outline" className={cn("text-[10px] uppercase font-bold border-dashed", task.cohort_id ? sourceColors.org : sourceColors.personal)}>
                        {task.cohort_id ? 'Organization' : 'Personal'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
