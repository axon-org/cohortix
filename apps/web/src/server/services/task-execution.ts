/**
 * Task Execution Service
 * SDD-003 OpenClaw Integration §6
 *
 * Handles agent task execution pipeline when @mentioned in comments.
 */

import { logger } from '@/lib/logger';
import { getEngineProxy } from './engine-proxy-factory';
import { getAgentById } from '../db/queries/agents';
import { getCohortById } from '../db/queries/cohorts';
import { createTaskSession, updateTaskSession } from './task-sessions';
import { insertTaskQueue, updateTaskQueue } from '../db/mutations/task-queue';
import { getQueuedTasksByCohort, getPendingTasks } from '../db/queries/task-queue';
import { classifyError, type EngineErrorType } from './engine-proxy';
import { db } from '@repo/database/client';
import { comments, tasks } from '@repo/database/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export interface HandleAgentMentionParams {
  commentId: string;
  taskId: string;
  cohortId: string;
  mentionedAgentIds: string[]; // Cohortix agent UUIDs
  commentText: string;
  organizationId: string;
  scopeType: 'personal' | 'cohort' | 'org';
  scopeId: string;
}

export interface TaskExecutionResult {
  sessionId: string;
  status: 'completed' | 'queued' | 'failed';
  queueId?: string;
  error?: EngineErrorType;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Handle agent mention in a comment
 * Creates parallel task_sessions for each mentioned agent
 */
export async function handleAgentMention(
  params: HandleAgentMentionParams
): Promise<TaskExecutionResult[]> {
  logger.info('Handling agent mention', {
    taskId: params.taskId,
    agentCount: params.mentionedAgentIds.length,
  });

  // 1. Build full prompt with PPV context
  const prompt = await buildTaskPrompt(params.taskId, params.commentText);

  // 2. Execute for each mentioned agent in parallel
  const results = await Promise.all(
    params.mentionedAgentIds.map((agentId) =>
      executeTaskForAgent({
        cohortId: params.cohortId,
        taskId: params.taskId,
        agentId,
        commentId: params.commentId,
        prompt,
        organizationId: params.organizationId,
        scopeType: params.scopeType,
        scopeId: params.scopeId,
      })
    )
  );

  return results;
}

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Build task prompt with full context
 * Format: Task context + Operation context + Comment request
 */
export async function buildTaskPrompt(taskId: string, commentText: string): Promise<string> {
  // Fetch task details
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  let prompt = '';

  // Task context
  prompt += `## Task: ${task.title}\n`;
  if (task.description) {
    prompt += `${task.description}\n\n`;
  }
  prompt += `**Status:** ${task.status}\n`;
  if (task.priority) {
    prompt += `**Priority:** ${task.priority}\n`;
  }
  if (task.dueDate) {
    prompt += `**Due:** ${new Date(task.dueDate).toLocaleDateString()}\n`;
  }

  // Operation context (if available)
  if (task.projectId) {
    try {
      const { getOperation } = await import('../db/queries/operations');
      const operation = await getOperation(task.projectId);
      if (operation) {
        prompt += `\n## Operation: ${operation.name}\n`;
        if (operation.description) {
          prompt += `${operation.description}\n`;
        }
      }
    } catch (error) {
      logger.warn('Failed to fetch operation context', { error });
    }
  }

  // The actual request
  prompt += `\n## Request\n${commentText}\n`;

  // Instructions
  prompt += `\n---\n`;
  prompt += `If you need more context about this task or operation, ask. `;
  prompt += `Post your response as a comment on this task.`;

  return prompt;
}

// ============================================================================
// Task Execution
// ============================================================================

interface ExecuteTaskParams {
  cohortId: string;
  taskId: string;
  agentId: string;
  commentId: string;
  prompt: string;
  organizationId: string;
  scopeType: 'personal' | 'cohort' | 'org';
  scopeId: string;
}

/**
 * Execute a task for a single agent
 * Routes to online execution or offline queue based on engine status
 */
async function executeTaskForAgent(params: ExecuteTaskParams): Promise<TaskExecutionResult> {
  const agent = await getAgentById(params.agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${params.agentId}`);
  }

  const cohort = await getCohortById(params.cohortId);
  if (!cohort) {
    throw new Error(`Cohort not found: ${params.cohortId}`);
  }

  // Check engine status
  if (cohort.runtimeStatus === 'online') {
    // Execute online
    return executeOnEngine(params, agent, cohort);
  } else {
    // Queue for later
    return queueForLater(params, agent);
  }
}

/**
 * Execute task on online engine
 */
async function executeOnEngine(
  params: ExecuteTaskParams,
  agent: {
    id: string;
    externalId: string | null;
    organizationId: string | null;
    scopeType: 'personal' | 'cohort' | 'org';
    scopeId: string;
  },
  cohort: { id: string; gatewayUrl: string | null }
): Promise<TaskExecutionResult> {
  if (!agent.externalId) {
    throw new Error(`Agent ${agent.id} has no externalId`);
  }

  const sessionKey = `cohortix:task:${params.taskId}:agent:${agent.externalId}`;

  logger.info('Executing task on engine', {
    agentId: agent.id,
    externalId: agent.externalId,
    sessionKey,
  });

  // Create task_session record
  const session = await createTaskSession({
    taskId: params.taskId,
    agentId: params.agentId,
    cohortId: params.cohortId,
    scopeType: params.scopeType,
    scopeId: params.scopeId,
    gatewaySessionId: sessionKey,
    status: 'running',
  });

  if (!session) {
    throw new Error('Failed to create task session');
  }

  try {
    // Get engine proxy
    const proxy = await getEngineProxy(params.cohortId);

    // Send to gateway
    const response = await proxy.sendToAgent({
      agentId: agent.externalId,
      sessionKey,
      input: params.prompt,
      stream: false, // v1: non-streaming
    });

    // Insert agent's response as a comment
    await db.insert(comments).values({
      organizationId: agent.organizationId || params.organizationId,
      scopeType: agent.scopeType,
      scopeId: agent.scopeId,
      cohortId: params.cohortId,
      entityType: 'task',
      entityId: params.taskId,
      authorType: 'agent',
      authorId: params.agentId,
      content: response.text,
      mentionedAgentIds: [],
    });

    // Update task_session status
    await updateTaskSession(session.id, {
      status: 'completed',
      endedAt: new Date(),
    });

    logger.info('Task execution completed', { sessionId: session.id });

    return {
      sessionId: session.id,
      status: 'completed',
    };
  } catch (error) {
    const errorType = classifyError(error);

    logger.error('Task execution failed', {
      sessionId: session.id,
      errorType,
      error,
    });

    // Update task_session with error
    await updateTaskSession(session.id, {
      status: 'failed',
      endedAt: new Date(),
      error: { type: errorType, message: String(error) },
    });

    // Insert error comment (with retry metadata)
    // NOTE: metadata field needs to be added to comments schema
    const errorMessage =
      errorType === 'auth_failed'
        ? '🔐 Authentication failed. Please check your gateway token.'
        : errorType === 'unreachable'
          ? '📡 Engine is offline. Task has been queued.'
          : errorType === 'endpoint_disabled'
            ? '⚙️ HTTP endpoint is not enabled on the gateway.'
            : `⚠️ Task execution failed: ${errorType}`;

    await db.insert(comments).values({
      organizationId: agent.organizationId || params.organizationId,
      scopeType: agent.scopeType,
      scopeId: agent.scopeId,
      cohortId: params.cohortId,
      entityType: 'task',
      entityId: params.taskId,
      authorType: 'agent',
      authorId: params.agentId,
      content: errorMessage,
      mentionedAgentIds: [],
      // TODO: Add metadata field to schema
      // metadata: {
      //   isError: true,
      //   errorType,
      //   retryable: errorType !== 'auth_failed' && errorType !== 'version_mismatch',
      //   taskSessionId: session.id,
      // },
    });

    return {
      sessionId: session.id,
      status: 'failed',
      error: errorType,
    };
  }
}

/**
 * Queue task for later execution (engine offline)
 */
async function queueForLater(
  params: ExecuteTaskParams,
  agent: { id: string; externalId: string | null }
): Promise<TaskExecutionResult> {
  if (!agent.externalId) {
    throw new Error(`Agent ${agent.id} has no externalId`);
  }

  const sessionKey = `cohortix:task:${params.taskId}:agent:${agent.externalId}`;

  logger.info('Queueing task for later', {
    agentId: agent.id,
    taskId: params.taskId,
  });

  // Insert into task_queue
  const entry = await insertTaskQueue({
    cohortId: params.cohortId,
    taskId: params.taskId,
    agentId: params.agentId,
    commentId: params.commentId,
    prompt: params.prompt,
    sessionKey,
    maxAttempts: 3,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
  });

  if (!entry) {
    throw new Error('Failed to create task queue entry');
  }

  // Insert placeholder comment
  await db.insert(comments).values({
    organizationId: params.organizationId,
    scopeType: params.scopeType,
    scopeId: params.scopeId,
    cohortId: params.cohortId,
    entityType: 'task',
    entityId: params.taskId,
    authorType: 'agent',
    authorId: params.agentId,
    content: "⏳ Engine is offline. I'll respond as soon as it's back online.",
    mentionedAgentIds: [],
    // TODO: Add metadata field to schema
    // metadata: { isQueued: true, queueId: entry.id },
  });

  return {
    sessionId: entry.id,
    status: 'queued',
    queueId: entry.id,
  };
}

// ============================================================================
// Queue Drain (Recovery)
// ============================================================================

/**
 * Drain task queue when engine recovers
 * Processes queued tasks FIFO, respects TTL and max attempts
 */
export async function drainTaskQueue(cohortId: string): Promise<void> {
  logger.info('Draining task queue', { cohortId });

  // Get pending tasks (FIFO, not expired)
  const queuedTasks = await getPendingTasks(cohortId);

  logger.info('Found queued tasks', { count: queuedTasks.length });

  for (const entry of queuedTasks) {
    // Check if expired
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      logger.info('Task expired', { queueId: entry.id });
      await updateTaskQueue(entry.id, { status: 'expired' });
      continue;
    }

    // Check max attempts
    if (entry.attempts >= entry.maxAttempts) {
      logger.warn('Task exceeded max attempts', { queueId: entry.id });
      await updateTaskQueue(entry.id, { status: 'failed' });
      continue;
    }

    // Update status to processing
    await updateTaskQueue(entry.id, {
      status: 'processing',
      attempts: entry.attempts + 1,
    });

    try {
      // Get agent details
      const agent = await getAgentById(entry.agentId);
      if (!agent || !agent.externalId) {
        throw new Error('Agent not found or missing externalId');
      }

      // Get cohort details
      const cohort = await getCohortById(entry.cohortId);
      if (!cohort) {
        throw new Error('Cohort not found');
      }

      // Execute on engine
      const proxy = await getEngineProxy(entry.cohortId);
      const response = await proxy.sendToAgent({
        agentId: agent.externalId,
        sessionKey: entry.sessionKey,
        input: entry.prompt,
        stream: false,
      });

      // Insert agent's response as comment
      if (!agent.organizationId) {
        throw new Error('Agent has no organizationId');
      }

      await db.insert(comments).values({
        organizationId: agent.organizationId,
        scopeType: agent.scopeType,
        scopeId: agent.scopeId,
        cohortId: entry.cohortId,
        entityType: 'task',
        entityId: entry.taskId,
        authorType: 'agent',
        authorId: entry.agentId,
        content: response.text,
        mentionedAgentIds: [],
      });

      // Mark as completed
      await updateTaskQueue(entry.id, {
        status: 'completed',
        processedAt: new Date(),
      });

      logger.info('Queued task executed successfully', { queueId: entry.id });
    } catch (error) {
      const errorType = classifyError(error);

      logger.error('Queued task execution failed', {
        queueId: entry.id,
        errorType,
        error,
      });

      // Check if should retry
      const shouldRetry = entry.attempts + 1 < entry.maxAttempts;

      await updateTaskQueue(entry.id, {
        status: shouldRetry ? 'queued' : 'failed',
        error: { type: errorType, message: String(error) },
        processedAt: shouldRetry ? null : new Date(),
      });

      if (!shouldRetry) {
        // Insert error comment
        const agent = await getAgentById(entry.agentId);
        if (agent && agent.organizationId) {
          await db.insert(comments).values({
            organizationId: agent.organizationId as string,
            scopeType: agent.scopeType,
            scopeId: agent.scopeId,
            cohortId: entry.cohortId,
            entityType: 'task',
            entityId: entry.taskId,
            authorType: 'agent',
            authorId: entry.agentId,
            content: `⚠️ Failed to execute queued task after ${entry.maxAttempts} attempts: ${errorType}`,
            mentionedAgentIds: [],
          });
        }
      }
    }
  }

  // Log drain event
  const { insertEngineEvent } = await import('../db/mutations/engine-events');
  await insertEngineEvent({
    cohortId,
    eventType: 'queue_drained',
    metadata: {
      processed: queuedTasks.length,
    },
  });

  logger.info('Task queue drain complete', {
    cohortId,
    processed: queuedTasks.length,
  });
}
