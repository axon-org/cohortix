/**
 * Individual Ally API Route - GET, PATCH, DELETE
 * Axon Codex v1.2 compliant
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helper'
import { logger } from '@/lib/logger'
import {
  withErrorHandler,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors'
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'
import { validateRequest, validateData } from '@/lib/validation'
import { updateAllySchema, type UpdateAllyInput } from '@/lib/validations/ally'
import { uuidSchema } from '@/lib/validation'

interface RouteContext {
  params: Promise<{ id: string }>
}

// ============================================================================
// GET /api/v1/allies/:id
// ============================================================================

export const GET = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const allyId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: ally, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', allyId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !ally) throw new NotFoundError('Ally', allyId)

    return NextResponse.json({ data: ally })
  }
)

// ============================================================================
// PATCH /api/v1/allies/:id
// ============================================================================

export const PATCH = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const allyId = validateData(uuidSchema, id)

    const validator = validateRequest(updateAllySchema, { target: 'body' })
    const data = (await validator(request)) as UpdateAllyInput

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('id', allyId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Ally', allyId)

    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.role !== undefined) updateData.role = data.role
    if (data.status !== undefined) updateData.status = data.status
    if (data.capabilities !== undefined) updateData.capabilities = data.capabilities
    if (data.runtimeType !== undefined) updateData.runtime_type = data.runtimeType
    if (data.runtimeConfig !== undefined) updateData.runtime_config = data.runtimeConfig
    if (data.settings !== undefined) updateData.settings = data.settings

    const { data: ally, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', allyId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update ally', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Ally updated', { correlationId, allyId })
    return NextResponse.json({ data: ally })
  }
)

// ============================================================================
// DELETE /api/v1/allies/:id
// ============================================================================

export const DELETE = withMiddleware(standardRateLimit, 
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId()
    logger.setContext({ correlationId })

    const { id } = await context.params
    const allyId = validateData(uuidSchema, id)

    const { supabase, organizationId } = await getAuthContext()

    const { data: existing } = await supabase
      .from('agents')
      .select('id, name')
      .eq('id', allyId)
      .eq('organization_id', organizationId)
      .single()
    if (!existing) throw new NotFoundError('Ally', allyId)

    const { error } = await supabase.from('agents').delete().eq('id', allyId)
    if (error) {
      logger.error('Failed to delete ally', { correlationId, error: { message: error.message, code: error.code } })
      throw error
    }

    logger.info('Ally deleted', { correlationId, allyId, allyName: existing.name })
    return new NextResponse(null, { status: 204 })
  }
)
