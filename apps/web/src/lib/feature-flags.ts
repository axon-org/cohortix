/**
 * Feature Flags for OpenClaw Integration
 * SDD-003 §12
 *
 * Environment-based feature flags for phased rollout of BYOH engine features.
 * Set in .env.local: FEATURE_FLAG_ENGINE_BYOH=true
 */

// ============================================================================
// Feature Flag Constants
// ============================================================================

export const FEATURE_FLAGS = {
  /** BYOH connection wizard */
  ENGINE_BYOH_CONNECTION: 'release.engine.byoh-connection',

  /** @mention → agent execution pipeline */
  ENGINE_TASK_EXECUTION: 'release.engine.task-execution',

  /** Agent profile page with file editing */
  ENGINE_AGENT_PROFILES: 'release.engine.agent-profiles',

  /** Engine health probes + status UI */
  ENGINE_HEALTH_MONITORING: 'release.engine.health-monitoring',

  /** Offline task queuing */
  ENGINE_TASK_QUEUE: 'release.engine.task-queue',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

// ============================================================================
// Feature Flag Check
// ============================================================================

/**
 * Check if a feature flag is enabled
 *
 * Environment variable format:
 * release.engine.byoh-connection → FEATURE_FLAG_ENGINE_BYOH
 *
 * @param flag - Feature flag constant from FEATURE_FLAGS
 * @returns true if feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Extract the feature name from the flag (e.g., "engine.byoh-connection" → "ENGINE_BYOH")
  const parts = flag.split('.');
  if (parts.length < 3 || parts[0] !== 'release') {
    return false;
  }

  // Convert to env var name: release.engine.byoh-connection → ENGINE_BYOH
  const envName = `FEATURE_FLAG_${parts[1]!.toUpperCase()}_${parts[2]!.toUpperCase().replace(/-/g, '_')}`;

  const value = process.env[envName];

  // Support: "true", "1", "yes", "on" (case-insensitive)
  if (!value) return false;

  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * Check if ALL provided flags are enabled (AND logic)
 */
export function areAllFeaturesEnabled(...flags: FeatureFlag[]): boolean {
  return flags.every(isFeatureEnabled);
}

/**
 * Check if ANY provided flag is enabled (OR logic)
 */
export function isAnyFeatureEnabled(...flags: FeatureFlag[]): boolean {
  return flags.some(isFeatureEnabled);
}

/**
 * Get all enabled feature flags (for debugging/status)
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter(isFeatureEnabled);
}
