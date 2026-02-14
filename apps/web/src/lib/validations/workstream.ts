/**
 * Workstream Validation Schemas
 * Operations Redesign feature
 */

import { z } from 'zod'

export const createWorkstreamSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  description: z.string().max(10000).optional().nullable(),
  position: z.number().int().min(0).default(0),
})

export type CreateWorkstreamInput = z.infer<typeof createWorkstreamSchema>

export const updateWorkstreamSchema = z.object({
  name: z.string().min(3).max(255).trim().optional(),
  description: z.string().max(10000).optional().nullable(),
  position: z.number().int().min(0).optional(),
  totalTasks: z.number().int().min(0).optional(),
  completedTasks: z.number().int().min(0).optional(),
})

export type UpdateWorkstreamInput = z.infer<typeof updateWorkstreamSchema>

export const workstreamQuerySchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
})

export type WorkstreamQueryParams = z.infer<typeof workstreamQuerySchema>
