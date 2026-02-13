/**
 * Individual Cohort API Route - GET, PATCH, DELETE
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging, Zod validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import {
  withErrorHandler,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors'
import { validateRequest, validateData } from '@/lib/validation'
import { updateCohortSchema, type UpdateCohortInput } from '@/lib/validations/cohort'
import { uuidSchema } from '@/lib/validation'

interface RouteContext {
  params: Promise<{ id: string }>
}

// ============================================================================
// GET /api/v1/cohorts/:id - Get a single cohort
// ============================================================================

export const GET = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    // Validate cohort ID
    const { id } = await context.params
    const cohortId = validateData(uuidSchema, id)

    let supabase: any
    let organizationId: string
    let userId: string | undefined = undefined

    // DEV MODE: Bypass auth for testing
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      // Use service role key to bypass RLS
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      // Use first available organization for testing
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()
      
      organizationId = org?.id || ''
      userId = 'dev-bypass'
      logger.info('DEV MODE: Using test organization', { organizationId })
    } else {
      // Get authenticated user
      supabase = await createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new UnauthorizedError('Authentication required')
      }

      userId = user.id

      // Get user's organization
      const { data: membership, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (membershipError || !membership) {
        throw new ForbiddenError('User is not associated with any organization')
      }

      organizationId = membership.organization_id
    }

    logger.info('Fetching cohort', {
      correlationId,
      userId,
      cohortId,
    })

    // Fetch cohort with organization filter
    const { data: cohort, error } = await supabase
      .from('cohorts')
      .select('*')
      .eq('id', cohortId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !cohort) {
      logger.warn('Cohort not found', {
        correlationId,
        cohortId,
        error: error?.message,
      })
      throw new NotFoundError('Cohort', cohortId)
    }

    logger.info('Cohort fetched successfully', {
      correlationId,
      cohortId: cohort.id,
    })

    return NextResponse.json({ data: cohort })
  }
)

// ============================================================================
// PATCH /api/v1/cohorts/:id - Update a cohort
// ============================================================================

export const PATCH = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    // Validate cohort ID
    const { id } = await context.params
    const cohortId = validateData(uuidSchema, id)

    // Validate request body
    const validator = validateRequest(updateCohortSchema, { target: 'body' })
    const data = (await validator(request)) as UpdateCohortInput

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new UnauthorizedError('Authentication required')
    }

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      throw new ForbiddenError('User is not associated with any organization')
    }

    logger.info('Updating cohort', {
      correlationId,
      userId: user.id,
      cohortId,
      updates: Object.keys(data),
    })

    // Check if cohort exists and belongs to user's organization
    const { data: existingCohort, error: fetchError } = await supabase
      .from('cohorts')
      .select('id')
      .eq('id', cohortId)
      .single()

    if (fetchError || !existingCohort) {
      throw new NotFoundError('Cohort', cohortId)
    }

    // Build update object (map camelCase to snake_case)
    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.startDate !== undefined) updateData.start_date = data.startDate
    if (data.endDate !== undefined) updateData.end_date = data.endDate
    if (data.memberCount !== undefined) updateData.member_count = data.memberCount
    if (data.engagementPercent !== undefined)
      updateData.engagement_percent = data.engagementPercent.toString()
    if (data.settings !== undefined) updateData.settings = data.settings

    // Update cohort
    const { data: cohort, error } = await supabase
      .from('cohorts')
      .update(updateData)
      .eq('id', cohortId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update cohort', {
        correlationId,
        error: {
          name: error.message,
          message: error.message,
          code: error.code,
        },
      })
      throw error
    }

    logger.info('Cohort updated successfully', {
      correlationId,
      cohortId: cohort.id,
    })

    return NextResponse.json({ data: cohort })
  }
)

// ============================================================================
// DELETE /api/v1/cohorts/:id - Delete a cohort
// ============================================================================

export const DELETE = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    // Validate cohort ID
    const { id } = await context.params
    const cohortId = validateData(uuidSchema, id)

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new UnauthorizedError('Authentication required')
    }

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      throw new ForbiddenError('User is not associated with any organization')
    }

    logger.info('Deleting cohort', {
      correlationId,
      userId: user.id,
      cohortId,
    })

    // Check if cohort exists and belongs to user's organization
    const { data: existingCohort, error: fetchError } = await supabase
      .from('cohorts')
      .select('id, name')
      .eq('id', cohortId)
      .single()

    if (fetchError || !existingCohort) {
      throw new NotFoundError('Cohort', cohortId)
    }

    // Delete cohort
    const { error } = await supabase.from('cohorts').delete().eq('id', cohortId)

    if (error) {
      logger.error('Failed to delete cohort', {
        correlationId,
        error: {
          name: error.message,
          message: error.message,
          code: error.code,
        },
      })
      throw error
    }

    logger.info('Cohort deleted successfully', {
      correlationId,
      cohortId,
      cohortName: existingCohort.name,
    })

    return new NextResponse(null, { status: 204 })
  }
)
