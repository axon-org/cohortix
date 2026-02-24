/**
 * Cohort Members Queries Module
 *
 * Server-side data fetching for cohort members (users/agents in cohorts).
 */

import { getAuthContext } from '@/lib/auth-helper';

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Get all members (users/agents) in a cohort with their engagement scores
 */
export async function getCohortMembers(cohortId: string): Promise<CohortMember[]> {
  const { supabase } = await getAuthContext();

  const { data, error } = await supabase
    .from('cohort_members')
    .select('id, cohort_id, user_id, agent_id, engagement_score, joined_at')
    .eq('cohort_id', cohortId)
    .order('engagement_score', { ascending: false });

  if (error) {
    console.error('Error fetching cohort members:', error);
    throw new Error(`Failed to fetch cohort members: ${error.message}`);
  }

  const members = data || [];
  const userIds = members
    .map((row: any) => row.user_id)
    .filter((id: string | null) => Boolean(id)) as string[];
  const agentIds = members
    .map((row: any) => row.agent_id)
    .filter((id: string | null) => Boolean(id)) as string[];

  const profilesMap = new Map<string, any>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, last_active_at')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching cohort member profiles:', profilesError);
    } else {
      profiles?.forEach((profile: any) => profilesMap.set(profile.id, profile));
    }
  }

  const agentsMap = new Map<string, any>();
  if (agentIds.length > 0) {
    try {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, slug, avatar_url, role, status, last_active_at')
        .in('id', agentIds);

      if (agentsError) {
        console.error('Error fetching cohort agents:', agentsError);
      } else {
        agents?.forEach((agent: any) => agentsMap.set(agent.id, agent));
      }
    } catch (error) {
      console.warn('Agents table not available for cohort members lookup.');
    }
  }

  return members.map((row: any) => {
    const profile = row.user_id ? profilesMap.get(row.user_id) : null;
    const agent = row.agent_id ? agentsMap.get(row.agent_id) : null;
    const displayName = agent?.name || profile?.name || profile?.email || 'Unknown Agent';
    const slug = agent?.slug || slugify(displayName);

    return {
      id: row.id,
      cohort_id: row.cohort_id,
      agent_id: row.user_id || row.agent_id || row.id,
      agent_name: displayName,
      agent_slug: slug,
      agent_avatar_url: agent?.avatar_url || profile?.avatar_url || null,
      agent_role: agent?.role || null,
      agent_status: (agent?.status as AgentStatus) || 'active',
      engagement_score: parseFloat(row.engagement_score) || 0,
      joined_at: row.joined_at,
      last_active_at: agent?.last_active_at || profile?.last_active_at || null,
    };
  });
}

/**
 * Get member count for a cohort
 */
export async function getCohortMemberCount(cohortId: string): Promise<number> {
  const { supabase } = await getAuthContext();

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
  const { supabase } = await getAuthContext();

  const { data, error } = await supabase
    .from('cohort_members')
    .select('engagement_score')
    .eq('cohort_id', cohortId);

  if (error || !data || data.length === 0) {
    return 0;
  }

  const scores = data.map((m: any) => parseFloat(m.engagement_score) || 0);
  const avg = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
  return Math.round(avg * 100) / 100;
}
