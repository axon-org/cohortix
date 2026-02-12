// Cohortix Sprint 2: Cohorts Queries Module (COH-B2)
// Author: John (Backend) - Task brief: /tmp/john-sprint2-backend.md
// Date: 2026-02-12

import { createClient } from '@/lib/supabase/server';

export type Cohort = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'at-risk' | 'completed';
  start_date: string | null;
  end_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CohortMember = {
  id: string;
  cohort_id: string;
  user_id: string | null;
  ally_id: string | null;
  joined_at: string;
  engagement_score: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CohortWithStats = Cohort & {
  members_count: number;
  avg_engagement: number;
};

/**
 * Get all cohorts for an organization with filters and pagination
 */
export async function getCohorts(
  orgId: string,
  filters?: { status?: string; search?: string },
  pagination?: { page?: number; limit?: number }
) {
  const supabase = createClient();
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('cohorts')
    .select('*, cohort_members(count)', { count: 'exact' })
    .eq('organization_id', orgId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('getCohorts error:', error);
    throw error;
  }

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Get a single cohort by ID with its members
 */
export async function getCohortById(id: string) {
  const supabase = createClient();

  const { data: cohort, error: cohortError } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', id)
    .single();

  if (cohortError) {
    console.error('getCohortById error:', cohortError);
    throw cohortError;
  }

  const { data: members, error: membersError } = await supabase
    .from('cohort_members')
    .select('*')
    .eq('cohort_id', id);

  if (membersError) {
    console.error('getCohortMembers error:', membersError);
    throw membersError;
  }

  return {
    ...cohort,
    members: members || [],
  };
}

/**
 * Get cohort statistics (member count, avg engagement)
 */
export async function getCohortStats(id: string) {
  const supabase = createClient();

  const { data: members, error } = await supabase
    .from('cohort_members')
    .select('engagement_score')
    .eq('cohort_id', id);

  if (error) {
    console.error('getCohortStats error:', error);
    throw error;
  }

  const totalMembers = members?.length || 0;
  const avgEngagement =
    totalMembers > 0
      ? members.reduce((sum, m) => sum + (m.engagement_score || 0), 0) / totalMembers
      : 0;

  return {
    totalMembers,
    avgEngagement: Math.round(avgEngagement * 100) / 100,
  };
}

/**
 * Get cohort activity history (placeholder for future implementation)
 */
export async function getCohortActivity(id: string, limit = 20) {
  // TODO: Implement activity tracking
  return {
    activities: [],
  };
}
