/**
 * Individual Ally API Route - GET, PATCH, DELETE
 * Axon Codex v1.2 compliant
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
import { updateAllySchema, type UpdateAllyInput } from '@/lib/validations/ally'
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
// GET /api/v1/allies/:id
// ============================================================================

export const GET = withErrorHandler(
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

export const PATCH = withErrorHandler(
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

export const DELETE = withErrorHandler(
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
