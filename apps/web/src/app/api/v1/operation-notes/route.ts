/**
 * Operation Notes API Route - GET (list) and POST (create)
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
  createOperationNoteSchema,
  operationNoteQuerySchema,
  type CreateOperationNoteInput,
  type OperationNoteQueryParams,
} from '@/lib/validations/operation-note'

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
// GET /api/v1/operation-notes?projectId=xxx
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const query = validateData(operationNoteQuerySchema, searchParams) as OperationNoteQueryParams

  const { supabase, organizationId } = await getAuthContext()

  logger.info('Fetching operation notes', { correlationId, organizationId, projectId: query.projectId })

  let queryBuilder = supabase
    .from('operation_notes')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('project_id', query.projectId)
    .order('created_at', { ascending: false })

  if (query.noteType) queryBuilder = queryBuilder.eq('note_type', query.noteType)
  if (query.status) queryBuilder = queryBuilder.eq('status', query.status)

  const { data: notes, error } = await queryBuilder

  if (error) {
    logger.error('Failed to fetch operation notes', { correlationId, error: { message: error.message, code: error.code } })
    throw error
  }

  return NextResponse.json({ data: notes || [] })
})

// ============================================================================
// POST /api/v1/operation-notes
// ============================================================================

export const POST = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const validator = validateRequest(createOperationNoteSchema, { target: 'body' })
  const data = (await validator(request)) as CreateOperationNoteInput

  const { supabase, organizationId, userId } = await getAuthContext()

  logger.info('Creating operation note', { correlationId, userId, organizationId, title: data.title })

  const { data: note, error } = await supabase
    .from('operation_notes')
    .insert({
      organization_id: organizationId,
      project_id: data.projectId,
      title: data.title,
      content: data.content || null,
      note_type: data.noteType,
      status: data.status,
      created_by_type: 'user',
      created_by_id: userId,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create operation note', { correlationId, error: { message: error.message, code: error.code } })
    throw error
  }

  logger.info('Operation note created', { correlationId, noteId: note.id })
  return NextResponse.json({ data: note }, { status: 201 })
})
