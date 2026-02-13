'use client'

import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, SortableHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { OperationStatusChip, type OperationStatus } from '@/components/ui/operation-status-chip'
import { formatDate } from '@/lib/utils'

// Operations = Bounded initiatives with start/end dates that achieve Missions
export interface OperationRow {
  id: string
  name: string
  status: OperationStatus
  startDate: string | null
  targetDate: string | null
  completedAt: string | null
}

interface OperationsTableProps {
  data: OperationRow[]
}

// Legacy alias for backwards compatibility
export type MissionRow = OperationRow
export type MissionsTableProps = OperationsTableProps

export function OperationsTable({ data }: OperationsTableProps) {
  const columns = useMemo<ColumnDef<OperationRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column}>Operation Name</SortableHeader>,
        cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <OperationStatusChip status={row.getValue('status')} />,
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <SortableHeader column={column}>Start Date</SortableHeader>,
        cell: ({ row }) => {
          const date = row.getValue<string | null>('startDate')
          return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>
        },
      },
      {
        accessorKey: 'targetDate',
        header: ({ column }) => <SortableHeader column={column}>Target Date</SortableHeader>,
        cell: ({ row }) => {
          const date = row.getValue<string | null>('targetDate')
          return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>
        },
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed',
        cell: ({ row }) => {
          const date = row.getValue<string | null>('completedAt')
          return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>
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
      onRowClick={(operation) => { window.location.href = `/operations/${operation.id}` }}
      emptyMessage="No operations found. Operations are bounded initiatives with start/end dates that achieve Missions."
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
          <Button variant="outline" size="sm" onClick={() => table.getColumn('status')?.setFilterValue(undefined)}>
            All
          </Button>
        </div>
      )}
    />
  )
}

// Legacy alias for backwards compatibility
export const MissionsTable = OperationsTable
