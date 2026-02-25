'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, ChevronDown, Filter, ArrowUpDown } from 'lucide-react';
import { useMyTasks } from '@/hooks/use-my-tasks';
import { type Task } from '@/lib/api/client';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { TaskStatusChip, type TaskStatus } from '@/components/ui/task-status-chip';

const STATUS_FILTERS: Array<{ label: string; value: TaskStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Backlog', value: 'backlog' },
  { label: 'Todo', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Review', value: 'review' },
  { label: 'Done', value: 'done' },
];

const PRIORITY_FILTERS: Array<{
  label: string;
  value: 'low' | 'medium' | 'high' | 'urgent' | 'all';
}> = [
  { label: 'All', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const SORT_OPTIONS: Array<{ label: string; value: 'due_date' | 'priority' | 'updated_at' }> = [
  { label: 'Due Date', value: 'due_date' },
  { label: 'Priority', value: 'priority' },
  { label: 'Recently Updated', value: 'updated_at' },
];

const priorityClasses: Record<NonNullable<Task['priority']>, string> = {
  low: 'bg-slate-500/10 text-slate-300 border border-slate-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  high: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  urgent: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

interface MyTasksPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default function MyTasksPage({ params }: MyTasksPageProps) {
  const { orgSlug } = use(params);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<
    'low' | 'medium' | 'high' | 'urgent' | 'all'
  >('all');
  const [sort, setSort] = useState<'due_date' | 'priority' | 'updated_at'>('due_date');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const queryParams = useMemo(() => {
    return {
      status: statusFilter === 'all' ? undefined : statusFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      sort,
      limit: 200,
    };
  }, [statusFilter, priorityFilter, sort]);

  const { data, isLoading, error } = useMyTasks(queryParams);

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; tasks: Task[]; href?: string }>();

    data?.data?.forEach((task) => {
      const projectId = task.project_id ?? 'unassigned';
      const projectName = task.projects?.name ?? 'Unassigned Operation';
      const group = groups.get(projectId);
      if (!group) {
        groups.set(projectId, {
          id: projectId,
          name: projectName,
          href: task.project_id ? `/${orgSlug}/operations/${task.project_id}` : undefined,
          tasks: [task],
        });
      } else {
        group.tasks.push(task);
      }
    });

    return Array.from(groups.values());
  }, [data?.data, orgSlug]);

  useEffect(() => {
    if (!groupedTasks.length) return;
    setOpenGroups(new Set(groupedTasks.map((group) => group.id)));
  }, [groupedTasks]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  if (isLoading) {
    return <MyTasksSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <p className="text-destructive font-medium">Failed to load tasks</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
          <CheckSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">My Tasks</h1>
        <p className="text-muted-foreground mb-4 max-w-md">No tasks assigned to you yet</p>
      </div>
    );
  }

  const currentStatusLabel = STATUS_FILTERS.find((s) => s.value === statusFilter)?.label ?? 'All';
  const currentPriorityLabel =
    PRIORITY_FILTERS.find((p) => p.value === priorityFilter)?.label ?? 'All';
  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label ?? 'Due Date';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Personal view of all tasks assigned to you across all operations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Status: {currentStatusLabel}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {STATUS_FILTERS.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setStatusFilter(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Priority: {currentPriorityLabel}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {PRIORITY_FILTERS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setPriorityFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Sort: {currentSortLabel}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setSort(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSort('due_date')}>Reset</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">
        {groupedTasks.map((group) => {
          const isOpen = openGroups.has(group.id);
          return (
            <div key={group.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
                  />
                  <span className="font-medium text-sm">{group.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {group.tasks.length}
                  </Badge>
                </div>
                {group.href && (
                  <Link
                    href={group.href}
                    onClick={(event) => event.stopPropagation()}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View Operation
                  </Link>
                )}
              </button>

              {isOpen && (
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-4">Task</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Priority</div>
                    <div className="col-span-3">Operation</div>
                    <div className="col-span-1 text-right">Due</div>
                  </div>
                  {group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 text-sm items-center hover:bg-secondary/20 transition-colors"
                    >
                      <div className="col-span-4">
                        {task.project_id ? (
                          <Link
                            href={`/${orgSlug}/operations/${task.project_id}`}
                            className="font-medium hover:text-foreground transition-colors"
                          >
                            {task.title}
                          </Link>
                        ) : (
                          <span className="font-medium">{task.title}</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <TaskStatusChip status={task.status} />
                      </div>
                      <div className="col-span-2">
                        {task.priority ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-2 py-0.5 font-normal',
                              priorityClasses[task.priority]
                            )}
                          >
                            {task.priority}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                      <div className="col-span-3">
                        {group.href ? (
                          <Link
                            href={group.href}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {group.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{group.name}</span>
                        )}
                      </div>
                      <div className="col-span-1 text-right text-muted-foreground">
                        {task.due_date ? formatDate(task.due_date) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MyTasksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
