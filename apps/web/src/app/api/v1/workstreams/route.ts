/**
 * Workstreams API Route - GET (list) and POST (create)
 * Workstreams are task grouping/phases within operations
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
  createWorkstreamSchema,
  workstreamQuerySchema,
  type CreateWorkstreamInput,
  type WorkstreamQueryParams,
} from '@/lib/validations/workstream'

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
// GET /api/v1/workstreams?projectId=xxx
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const query = validateData(workstreamQuerySchema, searchParams) as WorkstreamQueryParams

  const { supabase, organizationId } = await getAuthContext()

  logger.info('Fetching workstreams', { correlationId, organizationId, projectId: query.projectId })

  const { data: workstreams, error } = await supabase
    .from('workstreams')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('project_id', query.projectId)
    .order('position', { ascending: true })

  if (error) {
    logger.error('Failed to fetch workstreams', { correlationId, error: { message: error.message, code: error.code } })
    throw error
  }

  return NextResponse.json({ data: workstreams || [] })
})

// ============================================================================
// POST /api/v1/workstreams
// ============================================================================

export const POST = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const validator = validateRequest(createWorkstreamSchema, { target: 'body' })
  const data = (await validator(request)) as CreateWorkstreamInput

  const { supabase, organizationId, userId } = await getAuthContext()

  logger.info('Creating workstream', { correlationId, userId, organizationId, name: data.name })

  const { data: workstream, error } = await supabase
    .from('workstreams')
    .insert({
      organization_id: organizationId,
      project_id: data.projectId,
      name: data.name,
      description: data.description || null,
      position: data.position,
      total_tasks: 0,
      completed_tasks: 0,
      created_by_type: 'user',
      created_by_id: userId,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create workstream', { correlationId, error: { message: error.message, code: error.code } })
    throw error
  }

  logger.info('Workstream created', { correlationId, workstreamId: workstream.id })
  return NextResponse.json({ data: workstream }, { status: 201 })
})
