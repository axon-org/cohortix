'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { MissionStatusChip, type MissionStatus } from '@/components/ui/mission-status-chip';
import { formatDate } from '@/lib/utils';

export interface MissionRow {
  id: string;
  name?: string;
  title?: string;
  status: MissionStatus;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  operationCount?: number;
  progress?: number;
}

interface MissionsTableProps {
  data: MissionRow[];
}

export function MissionsTable({ data }: MissionsTableProps) {
  const columns = useMemo<ColumnDef<MissionRow>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
        cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <MissionStatusChip status={row.getValue('status')} />,
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        accessorKey: 'operationCount',
        header: 'Operations',
        cell: ({ row }) => {
          const count = row.getValue<number>('operationCount');
          return <span className="text-muted-foreground">{count ?? 0}</span>;
        },
      },
      {
        accessorKey: 'progress',
        header: 'Progress',
        cell: ({ row }) => {
          const progress = row.getValue<number>('progress');
          return (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">{progress ?? 0}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <SortableHeader column={column}>Start Date</SortableHeader>,
        cell: ({ row }) => {
          const date = row.getValue<string | null>('startDate');
          return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>;
        },
      },
      {
        accessorKey: 'targetDate',
        header: ({ column }) => <SortableHeader column={column}>Target Date</SortableHeader>,
        cell: ({ row }) => {
          const date = row.getValue<string | null>('targetDate');
          return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>;
        },
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed',
        cell: ({ row }) => {
          const date = row.getValue<string | null>('completedAt');
          return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>;
        },
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="title"
      searchPlaceholder="Search missions..."
      onRowClick={(mission) => {
        window.location.href = `/missions/${mission.id}`;
      }}
      emptyMessage="No missions found."
      toolbar={(table) => (
        <div className="flex items-center gap-2">
          {(['planning', 'active', 'on_hold', 'completed'] as const).map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => table.getColumn('status')?.setFilterValue([s])}
            >
              {s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.getColumn('status')?.setFilterValue(undefined)}
          >
            All
          </Button>
        </div>
      )}
    />
  );
}
