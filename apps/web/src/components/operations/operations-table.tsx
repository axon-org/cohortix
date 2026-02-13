'use client'

import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, SortableHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { OperationStatusChip, type OperationStatus } from '@/components/ui/operation-status-chip'
import { formatDate } from '@/lib/utils'
import { type Mission, type Ally } from '@/lib/api/client'
import { ChevronDown, Filter, MoreVertical } from 'lucide-react'
import { useUpdateOperation } from '@/hooks/use-operations'

export interface Operation {
  id: string
  name: string
  status: OperationStatus
  missionName?: string
  ownerName?: string
  startDate?: string
  targetDate?: string
  createdAt: string
}

interface OperationsTableProps {
  data: Operation[]
  missions: Mission[]
  allies: Ally[]
}

export function OperationsTable({ data, missions, allies }: OperationsTableProps) {
  const updateOperation = useUpdateOperation()
  const [rowSelection, setRowSelection] = useState({})

  const columns = useMemo<ColumnDef<Operation>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
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
          return (
            <span className="text-muted-foreground">
              {mission || <span className="text-muted-foreground/50 italic">No mission</span>}
            </span>
          )
        },
      },
      {
        accessorKey: 'ownerName',
        header: 'Ally',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.getValue('ownerName')}</span>
        ),
      },
      {
        accessorKey: 'targetDate',
        header: ({ column }) => <SortableHeader column={column}>Due Date</SortableHeader>,
        cell: ({ row }) => {
          const date = row.getValue<string | undefined>('targetDate')
          return date ? (
            <span className="text-muted-foreground">{formatDate(date)}</span>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = `/operations/${row.original.id}`}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  )

  const handleBulkStatusChange = (status: OperationStatus, table: any) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    selectedRows.forEach((row: any) => {
      updateOperation.mutate({
        id: row.original.id,
        data: { status },
      })
    })
    table.resetRowSelection()
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search operations..."
      enableSelection={true}
      onRowClick={(operation) => {
        // We might want to open the sheet here instead of redirect
        // window.location.href = `/operations/${operation.id}`
      }}
      toolbar={(table) => {
        const selectedCount = table.getFilteredSelectedRowModel().rows.length
        
        return (
          <div className="flex items-center gap-2">
            {selectedCount > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-primary/50 bg-primary/5">
                    Update {selectedCount} Selected
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('active', table)}>
                    Set to Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('planning', table)}>
                    Set to Planning
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('completed', table)}>
                    Set to Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue(['active'])}>
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue(['planning'])}>
                      Planning
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue(['completed'])}>
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue(undefined)}>
                      All Statuses
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Mission
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                    {missions.map(m => (
                      <DropdownMenuItem 
                        key={m.id} 
                        onClick={() => table.getColumn('missionName')?.setFilterValue(m.name)}
                      >
                        {m.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => table.getColumn('missionName')?.setFilterValue(undefined)}>
                      All Missions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Ally
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                    {allies.map(a => (
                      <DropdownMenuItem 
                        key={a.id} 
                        onClick={() => table.getColumn('ownerName')?.setFilterValue(a.name)}
                      >
                        {a.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => table.getColumn('ownerName')?.setFilterValue(undefined)}>
                      All Allies
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )
      }}
    />
  )
}
