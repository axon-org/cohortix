/**
 * Individual Timeline Item API Route - GET, PATCH, DELETE
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
import { updateTimelineItemSchema, type UpdateTimelineItemInput } from '@/lib/validations/timeline-item'
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
// GET /api/v1/timeline-items/:id
// ============================================================================

export const GET = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const itemId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: item, error } = await supabase
      .from('operation_timeline_items')
      .select('*')
      .eq('id', itemId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !item) throw new NotFoundError('Timeline item', itemId)

    return NextResponse.json({ data: item })
  }
)

// ============================================================================
// PATCH /api/v1/timeline-items/:id
// ============================================================================

export const PATCH = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const itemId = validateData(uuidSchema, id)

    const validator = validateRequest(updateTimelineItemSchema, { target: 'body' })
    const data = (await validator(request)) as UpdateTimelineItemInput

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('operation_timeline_items')
      .select('id')
      .eq('id', itemId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Timeline item', itemId)

    const updateData: Record<string, any> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    const { data: item, error } = await supabase
      .from('operation_timeline_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update timeline item', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Timeline item updated', { correlationId, itemId })
    return NextResponse.json({ data: item })
  }
)

// ============================================================================
// DELETE /api/v1/timeline-items/:id
// ============================================================================

export const DELETE = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const itemId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('operation_timeline_items')
      .select('id, title')
      .eq('id', itemId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Timeline item', itemId)

    const { error } = await supabase.from('operation_timeline_items').delete().eq('id', itemId)
    if (error) {
      logger.error('Failed to delete timeline item', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Timeline item deleted', { correlationId, itemId, title: existing.title })
    return new NextResponse(null, { status: 204 })
  }
)
