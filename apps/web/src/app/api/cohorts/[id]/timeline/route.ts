/**
 * Cohort Engagement Timeline API Route
 *
 * GET /api/cohorts/:id/timeline - Get engagement timeline data for graph
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCohortEngagementTimeline } from '@/server/db/queries/cohorts';
import { getAuthContext } from '@/lib/auth-helper';
import { getCohortById } from '@/server/db/queries/cohorts';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { organizationId } = await getAuthContext();

  const { id } = await context.params;

  // Parse query params
  const { searchParams } = new URL(request.url);
  const daysBack = Math.min(365, parseInt(searchParams.get('days') || '30'));

  try {
    // Verify cohort exists (RLS will handle access)
    const cohort = await getCohortById(id);
    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    // Fetch engagement timeline data
    const timeline = await getCohortEngagementTimeline(id, daysBack);

    return NextResponse.json({
      timeline,
      period: {
        days: daysBack,
        start: timeline[0]?.date,
        end: timeline[timeline.length - 1]?.date,
      },
    });
  } catch (error: any) {
    console.error(`GET /api/cohorts/${id}/timeline error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
