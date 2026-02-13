/**
 * Missions API Route - GET (list) and POST (create)
 * Maps to `projects` table. Axon Codex v1.2 compliant.
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

export const GET = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
  const query = validateData(missionQuerySchema, searchParams) as MissionQueryParams

  let supabase: any
  let organizationId: string
  let userId: string | null = null

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
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)

  if (query.status) queryBuilder = queryBuilder.eq('status', query.status)
  if (query.search) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query.search}%,description.ilike.%${query.search}%`
    )
  }

  const orderColumn = query.sortBy === 'createdAt' ? 'created_at' :
                     query.sortBy === 'startDate' ? 'start_date' :
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

export const POST = withErrorHandler(async (request: NextRequest) => {
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
  const baseSlug = generateSlug(data.name)
  const timestamp = Date.now().toString().slice(-6)
  const slug = `${baseSlug}-${timestamp}`

  logger.info('Creating mission', { correlationId, userId: user.id, organizationId, missionName: data.name })

  const { data: mission, error } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      name: data.name,
      slug,
      description: data.description || null,
      status: data.status,
      owner_type: 'user',
      owner_id: user.id,
      start_date: data.startDate || null,
      target_date: data.targetDate || null,
      goal_id: data.goalId || null,
      color: data.color || null,
      icon: data.icon || null,
      settings: data.settings || {},
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
