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
import { NotFoundError } from '@/lib/errors';
import { getCohortById } from '@/server/db/queries/cohorts';
import { getEngineProxy, hasEngineConnection } from '@/server/services/engine-proxy-factory';
import { classifyError } from '@/server/services/engine-proxy';

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

export const GET = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  await getAuthContext();

  // Parse query params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(healthCheckQuerySchema, searchParams);

  logger.debug('Checking engine health', {
    correlationId,
    cohortId: query.cohortId,
  });

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

  // Get cohort for metadata
  const cohort = await getCohortById(query.cohortId);
  if (!cohort) {
    throw new NotFoundError('Cohort', query.cohortId);
  }

  try {
    const proxy = await getEngineProxy(query.cohortId);
    const health = await proxy.healthCheck();

    const response: HealthResponse = {
      status: health.runtimeStatus,
      latencyMs: health.latencyMs,
      gatewayVersion: health.gatewayVersion,
      lastHeartbeat: cohort.lastHeartbeatAt?.toISOString() ?? null,
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

    const response: HealthResponse = {
      status: errorType === 'auth_failed' ? 'error' : 'offline',
      latencyMs: 0,
      gatewayVersion: cohort.gatewayVersion || '',
      lastHeartbeat: cohort.lastHeartbeatAt?.toISOString() ?? null,
      error: {
        type: errorType,
        message: error instanceof Error ? error.message : 'Health check failed',
      },
    };

    return NextResponse.json({ data: response }, { status: 200 });
  }
});
