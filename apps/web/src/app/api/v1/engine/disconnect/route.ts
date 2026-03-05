/**
 * POST /api/v1/engine/disconnect
 * SDD-003 OpenClaw Integration
 *
 * Disconnect a cohort from its gateway and expire queued tasks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import { disconnectEngineSchema } from '@/lib/validations/engine';
import { ensureCohortMember } from '@/lib/auth-access';
import { updateCohortRuntime } from '@/server/db/mutations/cohorts';
import { expireQueuedTasksByCohort } from '@/server/db/mutations/task-queue';
import { insertEngineEvent } from '@/server/db/mutations/engine-events';

interface DisconnectResponse {
  status: 'disconnected';
  expiredTasks: number;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { userId } = await getAuthContext();

  // Validate request body
  const validator = validateRequest(disconnectEngineSchema, { target: 'body' });
  const data = await validator(request);

  logger.info('Disconnecting engine', {
    correlationId,
    userId,
    cohortId: data.cohortId,
  });

  // Verify cohort exists and user has access
  await ensureCohortMember(data.cohortId, userId);

  // Expire all queued tasks
  const expiredTasks = await expireQueuedTasksByCohort(data.cohortId);

  // Clear connection details
  await updateCohortRuntime(data.cohortId, {
    gatewayUrl: null,
    authTokenEncrypted: null,
    runtimeStatus: 'offline',
    lastHeartbeatAt: null,
  });

  // Log disconnection event
  await insertEngineEvent({
    cohortId: data.cohortId,
    eventType: 'disconnected',
    metadata: {
      userId,
      expiredTaskCount: expiredTasks.length,
    },
  });

  logger.info('Engine disconnected', {
    correlationId,
    cohortId: data.cohortId,
    expiredTasks: expiredTasks.length,
  });

  const response: DisconnectResponse = {
    status: 'disconnected',
    expiredTasks: expiredTasks.length,
  };

  return NextResponse.json({ data: response }, { status: 200 });
});
