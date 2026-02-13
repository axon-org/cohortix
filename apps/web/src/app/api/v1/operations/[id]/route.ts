/**
 * Individual Operation API Route - GET, PATCH, DELETE
 * Operations are bounded initiatives with start/end dates that achieve Missions.
 * Maps to `projects` table. Axon Codex v1.2 compliant.
 * 
 * PPV Hierarchy: Mission (measurable outcome) → Operation (bounded initiative) → Task (atomic work)
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
import { updateOperationSchema, type UpdateOperationInput } from '@/lib/validations/operation'
import { uuidSchema } from '@/lib/validation'

interface RouteContext {
  params: Promise<{ id: string }>
}

// ============================================================================
// Auth Helper
// ============================================================================

async function getAuthContext() {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single()
    
    return { supabase, organizationId: org?.id || '', userId: 'dev-bypass' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new UnauthorizedError('Authentication required')

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) throw new ForbiddenError('User is not associated with any organization')

  return { supabase, organizationId: membership.organization_id, userId: user.id }
}

// ============================================================================
// GET /api/v1/operations/:id
// ============================================================================

export const GET = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const operationId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: operation, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', operationId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !operation) throw new NotFoundError('Operation', operationId)

    return NextResponse.json({ data: operation })
  }
)

// ============================================================================
// PATCH /api/v1/operations/:id
// ============================================================================

export const PATCH = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const operationId = validateData(uuidSchema, id)

    const validator = validateRequest(updateOperationSchema, { target: 'body' })
    const data = (await validator(request)) as UpdateOperationInput

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('id', operationId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Operation', operationId)

    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.startDate !== undefined) updateData.start_date = data.startDate
    if (data.targetDate !== undefined) updateData.target_date = data.targetDate
    if (data.missionId !== undefined) updateData.goal_id = data.missionId // DB column still named 'goal_id'
    if (data.color !== undefined) updateData.color = data.color
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.settings !== undefined) updateData.settings = data.settings

    // Auto-set completed_at when status changes to completed
    if (data.status === 'completed') updateData.completed_at = new Date().toISOString()
    if (data.status && data.status !== 'completed') updateData.completed_at = null

    const { data: operation, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', operationId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update operation', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Operation updated', { correlationId, operationId })
    return NextResponse.json({ data: operation })
  }
)

// ============================================================================
// DELETE /api/v1/operations/:id
// ============================================================================

export const DELETE = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const operationId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', operationId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Operation', operationId)

    const { error } = await supabase.from('projects').delete().eq('id', operationId)
    if (error) {
      logger.error('Failed to delete operation', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Operation deleted', { correlationId, operationId, operationName: existing.name })
    return new NextResponse(null, { status: 204 })
  }
)
