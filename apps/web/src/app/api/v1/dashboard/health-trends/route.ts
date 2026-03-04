/**
 * Health Trends Dashboard API - Engagement Over Time
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging, Zod validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
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

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(healthTrendsQuerySchema, searchParams) as HealthTrendsQueryParams;

  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Fetching health trends', {
    correlationId,
    userId,
    organizationId,
    period: query.period,
    interval: query.interval,
  });

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

  const { data: cohorts, error } = await supabase
    .from('cohorts')
    .select('id, status, created_at')
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

  const cohortIds = (cohorts || []).map((cohort: any) => cohort.id);

  const [
    { data: userMembers, error: userMembersError },
    { data: agentMembers, error: agentMembersError },
  ] = await Promise.all([
    supabase.from('cohort_user_members').select('cohort_id, joined_at').in('cohort_id', cohortIds),
    supabase
      .from('cohort_agent_members')
      .select('cohort_id, engagement_score, joined_at')
      .in('cohort_id', cohortIds),
  ]);

  if (userMembersError || agentMembersError) {
    logger.error('Failed to fetch cohort members for health trends', {
      correlationId,
      error: userMembersError || agentMembersError,
    });
    throw userMembersError || agentMembersError;
  }

  const members = [
    ...(userMembers || []).map((member: any) => ({
      cohort_id: member.cohort_id,
      joined_at: member.joined_at,
      engagement_score: 0,
    })),
    ...(agentMembers || []).map((member: any) => ({
      cohort_id: member.cohort_id,
      joined_at: member.joined_at,
      engagement_score: member.engagement_score,
    })),
  ];

  const dataPoints: DataPoint[] = [];
  const intervalMs =
    query.interval === 'day'
      ? 24 * 60 * 60 * 1000
      : query.interval === 'week'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]!;

    const cohortsAtDate = (cohorts || []).filter((cohort: any) => {
      const createdAt = new Date(cohort.created_at);
      return createdAt <= currentDate;
    });

    const cohortIdsAtDate = cohortsAtDate.map((cohort: any) => cohort.id);
    const membersAtDate = (members || []).filter(
      (member: any) =>
        cohortIdsAtDate.includes(member.cohort_id) && new Date(member.joined_at) <= currentDate
    );

    const activeCohorts = cohortsAtDate.filter((c: any) => c.status === 'active').length;

    const totalMembers = membersAtDate.length;
    const totalEngagement = membersAtDate.reduce((sum: number, member: any) => {
      return sum + (parseFloat(member.engagement_score) || 0);
    }, 0);

    const avgEngagement =
      totalMembers > 0 ? Math.round((totalEngagement / totalMembers) * 100) / 100 : 0;

    dataPoints.push({
      date: dateStr,
      avgEngagement,
      activeCohorts,
      totalMembers,
    });

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
