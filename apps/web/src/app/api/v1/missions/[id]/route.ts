/**
 * Individual Mission API Route - GET, PATCH, DELETE
 * Maps to `missions` table (PPV Hierarchy: measurable goals with target dates).
 * Axon Codex v1.2 compliant.
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
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'
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

export const GET = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const missionId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: mission, error } = await supabase
      .from('missions')
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

export const PATCH = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const missionId = validateData(uuidSchema, id)

    const validator = validateRequest(updateMissionSchema, { target: 'body' })
    const data = (await validator(request)) as UpdateMissionInput

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('missions')
      .select('id')
      .eq('id', missionId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Mission', missionId)

    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.title = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.targetDate !== undefined) updateData.target_date = data.targetDate
    if (data.visionId !== undefined) updateData.vision_id = data.visionId
    if (data.progress !== undefined) updateData.progress = data.progress

    const { data: mission, error } = await supabase
      .from('missions')
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

export const DELETE = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const missionId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('missions')
      .select('id, title')
      .eq('id', missionId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Mission', missionId)

    const { error } = await supabase.from('missions').delete().eq('id', missionId)
    if (error) {
      logger.error('Failed to delete mission', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Mission deleted', { correlationId, missionId, missionTitle: existing.title })
    return new NextResponse(null, { status: 204 })
  }
)
