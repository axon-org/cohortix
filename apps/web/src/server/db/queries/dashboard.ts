/**
 * Dashboard Data Queries
 *
 * Server-side data fetching for the main dashboard view.
 * Uses Supabase client with RLS for automatic tenant isolation.
 */

import { getAuthContext } from '@/lib/auth-helper';

/**
 * Create Supabase client — delegates to centralized auth helper
 * which handles BYPASS_AUTH for dev mode
 */
async function createClient() {
  const { supabase } = await getAuthContext();
  return supabase;
}

/**
 * Get current authenticated user (simplified — auth handled by getAuthContext)
 */
export async function getCurrentUser() {
  const { supabase, userId } = await getAuthContext();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

  return { id: userId, profile };
}

/**
 * Get user's organization membership
 */
export async function getUserOrganization(userId: string) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select(
      `
      *,
      organization:organizations(*)
    `
    )
    .eq('user_id', userId)
    .single();

  return membership;
}

/**
 * Dashboard KPI Metrics
 * Note: PPV Hierarchy - missions table (Missions), projects table (Operations), tasks table (Tasks)
 */
export async function getDashboardKPIs(organizationId: string) {
  const supabase = await createClient();

  // Run all KPI queries in parallel
  const [
    { count: activeMissions },
    { count: actionsInProgress },
    { count: completedActions },
    { count: totalActions },
    { count: activeCohorts },
    { count: activeAgents },
  ] = await Promise.all([
    supabase
      .from('missions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['in_progress', 'todo']),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'done'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase
      .from('cohorts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
    supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
  ]);

  const completionRate =
    totalActions && totalActions > 0 ? Math.round((completedActions! / totalActions) * 100) : 0;

  return {
    activeMissions: activeMissions || 0,
    actionsInProgress: actionsInProgress || 0,
    activeCohorts: activeCohorts || 0,
    activeAgents: activeAgents || 0,
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
    .from('activity_log')
    .select('*')
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
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    action?: {
      label: string;
      href: string;
    };
  };

  const alerts: Alert[] = [];

  if (unassignedUrgent && unassignedUrgent.length > 0) {
    alerts.push({
      type: 'warning' as const,
      title: 'Unassigned urgent actions',
      message: `${unassignedUrgent.length} urgent actions need agents assigned`,
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
 * Note: PPV Hierarchy - User-facing: "Missions", Database table: "missions"
 */
export async function getActiveMissions(organizationId: string, limit = 6) {
  const supabase = await createClient();

  const { data: missions, error } = await supabase
    .from('missions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching missions:', error);
    return [];
  }

  // For each mission, count linked operations and tasks
  const missionsWithStats = await Promise.all(
    (missions || []).map(async (mission: any) => {
      // Count operations (projects) linked to this mission
      const { count: operationsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('mission_id', mission.id);

      // Get all operations for this mission to count their tasks
      const { data: operations } = await supabase
        .from('projects')
        .select('id')
        .eq('mission_id', mission.id);

      let totalActions = 0;
      let completedActions = 0;
      let inProgressActions = 0;

      if (operations && operations.length > 0) {
        const operationIds = operations.map((op: any) => op.id);

        const { count: total } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('project_id', operationIds);

        const { count: completed } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('project_id', operationIds)
          .eq('status', 'done');

        const { count: inProgress } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('project_id', operationIds)
          .eq('status', 'in_progress');

        totalActions = total || 0;
        completedActions = completed || 0;
        inProgressActions = inProgress || 0;
      }

      return {
        ...mission,
        stats: {
          operations: operationsCount || 0,
          total: totalActions,
          completed: completedActions,
          inProgress: inProgressActions,
          progress: mission.progress || 0,
        },
      };
    })
  );

  return missionsWithStats;
}

/**
 * Active Agents Overview
 * Note: User-facing: "Actions", Database table: "tasks"
 */
export async function getActiveAgents(organizationId: string) {
  const supabase = await createClient();

  // TODO: Replace with OpenClaw agent integration (separate feature branch)
  // The DB table is still 'allies' (rename migration pending), but this feature
  // will be rebuilt to pull from OpenClaw anyway. Return empty for now.
  return [];
}

/**
 * Recent Knowledge Entries
 */
export async function getRecentKnowledge(organizationId: string, limit = 5) {
  const supabase = await createClient();

  const { data: knowledge, error } = await supabase
    .from('insights')
    .select('*')
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
  const authContext = await getAuthContext();
  const { supabase, userId, organizationId } = authContext;

  // Get user profile + org membership in parallel
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('organization_memberships')
      .select(`*, organization:organizations(*)`)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single(),
  ]);
  const user = { id: userId, profile };

  const [kpis, activity, alerts, missions, agents, knowledge] = await Promise.all([
    getDashboardKPIs(organizationId),
    getRecentActivity(organizationId),
    getActiveAlerts(organizationId),
    getActiveMissions(organizationId),
    getActiveAgents(organizationId),
    getRecentKnowledge(organizationId),
  ]);

  return {
    user,
    organization: membership?.organization ?? null,
    role: membership?.role ?? 'member',
    kpis,
    activity,
    alerts,
    missions,
    agents,
    knowledge,
  };
}
