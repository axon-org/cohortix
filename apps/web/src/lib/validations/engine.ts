/**
 * Engine API Validation Schemas
 * SDD-003 OpenClaw Integration
 */

import { z } from 'zod';

// ============================================================================
// Common Engine Schemas
// ============================================================================

export const engineErrorTypeEnum = z.enum([
  'auth_failed',
  'unreachable',
  'endpoint_disabled',
  'rate_limited',
  'agent_error',
  'version_mismatch',
  'unknown',
]);

export type EngineErrorType = z.infer<typeof engineErrorTypeEnum>;

// ============================================================================
// Connection Schemas
// ============================================================================

export const connectEngineSchema = z.object({
  cohortId: z.string().uuid(),
  gatewayUrl: z.string().url().min(1),
  authToken: z.string().min(1),
  hosting: z.enum(['self_hosted']).default('self_hosted'),
});

export type ConnectEngineInput = z.infer<typeof connectEngineSchema>;

export const verifyEngineSchema = z.object({
  cohortId: z.string().uuid(),
});

export type VerifyEngineInput = z.infer<typeof verifyEngineSchema>;

export const disconnectEngineSchema = z.object({
  cohortId: z.string().uuid(),
});

export type DisconnectEngineInput = z.infer<typeof disconnectEngineSchema>;

export const rotateTokenSchema = z.object({
  cohortId: z.string().uuid(),
  newToken: z.string().min(1),
});

export type RotateTokenInput = z.infer<typeof rotateTokenSchema>;

// ============================================================================
// Task Execution Schemas
// ============================================================================

export const sendToAgentSchema = z.object({
  cohortId: z.string().uuid(),
  agentId: z.string().uuid(),
  taskId: z.string().uuid(),
  input: z.string().min(1),
  commentId: z.string().uuid().optional(),
  stream: z.boolean().default(true),
});

export type SendToAgentInput = z.infer<typeof sendToAgentSchema>;

// ============================================================================
// Clone Sync Schemas
// ============================================================================

export const syncCloneSchema = z.object({
  cohortId: z.string().uuid(),
});

export type SyncCloneInput = z.infer<typeof syncCloneSchema>;

// ============================================================================
// Agent Sync Schemas
// ============================================================================

export const syncAgentSchema = z.object({
  cohortId: z.string().uuid(),
  agentId: z.string().uuid(),
  action: z.enum(['provision', 'update', 'delete']),
});

export type SyncAgentInput = z.infer<typeof syncAgentSchema>;

export const discoverAgentsSchema = z.object({
  cohortId: z.string().uuid(),
});

export type DiscoverAgentsInput = z.infer<typeof discoverAgentsSchema>;

export const importAgentSchema = z.object({
  cohortId: z.string().uuid(),
  externalId: z.string().min(1),
  asClone: z.boolean().default(false),
});

export type ImportAgentInput = z.infer<typeof importAgentSchema>;

// ============================================================================
// File Management Schemas
// ============================================================================

export const readFileSchema = z.object({
  cohortId: z.string().uuid(),
  agentId: z.string().uuid(),
});

export type ReadFileInput = z.infer<typeof readFileSchema>;

export const writeFileSchema = z.object({
  content: z.string(),
  cohortId: z.string().uuid(),
  agentId: z.string().uuid(),
});

export type WriteFileInput = z.infer<typeof writeFileSchema>;

// ============================================================================
// Health Check Schema
// ============================================================================

export const healthCheckQuerySchema = z.object({
  cohortId: z.string().uuid(),
});

export type HealthCheckQueryInput = z.infer<typeof healthCheckQuerySchema>;
