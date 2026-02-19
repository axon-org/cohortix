/**
 * Cohort Queries Module (COH-B2)
 *
 * Server-side data fetching for cohorts.
 */

import { getAuthContext } from '@/lib/auth-helper';

type CohortStatus = 'active' | 'paused' | 'at-risk' | 'completed';

interface CohortFilters {
  status?: CohortStatus;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: 'name' | 'created_at' | 'engagement_percent' | 'member_count' | 'start_date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

type CohortMemberStat = {
  member_count: number;
  engagement_percent: number;
};

async function getMemberStats(
  supabase: any,
  cohortIds: string[]
): Promise<Record<string, CohortMemberStat>> {
  if (cohortIds.length === 0) return {};

  const { data: members, error } = await supabase
    .from('cohort_members')
    .select('cohort_id, engagement_score')
    .in('cohort_id', cohortIds);

  if (error) {
    console.error('Error fetching cohort member stats:', error);
    return {};
  }

  const stats: Record<string, { count: number; totalEngagement: number }> = {};
  (members || []).forEach((member: any) => {
    if (!stats[member.cohort_id]) {
      stats[member.cohort_id] = { count: 0, totalEngagement: 0 };
    }
    const entry = stats[member.cohort_id]!;
    entry.count += 1;
    entry.totalEngagement += parseFloat(member.engagement_score) || 0;
  });

  return Object.entries(stats).reduce<Record<string, CohortMemberStat>>((acc, [id, value]) => {
    acc[id] = {
      member_count: value.count,
      engagement_percent:
        value.count > 0 ? Math.round((value.totalEngagement / value.count) * 100) / 100 : 0,
    };
    return acc;
  }, {});
}

/**
 * List cohorts with pagination, filtering, and sorting
 */
export async function getCohorts(organizationId: string, filters: CohortFilters = {}) {
  const { supabase } = await getAuthContext();
  const {
    status,
    search,
    startDateFrom,
    startDateTo,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
  } = filters;

  const needsComputedSort = ['member_count', 'engagement_percent'].includes(sortBy);

  let query = supabase
    .from('cohorts')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (startDateFrom) {
    query = query.gte('start_date', startDateFrom);
  }

  if (startDateTo) {
    query = query.lte('start_date', startDateTo);
  }

  if (!needsComputedSort) {
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching cohorts:', error);
    throw new Error(`Failed to fetch cohorts: ${error.message}`);
  }

  const cohorts = data || [];
  const cohortIds = cohorts.map((cohort: any) => cohort.id);
  const statsMap = await getMemberStats(supabase, cohortIds);

  const enriched = cohorts.map((cohort: any) => ({
    ...cohort,
    member_count: statsMap[cohort.id]?.member_count || 0,
    engagement_percent: statsMap[cohort.id]?.engagement_percent || 0,
  }));

  const sorted = needsComputedSort
    ? enriched.sort((a: any, b: any) => {
        const direction = sortOrder === 'asc' ? 1 : -1;
        return (a[sortBy] - b[sortBy]) * direction;
      })
    : enriched;

  const paged = needsComputedSort ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  return {
    cohorts: paged,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get a single cohort by ID with related data
 */
export async function getCohortById(cohortId: string) {
  const { supabase, organizationId } = await getAuthContext();

  const { data, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', cohortId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching cohort:', error);
    throw new Error(`Failed to fetch cohort: ${error.message}`);
  }

  if (!data) return null;

  const statsMap = await getMemberStats(supabase, [data.id]);
  return {
    ...data,
    member_count: statsMap[data.id]?.member_count || 0,
    engagement_percent: statsMap[data.id]?.engagement_percent || 0,
  };
}

/**
 * Get cohort statistics: engagement metrics, member breakdown, activity
 */
export async function getCohortStats(cohortId: string) {
  const { supabase, organizationId } = await getAuthContext();

  const { data: cohort, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', cohortId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !cohort) {
    return null;
  }

  const statsMap = await getMemberStats(supabase, [cohort.id]);
  const memberStats = statsMap[cohort.id] || { member_count: 0, engagement_percent: 0 };

  const startDate = cohort.start_date ? new Date(cohort.start_date) : new Date(cohort.created_at);
  const endDate = cohort.end_date ? new Date(cohort.end_date) : new Date();
  const daysActive = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    memberCount: memberStats.member_count,
    engagementPercent: memberStats.engagement_percent,
    daysActive,
    status: cohort.status,
    startDate: cohort.start_date,
    endDate: cohort.end_date,
  };
}

/**
 * Get cohort activity timeline
 */
export async function getCohortActivity(cohortId: string, limit = 20) {
  const { supabase, organizationId } = await getAuthContext();

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_id', cohortId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching cohort activity:', error);
    return [];
  }

  return data || [];
}

/**
 * Get engagement timeline data for a cohort
 */
export async function getCohortEngagementTimeline(
  cohortId: string,
  daysBack: number = 30
): Promise<Array<{ date: string; interaction_count: number }>> {
  const { supabase } = await getAuthContext();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const { data, error } = await supabase
    .from('cohort_members')
    .select('joined_at')
    .eq('cohort_id', cohortId)
    .gte('joined_at', startDate.toISOString())
    .lte('joined_at', endDate.toISOString());

  if (error) {
    console.error('Error fetching engagement timeline:', error);
  }

  const timelineMap = new Map<string, number>();
  (data || []).forEach((row: any) => {
    const date = new Date(row.joined_at).toISOString().split('T')[0]!;
    timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
  });

  const timeline = [] as Array<{ date: string; interaction_count: number }>;
  for (let i = 0; i < daysBack; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (daysBack - i - 1));
    const dateKey = date.toISOString().split('T')[0]!;
    timeline.push({
      date: dateKey,
      interaction_count: timelineMap.get(dateKey) || 0,
    });
  }

  return timeline;
}
