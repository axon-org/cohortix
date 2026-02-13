/**
 * Mission Control Dashboard API - KPI Aggregations
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging
 * 
 * Returns key performance indicators for the Mission Control dashboard:
 * - Active cohorts count
 * - Total allies (agents) count
 * - Average engagement across all cohorts
 * - At-risk cohorts count
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import {
  withErrorHandler,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/errors'
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'

interface KPIData {
  kpis: {
    activeCohortsCount: number
    totalAllies: number
    avgEngagement: number
    atRiskCount: number
  }
  trends: {
    activeCohortsChange: number
    totalAlliesChange: number
    avgEngagementChange: number
    atRiskChange: number
  }
}

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  let supabase: any
  let organizationId: string
  let userId: string | undefined = undefined

  // DEV MODE: Bypass auth for testing
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    // Use service role key to bypass RLS
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
    
    // Use first available organization for testing
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single()
    
    organizationId = org?.id || ''
    userId = 'dev-bypass'
    logger.info('DEV MODE: Using test organization', { organizationId })
  } else {
    supabase = await createClient()
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new UnauthorizedError('Authentication required')
    }

    userId = user.id

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      throw new ForbiddenError('User is not associated with any organization')
    }

    organizationId = membership.organization_id
  }

  logger.info('Fetching Mission Control KPIs', {
    correlationId,
    userId,
    organizationId,
  })

  // Fetch current period KPIs
  const [cohortsResult, agentsResult] = await Promise.all([
    // Cohorts data
    supabase
      .from('cohorts')
      .select('status, member_count, engagement_percent')
      .eq('organization_id', organizationId),

    // Agents (allies) data
    supabase
      .from('agents')
      .select('id, status')
      .eq('organization_id', organizationId),
  ])

  if (cohortsResult.error) {
    logger.error('Failed to fetch cohorts for KPIs', {
      correlationId,
      error: cohortsResult.error,
    })
    throw cohortsResult.error
  }

  if (agentsResult.error) {
    logger.error('Failed to fetch agents for KPIs', {
      correlationId,
      error: agentsResult.error,
    })
    throw agentsResult.error
  }

  const cohorts = cohortsResult.data || []
  const agents = agentsResult.data || []

  // Calculate current KPIs
  const activeCohortsCount = cohorts.filter((c: any) => c.status === 'active').length
  const atRiskCount = cohorts.filter((c: any) => c.status === 'at-risk').length
  const totalAllies = agents.length

  // Calculate average engagement
  const totalEngagement = cohorts.reduce((sum: number, cohort: any) => {
    const engagement = parseFloat(cohort.engagement_percent || '0')
    return sum + engagement
  }, 0)
  const avgEngagement = cohorts.length > 0 
    ? Math.round((totalEngagement / cohorts.length) * 100) / 100 
    : 0

  // Fetch previous period data (30 days ago) for trend calculation
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [prevCohortsResult, prevAgentsResult] = await Promise.all([
    supabase
      .from('cohorts')
      .select('status')
      .eq('organization_id', organizationId)
      .lte('created_at', thirtyDaysAgo.toISOString()),

    supabase
      .from('agents')
      .select('id')
      .eq('organization_id', organizationId)
      .lte('created_at', thirtyDaysAgo.toISOString()),
  ])

  const prevCohorts = prevCohortsResult.data || []
  const prevAgents = prevAgentsResult.data || []

  // Calculate trends (percentage change)
  const prevActiveCount = prevCohorts.filter((c: any) => c.status === 'active').length
  const prevAtRiskCount = prevCohorts.filter((c: any) => c.status === 'at-risk').length
  const prevAlliesCount = prevAgents.length

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100 * 100) / 100
  }

  const kpiData: KPIData = {
    kpis: {
      activeCohortsCount,
      totalAllies,
      avgEngagement,
      atRiskCount,
    },
    trends: {
      activeCohortsChange: calculatePercentageChange(activeCohortsCount, prevActiveCount),
      totalAlliesChange: calculatePercentageChange(totalAllies, prevAlliesCount),
      avgEngagementChange: 0, // Would need historical engagement data
      atRiskChange: calculatePercentageChange(atRiskCount, prevAtRiskCount),
    },
  }

  logger.info('Mission Control KPIs fetched successfully', {
    correlationId,
    kpis: kpiData.kpis,
  })

  return NextResponse.json({ data: kpiData })
})
