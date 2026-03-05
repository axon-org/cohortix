/**
 * PUT /api/v1/engine/token
 * SDD-003 OpenClaw Integration
 *
 * Rotate gateway auth token without full reconnection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import { rotateTokenSchema } from '@/lib/validations/engine';
import { encrypt } from '@/lib/encryption';
import { NotFoundError } from '@/lib/errors';
import { getCohortById } from '@/server/db/queries/cohorts';
import { updateCohortRuntime } from '@/server/db/mutations/cohorts';
import { EngineProxyService } from '@/server/services/engine-proxy';
import { insertEngineEvent } from '@/server/db/mutations/engine-events';

interface RotateTokenResponse {
  status: 'token_updated';
  gatewayVersion: string;
  latencyMs: number;
}

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { userId } = await getAuthContext();

  // Validate request body
  const validator = validateRequest(rotateTokenSchema, { target: 'body' });
  const data = await validator(request);

  logger.info('Rotating engine token', {
    correlationId,
    userId,
    cohortId: data.cohortId,
  });

  // Verify cohort exists and has connection
  const cohort = await getCohortById(data.cohortId);
  if (!cohort) {
    throw new NotFoundError('Cohort', data.cohortId);
  }

  if (!cohort.gatewayUrl) {
    return NextResponse.json(
      {
        type: 'https://cohortix.com/errors/not-connected',
        title: 'Not Connected',
        status: 422,
        detail: 'Cohort is not connected to a gateway',
      },
      { status: 422 }
    );
  }

  // Test new token before storing
  const tempService = new EngineProxyService(cohort.gatewayUrl, data.newToken, {
    timeoutMs: 30000,
    maxRetries: 1,
  });

  const health = await tempService.healthCheck();

  if (!health.reachable) {
    logger.warn('Token rotation failed - token invalid', {
      correlationId,
      cohortId: data.cohortId,
      error: health.error,
    });

    return NextResponse.json(
      {
        type: 'https://cohortix.com/errors/invalid-token',
        title: 'Invalid Token',
        status: 422,
        detail: `The new token is invalid: ${health.error?.message ?? 'Could not connect to gateway'}`,
      },
      { status: 422 }
    );
  }

  // Encrypt and store new token
  const encryptedToken = encrypt(data.newToken);

  await updateCohortRuntime(data.cohortId, {
    authTokenEncrypted: encryptedToken,
    runtimeStatus: 'online',
    lastHeartbeatAt: new Date(),
  });

  // Log token rotation event
  await insertEngineEvent({
    cohortId: data.cohortId,
    eventType: 'token_rotated',
    metadata: {
      userId,
      version: health.gatewayVersion,
      latencyMs: health.latencyMs,
    },
  });

  logger.info('Engine token rotated successfully', {
    correlationId,
    cohortId: data.cohortId,
    version: health.gatewayVersion,
  });

  const response: RotateTokenResponse = {
    status: 'token_updated',
    gatewayVersion: health.gatewayVersion,
    latencyMs: health.latencyMs,
  };

  return NextResponse.json({ data: response }, { status: 200 });
});
