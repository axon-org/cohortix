/**
 * Cohort Members API Route
 * 
 * GET /api/cohorts/:id/members - List all members (allies) in a cohort
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCohortMembers } from '@/server/db/queries/cohort-members';
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

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await getAuthContext();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await context.params;

  try {
    // Verify cohort exists (RLS will handle access)
    const cohort = await getCohortById(id);
    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    // Fetch members with engagement scores and statuses
    const members = await getCohortMembers(id);

    return NextResponse.json({ members, count: members.length });
  } catch (error: any) {
    console.error(`GET /api/cohorts/${id}/members error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
