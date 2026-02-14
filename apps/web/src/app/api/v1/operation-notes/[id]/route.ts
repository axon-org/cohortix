/**
 * Individual Operation Note API Route - GET, PATCH, DELETE
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
import { updateOperationNoteSchema, type UpdateOperationNoteInput } from '@/lib/validations/operation-note'
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
// GET /api/v1/operation-notes/:id
// ============================================================================

export const GET = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const noteId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: note, error } = await supabase
      .from('operation_notes')
      .select('*')
      .eq('id', noteId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !note) throw new NotFoundError('Operation note', noteId)

    return NextResponse.json({ data: note })
  }
)

// ============================================================================
// PATCH /api/v1/operation-notes/:id
// ============================================================================

export const PATCH = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const noteId = validateData(uuidSchema, id)

    const validator = validateRequest(updateOperationNoteSchema, { target: 'body' })
    const data = (await validator(request)) as UpdateOperationNoteInput

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('operation_notes')
      .select('id')
      .eq('id', noteId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Operation note', noteId)

    const updateData: Record<string, any> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.noteType !== undefined) updateData.note_type = data.noteType
    if (data.status !== undefined) updateData.status = data.status

    const { data: note, error } = await supabase
      .from('operation_notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update operation note', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Operation note updated', { correlationId, noteId })
    return NextResponse.json({ data: note })
  }
)

// ============================================================================
// DELETE /api/v1/operation-notes/:id
// ============================================================================

export const DELETE = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const noteId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('operation_notes')
      .select('id, title')
      .eq('id', noteId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Operation note', noteId)

    const { error } = await supabase.from('operation_notes').delete().eq('id', noteId)
    if (error) {
      logger.error('Failed to delete operation note', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Operation note deleted', { correlationId, noteId, title: existing.title })
    return new NextResponse(null, { status: 204 })
  }
)
