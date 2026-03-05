/**
 * POST /api/v1/engine/verify
 * SDD-003 OpenClaw Integration
 *
 * Re-verify an existing gateway connection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import { verifyEngineSchema } from '@/lib/validations/engine';
import { NotFoundError } from '@/lib/errors';
import { getCohortById } from '@/server/db/queries/cohorts';
import { updateCohortRuntime } from '@/server/db/mutations/cohorts';
import { getEngineProxy, EngineNotConnectedError } from '@/server/services/engine-proxy-factory';
import { insertEngineEvent, countRecentEvents } from '@/server/db/mutations/engine-events';

interface VerifyResponse {
  reachable: boolean;
  latencyMs: number;
  gatewayVersion: string;
  runtimeStatus: 'online' | 'offline' | 'error';
  agentCount: number;
  error?: {
    type: string;
    message: string;
  };
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { userId } = await getAuthContext();

  // Validate request body
  const validator = validateRequest(verifyEngineSchema, { target: 'body' });
  const data = await validator(request);

  logger.info('Verifying engine connection', {
    correlationId,
    userId,
    cohortId: data.cohortId,
  });

  // Check cohort connection status
  const cohort = await getCohortById(data.cohortId);
  if (!cohort) {
    throw new NotFoundError('Cohort', data.cohortId);
  }

  if (!cohort.gatewayUrl || !cohort.authTokenEncrypted) {
    return NextResponse.json(
      {
        data: {
          reachable: false,
          latencyMs: 0,
          gatewayVersion: '',
          runtimeStatus: 'offline' as const,
          agentCount: 0,
          error: {
            type: 'not_connected',
            message: 'Cohort is not connected to an engine',
          },
        },
      },
      { status: 200 }
    );
  }

  try {
    const proxy = await getEngineProxy(data.cohortId);
    const health = await proxy.healthCheck();
    const agents = await proxy.discoverAgents();

    // Update cohort runtime status based on health
    const newStatus = health.runtimeStatus;
    if (cohort.runtimeStatus !== newStatus) {
      await updateCohortRuntime(data.cohortId, {
        runtimeStatus: newStatus,
        lastHeartbeatAt: new Date(),
      });

      // Log status change event
      if (newStatus === 'online' && cohort.runtimeStatus !== 'online') {
        await insertEngineEvent({
          cohortId: data.cohortId,
          eventType: 'health_check_recovered',
          metadata: {
            latencyMs: health.latencyMs,
            version: health.gatewayVersion,
          },
        });
      } else if (newStatus !== 'online' && cohort.runtimeStatus === 'online') {
        await insertEngineEvent({
          cohortId: data.cohortId,
          eventType: 'health_check_failed',
          metadata: {
            error: health.error,
            previousStatus: cohort.runtimeStatus,
          },
        });
      }
    } else if (newStatus === 'online') {
      // Still online, just update heartbeat
      await updateCohortRuntime(data.cohortId, {
        lastHeartbeatAt: new Date(),
      });
    }

    const response: VerifyResponse = {
      reachable: health.reachable,
      latencyMs: health.latencyMs,
      gatewayVersion: health.gatewayVersion,
      runtimeStatus: newStatus,
      agentCount: agents.length,
      error: health.error
        ? {
            type: health.error.type,
            message: health.error.message,
          }
        : undefined,
    };

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    logger.error('Engine verification failed', {
      correlationId,
      cohortId: data.cohortId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Update runtime status to error/offline
    const newStatus =
      error instanceof Error && error.message.includes('auth') ? 'error' : 'offline';
    await updateCohortRuntime(data.cohortId, {
      runtimeStatus: newStatus,
    });

    // Log failure event
    await insertEngineEvent({
      cohortId: data.cohortId,
      eventType: 'health_check_failed',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        isAuthError: newStatus === 'error',
      },
    });

    const response: VerifyResponse = {
      reachable: false,
      latencyMs: 0,
      gatewayVersion: cohort.gatewayVersion || '',
      runtimeStatus: newStatus,
      agentCount: 0,
      error: {
        type: newStatus === 'error' ? 'auth_failed' : 'unreachable',
        message: error instanceof Error ? error.message : 'Verification failed',
      },
    };

    return NextResponse.json({ data: response }, { status: 200 });
  }
});
