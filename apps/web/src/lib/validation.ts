/**
 * Input Validation with Zod - Codex v1.2 Section 2.5.1
 * 
 * Provides Zod schemas for API input validation and a middleware wrapper
 * to enforce validation on all API routes.
 */

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { ValidationError } from './errors'
import { logger } from './logger'

// ============================================================================
// Common Reusable Schemas
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const emailSchema = z.string().email('Invalid email address')

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// ============================================================================
// Operation Schemas (Bounded Initiatives)
// LEGACY: These are generic schemas. Use @/lib/validations/operation for production.
// ============================================================================

export const createOperationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  status: z.enum(['planning', 'active', 'paused', 'completed', 'archived']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  assignedTo: z.array(uuidSchema).optional(),
  tags: z.array(z.string()).optional(),
})

export const updateOperationSchema = createOperationSchema.partial()

export const operationQuerySchema = z.object({
  status: z.enum(['planning', 'active', 'paused', 'completed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: uuidSchema.optional(),
  search: z.string().optional(),
}).merge(paginationSchema)

// Legacy aliases (old "Mission" meant bounded initiative)
export const createMissionSchema = createOperationSchema
export const updateMissionSchema = updateOperationSchema
export const missionQuerySchema = operationQuerySchema

// ============================================================================
// Mission Schemas (Measurable Outcomes)
// LEGACY: These are generic schemas. For production, create specific Mission schemas in @/lib/validations/
// ============================================================================

export const createMissionObjectiveSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  operationId: uuidSchema, // Links to Operation (bounded initiative)
  targetDate: z.string().datetime().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).default('not_started'),
  metrics: z.record(z.any()).optional(),
})

export const updateMissionObjectiveSchema = createMissionObjectiveSchema.partial()

// Legacy alias (old "Goal" meant measurable outcome)
export const createGoalSchema = createMissionObjectiveSchema
export const updateGoalSchema = updateMissionObjectiveSchema

// ============================================================================
// Ally Schemas (AI Teammates)
// LEGACY: These are generic schemas. Use @/lib/validations/ally for production.
// ============================================================================

export const createAllySchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().min(2).max(100),
  specialty: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  status: z.enum(['active', 'idle', 'offline', 'maintenance']).default('active'),
})

export const updateAllySchema = createAllySchema.partial()

// Legacy alias (old "Agent" terminology)
export const createAgentSchema = createAllySchema
export const updateAgentSchema = updateAllySchema

// ============================================================================
// Task Schemas (Atomic Units of Work)
// LEGACY: These are generic schemas. Use @/lib/validations/task for production.
// ============================================================================

export const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  operationId: uuidSchema, // Links to Operation (bounded initiative)
  assignedTo: uuidSchema.optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
})

export const updateTaskSchema = createTaskSchema.partial()

// Legacy alias (old "Action" meant atomic task)
export const createActionSchema = createTaskSchema
export const updateActionSchema = updateTaskSchema

// ============================================================================
// Time Entry Schemas
// ============================================================================

export const createTimeEntrySchema = z.object({
  taskId: uuidSchema, // Links to Task (atomic work unit)
  allyId: uuidSchema, // Ally (agent) who logged the time
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().int().positive().optional(),
  notes: z.string().optional(),
})

export const updateTimeEntrySchema = createTimeEntrySchema.partial()

// Legacy aliases
export const actionId = 'taskId' // Field name mapping
export const agentId = 'allyId' // Field name mapping

// ============================================================================
// Validation Middleware
// ============================================================================

export type ValidationTarget = 'body' | 'query' | 'params'

export interface ValidationOptions {
  target?: ValidationTarget
  abortEarly?: boolean
}

/**
 * Validates request data against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param options - Validation options (target, abortEarly)
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  options: ValidationOptions = {}
) {
  const { target = 'body', abortEarly = false } = options

  return async (
    request: NextRequest
  ): Promise<z.infer<T>> => {
    try {
      let data: unknown

      // Extract data based on target
      switch (target) {
        case 'body':
          try {
            data = await request.json()
          } catch {
            throw new ValidationError('Invalid JSON in request body')
          }
          break
        
        case 'query':
          data = Object.fromEntries(request.nextUrl.searchParams.entries())
          break
        
        case 'params':
          // For params, we expect the caller to pass them explicitly
          throw new Error('Use validateData for params validation')
        
        default:
          throw new Error(`Invalid validation target: ${target}`)
      }

      // Validate with Zod
      const result = schema.safeParse(data)

      if (!result.success) {
        const errors = result.error.errors.reduce((acc, err) => {
          const path = err.path.join('.')
          if (!acc[path]) acc[path] = []
          acc[path].push(err.message)
          return acc
        }, {} as Record<string, string[]>)

        logger.warn('Validation failed', { errors, target })

        throw new ValidationError(
          'Validation failed',
          errors
        )
      }

      return result.data
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      
      logger.error('Validation error', error as Error)
      throw new ValidationError('Validation failed', {
        _error: [(error as Error).message]
      })
    }
  }
}

/**
 * Validates arbitrary data against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export function validateData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.errors.reduce((acc, err) => {
      const path = err.path.join('.') || '_root'
      if (!acc[path]) acc[path] = []
      acc[path].push(err.message)
      return acc
    }, {} as Record<string, string[]>)

    throw new ValidationError('Validation failed', errors)
  }

  return result.data
}

/**
 * Type-safe API handler with validation
 * 
 * Usage:
 * ```ts
 * export const POST = withValidation(createMissionSchema, async (request, data) => {
 *   // data is typed as z.infer<typeof createMissionSchema>
 *   const mission = await createMission(data)
 *   return NextResponse.json(mission)
 * })
 * ```
 */
export function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (request: NextRequest, data: z.infer<T>) => Promise<NextResponse>,
  options: ValidationOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const validator = validateRequest(schema, options)
    const data = await validator(request)
    return handler(request, data)
  }
}
