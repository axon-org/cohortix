/**
 * Runtime Heartbeat Helpers
 *
 * Implements status transitions:
 * online → degraded (3 missed) → disconnected (5min) → suspended (24h)
 *
 * Mapped to runtime_status enum:
 * online → online
 * degraded → error
 * disconnected → offline
 * suspended → paused
 */

export const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const DEGRADED_AFTER_MS = HEARTBEAT_INTERVAL_MS * 3; // 3 missed beats
const DISCONNECTED_AFTER_MS = 5 * 60 * 1000; // 5 minutes
const SUSPENDED_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

export type RuntimeStatus = 'online' | 'error' | 'offline' | 'paused';

export function evaluateRuntimeStatus(lastHeartbeatAt?: Date | null, now: Date = new Date()) {
  if (!lastHeartbeatAt) return 'offline' as RuntimeStatus;

  const delta = now.getTime() - lastHeartbeatAt.getTime();

  if (delta <= DEGRADED_AFTER_MS) return 'online' as RuntimeStatus;
  if (delta <= DISCONNECTED_AFTER_MS) return 'error' as RuntimeStatus;
  if (delta <= SUSPENDED_AFTER_MS) return 'offline' as RuntimeStatus;
  return 'paused' as RuntimeStatus;
}

export function createHeartbeatUpdate(now: Date = new Date()) {
  return {
    runtimeStatus: 'online' as RuntimeStatus,
    lastHeartbeatAt: now,
  };
}
