/**
 * Health Trends Dashboard API - Engagement Over Time
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging, Zod validation
 *
 * Returns engagement trends over time for dashboard charts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler, UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';
import { validateData } from '@/lib/validation';
import { healthTrendsQuerySchema, type HealthTrendsQueryParams } from '@/lib/validations/cohort';

interface DataPoint {
  date: string;
  avgEngagement: number;
  activeCohorts: number;
  totalMembers: number;
}

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  // Validate query parameters
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(healthTrendsQuerySchema, searchParams) as HealthTrendsQueryParams;

  // Get authenticated context
  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Fetching health trends', {
    correlationId,
    userId,
    organizationId,
    period: query.period,
    interval: query.interval,
  });

  // Calculate date range based on period
  const endDate = new Date();
  const startDate = new Date();

  switch (query.period) {
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  // Fetch all cohorts in the organization
  const { data: cohorts, error } = await supabase
    .from('cohorts')
    .select('status, member_count, engagement_percent, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    logger.error('Failed to fetch cohorts for health trends', {
      correlationId,
      error,
    });
    throw error;
  }

  // Generate data points based on interval
  const dataPoints: DataPoint[] = [];
  const intervalMs =
    query.interval === 'day'
      ? 24 * 60 * 60 * 1000
      : query.interval === 'week'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000; // month (approximate)

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]!;

    // Filter cohorts that existed at this date
    const cohortsAtDate = (cohorts || []).filter((cohort: any) => {
      const createdAt = new Date(cohort.created_at);
      return createdAt <= currentDate;
    });

    const activeCohorts = cohortsAtDate.filter((c: any) => c.status === 'active').length;

    const totalEngagement = cohortsAtDate.reduce((sum: number, cohort: any) => {
      return sum + parseFloat(cohort.engagement_percent || '0');
    }, 0);

    const avgEngagement =
      cohortsAtDate.length > 0
        ? Math.round((totalEngagement / cohortsAtDate.length) * 100) / 100
        : 0;

    const totalMembers = cohortsAtDate.reduce((sum: number, cohort: any) => {
      return sum + (cohort.member_count || 0);
    }, 0);

    dataPoints.push({
      date: dateStr,
      avgEngagement,
      activeCohorts,
      totalMembers,
    });

    // Increment date by interval
    currentDate.setTime(currentDate.getTime() + intervalMs);
  }

  logger.info('Health trends fetched successfully', {
    correlationId,
    dataPointsCount: dataPoints.length,
  });

  return NextResponse.json({
    data: {
      dataPoints,
    },
  });
});
