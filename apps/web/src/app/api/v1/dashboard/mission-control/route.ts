/**
 * Mission Control Dashboard API - KPI Aggregations
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';

interface KPIData {
  kpis: {
    activeCohortsCount: number;
    totalAgents: number;
    avgEngagement: number;
    atRiskCount: number;
  };
  trends: {
    activeCohortsChange: number;
    totalAgentsChange: number;
    avgEngagementChange: number;
    atRiskChange: number;
  };
}

type CohortMemberRow = {
  cohort_id: string;
  engagement_score: string | number | null;
  joined_at: string;
};

function computeEngagementStats(cohortIds: string[], members: CohortMemberRow[]) {
  const stats = new Map<string, { count: number; total: number }>();
  cohortIds.forEach((id) => stats.set(id, { count: 0, total: 0 }));

  members.forEach((member) => {
    const entry = stats.get(member.cohort_id);
    if (!entry) return;
    entry.count += 1;
    entry.total += parseFloat(member.engagement_score as string) || 0;
  });

  const engagementByCohort = Array.from(stats.values()).map((entry) =>
    entry.count > 0 ? entry.total / entry.count : 0
  );

  const avgEngagement =
    engagementByCohort.length > 0
      ? Math.round(
          (engagementByCohort.reduce((sum, value) => sum + value, 0) / engagementByCohort.length) *
            100
        ) / 100
      : 0;

  return { avgEngagement };
}

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Fetching Mission Control KPIs', {
    correlationId,
    userId,
    organizationId,
  });

  const { data: cohorts, error: cohortsError } = await supabase
    .from('cohorts')
    .select('id, status, created_at')
    .eq('organization_id', organizationId);

  if (cohortsError) {
    logger.error('Failed to fetch cohorts for KPIs', {
      correlationId,
      error: cohortsError,
    });
    throw cohortsError;
  }

  const { data: members, error: membersError } = await supabase
    .from('cohort_members')
    .select('cohort_id, engagement_score, joined_at')
    .in(
      'cohort_id',
      (cohorts || []).map((cohort: any) => cohort.id)
    );

  if (membersError) {
    logger.error('Failed to fetch cohort members for KPIs', {
      correlationId,
      error: membersError,
    });
    throw membersError;
  }

  const activeCohortsCount = (cohorts || []).filter((c: any) => c.status === 'active').length;
  const atRiskCount = (cohorts || []).filter((c: any) => c.status === 'at-risk').length;
  const totalAgents = (members || []).length;

  const { avgEngagement } = computeEngagementStats(
    (cohorts || []).map((cohort: any) => cohort.id),
    (members || []) as CohortMemberRow[]
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const prevCohorts = (cohorts || []).filter(
    (cohort: any) => new Date(cohort.created_at) <= thirtyDaysAgo
  );
  const prevMembers = (members || []).filter(
    (member: any) => new Date(member.joined_at) <= thirtyDaysAgo
  );

  const prevActiveCount = prevCohorts.filter((c: any) => c.status === 'active').length;
  const prevAtRiskCount = prevCohorts.filter((c: any) => c.status === 'at-risk').length;
  const prevAgentsCount = prevMembers.length;

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  };

  const kpiData: KPIData = {
    kpis: {
      activeCohortsCount,
      totalAgents,
      avgEngagement,
      atRiskCount,
    },
    trends: {
      activeCohortsChange: calculatePercentageChange(activeCohortsCount, prevActiveCount),
      totalAgentsChange: calculatePercentageChange(totalAgents, prevAgentsCount),
      avgEngagementChange: 0,
      atRiskChange: calculatePercentageChange(atRiskCount, prevAtRiskCount),
    },
  };

  logger.info('Mission Control KPIs fetched successfully', {
    correlationId,
    kpis: kpiData.kpis,
  });

  return NextResponse.json({ data: kpiData });
});
