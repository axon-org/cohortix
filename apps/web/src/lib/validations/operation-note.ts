/**
 * Operation Note Validation Schemas
 * Operations Redesign feature
 */

import { z } from 'zod'

export const noteTypeEnum = z.enum(['document', 'pinned', 'important'])
export type NoteType = z.infer<typeof noteTypeEnum>

export const noteStatusEnum = z.enum(['processing', 'completed'])
export type NoteStatus = z.infer<typeof noteStatusEnum>

export const createOperationNoteSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  content: z.string().max(50000).optional().nullable(),
  noteType: noteTypeEnum.default('document'),
  status: noteStatusEnum.default('processing'),
})

export type CreateOperationNoteInput = z.infer<typeof createOperationNoteSchema>

export const updateOperationNoteSchema = z.object({
  title: z.string().min(1).max(255).trim().optional(),
  content: z.string().max(50000).optional().nullable(),
  noteType: noteTypeEnum.optional(),
  status: noteStatusEnum.optional(),
})

export type UpdateOperationNoteInput = z.infer<typeof updateOperationNoteSchema>

export const operationNoteQuerySchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  noteType: noteTypeEnum.optional(),
  status: noteStatusEnum.optional(),
})

export type OperationNoteQueryParams = z.infer<typeof operationNoteQuerySchema>
