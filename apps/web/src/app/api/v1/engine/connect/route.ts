/**
 * POST /api/v1/engine/connect
 * SDD-003 OpenClaw Integration
 *
 * Establish connection between a cohort and a gateway.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/errors';
import { validateRequest, validateData } from '@/lib/validation';
import { connectEngineSchema } from '@/lib/validations/engine';
import { encrypt } from '@/lib/encryption';
import { ensureCohortMember } from '@/lib/auth-access';
import { updateCohort, updateCohortRuntime } from '@/server/db/mutations/cohorts';
import {
  EngineProxyService,
  EngineProxyErrorClass,
  classifyError,
  type HealthCheckResult,
} from '@/server/services/engine-proxy';
import { insertEngineEvent } from '@/server/db/mutations/engine-events';
import { NotFoundError, ValidationError, BadRequestError } from '@/lib/errors';

// Minimum required gateway version (SDD-003 §11.1)
const MIN_GATEWAY_VERSION = '2026.1.29';

interface ConnectResponse {
  status: 'connected';
  runtimeStatus: 'online' | 'offline' | 'error';
  gatewayVersion: string;
  latencyMs: number;
  existingAgents: Array<{
    externalId: string;
    name: string;
    model?: string;
    workspace?: string;
  }>;
  error?: {
    type: string;
    message: string;
  };
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { userId, organizationId } = await getAuthContext();

  // Validate request body
  const validator = validateRequest(connectEngineSchema, { target: 'body' });
  const data = await validator(request);

  logger.info('Connecting engine', {
    correlationId,
    userId,
    cohortId: data.cohortId,
    gatewayUrl: data.gatewayUrl,
    hosting: data.hosting,
  });

  // Verify cohort exists and user has access
  const cohort = await ensureCohortMember(data.cohortId, userId);

  // Normalize gateway URL
  let gatewayUrl = data.gatewayUrl.trim();
  if (gatewayUrl.endsWith('/')) {
    gatewayUrl = gatewayUrl.slice(0, -1);
  }

  // Create temp service for testing connection
  const tempService = new EngineProxyService(gatewayUrl, data.authToken, {
    timeoutMs: 30000,
    maxRetries: 1,
  });

  // Test connection and discover
  let health: HealthCheckResult;
  let agents: Awaited<ReturnType<typeof tempService.discoverAgents>> = [];

  try {
    // 1. Health check
    health = await tempService.healthCheck();

    if (!health.reachable) {
      const errorType = health.error?.type ?? 'unreachable';
      logger.warn('Engine connection failed - not reachable', {
        correlationId,
        cohortId: data.cohortId,
        errorType,
        error: health.error,
      });

      return NextResponse.json(
        {
          type: 'https://cohortix.com/errors/connection-failed',
          title: 'Connection Failed',
          status: 422,
          detail: `Failed to connect to gateway: ${health.error?.message ?? 'Gateway is unreachable'}`,
          error: {
            type: errorType,
            message: health.error?.message ?? 'Gateway is unreachable',
          },
        } as const,
        { status: 422 }
      );
    }

    // 2. Check version
    if (health.error?.type === 'version_mismatch') {
      logger.warn('Engine version too old', {
        correlationId,
        cohortId: data.cohortId,
        version: health.gatewayVersion,
        minVersion: MIN_GATEWAY_VERSION,
      });

      return NextResponse.json(
        {
          type: 'https://cohortix.com/errors/version-mismatch',
          title: 'Gateway Version Too Old',
          status: 422,
          detail: `Gateway version ${health.gatewayVersion} is below the minimum required version ${MIN_GATEWAY_VERSION}. Please update your OpenClaw Gateway.`,
          error: {
            type: 'version_mismatch',
            message: `Gateway version ${health.gatewayVersion} is too old`,
            currentVersion: health.gatewayVersion,
            requiredVersion: MIN_GATEWAY_VERSION,
          },
        } as const,
        { status: 422 }
      );
    }

    // 3. Discover existing agents
    agents = await tempService.discoverAgents();

    logger.info('Engine connection successful', {
      correlationId,
      cohortId: data.cohortId,
      version: health.gatewayVersion,
      latencyMs: health.latencyMs,
      agentCount: agents.length,
    });
  } catch (error) {
    const errorType = classifyError(error);
    logger.error('Engine connection failed', {
      correlationId,
      cohortId: data.cohortId,
      errorType,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        type: 'https://cohortix.com/errors/connection-failed',
        title: 'Connection Failed',
        status: 422,
        detail: `Failed to connect to gateway: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          type: errorType,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      } as const,
      { status: 422 }
    );
  }

  // Encrypt and store auth token
  const encryptedToken = encrypt(data.authToken);

  // Update cohort with connection details
  await updateCohortRuntime(data.cohortId, {
    gatewayUrl,
    authTokenEncrypted: encryptedToken,
    runtimeStatus: 'online',
    lastHeartbeatAt: new Date(),
    hardwareInfo: {
      ...((cohort.hardwareInfo as Record<string, unknown>) || {}),
      gatewayVersion: health.gatewayVersion,
      connectedAt: new Date().toISOString(),
    },
  });

  // Log connection event
  await insertEngineEvent({
    cohortId: data.cohortId,
    eventType: 'connected',
    metadata: {
      gatewayUrl,
      version: health.gatewayVersion,
      latencyMs: health.latencyMs,
      agentCount: agents.length,
      userId,
    },
  });

  const response: ConnectResponse = {
    status: 'connected',
    runtimeStatus: health.runtimeStatus,
    gatewayVersion: health.gatewayVersion,
    latencyMs: health.latencyMs,
    existingAgents: agents.map((a) => ({
      externalId: a.externalId,
      name: a.name,
      model: a.model,
      workspace: a.workspace,
    })),
  };

  return NextResponse.json({ data: response }, { status: 200 });
});
