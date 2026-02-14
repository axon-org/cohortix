/**
 * Operation (Bounded Initiative) Validation Schemas
 * Operations have start/end dates and achieve Missions.
 * Maps to 'projects' table in database.
 */

import { z } from 'zod';

export const operationStatusEnum = z.enum([
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived',
]);
export type OperationStatus = z.infer<typeof operationStatusEnum>;

export const healthStatusEnum = z.enum(['healthy', 'at_risk', 'critical', 'unknown'])
export type HealthStatus = z.infer<typeof healthStatusEnum>

export const createOperationSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  description: z.string().max(10000).optional(),
  status: operationStatusEnum.default('planning'),
  cohortId: z.string().uuid().optional().nullable(),
  missionId: z.string().uuid().optional().nullable(), // Links to Mission (goals table in DB)
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

export type CreateOperationInput = z.infer<typeof createOperationSchema>;

export const updateOperationSchema = z.object({
  name: z.string().min(3).max(255).trim().optional(),
  description: z.string().max(10000).optional().nullable(),
  status: operationStatusEnum.optional(),
  cohortId: z.string().uuid().optional().nullable(),
  missionId: z.string().uuid().optional().nullable(),
  startDate: z.string().date().optional().nullable(),
  targetDate: z.string().date().optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  settings: z.record(z.any()).optional(),
  // Operations Redesign fields
  location: z.string().max(255).optional().nullable(),
  sprintInfo: z.string().max(255).optional().nullable(),
  lastSync: z.string().datetime().optional().nullable(),
  inScope: z.array(z.string()).optional().nullable(),
  outOfScope: z.array(z.string()).optional().nullable(),
  expectedOutcomes: z.array(z.string()).optional().nullable(),
  keyFeatures: z.object({
    p0: z.array(z.string()).optional(),
    p1: z.array(z.string()).optional(),
    p2: z.array(z.string()).optional(),
  }).optional().nullable(),
  healthStatus: healthStatusEnum.optional().nullable(),
  label: z.string().max(100).optional().nullable(),
}).refine(
  (data) => {
    if (data.startDate && data.targetDate) {
      return new Date(data.startDate) <= new Date(data.targetDate)
    }
    return true
  },
  { message: 'Target date must be after start date', path: ['targetDate'] }
)

export type UpdateOperationInput = z.infer<typeof updateOperationSchema>;

export const operationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: operationStatusEnum.optional(),
  search: z.string().trim().optional(),
  cohortId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'createdAt', 'status', 'startDate', 'targetDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type OperationQueryParams = z.infer<typeof operationQuerySchema>;

// Legacy aliases for backwards compatibility (old "Project" terminology)
export const projectStatusEnum = operationStatusEnum;
export type ProjectStatus = OperationStatus;
export const createProjectSchema = createOperationSchema;
export type CreateProjectInput = CreateOperationInput;
export const updateProjectSchema = updateOperationSchema;
export type UpdateProjectInput = UpdateOperationInput;
export const projectQuerySchema = operationQuerySchema;
export type ProjectQueryParams = OperationQueryParams;
