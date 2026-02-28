/**
 * Knowledge Hub Sources API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
import { getKnowledgeSources } from '@/server/services/knowledge-hub';

const sourcesRateLimit = {
  maxRequests: 60,
  windowMs: 60 * 1000,
};

const querySchema = z.object({
  cohortId: uuidSchema,
});

async function ensureCohortAccess(cohortId: string, userId: string) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) throw new NotFoundError('Cohort', cohortId);

  if (cohort.type === 'personal') {
    if (cohort.ownerUserId !== userId) {
      throw new ForbiddenError('Not allowed');
    }
    return;
  }

  const members = await getCohortUserMembers(cohortId);
  const member = members.find((m) => m.userId === userId);
  if (!member) throw new ForbiddenError('Not a cohort member');
}

export const GET = withMiddleware(sourcesRateLimit, async (request: NextRequest) => {
  const query = validateData(querySchema, Object.fromEntries(request.nextUrl.searchParams));
  const { userId } = await getAuthContext();

  await ensureCohortAccess(query.cohortId, userId);

  const sources = await getKnowledgeSources(query.cohortId);

  return NextResponse.json({ data: sources });
});
