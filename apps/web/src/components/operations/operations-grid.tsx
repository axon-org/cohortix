'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OperationCard } from './operation-card'
import type { Operation } from '@/lib/api/client'

interface OperationsGridProps {
  operations: Operation[]
  isLoading?: boolean
  onCreateClick?: () => void
  className?: string
}

function OperationCardSkeleton() {
  return (
    <div className="w-full min-w-[320px] max-w-[400px] animate-pulse rounded-lg border border-border bg-card p-4">
      <div className="mb-3">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
      </div>
      <div className="mb-3 flex items-center gap-2">
        <div className="h-6 w-20 rounded-full bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
      <div className="mb-4 h-4 w-16 rounded bg-muted" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="h-8 w-8 rounded-full bg-muted" />
      </div>
    </div>
  )
}

function CreateOperationCard({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full min-w-[320px] max-w-[400px] rounded-lg border border-dashed border-border bg-card/50 p-4 transition-all hover:border-foreground/20 hover:bg-card"
    >
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-muted-foreground group-hover:text-foreground">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 group-hover:bg-muted">
          <Plus className="h-6 w-6" />
        </div>
        <span className="text-sm font-medium">Create new operation</span>
      </div>
    </button>
  )
}

function EmptyState({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
        <Plus className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">No operations yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first operation
        </p>
      </div>
      {onCreateClick && (
        <button
          onClick={onCreateClick}
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]"
        >
          <Plus className="h-4 w-4" />
          Create Operation
        </button>
      )}
    </div>
  )
}

export function OperationsGrid({
  operations,
  isLoading = false,
  onCreateClick,
  className,
}: OperationsGridProps) {
  // Show loading skeletons
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-6',
          'grid-cols-1',
          'sm:grid-cols-2',
          'lg:grid-cols-3',
          'xl:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <OperationCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Show empty state
  if (operations.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />
  }

  // Show grid with operations
  return (
    <div
      className={cn(
        'grid gap-6',
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4',
        className
      )}
    >
      {operations.map((operation) => (
        <OperationCard key={operation.id} operation={operation} />
      ))}
      {onCreateClick && <CreateOperationCard onClick={onCreateClick} />}
    </div>
  )
}
