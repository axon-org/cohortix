/**
 * Engine Health Check Cron
 * SDD-003 OpenClaw Integration §7
 *
 * Background health monitoring for all connected engines.
 * Runs every 5 minutes for cohorts with gateway_url set.
 */

import { logger } from '@/lib/logger';
import { getEngineProxy } from '../services/engine-proxy-factory';
import { classifyError } from '../services/engine-proxy';
import { drainTaskQueue } from '../services/task-execution';
import { db } from '@repo/database/client';
import { cohorts, engineEvents } from '@repo/database/schema';
import { eq, isNotNull, and, sql, desc } from 'drizzle-orm';

// ============================================================================
// Health Check Engine
// ============================================================================

/**
 * Check health for all connected cohorts
 * Called by cron job every 5 minutes
 */
export async function checkAllEngines(): Promise<void> {
  logger.info('[Health Check] Starting engine health check cycle');

  // Get all cohorts with connected engines
  const connectedCohorts = await getCohortsWithEngine();

  logger.info('[Health Check] Found connected cohorts', { count: connectedCohorts.length });

  // Check each cohort's engine
  const results = await Promise.allSettled(
    connectedCohorts.map((cohort) => checkEngineHealth(cohort.id, cohort.runtimeStatus))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  logger.info('[Health Check] Cycle complete', {
    total: connectedCohorts.length,
    succeeded,
    failed,
  });
}

/**
 * Check health for a single cohort's engine
 */
async function checkEngineHealth(
  cohortId: string,
  currentStatus: 'online' | 'offline' | 'error' | 'provisioning' | 'paused' | null
): Promise<void> {
  logger.info('[Health Check] Checking engine', { cohortId, currentStatus });

  try {
    const proxy = await getEngineProxy(cohortId);
    const health = await proxy.healthCheck();

    if (!health.reachable) {
      // Engine is unreachable
      await handleUnreachableEngine(cohortId, currentStatus, health.error?.type);
      return;
    }

    // Engine is reachable
    if (currentStatus !== 'online') {
      // Engine recovered!
      logger.info('[Health Check] Engine recovered', { cohortId });

      await db
        .update(cohorts)
        .set({
          runtimeStatus: 'online',
          lastHeartbeatAt: new Date(),
        })
        .where(eq(cohorts.id, cohortId));

      await insertEngineEvent(cohortId, 'health_check_recovered', {
        latencyMs: health.latencyMs,
        previousStatus: currentStatus,
      });

      // Drain task queue
      await drainTaskQueue(cohortId);
    } else {
      // Engine still online - update heartbeat
      await db
        .update(cohorts)
        .set({
          lastHeartbeatAt: new Date(),
        })
        .where(eq(cohorts.id, cohortId));
    }
  } catch (error) {
    const errorType = classifyError(error);

    logger.error('[Health Check] Failed', {
      cohortId,
      errorType,
      error: error instanceof Error ? error.message : String(error),
    });

    if (errorType === 'auth_failed') {
      // Immediate error state for auth failures
      await db
        .update(cohorts)
        .set({
          runtimeStatus: 'error',
        })
        .where(eq(cohorts.id, cohortId));

      await insertEngineEvent(cohortId, 'auth_failed', {
        error: String(error),
      });
    } else {
      // Track consecutive failures for other errors
      await handleUnreachableEngine(cohortId, currentStatus, errorType);
    }
  }
}

/**
 * Handle unreachable engine (track failures, set offline after threshold)
 */
async function handleUnreachableEngine(
  cohortId: string,
  currentStatus: 'online' | 'offline' | 'error' | 'provisioning' | 'paused' | null,
  errorType?: string
): Promise<void> {
  // Insert failure event
  await insertEngineEvent(cohortId, 'health_check_failed', {
    errorType,
  });

  // Count consecutive failures since last recovery
  const consecutiveFailures = await countConsecutiveFailures(cohortId);

  logger.info('[Health Check] Consecutive failures', {
    cohortId,
    consecutiveFailures,
  });

  // Set offline after 3 consecutive failures
  if (consecutiveFailures >= 3 && currentStatus !== 'offline') {
    logger.warn('[Health Check] Setting engine offline', {
      cohortId,
      consecutiveFailures,
    });

    await db
      .update(cohorts)
      .set({
        runtimeStatus: 'offline',
      })
      .where(eq(cohorts.id, cohortId));
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get all cohorts with connected engines (gateway_url is not null)
 */
async function getCohortsWithEngine() {
  return db
    .select({
      id: cohorts.id,
      runtimeStatus: cohorts.runtimeStatus,
    })
    .from(cohorts)
    .where(isNotNull(cohorts.gatewayUrl));
}

/**
 * Insert an engine event
 */
async function insertEngineEvent(
  cohortId: string,
  eventType:
    | 'connected'
    | 'disconnected'
    | 'health_check_failed'
    | 'health_check_recovered'
    | 'auth_failed'
    | 'token_rotated'
    | 'agent_synced'
    | 'clone_synced'
    | 'queue_drained'
    | 'version_checked',
  metadata: Record<string, unknown> = {}
) {
  await db.insert(engineEvents).values({
    cohortId,
    eventType,
    metadata,
  });
}

/**
 * Count consecutive failures since last recovery
 */
async function countConsecutiveFailures(cohortId: string): Promise<number> {
  // Get the most recent recovery event
  const [lastRecovery] = await db
    .select({
      createdAt: engineEvents.createdAt,
    })
    .from(engineEvents)
    .where(
      and(eq(engineEvents.cohortId, cohortId), eq(engineEvents.eventType, 'health_check_recovered'))
    )
    .orderBy(desc(engineEvents.createdAt))
    .limit(1);

  // Count failures since last recovery (or all failures if no recovery)
  const [result] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(engineEvents)
    .where(
      and(
        eq(engineEvents.cohortId, cohortId),
        eq(engineEvents.eventType, 'health_check_failed'),
        lastRecovery ? sql`${engineEvents.createdAt} > ${lastRecovery.createdAt}` : sql`true`
      )
    );

  return result?.count ?? 0;
}
