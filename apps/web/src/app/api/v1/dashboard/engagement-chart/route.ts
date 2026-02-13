/**
 * Engagement Chart Data API
 * Returns time-series engagement data for dashboard chart
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth-helper'
import { logger } from '@/lib/logger'
import { withErrorHandler, UnauthorizedError, ForbiddenError } from '@/lib/errors'
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'

interface EngagementDataPoint {
  date: string
  value: number
}

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId()
  logger.setContext({ correlationId })

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  const { supabase, organizationId } = await getAuthContext()

  // Fetch cohorts engagement data
  const { data: cohorts, error } = await supabase
    .from('cohorts')
    .select('created_at, engagement_percent, member_count')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('Failed to fetch engagement data', { correlationId, error })
    throw error
  }

  // Generate time-series data points
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const dataPoints: EngagementDataPoint[] = []
  const interval = days <= 30 ? 1 : days <= 90 ? 3 : 7 // Daily for 30d, every 3 days for 90d, weekly for 1y

  for (let i = 0; i <= days; i += interval) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    
    // Calculate average engagement for cohorts created up to this date
    const relevantCohorts = (cohorts || []).filter(
      (c: any) => new Date(c.created_at) <= date
    )

    let avgEngagement = 0
    if (relevantCohorts.length > 0) {
      const totalEngagement = relevantCohorts.reduce((sum: number, c: any) => {
        return sum + parseFloat(c.engagement_percent || '0')
      }, 0)
      avgEngagement = totalEngagement / relevantCohorts.length
    }

    dataPoints.push({
      date: date.toISOString().split('T')[0]!,
      value: Math.round(avgEngagement * 100) / 100,
    })
  }

  logger.info('Engagement chart data fetched', {
    correlationId,
    days,
    pointsCount: dataPoints.length,
  })

  return NextResponse.json({ data: dataPoints })
})
