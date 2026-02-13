/**
 * Cohort Queries Module (COH-B2)
 * 
 * Server-side data fetching for cohorts.
 * Uses Supabase client with RLS for automatic tenant isolation.
 * 
 * Database: cohorts table with cohort_status enum (active, paused, at-risk, completed)
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

async function createClient() {
  // Production: Use SSR client with cookies for auth
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * List cohorts with pagination, filtering, and sorting
 */
export async function getCohorts(organizationId: string, filters: CohortFilters = {}) {
  const supabase = await createClient();
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

  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching cohorts:', error);
    throw new Error(`Failed to fetch cohorts: ${error.message}`);
  }

  return {
    cohorts: data || [],
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', cohortId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching cohort:', error);
    throw new Error(`Failed to fetch cohort: ${error.message}`);
  }

  return data;
}

/**
 * Get cohort statistics: engagement metrics, member breakdown, activity
 */
export async function getCohortStats(cohortId: string) {
  const supabase = await createClient();

  // Get the cohort first
  const { data: cohort, error } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', cohortId)
    .single();

  if (error || !cohort) {
    return null;
  }

  // Calculate days active
  const startDate = cohort.start_date ? new Date(cohort.start_date) : new Date(cohort.created_at);
  const endDate = cohort.end_date ? new Date(cohort.end_date) : new Date();
  const daysActive = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    memberCount: cohort.member_count,
    engagementPercent: parseFloat(cohort.engagement_percent),
    daysActive,
    status: cohort.status,
    startDate: cohort.start_date,
    endDate: cohort.end_date,
  };
}

/**
 * Get cohort activity timeline (placeholder — will use audit_logs when available)
 */
export async function getCohortActivity(cohortId: string, limit = 20) {
  const supabase = await createClient();

  // Try fetching from audit_logs if entity_id matches
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
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
 * Returns daily interaction counts for the past 30 days (or specified range)
 * Used for the "Engagement Timeline" graph in Cohort Detail screen
 */
export async function getCohortEngagementTimeline(
  cohortId: string,
  daysBack: number = 30
): Promise<Array<{ date: string; interaction_count: number }>> {
  const supabase = await createClient();

  // Calculate start date
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Query audit_logs for interactions by cohort members
  // This assumes audit_logs tracks agent activity with entity_type and entity_id
  const { data, error } = await supabase.rpc('get_cohort_engagement_timeline', {
    p_cohort_id: cohortId,
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0],
  });

  if (error) {
    console.error('Error fetching engagement timeline:', error);
    // Return empty array with date range filled with zeros
    const timeline = [];
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (daysBack - i - 1));
      timeline.push({
        date: date.toISOString().split('T')[0]!,
        interaction_count: 0,
      });
    }
    return timeline;
  }

  return data || [];
}
