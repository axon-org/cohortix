/**
 * Task Sessions API - update
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { closeTaskSession } from '@/server/services/task-sessions';

const taskSessionRateLimit = {
  maxRequests: 60,
  windowMs: 60 * 1000,
};

const updateTaskSessionSchema = z.object({
  status: z.enum(['running', 'completed', 'failed', 'cancelled']),
  error: z.record(z.any()).optional(),
});

const paramsSchema = z.object({
  id: uuidSchema,
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withMiddleware(
  taskSessionRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const { id: sessionId } = validateData(paramsSchema, { id });

    const validator = validateRequest(updateTaskSessionSchema, { target: 'body' });
    const data = await validator(request);

    await getAuthContext();

    const session = await closeTaskSession(sessionId, data.status, data.error ?? null);

    return NextResponse.json({ data: session });
  }
);
