'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
  type Table as TTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Sortable Header Helper
// ============================================================================

interface SortableHeaderProps {
  column: any
  children: React.ReactNode
}

export function SortableHeader({ column, children }: SortableHeaderProps) {
  return (
    <button
      className="flex items-center gap-2 hover:text-foreground transition-colors"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      {column.getIsSorted() === 'asc' ? (
        <ChevronUp className="w-4 h-4" />
      ) : column.getIsSorted() === 'desc' ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronsUpDown className="w-4 h-4 opacity-50" />
      )}
    </button>
  )
}

// ============================================================================
// DataTable Component
// ============================================================================

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  searchKey?: string
  onRowClick?: (row: TData) => void
  enablePagination?: boolean
  pageSize?: number
  enableSelection?: boolean
  toolbar?: (table: TTable<TData>) => React.ReactNode
  emptyMessage?: string
  emptyDescription?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKey,
  onRowClick,
  enablePagination = false,
  pageSize = 20,
  enableSelection = false,
  toolbar,
  emptyMessage = 'No results found.',
  emptyDescription,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    ...(enableSelection && { onRowSelectionChange: setRowSelection }),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      ...(enableSelection && { rowSelection }),
    },
    initialState: {
      pagination: { pageSize },
    },
  })

  return (
    <div className="space-y-4">
      {/* Search & Custom Toolbar */}
      <div className="flex items-center gap-4">
        {searchKey !== undefined && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        {toolbar?.(table)}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <p className="text-muted-foreground">{emptyMessage}</p>
                  {emptyDescription && (
                    <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: Count + Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {enableSelection && Object.keys(rowSelection).length > 0
            ? `${Object.keys(rowSelection).length} of ${table.getFilteredRowModel().rows.length} selected`
            : `Showing ${table.getRowModel().rows.length} of ${data.length} result${data.length !== 1 ? 's' : ''}`}
        </div>

        {enablePagination && table.getPageCount() > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
