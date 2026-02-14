/**
 * Cohort Members Queries Module
 *
 * Server-side data fetching for cohort members (agents/allies in cohorts).
 * Supports the Cohort Detail screen with member list, engagement scores, and statuses.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type AgentStatus = 'active' | 'idle' | 'busy' | 'offline' | 'error';

export interface CohortMember {
  id: string;
  cohort_id: string;
  agent_id: string;
  agent_name: string;
  agent_slug: string;
  agent_avatar_url: string | null;
  agent_role: string | null;
  agent_status: AgentStatus;
  engagement_score: number; // 0-100
  joined_at: string;
  last_active_at: string | null;
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
 * Get all members (agents) in a cohort with their engagement scores
 * Used for the "Batch Members" section in Cohort Detail screen
 */
export async function getCohortMembers(cohortId: string): Promise<CohortMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cohort_members')
    .select(
      `
      id,
      cohort_id,
      agent_id,
      engagement_score,
      joined_at,
      agents!inner (
        id,
        name,
        slug,
        avatar_url,
        role,
        status,
        last_active_at
      )
    `
    )
    .eq('cohort_id', cohortId)
    .order('engagement_score', { ascending: false });

  if (error) {
    console.error('Error fetching cohort members:', error);
    throw new Error(`Failed to fetch cohort members: ${error.message}`);
  }

  // Transform the joined data into our CohortMember interface
  return (data || []).map((row: any) => ({
    id: row.id,
    cohort_id: row.cohort_id,
    agent_id: row.agent_id,
    agent_name: row.agents.name,
    agent_slug: row.agents.slug,
    agent_avatar_url: row.agents.avatar_url,
    agent_role: row.agents.role,
    agent_status: row.agents.status,
    engagement_score: parseFloat(row.engagement_score) || 0,
    joined_at: row.joined_at,
    last_active_at: row.agents.last_active_at,
  }));
}

/**
 * Get member count for a cohort
 */
export async function getCohortMemberCount(cohortId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('cohort_members')
    .select('*', { count: 'exact', head: true })
    .eq('cohort_id', cohortId);

  if (error) {
    console.error('Error counting cohort members:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get average engagement score for a cohort
 */
export async function getCohortAvgEngagement(cohortId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cohort_members')
    .select('engagement_score')
    .eq('cohort_id', cohortId);

  if (error || !data || data.length === 0) {
    return 0;
  }

  const scores = data.map((m) => parseFloat(m.engagement_score) || 0);
  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(avg * 100) / 100; // Round to 2 decimals
}
