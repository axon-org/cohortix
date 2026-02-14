/**
 * Cohort Activity Log API Route
 *
 * GET /api/cohorts/:id/activity - Get recent activity for a cohort
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCohortActivity } from '@/server/db/queries/cohorts';
import { getAuthContext } from '@/lib/auth-helper';
import { getCohortById } from '@/server/db/queries/cohorts';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { organizationId } = await getAuthContext();

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
