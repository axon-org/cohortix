/**
 * Mission (Project) Validation Schemas
 * Follows same pattern as cohort validations.
 */

import { z } from 'zod'

export const missionStatusEnum = z.enum(['planning', 'active', 'on_hold', 'completed', 'archived'])
export type MissionStatus = z.infer<typeof missionStatusEnum>

export const createMissionSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  description: z.string().max(10000).optional(),
  status: missionStatusEnum.default('planning'),
  cohortId: z.string().uuid().optional().nullable(),
  goalId: z.string().uuid().optional().nullable(),
  startDate: z.string().date('Invalid date format (use YYYY-MM-DD)').optional().nullable(),
  targetDate: z.string().date('Invalid date format (use YYYY-MM-DD)').optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  settings: z.record(z.any()).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.targetDate) {
      return new Date(data.startDate) <= new Date(data.targetDate)
    }
    return true
  },
  { message: 'Target date must be after start date', path: ['targetDate'] }
)

export type CreateMissionInput = z.infer<typeof createMissionSchema>

export const updateMissionSchema = z.object({
  name: z.string().min(3).max(255).trim().optional(),
  description: z.string().max(10000).optional().nullable(),
  status: missionStatusEnum.optional(),
  cohortId: z.string().uuid().optional().nullable(),
  goalId: z.string().uuid().optional().nullable(),
  startDate: z.string().date().optional().nullable(),
  targetDate: z.string().date().optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  settings: z.record(z.any()).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.targetDate) {
      return new Date(data.startDate) <= new Date(data.targetDate)
    }
    return true
  },
  { message: 'Target date must be after start date', path: ['targetDate'] }
)

export type UpdateMissionInput = z.infer<typeof updateMissionSchema>

export const missionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: missionStatusEnum.optional(),
  search: z.string().trim().optional(),
  cohortId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'createdAt', 'status', 'startDate', 'targetDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type MissionQueryParams = z.infer<typeof missionQuerySchema>
