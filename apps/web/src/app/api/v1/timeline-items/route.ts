/**
 * Timeline Items API Route - GET (list) and POST (create)
 * Activity log for operations (human + AI actions)
 * Operations Redesign feature. Axon Codex v1.2 compliant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import {
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/errors'
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'
import { validateRequest, validateData } from '@/lib/validation'
import {
  createTimelineItemSchema,
  timelineItemQuerySchema,
  type CreateTimelineItemInput,
  type TimelineItemQueryParams,
} from '@/lib/validations/timeline-item'

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
// GET /api/v1/timeline-items?projectId=xxx
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const query = validateData(timelineItemQuerySchema, searchParams) as TimelineItemQueryParams

  const { supabase, organizationId } = await getAuthContext()

  logger.info('Fetching timeline items', { correlationId, organizationId, projectId: query.projectId })

  let queryBuilder = supabase
    .from('operation_timeline_items')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('project_id', query.projectId)
    .order('created_at', { ascending: false })
    .limit(query.limit)

  if (query.eventType) queryBuilder = queryBuilder.eq('event_type', query.eventType)

  const { data: items, error } = await queryBuilder

  if (error) {
    logger.error('Failed to fetch timeline items', { correlationId, error: { message: error.message, code: error.code } })
    throw error
  }

  return NextResponse.json({ data: items || [] })
})

// ============================================================================
// POST /api/v1/timeline-items
// ============================================================================

export const POST = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const validator = validateRequest(createTimelineItemSchema, { target: 'body' })
  const data = (await validator(request)) as CreateTimelineItemInput

  const { supabase, organizationId, userId } = await getAuthContext()

  logger.info('Creating timeline item', { 
    correlationId, 
    userId, 
    organizationId, 
    eventType: data.eventType,
    title: data.title 
  })

  const { data: item, error } = await supabase
    .from('operation_timeline_items')
    .insert({
      organization_id: organizationId,
      project_id: data.projectId,
      event_type: data.eventType,
      title: data.title,
      description: data.description || null,
      metadata: data.metadata,
      actor_type: 'user',
      actor_id: userId,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create timeline item', { correlationId, error: { message: error.message, code: error.code } })
    throw error
  }

  logger.info('Timeline item created', { correlationId, itemId: item.id })
  return NextResponse.json({ data: item }, { status: 201 })
})
