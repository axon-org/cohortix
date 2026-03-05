/**
 * POST /api/v1/engine/agents/import
 * SDD-003 OpenClaw Integration
 *
 * Import an existing gateway agent into Cohortix.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler, NotFoundError } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import { importAgentSchema } from '@/lib/validations/engine';
import { getCohortById } from '@/server/db/queries/cohorts';
import { insertAgent, updateAgent } from '@/server/db/mutations/agents';
import { getEngineProxy } from '@/server/services/engine-proxy-factory';

interface ImportResponse {
  status: 'imported';
  agentId: string;
  externalId: string;
  importedAsClone: boolean;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { userId, organizationId } = await getAuthContext();

  // Validate request body
  const validator = validateRequest(importAgentSchema, { target: 'body' });
  const data = await validator(request);

  logger.info('Importing gateway agent', {
    correlationId,
    userId,
    cohortId: data.cohortId,
    externalId: data.externalId,
    asClone: data.asClone,
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

  // Get agent info from gateway
  const proxy = await getEngineProxy(data.cohortId);

  let agentName = data.externalId;
  let agentRole = 'Imported Agent';

  try {
    // Read agent's workspace files to get info
    const soulContent = await proxy.readFile('SOUL.md', data.externalId);
    // Parse name from SOUL.md (simple parsing)
    const nameMatch = soulContent.match(/I am (\w+)/);
    if (nameMatch) {
      agentName = nameMatch[1] ?? data.externalId;
    }
    const roleMatch = soulContent.match(/## Role\n([^\n]+)/);
    if (roleMatch) {
      agentRole = roleMatch[1] ?? 'Imported Agent';
    }
  } catch {
    // Fallback if files don't exist
    logger.warn('Could not read agent workspace files', {
      correlationId,
      externalId: data.externalId,
    });
  }

  // Create agent in Cohortix
  const newAgent = await insertAgent({
    name: agentName,
    externalId: data.externalId,
    scopeType: 'cohort',
    scopeId: data.cohortId,
    defaultCohortId: data.cohortId,
    role: agentRole,
    description: `Imported from gateway`,
    status: 'active',
    capabilities: [],
    settings: {},
    runtimeType: 'clawdbot',
    runtimeConfig: {},
  });

  if (!newAgent) {
    throw new Error('Failed to create agent');
  }

  logger.info('Agent imported', {
    correlationId,
    agentId: newAgent.id,
    externalId: data.externalId,
  });

  const response: ImportResponse = {
    status: 'imported',
    agentId: newAgent.id,
    externalId: data.externalId,
    importedAsClone: data.asClone,
  };

  return NextResponse.json({ data: response }, { status: 201 });
});
