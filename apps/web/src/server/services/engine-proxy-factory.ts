/**
 * Engine Proxy Factory
 * SDD-003 OpenClaw Integration
 *
 * Factory for creating EngineProxyService instances per cohort.
 */

import { decrypt } from '@/lib/encryption';
import { NotFoundError, BadRequestError } from '@/lib/errors';
import { getCohortById } from '@/server/db/queries/cohorts';
import { EngineProxyService, type EngineProxyOptions } from './engine-proxy';

const DEFAULT_OPTIONS: EngineProxyOptions = {
  timeoutMs: 30000,
  maxRetries: 3,
};

/**
 * Error thrown when a cohort is not connected to an engine
 */
export class EngineNotConnectedError extends Error {
  constructor(public cohortId: string) {
    super(`Cohort ${cohortId} is not connected to an engine`);
    this.name = 'EngineNotConnectedError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Get or create an EngineProxyService instance for a cohort
 *
 * @param cohortId - The cohort ID
 * @returns Configured EngineProxyService instance
 * @throws EngineNotConnectedError if cohort has no gateway connection
 * @throws NotFoundError if cohort doesn't exist
 */
export async function getEngineProxy(cohortId: string): Promise<EngineProxyService> {
  // 1. Fetch cohort from DB
  const cohort = await getCohortById(cohortId);
  if (!cohort) {
    throw new NotFoundError('Cohort', cohortId);
  }

  // 2. Validate connection exists
  if (!cohort.gatewayUrl || !cohort.authTokenEncrypted) {
    throw new EngineNotConnectedError(cohortId);
  }

  // 3. Decrypt auth token
  let authToken: string;
  try {
    authToken = decrypt(cohort.authTokenEncrypted);
  } catch (error) {
    throw new BadRequestError(
      `Failed to decrypt auth token for cohort ${cohortId}: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }

  // 4. Merge connection config with defaults
  const connectionConfig = (cohort.connectionConfig || {}) as Record<string, unknown>;
  const options: EngineProxyOptions = {
    timeoutMs: Number(connectionConfig.timeoutMs) ?? DEFAULT_OPTIONS.timeoutMs,
    maxRetries: Number(connectionConfig.maxRetries) ?? DEFAULT_OPTIONS.maxRetries,
  };

  // 5. Create and return service instance
  return new EngineProxyService(cohort.gatewayUrl, authToken, options);
}

/**
 * Check if a cohort has an active engine connection
 */
export async function hasEngineConnection(cohortId: string): Promise<boolean> {
  try {
    const cohort = await getCohortById(cohortId);
    return !!cohort?.gatewayUrl && !!cohort?.authTokenEncrypted;
  } catch {
    return false;
  }
}

/**
 * Get engine connection status for a cohort
 */
export async function getEngineConnectionStatus(cohortId: string): Promise<{
  connected: boolean;
  gatewayUrl?: string;
  runtimeStatus?: string;
  gatewayVersion?: string;
  lastHeartbeatAt?: Date | null;
}> {
  const cohort = await getCohortById(cohortId);
  if (!cohort) {
    throw new NotFoundError('Cohort', cohortId);
  }

  const connected = !!cohort.gatewayUrl && !!cohort.authTokenEncrypted;

  return {
    connected,
    gatewayUrl: cohort.gatewayUrl || undefined,
    runtimeStatus: cohort.runtimeStatus || undefined,
    gatewayVersion: cohort.gatewayVersion || undefined,
    lastHeartbeatAt: cohort.lastHeartbeatAt,
  };
}
