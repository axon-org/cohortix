/**
 * POST /api/v1/engine/send
 * SDD-003 OpenClaw Integration
 *
 * Send a prompt to an agent. If engine is offline, queue for later.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler, NotFoundError } from '@/lib/errors';
import { validateRequest } from '@/lib/validation';
import { sendToAgentSchema } from '@/lib/validations/engine';
import { getCohortById } from '@/server/db/queries/cohorts';
import { getAgentById } from '@/server/db/queries/agents';
import { hasEngineConnection, getEngineProxy } from '@/server/services/engine-proxy-factory';
import { insertTaskQueue } from '@/server/db/mutations/task-queue';
import { createTaskSession } from '@/server/services/task-sessions';
import { insertEngineEvent } from '@/server/db/mutations/engine-events';
import { EngineProxyErrorClass, classifyError } from '@/server/services/engine-proxy';

interface SendSuccessResponse {
  status: 'sent';
  sessionId: string;
  sessionKey: string;
  response?: string;
}

interface QueuedResponse {
  status: 'queued';
  queueId: string;
  sessionKey: string;
  message: string;
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { userId, organizationId } = await getAuthContext();

  // Validate request body
  const validator = validateRequest(sendToAgentSchema, { target: 'body' });
  const data = await validator(request);

  logger.info('Sending to agent', {
    correlationId,
    userId,
    cohortId: data.cohortId,
    agentId: data.agentId,
    taskId: data.taskId,
    hasStream: data.stream,
  });

  // Verify cohort exists
  const cohort = await getCohortById(data.cohortId);
  if (!cohort) {
    throw new NotFoundError('Cohort', data.cohortId);
  }

  // Verify agent exists
  const agent = await getAgentById(data.agentId);
  if (!agent) {
    throw new NotFoundError('Agent', data.agentId);
  }

  // Check if agent has an external ID (needed for externalId targeting)
  if (!agent.externalId) {
    return NextResponse.json(
      {
        type: 'https://cohortix.com/errors/agent-not-provisioned',
        title: 'Agent Not Provisioned',
        status: 422,
        detail: 'Agent does not have an external ID. Please provision the agent first.',
      },
      { status: 422 }
    );
  }

  // Derive session key
  const sessionKey = `cohortix:task:${data.taskId}:agent:${agent.externalId}`;

  // Create task session
  const session = await createTaskSession({
    taskId: data.taskId,
    agentId: data.agentId,
    cohortId: data.cohortId,
    scopeType: agent.scopeType as 'personal' | 'cohort' | 'org',
    scopeId: agent.scopeId,
    gatewaySessionId: sessionKey,
  });

  if (!session) {
    throw new Error('Failed to create task session');
  }

  // Check if engine is connected and online
  const hasConnection = await hasEngineConnection(data.cohortId);
  const isOnline = hasConnection && cohort.runtimeStatus === 'online';

  if (!isOnline) {
    // Queue for later
    const queueEntry = await insertTaskQueue({
      cohortId: data.cohortId,
      taskId: data.taskId,
      agentId: data.agentId,
      commentId: data.commentId,
      prompt: data.input,
      sessionKey,
    });

    if (!queueEntry) {
      throw new Error('Failed to queue task');
    }

    logger.info('Task queued for offline engine', {
      correlationId,
      queueId: queueEntry.id,
      cohortId: data.cohortId,
    });

    const response: QueuedResponse = {
      status: 'queued',
      queueId: queueEntry.id,
      sessionKey,
      message: 'Agent will respond when engine is back online.',
    };

    return NextResponse.json({ data: response }, { status: 202 });
  }

  try {
    // Send to agent
    const proxy = await getEngineProxy(data.cohortId);
    const agentResponse = await proxy.sendToAgent({
      agentId: agent.externalId,
      sessionKey,
      input: data.input,
      stream: data.stream,
    });

    // Update session as completed
    // Note: In real implementation, you'd update the session status
    // and create a comment with the response

    logger.info('Agent response received', {
      correlationId,
      sessionId: session.id,
      responseLength: agentResponse.text.length,
    });

    // For now, return immediate response (non-streaming)
    const response: SendSuccessResponse = {
      status: 'sent',
      sessionId: session.id,
      sessionKey,
      response: agentResponse.text,
    };

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error) {
    const errorType = classifyError(error);

    logger.error('Failed to send to agent', {
      correlationId,
      cohortId: data.cohortId,
      agentId: data.agentId,
      errorType,
      error: error instanceof Error ? error.message : String(error),
    });

    // Queue for retry if it's a recoverable error
    if (errorType !== 'auth_failed' && errorType !== 'version_mismatch') {
      const queueEntry = await insertTaskQueue({
        cohortId: data.cohortId,
        taskId: data.taskId,
        agentId: data.agentId,
        commentId: data.commentId,
        prompt: data.input,
        sessionKey,
      });

      if (!queueEntry) {
        throw new Error('Failed to queue task for retry');
      }

      const response: QueuedResponse = {
        status: 'queued',
        queueId: queueEntry.id,
        sessionKey,
        message: 'Agent will respond when engine is back online.',
      };

      return NextResponse.json({ data: response }, { status: 202 });
    }

    // Non-recoverable error
    return NextResponse.json(
      {
        type: 'https://cohortix.com/errors/agent-error',
        title: 'Agent Error',
        status: 422,
        detail: error instanceof Error ? error.message : 'Failed to send to agent',
        error: {
          type: errorType,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 422 }
    );
  }
});
