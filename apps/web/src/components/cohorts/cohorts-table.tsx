'use client'

import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, SortableHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { StatusChip, type CohortStatus } from '@/components/ui/status-chip'
import { formatDate } from '@/lib/utils'

export interface Cohort {
  id: string
  name: string
  status: CohortStatus
  members: number
  engagement: number
  startDate: string
}

interface CohortsTableProps {
  data: Cohort[]
}

export function CohortsTable({ data }: CohortsTableProps) {
  const columns = useMemo<ColumnDef<Cohort>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
        cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusChip status={row.getValue('status')} />,
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      {
        accessorKey: 'members',
        header: ({ column }) => <SortableHeader column={column}>Members</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono">
            {row.getValue<number>('members').toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'engagement',
        header: ({ column }) => <SortableHeader column={column}>Engagement</SortableHeader>,
        cell: ({ row }) => {
          const engagement = row.getValue<number>('engagement')
          return (
            <div className="flex items-center gap-2">
              <span className="font-mono">{engagement}%</span>
              <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: `${engagement}%` }} />
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <SortableHeader column={column}>Start Date</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.getValue('startDate'))}</span>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search cohorts..."
      onRowClick={(cohort) => {
        window.location.href = `/cohorts/${cohort.id}`
      }}
      emptyMessage="No cohorts found."
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
            onClick={() => table.getColumn('status')?.setFilterValue(['paused'])}
          >
            Paused
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.getColumn('status')?.setFilterValue(['at-risk'])}
          >
            At-Risk
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
