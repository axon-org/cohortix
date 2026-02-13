/**
 * Cohort Activity Log API Route
 * 
 * GET /api/cohorts/:id/activity - Get recent activity for a cohort
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCohortActivity } from '@/server/db/queries/cohorts';
import { getCurrentUser, getUserOrganization } from '@/server/db/queries/dashboard';
import { getCohortById } from '@/server/db/queries/cohorts';

async function getAuthContext() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const membership = await getUserOrganization(user.id);
  if (!membership) {
    return { error: NextResponse.json({ error: 'No organization found' }, { status: 403 }) };
  }
  return { user, organizationId: membership.organization_id };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getAuthContext();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await context.params;

  // Parse query params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

  try {
    // Verify cohort exists and user has access (RLS will handle this)
    const cohort = await getCohortById(id);
    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    // Fetch recent activity
    const activities = await getCohortActivity(id, limit);

    return NextResponse.json({ activities, count: activities.length });
  } catch (error: any) {
    console.error(`GET /api/cohorts/${id}/activity error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
