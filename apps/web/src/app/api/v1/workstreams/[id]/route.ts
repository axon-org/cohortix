/**
 * Individual Workstream API Route - GET, PATCH, DELETE
 * Operations Redesign feature. Axon Codex v1.2 compliant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors'
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'
import { validateRequest, validateData } from '@/lib/validation'
import { updateWorkstreamSchema, type UpdateWorkstreamInput } from '@/lib/validations/workstream'
import { uuidSchema } from '@/lib/validation'

interface RouteContext {
  params: Promise<{ id: string }>
}

// ============================================================================
// Auth Helper
// ============================================================================

async function getAuthContext() {
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
// GET /api/v1/workstreams/:id
// ============================================================================

export const GET = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const workstreamId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: workstream, error } = await supabase
      .from('workstreams')
      .select('*')
      .eq('id', workstreamId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !workstream) throw new NotFoundError('Workstream', workstreamId)

    return NextResponse.json({ data: workstream })
  }
)

// ============================================================================
// PATCH /api/v1/workstreams/:id
// ============================================================================

export const PATCH = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const workstreamId = validateData(uuidSchema, id)

    const validator = validateRequest(updateWorkstreamSchema, { target: 'body' })
    const data = (await validator(request)) as UpdateWorkstreamInput

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('workstreams')
      .select('id')
      .eq('id', workstreamId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Workstream', workstreamId)

    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.position !== undefined) updateData.position = data.position
    if (data.totalTasks !== undefined) updateData.total_tasks = data.totalTasks
    if (data.completedTasks !== undefined) updateData.completed_tasks = data.completedTasks

    const { data: workstream, error } = await supabase
      .from('workstreams')
      .update(updateData)
      .eq('id', workstreamId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update workstream', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Workstream updated', { correlationId, workstreamId })
    return NextResponse.json({ data: workstream })
  }
)

// ============================================================================
// DELETE /api/v1/workstreams/:id
// ============================================================================

export const DELETE = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const workstreamId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('workstreams')
      .select('id, name')
      .eq('id', workstreamId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Workstream', workstreamId)

    const { error } = await supabase.from('workstreams').delete().eq('id', workstreamId)
    if (error) {
      logger.error('Failed to delete workstream', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Workstream deleted', { correlationId, workstreamId, name: existing.name })
    return new NextResponse(null, { status: 204 })
  }
)
