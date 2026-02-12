/**
 * Dashboard Data Queries
 * 
 * Server-side data fetching for the main dashboard view.
 * Uses Supabase client with RLS for automatic tenant isolation.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create Supabase client with server-side cookies
 */
async function createClient() {
  // DEV MODE: Use service role to bypass RLS when testing
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

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
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return { ...user, profile };
}

/**
 * Get user's organization membership
 */
export async function getUserOrganization(userId: string) {
  const supabase = await createClient();
  
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('user_id', userId)
    .single();
  
  return membership;
}

/**
 * Dashboard KPI Metrics
 * Note: Database tables are 'projects' (Missions) and 'tasks' (Actions)
 */
export async function getDashboardKPIs(organizationId: string) {
  const supabase = await createClient();
  
  // Total active missions (database table: projects)
  const { count: activeMissions } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active');
  
  // Total actions in progress (database table: tasks)
  const { count: actionsInProgress } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('status', ['in_progress', 'todo']);
  
  // Total active allies (agents)
  const { count: activeAllies } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active');
  
  // Completion rate (completed actions / total actions)
  const { count: completedActions } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'done');
  
  const { count: totalActions } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);
  
  const completionRate = totalActions && totalActions > 0 
    ? Math.round((completedActions! / totalActions) * 100) 
    : 0;
  
  return {
    activeMissions: activeMissions || 0,
    actionsInProgress: actionsInProgress || 0,
    activeAllies: activeAllies || 0,
    completionRate,
  };
}

/**
 * Recent Activity Feed
 */
export async function getRecentActivity(organizationId: string, limit = 10) {
  const supabase = await createClient();
  
  // Fetch audit logs with related data
  const { data: activities, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      actor_agent:agents!audit_logs_actor_id_fkey(name, avatar_url),
      actor_user:profiles!audit_logs_actor_id_fkey(display_name, avatar_url)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching activity:', error);
    return [];
  }
  
  return activities || [];
}

/**
 * Active Alerts/Notifications
 * Note: User-facing: "Actions", Database table: "tasks"
 */
export async function getActiveAlerts(organizationId: string) {
  const supabase = await createClient();
  
  // Get urgent actions without assignees
  const { data: unassignedUrgent } = await supabase
    .from('tasks')
    .select('id, title, project_id')
    .eq('organization_id', organizationId)
    .eq('priority', 'urgent')
    .is('assignee_id', null)
    .limit(5);
  
  // Get overdue actions (past target date)
  const today = new Date().toISOString().split('T')[0];
  const { data: overdueActions } = await supabase
    .from('tasks')
    .select('id, title, target_date')
    .eq('organization_id', organizationId)
    .in('status', ['todo', 'in_progress'])
    .not('target_date', 'is', null)
    .lt('target_date', today)
    .limit(5);
  
  // Get blocked actions
  const { data: blockedActions } = await supabase
    .from('tasks')
    .select('id, title, blocked_reason')
    .eq('organization_id', organizationId)
    .eq('status', 'blocked')
    .limit(5);
  
  type Alert = {
    type: 'warning' | 'error' | 'info'
    title: string
    message: string
    action?: {
      label: string
      href: string
    }
  }

  const alerts: Alert[] = [];
  
  if (unassignedUrgent && unassignedUrgent.length > 0) {
    alerts.push({
      type: 'warning' as const,
      title: 'Unassigned urgent actions',
      message: `${unassignedUrgent.length} urgent actions need allies assigned`,
      action: {
        label: 'Assign now',
        href: '/actions?filter=urgent-unassigned',
      },
    });
  }
  
  if (overdueActions && overdueActions.length > 0) {
    alerts.push({
      type: 'error' as const,
      title: 'Overdue actions',
      message: `${overdueActions.length} actions are past their target date`,
      action: {
        label: 'Review',
        href: '/actions?filter=overdue',
      },
    });
  }
  
  if (blockedActions && blockedActions.length > 0) {
    alerts.push({
      type: 'info' as const,
      title: 'Blocked actions',
      message: `${blockedActions.length} actions are blocked and need attention`,
      action: {
        label: 'Unblock',
        href: '/actions?filter=blocked',
      },
    });
  }
  
  return alerts;
}

/**
 * Active Missions Overview
 * Note: User-facing: "Missions", Database table: "projects"
 */
export async function getActiveMissions(organizationId: string, limit = 6) {
  const supabase = await createClient();
  
  const { data: missions, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(name, slug),
      owner_agent:agents!projects_owner_id_fkey(name, avatar_url),
      tasks(id, status)
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching missions:', error);
    return [];
  }
  
  // Calculate action statistics for each mission
  const missionsWithStats = missions?.map((mission: any) => {
    const actions = mission.tasks || [];
    const totalActions = actions.length;
    const completedActions = actions.filter((t: any) => t.status === 'done').length;
    const inProgressActions = actions.filter((t: any) => t.status === 'in_progress').length;
    
    return {
      ...mission,
      stats: {
        total: totalActions,
        completed: completedActions,
        inProgress: inProgressActions,
        progress: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
      },
    };
  });
  
  return missionsWithStats || [];
}

/**
 * Active Allies Overview
 * Note: User-facing: "Actions", Database table: "tasks"
 */
export async function getActiveAllies(organizationId: string) {
  const supabase = await createClient();
  
  const { data: allies, error } = await supabase
    .from('agents')
    .select(`
      *,
      assigned_actions:tasks!tasks_assignee_id_fkey(
        id, 
        status,
        mission:projects(name, color)
      )
    `)
    .eq('organization_id', organizationId)
    .in('status', ['active', 'busy'])
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching allies:', error);
    return [];
  }
  
  // Calculate workload for each ally
  const alliesWithWorkload = allies?.map((ally: any) => {
    const actions = ally.assigned_actions || [];
    const activeActions = actions.filter((t: any) => 
      t.status === 'in_progress' || t.status === 'todo'
    );
    
    return {
      ...ally,
      workload: {
        active: activeActions.length,
        total: actions.length,
        currentMission: activeActions[0]?.mission,
      },
    };
  });
  
  return alliesWithWorkload || [];
}

/**
 * Recent Knowledge Entries
 */
export async function getRecentKnowledge(organizationId: string, limit = 5) {
  const supabase = await createClient();
  
  const { data: knowledge, error } = await supabase
    .from('knowledge_entries')
    .select(`
      *,
      agent:agents(name, avatar_url)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching knowledge:', error);
    return [];
  }
  
  return knowledge || [];
}

/**
 * Complete Dashboard Data
 * 
 * Fetches all data needed for the dashboard in one call
 */
export async function getDashboardData() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const membership = await getUserOrganization(user.id);
  
  if (!membership) {
    return null;
  }
  
  const organizationId = membership.organization_id;
  
  const [kpis, activity, alerts, missions, allies, knowledge] = await Promise.all([
    getDashboardKPIs(organizationId),
    getRecentActivity(organizationId),
    getActiveAlerts(organizationId),
    getActiveMissions(organizationId),
    getActiveAllies(organizationId),
    getRecentKnowledge(organizationId),
  ]);
  
  return {
    user,
    organization: membership.organization,
    role: membership.role,
    kpis,
    activity,
    alerts,
    missions,
    allies,
    knowledge,
  };
}
