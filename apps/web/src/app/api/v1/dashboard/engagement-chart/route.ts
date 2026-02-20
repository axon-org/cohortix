/**
 * Engagement Chart Data API
 * Returns time-series engagement data for dashboard chart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';

interface EngagementDataPoint {
  date: string;
  value: number;
}

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  const { supabase, organizationId } = await getAuthContext();

  const { data: cohorts, error } = await supabase
    .from('cohorts')
    .select('id, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to fetch engagement data', { correlationId, error });
    throw error;
  }

  const cohortIds = (cohorts || []).map((cohort: any) => cohort.id);
  const { data: members, error: membersError } = await supabase
    .from('cohort_members')
    .select('cohort_id, engagement_score, joined_at')
    .in('cohort_id', cohortIds);

  if (membersError) {
    logger.error('Failed to fetch engagement members data', { correlationId, error: membersError });
    throw membersError;
  }

  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const dataPoints: EngagementDataPoint[] = [];
  const interval = days <= 30 ? 1 : days <= 90 ? 3 : 7;

  for (let i = 0; i <= days; i += interval) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

    const cohortsAtDate = (cohorts || []).filter(
      (cohort: any) => new Date(cohort.created_at) <= date
    );
    const cohortIdsAtDate = cohortsAtDate.map((cohort: any) => cohort.id);

    const membersAtDate = (members || []).filter(
      (member: any) =>
        cohortIdsAtDate.includes(member.cohort_id) && new Date(member.joined_at) <= date
    );

    let avgEngagement = 0;
    if (membersAtDate.length > 0) {
      const totalEngagement = membersAtDate.reduce((sum: number, member: any) => {
        return sum + (parseFloat(member.engagement_score) || 0);
      }, 0);
      avgEngagement = totalEngagement / membersAtDate.length;
    }

    dataPoints.push({
      date: date.toISOString().split('T')[0]!,
      value: Math.round(avgEngagement * 100) / 100,
    });
  }

  logger.info('Engagement chart data fetched', {
    correlationId,
    days,
    pointsCount: dataPoints.length,
  });

  return NextResponse.json({ data: dataPoints });
});
