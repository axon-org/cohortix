/**
 * Mission (Measurable Outcome) Validation Schemas
 * Missions are strategic outcomes that serve Visions (PPV Goal level).
 * Maps to 'goals' table in database.
 */

import { z } from 'zod'

export const missionStatusEnum = z.enum(['not_started', 'in_progress', 'at_risk', 'completed', 'cancelled'])
export type MissionStatus = z.infer<typeof missionStatusEnum>

export const createMissionSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(500, 'Title must be less than 500 characters')
    .trim(),
  description: z.string().max(10000).optional(),
  status: missionStatusEnum.default('not_started'),
  clientId: z.string().uuid().optional().nullable(),
  ownerType: z.enum(['user', 'agent']).default('user'),
  ownerId: z.string().uuid(),
  targetDate: z.string().date('Invalid date format (use YYYY-MM-DD)').optional().nullable(),
  keyResults: z.array(z.record(z.any())).default([]),
  progressPercent: z.number().int().min(0).max(100).default(0),
  progressAutoCalculate: z.boolean().default(true),
})

export type CreateMissionInput = z.infer<typeof createMissionSchema>

export const updateMissionSchema = z.object({
  title: z.string().min(3).max(500).trim().optional(),
  description: z.string().max(10000).optional().nullable(),
  status: missionStatusEnum.optional(),
  clientId: z.string().uuid().optional().nullable(),
  targetDate: z.string().date().optional().nullable(),
  keyResults: z.array(z.record(z.any())).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  progressAutoCalculate: z.boolean().optional(),
})

export type UpdateMissionInput = z.infer<typeof updateMissionSchema>

export const missionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: missionStatusEnum.optional(),
  search: z.string().trim().optional(),
  ownerId: z.string().uuid().optional(),
  ownerType: z.enum(['user', 'agent']).optional(),
  sortBy: z.enum(['title', 'createdAt', 'status', 'targetDate', 'progressPercent']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type MissionQueryParams = z.infer<typeof missionQuerySchema>

// Legacy aliases for backwards compatibility (old "Goal" terminology)
export const goalStatusEnum = missionStatusEnum;
export type GoalStatus = MissionStatus;
export const createGoalSchema = createMissionSchema;
export type CreateGoalInput = CreateMissionInput;
export const updateGoalSchema = updateMissionSchema;
export type UpdateGoalInput = UpdateMissionInput;
export const goalQuerySchema = missionQuerySchema;
export type GoalQueryParams = MissionQueryParams;
