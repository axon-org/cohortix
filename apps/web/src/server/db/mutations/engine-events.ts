/**
 * Engine Events Mutations Module
 * SDD-003 OpenClaw Integration
 *
 * Server-side write operations for engine_events table.
 */

import { db } from '@repo/database/client';
import { engineEvents, engineEventTypeEnum } from '@repo/database/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

export interface CreateEngineEventInput {
  cohortId: string;
  eventType: 'connected' | 'disconnected' | 'health_check_failed' | 'health_check_recovered' | 'auth_failed' | 'token_rotated' | 'agent_synced' | 'clone_synced' | 'queue_drained' | 'version_checked';
  metadata?: Record<string, unknown>;
}

/**
 * Insert a new engine event
 */
export async function insertEngineEvent(input: CreateEngineEventInput) {
  const [event] = await db
    .insert(engineEvents)
    .values({
      cohortId: input.cohortId,
      eventType: input.eventType,
      metadata: input.metadata ?? {},
    })
    .returning();

  return event ?? null;
}

/**
 * Count recent events by type
 */
export async function countRecentEvents(
  cohortId: string,
  eventType: CreateEngineEventInput['eventType'],
  minutes: number
) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(engineEvents)
    .where(
      and(
        eq(engineEvents.cohortId, cohortId),
        eq(engineEvents.eventType, eventType),
        gte(engineEvents.createdAt, cutoff)
      )
    );

  return Number(result?.count ?? 0);
}

/**
 * Get the most recent event for a cohort
 */
export async function getMostRecentEvent(cohortId: string) {
  const [event] = await db
    .select()
    .from(engineEvents)
    .where(eq(engineEvents.cohortId, cohortId))
    .orderBy(desc(engineEvents.createdAt))
    .limit(1);

  return event ?? null;
}

/**
 * Get the most recent event of a specific type
 */
export async function getMostRecentEventByType(
  cohortId: string,
  eventType: CreateEngineEventInput['eventType']
) {
  const [event] = await db
    .select()
    .from(engineEvents)
    .where(
      and(
        eq(engineEvents.cohortId, cohortId),
        eq(engineEvents.eventType, eventType)
      )
    )
    .orderBy(desc(engineEvents.createdAt))
    .limit(1);

  return event ?? null;
}
