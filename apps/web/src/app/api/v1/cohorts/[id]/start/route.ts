/**
 * Cohort Runtime - start
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { ensureCohortAdmin } from '@/lib/auth-access';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
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

const startSchema = z.object({
  gatewayUrl: z.string().optional(),
  hardwareInfo: z.record(z.any()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const validator = validateRequest(startSchema, { target: 'body' });
    const data = await validator(request);

    const { userId } = await getAuthContext();
    await enforceUserRateLimit(request, userId);

    await ensureCohortAdmin(cohortId, userId);

    const cohort = await updateCohortRuntime(cohortId, {
      runtimeStatus: 'online',
      gatewayUrl: data.gatewayUrl,
      hardwareInfo: data.hardwareInfo,
      lastHeartbeatAt: new Date(),
    });

    return NextResponse.json({ data: cohort });
  }
);
