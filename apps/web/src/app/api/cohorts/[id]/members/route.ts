/**
 * Cohort Members API Route
 *
 * GET /api/cohorts/:id/members - List all members (agents) in a cohort
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCohortMembers } from '@/server/db/queries/cohort-members';
import { getAuthContext } from '@/lib/auth-helper';
import { getCohortById } from '@/server/db/queries/cohorts';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { organizationId } = await getAuthContext();

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
