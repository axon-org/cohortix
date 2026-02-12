'use client'

import { useState } from 'react'
import { Button } from './button'
import { Trash2, X } from 'lucide-react'

interface DeleteDialogProps {
  title: string
  description: string
  onConfirm: () => void
  isDeleting?: boolean
  trigger?: React.ReactNode
}

export function DeleteDialog({
  title,
  description,
  onConfirm,
  isDeleting,
  trigger,
}: DeleteDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-lg p-6 w-full max-w-sm shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-secondary text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{description}</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => {
                  onConfirm()
                  setOpen(false)
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
