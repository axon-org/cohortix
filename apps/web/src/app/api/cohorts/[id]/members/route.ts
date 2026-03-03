/**
 * Cohort Members API Route (Legacy)
 *
 * GET /api/cohorts/:id/members - List all members (agents) in a cohort
 * NOTE: This is the legacy route. Prefer /api/v1/cohorts/:id/members
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import {
  getCohortById,
  getCohortAgentMembers,
  getCohortUserMembers,
} from '@/server/db/queries/cohorts';
import { logger } from '@/lib/logger';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { organizationId, userId } = await getAuthContext();
  const correlationId = logger.generateCorrelationId();

  const { id } = await context.params;

  try {
    // Verify cohort exists and user has access
    const cohort = await getCohortById(id);
    if (!cohort) {
      return NextResponse.json(
        {
          type: 'https://cohortix.io/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Cohort not found',
        },
        { status: 404 }
      );
    }

    // Check user membership for shared cohorts and fetch members
    let userMembers;
    if (cohort.type === 'shared') {
      userMembers = await getCohortUserMembers(id);
      const isMember = userMembers.some((m) => m.userId === userId);
      if (!isMember) {
        return NextResponse.json(
          {
            type: 'https://cohortix.io/errors/forbidden',
            title: 'Forbidden',
            status: 403,
            detail: 'Not a member of this cohort',
          },
          { status: 403 }
        );
      }
    } else if (cohort.type === 'personal' && cohort.ownerUserId !== userId) {
      return NextResponse.json(
        {
          type: 'https://cohortix.io/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'Not authorized to access this cohort',
        },
        { status: 403 }
      );
    }

    // Fetch agent members and user members if not already fetched
    const agentMembersPromise = getCohortAgentMembers(id);
    const userMembersPromise = userMembers
      ? Promise.resolve(userMembers)
      : getCohortUserMembers(id);
    const [finalUserMembers, agentMembers] = await Promise.all([
      userMembersPromise,
      agentMembersPromise,
    ]);
    userMembers = finalUserMembers;

    // Transform to legacy response format
    const members = [
      ...userMembers.map((u) => ({
        id: u.id,
        cohort_id: u.cohortId,
        agent_id: u.userId,
        agent_name: u.name || u.email || 'Unknown',
        agent_slug: (u.name || u.email || 'unknown').toLowerCase().replace(/\s+/g, '-'),
        agent_avatar_url: u.avatarUrl,
        agent_role: u.role,
        agent_status: 'active' as const,
        engagement_score: 0,
        joined_at: u.joinedAt?.toISOString() || new Date().toISOString(),
        last_active_at: null,
      })),
      ...agentMembers.map((a) => ({
        id: a.id,
        cohort_id: a.cohortId,
        agent_id: a.agentId,
        agent_name: a.name || 'Unknown Agent',
        agent_slug: a.slug || (a.name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
        agent_avatar_url: a.avatarUrl,
        agent_role: a.role,
        agent_status: (a.status as 'active' | 'idle' | 'busy' | 'offline' | 'error') || 'active',
        engagement_score: a.engagementScore || 0,
        joined_at: a.joinedAt?.toISOString() || new Date().toISOString(),
        last_active_at: null,
      })),
    ];

    return NextResponse.json({ members, count: members.length });
  } catch (error: any) {
    logger.error('GET /api/cohorts/:id/members error', {
      correlationId,
      cohortId: id,
      error: error.message,
    });
    return NextResponse.json(
      {
        type: 'https://cohortix.io/errors/internal-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch cohort members',
      },
      { status: 500 }
    );
  }
}
