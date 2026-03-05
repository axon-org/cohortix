/**
 * POST /api/v1/engine/clone/sync
 * SDD-003 OpenClaw Integration
 *
 * Write Clone Foundation data to gateway workspace.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, getAuthContextBasic } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler, NotFoundError } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import { syncCloneSchema } from '@/lib/validations/engine';
import { getCohortById } from '@/server/db/queries/cohorts';
import { getAgents } from '@/server/db/queries/agents';
import { getEngineProxy } from '@/server/services/engine-proxy-factory';
import { insertEngineEvent } from '@/server/db/mutations/engine-events';
import { db } from '@repo/database/client';
import { cloneFoundation } from '@repo/database/schema';
import { eq } from 'drizzle-orm';
import { updateCohort } from '@/server/db/mutations/cohorts';

interface SyncResponse {
  status: 'synced';
  filesWritten: number;
}

/**
 * Generate SOUL.md content from Clone Foundation
 */
function generateSoulMd(clone: {
  displayName: string;
  values: string[];
  decisionMaking?: string | null;
  communicationStyle?: string | null;
  expertise: string[];
  aspirations?: string | null;
}): string {
  return `# SOUL.md - ${clone.displayName}

## Identity
I am ${clone.displayName} — your AI clone.

## Values
${clone.values.map((v) => `- ${v}`).join('\n')}

## Decision Making
${clone.decisionMaking || 'Adaptive and context-aware.'}

## Communication Style
${clone.communicationStyle || 'Clear, direct, and helpful.'}

## Expertise
${clone.expertise.map((e) => `- ${e}`).join('\n')}

## Aspirations
${clone.aspirations || ''}

---
*Managed by Cohortix. Edits sync automatically.*
`;
}

/**
 * Generate IDENTITY.md content from Clone Foundation
 */
function generateIdentityMd(clone: { displayName: string; communicationStyle?: string | null }): string {
  return `# IDENTITY.md

- **Name:** ${clone.displayName}
- **Creature:** AI Clone
- **Vibe:** ${clone.communicationStyle || 'Helpful and direct'}
`;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { userId } = await getAuthContext();

  // Validate request body
  const validator = validateRequest(syncCloneSchema, { target: 'body' });
  const data = await validator(request);

  logger.info('Syncing clone foundation', {
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

  // Get clone foundation for the user
  const [clone] = await db
    .select()
    .from(cloneFoundation)
    .where(eq(cloneFoundation.userId, userId));

  if (!clone) {
    return NextResponse.json(
      {
        type: 'https://cohortix.com/errors/clone-not-found',
        title: 'Clone Not Found',
        status: 422,
        detail: 'Clone Foundation not found for user. Please complete onboarding first.',
      },
      { status: 422 }
    );
  }

  // Get the clone agent (agent with externalId starting with 'user-')
  const cohortAgents = await getAgents('cohort', data.cohortId);
  const cloneAgent = cohortAgents.find(
    (a) => a.externalId?.startsWith('user-')
  );

  const externalId = cloneAgent?.externalId ?? undefined;

  if (!externalId) {
    return NextResponse.json(
      {
        type: 'https://cohortix.com/errors/clone-agent-not-found',
        title: 'Clone Agent Not Found',
        status: 422,
        detail: 'No clone agent found in cohort with an external ID. Please provision the clone agent first.',
      },
      { status: 422 }
    );
  }

  // Get proxy and write files
  const proxy = await getEngineProxy(data.cohortId);

  let filesWritten = 0;
  try {
    // Write SOUL.md
    const soulContent = generateSoulMd({
      displayName: clone.displayName,
      values: (clone.values || []) as string[],
      decisionMaking: clone.decisionMaking,
      communicationStyle: clone.communicationStyle,
      expertise: (clone.expertise || []) as string[],
      aspirations: clone.aspirations,
    });
    await proxy.writeFile('SOUL.md', soulContent, externalId);
    filesWritten++;

    // Write IDENTITY.md
    const identityContent = generateIdentityMd({
      displayName: clone.displayName,
      communicationStyle: clone.communicationStyle,
    });
    await proxy.writeFile('IDENTITY.md', identityContent, externalId);
    filesWritten++;

    // Update last synced timestamp
    await db
      .update(cloneFoundation)
      .set({
        lastSyncedAt: new Date(),
        syncedToCohortId: data.cohortId,
      })
      .where(eq(cloneFoundation.id, clone.id));

    // Log sync event
    await insertEngineEvent({
      cohortId: data.cohortId,
      eventType: 'clone_synced',
      metadata: {
        userId,
        filesWritten,
        cloneId: clone.id,
      },
    });

    logger.info('Clone foundation synced', {
      correlationId,
      cohortId: data.cohortId,
      filesWritten,
    });

    const response: SyncResponse = {
      status: 'synced',
      filesWritten,
    };

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    logger.error('Failed to sync clone foundation', {
      correlationId,
      cohortId: data.cohortId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
});
