'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable, SortableHeader } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { AgentStatusChip, type AgentStatus } from '@/components/ui/agent-status-chip';
import { formatDate } from '@/lib/utils';

export interface AgentRow {
  id: string;
  name: string;
  role: string | null;
  status: AgentStatus;
  capabilities: string[];
  totalTasksCompleted: number;
  lastActiveAt: string | null;
}

interface AgentsTableProps {
  data: AgentRow[];
}

export function AgentsTable({ data }: AgentsTableProps) {
  const columns = useMemo<ColumnDef<AgentRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{row.getValue('name')}</span>
            {row.original.role && (
              <p className="text-xs text-muted-foreground">{row.original.role}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <AgentStatusChip status={row.getValue('status')} />,
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        accessorKey: 'capabilities',
        header: 'Capabilities',
        cell: ({ row }) => {
          const caps = row.getValue<string[]>('capabilities');
          if (!caps?.length) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {caps.slice(0, 3).map((cap) => (
                <span key={cap} className="px-2 py-0.5 text-xs bg-secondary rounded-md">
                  {cap}
                </span>
              ))}
              {caps.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                  +{caps.length - 3}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'totalTasksCompleted',
        header: ({ column }) => <SortableHeader column={column}>Tasks Done</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono">
            {row.getValue<number>('totalTasksCompleted').toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'lastActiveAt',
        header: 'Last Active',
        cell: ({ row }) => {
          const date = row.getValue<string | null>('lastActiveAt');
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
      searchKey="name"
      searchPlaceholder="Search agents..."
      onRowClick={(agent) => {
        window.location.href = `/agents/${agent.id}`;
      }}
      emptyMessage="No agents found."
      toolbar={(table) => (
        <div className="flex items-center gap-2">
          {(['active', 'idle', 'busy', 'offline'] as const).map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => table.getColumn('status')?.setFilterValue([s])}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
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
