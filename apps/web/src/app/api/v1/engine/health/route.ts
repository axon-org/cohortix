/**
 * GET /api/v1/engine/health
 * SDD-003 OpenClaw Integration
 *
 * Health check endpoint for engine status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler, ValidationError } from '@/lib/errors';
import { validateData } from '@/lib/validation';
import { healthCheckQuerySchema } from '@/lib/validations/engine';
import { ensureCohortMember } from '@/lib/auth-access';
import { getEngineProxy, hasEngineConnection } from '@/server/services/engine-proxy-factory';
import { classifyError } from '@/server/services/engine-proxy';
import { db } from '@repo/database/client';
import { engineEvents } from '@repo/database/schema';
import { eq, and, sql } from 'drizzle-orm';

interface HealthResponse {
  status: 'online' | 'offline' | 'error' | 'not_connected';
  latencyMs: number;
  gatewayVersion: string;
  lastHeartbeat?: string | null;
  consecutiveFailures?: number;
  error?: {
    type: string;
    message: string;
  };
}

/**
 * Helper: Count consecutive health check failures in recent minutes
 */
async function getConsecutiveFailures(cohortId: string, minutesAgo: number): Promise<number> {
  const threshold = new Date(Date.now() - minutesAgo * 60 * 1000);

  const [result] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(engineEvents)
    .where(
      and(
        eq(engineEvents.cohortId, cohortId),
        eq(engineEvents.eventType, 'health_check_failed'),
        sql`${engineEvents.createdAt} >= ${threshold}`
      )
    );

  return result?.count ?? 0;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { userId } = await getAuthContext();

  // Parse query params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(healthCheckQuerySchema, searchParams);

  logger.debug('Checking engine health', {
    correlationId,
    cohortId: query.cohortId,
  });

  // Verify cohort exists and user has access
  const cohort = await ensureCohortMember(query.cohortId, userId);

  // Check if cohort has connection
  const hasConnection = await hasEngineConnection(query.cohortId);
  if (!hasConnection) {
    const response: HealthResponse = {
      status: 'not_connected',
      latencyMs: 0,
      gatewayVersion: '',
    };
    return NextResponse.json({ data: response }, { status: 200 });
  }

  try {
    const proxy = await getEngineProxy(query.cohortId);
    const health = await proxy.healthCheck();

    // Get consecutive failures count (last 15 minutes)
    const consecutiveFailures = await getConsecutiveFailures(query.cohortId, 15);

    const response: HealthResponse = {
      status: health.runtimeStatus,
      latencyMs: health.latencyMs,
      gatewayVersion: health.gatewayVersion,
      lastHeartbeat: cohort.lastHeartbeatAt?.toISOString() ?? null,
      consecutiveFailures,
      error: health.error
        ? {
            type: health.error.type,
            message: health.error.message,
          }
        : undefined,
    };

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    const errorType = classifyError(error);

    logger.error('Health check error', {
      correlationId,
      cohortId: query.cohortId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Get consecutive failures count (last 15 minutes)
    const consecutiveFailures = await getConsecutiveFailures(query.cohortId, 15);

    const response: HealthResponse = {
      status: errorType === 'auth_failed' ? 'error' : 'offline',
      latencyMs: 0,
      gatewayVersion: cohort.gatewayVersion || '',
      lastHeartbeat: cohort.lastHeartbeatAt?.toISOString() ?? null,
      consecutiveFailures,
      error: {
        type: errorType,
        message: error instanceof Error ? error.message : 'Health check failed',
      },
    };

    return NextResponse.json({ data: response }, { status: 200 });
  }
});
