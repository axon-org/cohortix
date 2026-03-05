/**
 * POST /api/v1/engine/agents/discover
 * SDD-003 OpenClaw Integration
 *
 * Discover existing agents on the gateway that haven't been imported yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler, NotFoundError } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import { discoverAgentsSchema } from '@/lib/validations/engine';
import { getCohortById, getCohortAgentMembers } from '@/server/db/queries/cohorts';
import { getEngineProxy } from '@/server/services/engine-proxy-factory';

interface GatewayAgent {
  externalId: string;
  name: string;
  model?: string;
  workspace?: string;
  imported: boolean;
}

interface DiscoverResponse {
  agents: GatewayAgent[];
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { userId } = await getAuthContext();

  // Validate request body
  const validator = validateRequest(discoverAgentsSchema, { target: 'body' });
  const data = await validator(request);

  logger.info('Discovering gateway agents', {
    correlationId,
    userId,
    cohortId: data.cohortId,
  });

  // Verify cohort exists and is connected
  const cohort = await getCohortById(data.cohortId);
  if (!cohort) {
    throw new NotFoundError('Cohort', data.cohortId);
  }

  if (!cohort.gatewayUrl || !cohort.authTokenEncrypted) {
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

  // Get already imported agents
  const existingAgents = await getCohortAgentMembers(data.cohortId);
  const existingExternalIds = new Set(
    (existingAgents as Array<{ externalId?: string | null }>)
      .map((a) => a.externalId)
      .filter((id): id is string => typeof id === 'string')
  );

  // Discover agents on gateway
  try {
    const proxy = await getEngineProxy(data.cohortId);
    const discoveredAgents = await proxy.discoverAgents();

    const response: DiscoverResponse = {
      agents: discoveredAgents.map((agent) => ({
        externalId: agent.externalId,
        name: agent.name,
        model: agent.model,
        workspace: agent.workspace,
        imported: existingExternalIds.has(agent.externalId),
      })),
    };

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    logger.error('Failed to discover agents', {
      correlationId,
      cohortId: data.cohortId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return empty list on error
    const response: DiscoverResponse = {
      agents: [],
    };

    return NextResponse.json({ data: response }, { status: 200 });
  }
});
