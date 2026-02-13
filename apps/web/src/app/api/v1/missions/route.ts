/**
 * Missions API Route - GET (list) and POST (create)
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
  ValidationError,
} from '@/lib/errors'
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'
import { validateRequest, validateData } from '@/lib/validation'
import {
  createMissionSchema,
  missionQuerySchema,
  type CreateMissionInput,
  type MissionQueryParams,
} from '@/lib/validations/mission'
import { generateSlug } from '@/lib/utils/cohort'

// ============================================================================
// GET /api/v1/missions
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const query = validateData(missionQuerySchema, searchParams) as MissionQueryParams

  let supabase: any
  let organizationId: string
  let userId: string | undefined = undefined

  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data: org } = await supabase.from('organizations').select('id').limit(1).single()
    organizationId = org?.id || ''
    userId = 'dev-bypass'
  } else {
    supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new UnauthorizedError('Authentication required')
    userId = user.id

    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    if (!membership) throw new ForbiddenError('User is not associated with any organization')
    organizationId = membership.organization_id
  }

  logger.info('Fetching missions', { correlationId, userId, organizationId, query })

  let queryBuilder = supabase
    .from('missions')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)

  if (query.status) queryBuilder = queryBuilder.eq('status', query.status)
  if (query.search) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
    )
  }

  const orderColumn = query.sortBy === 'createdAt' ? 'created_at' :
                     query.sortBy === 'targetDate' ? 'target_date' :
                     query.sortBy
  queryBuilder = queryBuilder.order(orderColumn, { ascending: query.sortOrder === 'asc' })

  const start = (query.page - 1) * query.limit
  queryBuilder = queryBuilder.range(start, start + query.limit - 1)

  const { data: missions, error, count } = await queryBuilder

  if (error) {
    logger.error('Failed to fetch missions', { correlationId, error: { message: error.message, code: error.code } })
    throw error
  }

  return NextResponse.json({
    data: missions || [],
    meta: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / query.limit) : 0,
    },
  })
})

// ============================================================================
// POST /api/v1/missions
// ============================================================================

export const POST = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const validator = validateRequest(createMissionSchema, { target: 'body' })
  const data = (await validator(request)) as CreateMissionInput

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new UnauthorizedError('Authentication required')

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) throw new ForbiddenError('User is not associated with any organization')

  const organizationId = membership.organization_id

  logger.info('Creating mission', { correlationId, userId: user.id, organizationId, missionTitle: data.name })

  const { data: mission, error } = await supabase
    .from('missions')
    .insert({
      organization_id: organizationId,
      title: data.name,
      description: data.description || null,
      status: data.status || 'active',
      owner_type: 'user',
      owner_id: user.id,
      target_date: data.targetDate || null,
      vision_id: data.visionId || null,
      progress: 0,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create mission', { correlationId, error: { message: error.message, code: error.code } })
    throw error
  }

  logger.info('Mission created', { correlationId, missionId: mission.id })
  return NextResponse.json({ data: mission }, { status: 201 })
})
