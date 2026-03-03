/**
 * Cohort Runtime - heartbeat
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  InternalServerError,
} from '@/lib/errors';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { createHeartbeatUpdate } from '@/lib/runtime/heartbeat';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
import { updateCohortRuntime } from '@/server/db/mutations/cohorts';
import crypto from 'crypto';

const cohortRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const heartbeatSchema = z.object({
  hardwareInfo: z.record(z.any()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

type ConnectionTokenPayload = {
  cohortId: string;
  type?: string;
  exp?: number;
};

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function verifyJwt(token: string, secret: string): ConnectionTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const encodedHeader = parts[0]!;
  const encodedPayload = parts[1]!;
  const signature = parts[2]!;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64');
  const expectedNormalized = expected.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedNormalized);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as ConnectionTokenPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.type && payload.type !== 'cohort_connection') return null;
    return payload;
  } catch {
    return null;
  }
}

function getConnectionToken(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

async function ensureMember(cohortId: string, userId: string) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) throw new NotFoundError('Cohort', cohortId);

  if (cohort.type === 'personal') {
    if (cohort.ownerUserId !== userId) throw new ForbiddenError('Not allowed');
    return cohort;
  }

  const members = await getCohortUserMembers(cohortId);
  const member = members.find((m) => m.userId === userId);
  if (!member) throw new ForbiddenError('Not a cohort member');

  return cohort;
}

export const POST = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const validator = validateRequest(heartbeatSchema, { target: 'body' });
    const data = await validator(request);

    const connectionToken = getConnectionToken(request);
    const secret =
      process.env.COHORT_CONNECTION_TOKEN_SECRET ||
      process.env.JWT_SECRET ||
      process.env.NEXTAUTH_SECRET;

    if (connectionToken) {
      if (!secret) {
        throw new InternalServerError('Missing connection token secret');
      }

      const payload = verifyJwt(connectionToken, secret);
      if (!payload) {
        throw new UnauthorizedError('Invalid or expired connection token');
      }

      if (payload.cohortId !== cohortId) {
        throw new ForbiddenError('Connection token does not match cohort');
      }
    } else {
      const { userId } = await getAuthContext();
      await ensureMember(cohortId, userId);
    }

    const heartbeatUpdate = createHeartbeatUpdate();

    const cohort = await updateCohortRuntime(cohortId, {
      ...heartbeatUpdate,
      hardwareInfo: data.hardwareInfo,
    });

    return NextResponse.json({ data: cohort });
  }
);
