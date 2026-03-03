/**
 * Cohort Runtime - connection token
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthContext } from '@/lib/auth-helper';
import { ensureCohortAdmin } from '@/lib/auth-access';
import { InternalServerError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
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

function base64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload: Record<string, unknown>, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  return `${data}.${base64url(signature)}`;
}

export const POST = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const { userId } = await getAuthContext();
    await enforceUserRateLimit(request, userId);

    await ensureCohortAdmin(cohortId, userId);

    const secret =
      process.env.COHORT_CONNECTION_TOKEN_SECRET ||
      process.env.JWT_SECRET ||
      process.env.NEXTAUTH_SECRET;

    if (!secret) {
      throw new InternalServerError('Missing connection token secret');
    }

    const expiresInSeconds = 7 * 24 * 60 * 60;
    const payload = {
      cohortId,
      type: 'cohort_connection',
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };

    const token = signJwt(payload, secret);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await updateCohortRuntime(cohortId, {
      authTokenHash: tokenHash,
    });

    return NextResponse.json({
      data: {
        token,
        expiresIn: expiresInSeconds,
      },
    });
  }
);
