'use client'

import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, SortableHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { OperationStatusChip, type OperationStatus } from '@/components/ui/operation-status-chip'
import { formatDate } from '@/lib/utils'

export interface Operation {
  id: string
  name: string
  status: OperationStatus
  missionName?: string
  startDate?: string
  targetDate?: string
  createdAt: string
}

interface OperationsTableProps {
  data: Operation[]
}

export function OperationsTable({ data }: OperationsTableProps) {
  const columns = useMemo<ColumnDef<Operation>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
        cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <OperationStatusChip status={row.getValue('status')} />,
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        accessorKey: 'missionName',
        header: 'Mission',
        cell: ({ row }) => {
          const mission = row.getValue<string | undefined>('missionName')
          return mission ? (
            <span className="text-muted-foreground">{mission}</span>
          ) : (
            <span className="text-muted-foreground/50 italic">No mission</span>
          )
        },
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <SortableHeader column={column}>Start Date</SortableHeader>,
        cell: ({ row }) => {
          const date = row.getValue<string | undefined>('startDate')
          return date ? (
            <span className="text-muted-foreground">{formatDate(date)}</span>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )
        },
      },
      {
        accessorKey: 'targetDate',
        header: ({ column }) => <SortableHeader column={column}>Target Date</SortableHeader>,
        cell: ({ row }) => {
          const date = row.getValue<string | undefined>('targetDate')
          return date ? (
            <span className="text-muted-foreground">{formatDate(date)}</span>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )
        },
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search operations..."
      onRowClick={(operation) => {
        window.location.href = `/operations/${operation.id}`
      }}
      emptyMessage="No operations found."
      toolbar={(table) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.getColumn('status')?.setFilterValue(['active'])}
          >
            Active
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.getColumn('status')?.setFilterValue(['planning'])}
          >
            Planning
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.getColumn('status')?.setFilterValue(['completed'])}
          >
            Completed
          </Button>
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
  )
}
