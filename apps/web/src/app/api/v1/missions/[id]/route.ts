/**
 * Individual Mission API Route - GET, PATCH, DELETE
 * Maps to `projects` table. Axon Codex v1.2 compliant.
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
import { updateMissionSchema, type UpdateMissionInput } from '@/lib/validations/mission'
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
// GET /api/v1/missions/:id
// ============================================================================

export const GET = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const missionId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: mission, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', missionId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !mission) throw new NotFoundError('Mission', missionId)

    return NextResponse.json({ data: mission })
  }
)

// ============================================================================
// PATCH /api/v1/missions/:id
// ============================================================================

export const PATCH = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const missionId = validateData(uuidSchema, id)

    const validator = validateRequest(updateMissionSchema, { target: 'body' })
    const data = (await validator(request)) as UpdateMissionInput

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('id', missionId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Mission', missionId)

    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.startDate !== undefined) updateData.start_date = data.startDate
    if (data.targetDate !== undefined) updateData.target_date = data.targetDate
    if (data.goalId !== undefined) updateData.goal_id = data.goalId
    if (data.color !== undefined) updateData.color = data.color
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.settings !== undefined) updateData.settings = data.settings

    // Auto-set completed_at when status changes to completed
    if (data.status === 'completed') updateData.completed_at = new Date().toISOString()
    if (data.status && data.status !== 'completed') updateData.completed_at = null

    const { data: mission, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', missionId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update mission', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Mission updated', { correlationId, missionId })
    return NextResponse.json({ data: mission })
  }
)

// ============================================================================
// DELETE /api/v1/missions/:id
// ============================================================================

export const DELETE = withErrorHandler(
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const missionId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', missionId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Mission', missionId)

    const { error } = await supabase.from('projects').delete().eq('id', missionId)
    if (error) {
      logger.error('Failed to delete mission', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Mission deleted', { correlationId, missionId, missionName: existing.name })
    return new NextResponse(null, { status: 204 })
  }
)
