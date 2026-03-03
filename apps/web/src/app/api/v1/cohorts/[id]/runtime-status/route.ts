/**
 * Cohort Runtime - status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { ensureCohortMember } from '@/lib/auth-access';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
import { evaluateRuntimeStatus } from '@/lib/runtime/heartbeat';
import { updateCohortRuntime } from '@/server/db/mutations/cohorts';

const cohortRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const shouldSkipRateLimit = () =>
  process.env.NODE_ENV === 'test' ||
  process.env.E2E_SKIP_AUTH === 'true' ||
  process.env.BYPASS_AUTH === 'true';

async function enforceUserRateLimit(request: NextRequest, userId: string) {
  if (shouldSkipRateLimit()) return;
  const limiter = createRateLimiter({
    ...cohortRateLimit,
    keyGenerator: () => `user:${userId}`,
  });
  await limiter(request);
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const { userId } = await getAuthContext();
    await enforceUserRateLimit(request, userId);

    const cohort = await ensureCohortMember(cohortId, userId);

    const lastHeartbeatAt = cohort.lastHeartbeatAt ? new Date(cohort.lastHeartbeatAt) : null;

    const computedStatus = evaluateRuntimeStatus(lastHeartbeatAt);

    if (computedStatus !== cohort.runtimeStatus) {
      await updateCohortRuntime(cohortId, { runtimeStatus: computedStatus });
    }

    return NextResponse.json({
      data: {
        runtimeStatus: computedStatus,
        lastHeartbeatAt: cohort.lastHeartbeatAt ?? null,
        gatewayUrl: cohort.gatewayUrl ?? null,
        hosting: cohort.hosting,
      },
    });
  }
);
