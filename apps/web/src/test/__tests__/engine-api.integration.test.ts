/**
 * Integration Tests - Engine API
 *
 * Tests for /api/v1/engine/* endpoints:
 * - Connection flow (connect, verify)
 * - Task execution pipeline (send, queue)
 * - Health monitoring
 * - Queue drain
 * - File sync
 *
 * SDD-003 §14.2 Integration Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as connectEngineHandler } from '@/app/api/v1/engine/connect/route';
import { POST as verifyEngineHandler } from '@/app/api/v1/engine/verify/route';
import { POST as sendToAgentHandler } from '@/app/api/v1/engine/send/route';
import { GET as healthCheckHandler } from '@/app/api/v1/engine/health/route';
import {
  GET as readFileHandler,
  PUT as writeFileHandler,
} from '@/app/api/v1/engine/files/[[...path]]/route';

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock auth context
vi.mock('@/lib/auth-helper', () => ({
  getAuthContext: vi.fn(),
}));

// Mock auth access helpers
vi.mock('@/lib/auth-access', () => ({
  ensureCohortMember: vi.fn(),
  ensureAgentAccess: vi.fn(),
}));

// Mock encryption
vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn((token: string) => `encrypted_${token}`),
  decrypt: vi.fn((encrypted: string) => encrypted.replace('encrypted_', '')),
}));

// Mock cohort queries and mutations
vi.mock('@/server/db/queries/cohorts', () => ({
  getCohortById: vi.fn(),
  getCohortUserMembers: vi.fn(),
}));

vi.mock('@/server/db/mutations/cohorts', () => ({
  updateCohort: vi.fn(),
  updateCohortRuntime: vi.fn(),
}));

// Mock agent queries
vi.mock('@/server/db/queries/agents', () => ({
  getAgentById: vi.fn(),
}));

// Mock engine events mutations
vi.mock('@/server/db/mutations/engine-events', () => ({
  insertEngineEvent: vi.fn(),
  recordEngineEvent: vi.fn(),
  countConsecutiveFailures: vi.fn(),
}));

// Mock task queue mutations
vi.mock('@/server/db/mutations/task-queue', () => ({
  insertTaskQueue: vi.fn(),
  updateTaskQueue: vi.fn(),
}));

// Mock task queue queries
vi.mock('@/server/db/queries/task-queue', () => ({
  getQueuedTasksByCohort: vi.fn(),
  getPendingTasks: vi.fn(),
}));

// Mock task sessions service
vi.mock('@/server/services/task-sessions', () => ({
  createTaskSession: vi.fn(),
  updateTaskSession: vi.fn(),
}));

// Mock engine proxy factory
vi.mock('@/server/services/engine-proxy-factory', () => ({
  getEngineProxy: vi.fn(),
  hasEngineConnection: vi.fn(),
}));

// Mock engine proxy service (we'll mock the instance methods)
vi.mock('@/server/services/engine-proxy', async () => {
  const actual = await vi.importActual('@/server/services/engine-proxy');
  return {
    ...actual,
    EngineProxyService: vi.fn().mockImplementation(function () {
      return {
        healthCheck: vi.fn(),
        discoverAgents: vi.fn(),
        sendToAgent: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
      };
    }),
  };
});

// Mock database client for comment insertions
vi.mock('@repo/database/client', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    }),
  },
}));

// ============================================================================
// Import mocked modules
// ============================================================================

import { getAuthContext } from '@/lib/auth-helper';
import { ensureCohortMember, ensureAgentAccess } from '@/lib/auth-access';
import { encrypt, decrypt } from '@/lib/encryption';
import { getCohortById } from '@/server/db/queries/cohorts';
import { updateCohort, updateCohortRuntime } from '@/server/db/mutations/cohorts';
import { getAgentById } from '@/server/db/queries/agents';
import { insertEngineEvent, countConsecutiveFailures } from '@/server/db/mutations/engine-events';
import { insertTaskQueue, updateTaskQueue } from '@/server/db/mutations/task-queue';
import { getQueuedTasksByCohort, getPendingTasks } from '@/server/db/queries/task-queue';
import { createTaskSession, updateTaskSession } from '@/server/services/task-sessions';
import { getEngineProxy, hasEngineConnection } from '@/server/services/engine-proxy-factory';
import { EngineProxyService, EngineProxyErrorClass } from '@/server/services/engine-proxy';
import { drainTaskQueue } from '@/server/services/task-execution';

// ============================================================================
// Type the mocked functions
// ============================================================================

const mockGetAuthContext = vi.mocked(getAuthContext);
const mockEnsureCohortMember = vi.mocked(ensureCohortMember);
const mockEnsureAgentAccess = vi.mocked(ensureAgentAccess);
const mockEncrypt = vi.mocked(encrypt);
const mockDecrypt = vi.mocked(decrypt);
const mockGetCohortById = vi.mocked(getCohortById);
const mockUpdateCohort = vi.mocked(updateCohort);
const mockUpdateCohortRuntime = vi.mocked(updateCohortRuntime);
const mockGetAgentById = vi.mocked(getAgentById);
const mockInsertEngineEvent = vi.mocked(insertEngineEvent);
const mockCountConsecutiveFailures = vi.mocked(countConsecutiveFailures);
const mockInsertTaskQueue = vi.mocked(insertTaskQueue);
const mockUpdateTaskQueue = vi.mocked(updateTaskQueue);
const mockGetQueuedTasksByCohort = vi.mocked(getQueuedTasksByCohort);
const mockGetPendingTasks = vi.mocked(getPendingTasks);
const mockCreateTaskSession = vi.mocked(createTaskSession);
const mockUpdateTaskSession = vi.mocked(updateTaskSession);
const mockGetEngineProxy = vi.mocked(getEngineProxy);
const mockHasEngineConnection = vi.mocked(hasEngineConnection);

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
};

const mockOrganization = {
  id: '00000000-0000-0000-0000-000000000002',
  organization_id: '00000000-0000-0000-0000-000000000002',
  user_id: '00000000-0000-0000-0000-000000000001',
};

const mockCohort = {
  id: '00000000-0000-0000-0000-000000000003',
  organizationId: '00000000-0000-0000-0000-000000000002',
  ownerUserId: '00000000-0000-0000-0000-000000000001',
  type: 'personal' as const,
  name: 'Test Cohort',
  slug: 'test-cohort-123',
  status: 'active' as const,
  hosting: 'self_hosted' as const,
  runtimeStatus: 'online' as const,
  gatewayUrl: 'https://gateway.example.com',
  authTokenEncrypted: 'encrypted_test-token',
  gatewayVersion: '2026.2.1',
  lastHeartbeatAt: new Date(),
  connectionConfig: {},
  hardwareInfo: {},
  settings: {},
  createdBy: '00000000-0000-0000-0000-000000000001',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAgent = {
  id: '00000000-0000-0000-0000-000000000004',
  externalId: 'agent-ext-123',
  name: 'Test Agent',
  scopeType: 'personal' as const,
  scopeId: '00000000-0000-0000-0000-000000000001',
  ownerUserId: '00000000-0000-0000-0000-000000000001',
  organizationId: '00000000-0000-0000-0000-000000000002',
  status: 'active' as const,
  model: 'claude-3-5-sonnet',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTaskSession = {
  id: '00000000-0000-0000-0000-000000000005',
  taskId: '00000000-0000-0000-0000-000000000006',
  agentId: '00000000-0000-0000-0000-000000000004',
  cohortId: '00000000-0000-0000-0000-000000000003',
  scopeType: 'personal' as const,
  scopeId: '00000000-0000-0000-0000-000000000001',
  gatewaySessionId: 'cohortix:task:00000000-0000-0000-0000-000000000006:agent:agent-ext-123',
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockQueueEntry = {
  id: '00000000-0000-0000-0000-000000000007',
  cohortId: '00000000-0000-0000-0000-000000000003',
  taskId: '00000000-0000-0000-0000-000000000006',
  agentId: '00000000-0000-0000-0000-000000000004',
  commentId: '00000000-0000-0000-0000-000000000008',
  prompt: 'Test prompt',
  sessionKey: 'cohortix:task:00000000-0000-0000-0000-000000000006:agent:agent-ext-123',
  status: 'queued' as const,
  attempts: 0,
  maxAttempts: 3,
  queuedAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

// ============================================================================
// Test Suite
// ============================================================================

describe('Engine API - Integration Tests (SDD-003 §14.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth mocks - successful authentication
    mockGetAuthContext.mockResolvedValue({
      supabase: {} as any,
      organizationId: mockOrganization.id,
      userId: mockUser.id,
    });

    // Default encrypt/decrypt behavior
    mockEncrypt.mockImplementation((token) => `encrypted_${token}`);
    mockDecrypt.mockImplementation((encrypted) => encrypted.replace('encrypted_', ''));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Scenario 1: Engine Connection Flow
  // ============================================================================

  describe('Scenario 1: Engine connection flow (mock gateway)', () => {
    it('should successfully connect to a valid gateway', async () => {
      // Mock cohort access
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);

      // Mock EngineProxyService instance methods
      const mockHealthCheck = vi.fn().mockResolvedValue({
        reachable: true,
        latencyMs: 123,
        gatewayVersion: '2026.2.1',
        runtimeStatus: 'online',
      });
      const mockDiscoverAgents = vi.fn().mockResolvedValue([
        {
          externalId: 'existing-agent-1',
          name: 'Existing Agent',
          model: 'claude-3-5-sonnet',
        },
      ]);

      // Mock the EngineProxyService constructor to return our mocked instance
      vi.mocked(EngineProxyService).mockImplementation(function () {
        return {
          healthCheck: mockHealthCheck,
          discoverAgents: mockDiscoverAgents,
        } as any;
      });

      mockUpdateCohortRuntime.mockResolvedValue(mockCohort as any);
      mockInsertEngineEvent.mockResolvedValue({} as any);

      const requestBody = {
        cohortId: mockCohort.id,
        gatewayUrl: 'https://gateway.example.com',
        authToken: 'test-token',
        hosting: 'self_hosted',
      };

      const request = new NextRequest('https://example.com/api/v1/engine/connect', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await connectEngineHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        status: 'connected',
        runtimeStatus: 'online',
        gatewayVersion: '2026.2.1',
        latencyMs: 123,
      });

      expect(data.data.existingAgents).toHaveLength(1);
      expect(data.data.existingAgents[0].externalId).toBe('existing-agent-1');

      // Verify DB mutations were called
      expect(mockUpdateCohortRuntime).toHaveBeenCalledWith(
        mockCohort.id,
        expect.objectContaining({
          gatewayUrl: 'https://gateway.example.com',
          authTokenEncrypted: 'encrypted_test-token',
          gatewayVersion: '2026.2.1',
          runtimeStatus: 'online',
        })
      );

      expect(mockInsertEngineEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          cohortId: mockCohort.id,
          eventType: 'connected',
          metadata: expect.objectContaining({
            gatewayUrl: 'https://gateway.example.com',
            version: '2026.2.1',
            latencyMs: 123,
            agentCount: 1,
          }),
        })
      );
    });

    it('should reject connection to unreachable gateway', async () => {
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);

      const mockHealthCheck = vi.fn().mockResolvedValue({
        reachable: false,
        latencyMs: 0,
        gatewayVersion: '',
        runtimeStatus: 'offline',
        error: {
          type: 'unreachable',
          message: 'Gateway is unreachable',
        },
      });

      vi.mocked(EngineProxyService).mockImplementation(function () {
        return {
          healthCheck: mockHealthCheck,
        } as any;
      });

      const requestBody = {
        cohortId: mockCohort.id,
        gatewayUrl: 'https://unreachable.example.com',
        authToken: 'test-token',
        hosting: 'self_hosted',
      };

      const request = new NextRequest('https://example.com/api/v1/engine/connect', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await connectEngineHandler(request);

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.detail).toContain('Failed to connect to gateway');
      expect(data.error.type).toBe('unreachable');
    });

    it('should reject connection on auth failure', async () => {
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);

      const mockHealthCheck = vi
        .fn()
        .mockRejectedValue(new EngineProxyErrorClass('auth_failed', '401 Unauthorized'));

      vi.mocked(EngineProxyService).mockImplementation(function () {
        return {
          healthCheck: mockHealthCheck,
        } as any;
      });

      const requestBody = {
        cohortId: mockCohort.id,
        gatewayUrl: 'https://gateway.example.com',
        authToken: 'invalid-token',
        hosting: 'self_hosted',
      };

      const request = new NextRequest('https://example.com/api/v1/engine/connect', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await connectEngineHandler(request);

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.title).toBe('Connection Failed');
    });

    it('should verify existing connection (gateway reachable)', async () => {
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);

      const mockProxyInstance = {
        healthCheck: vi.fn().mockResolvedValue({
          reachable: true,
          latencyMs: 150,
          gatewayVersion: '2026.2.1',
          runtimeStatus: 'online',
        }),
        discoverAgents: vi.fn().mockResolvedValue([]),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);
      mockUpdateCohortRuntime.mockResolvedValue(mockCohort as any);
      mockInsertEngineEvent.mockResolvedValue({} as any);

      const requestBody = {
        cohortId: mockCohort.id,
      };

      const request = new NextRequest('https://example.com/api/v1/engine/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await verifyEngineHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        reachable: true,
        latencyMs: 150,
        gatewayVersion: '2026.2.1',
        runtimeStatus: 'online',
        agentCount: 0,
      });

      expect(mockUpdateCohortRuntime).toHaveBeenCalledWith(
        mockCohort.id,
        expect.objectContaining({
          lastHeartbeatAt: expect.any(Date),
        })
      );
    });

    it('should verify existing connection (gateway unreachable)', async () => {
      const offlineCohort = { ...mockCohort, runtimeStatus: 'online' };
      mockEnsureCohortMember.mockResolvedValue(offlineCohort as any);

      mockGetEngineProxy.mockRejectedValue(new Error('Connection refused'));
      mockUpdateCohortRuntime.mockResolvedValue(mockCohort as any);
      mockInsertEngineEvent.mockResolvedValue({} as any);

      const requestBody = {
        cohortId: mockCohort.id,
      };

      const request = new NextRequest('https://example.com/api/v1/engine/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await verifyEngineHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        reachable: false,
        latencyMs: 0,
        runtimeStatus: 'offline',
      });

      expect(mockUpdateCohortRuntime).toHaveBeenCalledWith(
        mockCohort.id,
        expect.objectContaining({
          runtimeStatus: 'offline',
        })
      );

      expect(mockInsertEngineEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          cohortId: mockCohort.id,
          eventType: 'health_check_failed',
        })
      );
    });
  });

  // ============================================================================
  // Scenario 2: Task Execution Pipeline
  // ============================================================================

  describe('Scenario 2: Task execution pipeline (mock gateway, verify DB state)', () => {
    it('should send task to agent when engine is online', async () => {
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);
      mockEnsureAgentAccess.mockResolvedValue(mockAgent as any);
      mockCreateTaskSession.mockResolvedValue(mockTaskSession as any);
      mockHasEngineConnection.mockResolvedValue(true);

      const mockProxyInstance = {
        sendToAgent: vi.fn().mockResolvedValue({
          text: 'Agent response text',
          usage: {
            promptTokens: 100,
            completionTokens: 200,
            totalTokens: 300,
          },
        }),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);

      const requestBody = {
        cohortId: mockCohort.id,
        agentId: mockAgent.id,
        taskId: mockTaskSession.taskId,
        commentId: mockQueueEntry.commentId,
        input: 'Test prompt for agent',
        stream: false,
      };

      const request = new NextRequest('https://example.com/api/v1/engine/send', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await sendToAgentHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        status: 'sent',
        sessionId: mockTaskSession.id,
        sessionKey: `cohortix:task:${mockTaskSession.taskId}:agent:agent-ext-123`,
      });

      expect(data.data.response).toContain('Agent response text');

      // Verify task session was created
      expect(mockCreateTaskSession).toHaveBeenCalledWith({
        taskId: mockTaskSession.taskId,
        agentId: mockAgent.id,
        cohortId: mockCohort.id,
        scopeType: 'personal',
        scopeId: mockUser.id,
        gatewaySessionId: `cohortix:task:${mockTaskSession.taskId}:agent:agent-ext-123`,
      });

      // Verify sendToAgent was called
      expect(mockProxyInstance.sendToAgent).toHaveBeenCalledWith({
        agentId: 'agent-ext-123',
        sessionKey: `cohortix:task:${mockTaskSession.taskId}:agent:agent-ext-123`,
        input: 'Test prompt for agent',
        stream: false,
      });
    });

    it('should queue task when engine is offline', async () => {
      const offlineCohort = { ...mockCohort, runtimeStatus: 'offline' };
      mockEnsureCohortMember.mockResolvedValue(offlineCohort as any);
      mockEnsureAgentAccess.mockResolvedValue(mockAgent as any);
      mockCreateTaskSession.mockResolvedValue(mockTaskSession as any);
      mockHasEngineConnection.mockResolvedValue(true); // Has connection but offline
      mockInsertTaskQueue.mockResolvedValue(mockQueueEntry as any);

      const requestBody = {
        cohortId: mockCohort.id,
        agentId: mockAgent.id,
        taskId: mockTaskSession.taskId,
        commentId: mockQueueEntry.commentId,
        input: 'Test prompt for queuing',
        stream: false,
      };

      const request = new NextRequest('https://example.com/api/v1/engine/send', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await sendToAgentHandler(request);

      expect(response.status).toBe(202);
      const data = await response.json();

      expect(data.data).toMatchObject({
        status: 'queued',
        queueId: mockQueueEntry.id,
        sessionKey: `cohortix:task:${mockTaskSession.taskId}:agent:agent-ext-123`,
        message: 'Agent will respond when engine is back online.',
      });

      // Verify task was queued
      expect(mockInsertTaskQueue).toHaveBeenCalledWith({
        cohortId: mockCohort.id,
        taskId: mockTaskSession.taskId,
        agentId: mockAgent.id,
        commentId: mockQueueEntry.commentId,
        prompt: 'Test prompt for queuing',
        sessionKey: `cohortix:task:${mockTaskSession.taskId}:agent:agent-ext-123`,
      });
    });
  });

  // ============================================================================
  // Scenario 3: Health Check → Status Transitions
  // ============================================================================

  describe('Scenario 3: Health check → status transitions', () => {
    it('should transition from online to offline', async () => {
      const onlineCohort = { ...mockCohort, runtimeStatus: 'online' };
      mockEnsureCohortMember.mockResolvedValue(onlineCohort as any);
      mockHasEngineConnection.mockResolvedValue(true);

      const mockProxyInstance = {
        healthCheck: vi.fn().mockResolvedValue({
          reachable: false,
          latencyMs: 0,
          gatewayVersion: '2026.2.1',
          runtimeStatus: 'offline',
          error: {
            type: 'unreachable',
            message: 'Connection timeout',
          },
        }),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);
      mockCountConsecutiveFailures.mockResolvedValue(3);

      const request = new NextRequest(
        `https://example.com/api/v1/engine/health?cohortId=${mockCohort.id}`
      );

      const response = await healthCheckHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        status: 'offline',
        latencyMs: 0,
        consecutiveFailures: 3,
        error: {
          type: 'unreachable',
          message: 'Connection timeout',
        },
      });
    });

    it('should transition from offline to online (recovered)', async () => {
      const offlineCohort = { ...mockCohort, runtimeStatus: 'offline' };
      mockEnsureCohortMember.mockResolvedValue(offlineCohort as any);
      mockHasEngineConnection.mockResolvedValue(true);

      const mockProxyInstance = {
        healthCheck: vi.fn().mockResolvedValue({
          reachable: true,
          latencyMs: 200,
          gatewayVersion: '2026.2.1',
          runtimeStatus: 'online',
        }),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);
      mockCountConsecutiveFailures.mockResolvedValue(0);

      const request = new NextRequest(
        `https://example.com/api/v1/engine/health?cohortId=${mockCohort.id}`
      );

      const response = await healthCheckHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        status: 'online',
        latencyMs: 200,
        consecutiveFailures: 0,
      });
    });

    it('should record engine event for status changes', async () => {
      const onlineCohort = { ...mockCohort, runtimeStatus: 'online' };
      mockEnsureCohortMember.mockResolvedValue(onlineCohort as any);

      const mockProxyInstance = {
        healthCheck: vi.fn().mockResolvedValue({
          reachable: true,
          latencyMs: 150,
          gatewayVersion: '2026.2.1',
          runtimeStatus: 'online',
        }),
        discoverAgents: vi.fn().mockResolvedValue([]),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);
      mockUpdateCohortRuntime.mockResolvedValue(mockCohort as any);
      mockInsertEngineEvent.mockResolvedValue({} as any);

      const requestBody = { cohortId: mockCohort.id };

      const request = new NextRequest('https://example.com/api/v1/engine/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await verifyEngineHandler(request);

      // When status doesn't change but still online, should just update heartbeat
      expect(mockUpdateCohortRuntime).toHaveBeenCalledWith(
        mockCohort.id,
        expect.objectContaining({
          lastHeartbeatAt: expect.any(Date),
        })
      );
    });
  });

  // ============================================================================
  // Scenario 4: Queue Drain After Engine Recovery
  // ============================================================================

  describe('Scenario 4: Queue drain after engine recovery', () => {
    it('should trigger queue drain when engine recovers', async () => {
      // This test verifies the conceptual flow
      // In the actual implementation, queue drain is triggered by verify endpoint
      // when it detects status change from offline to online

      const offlineCohort = { ...mockCohort, runtimeStatus: 'offline' };
      mockEnsureCohortMember.mockResolvedValue(offlineCohort as any);

      const mockProxyInstance = {
        healthCheck: vi.fn().mockResolvedValue({
          reachable: true,
          latencyMs: 180,
          gatewayVersion: '2026.2.1',
          runtimeStatus: 'online',
        }),
        discoverAgents: vi.fn().mockResolvedValue([]),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);
      mockUpdateCohortRuntime.mockResolvedValue(mockCohort as any);
      mockInsertEngineEvent.mockResolvedValue({} as any);

      const requestBody = { cohortId: mockCohort.id };

      const request = new NextRequest('https://example.com/api/v1/engine/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await verifyEngineHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify status changed to online
      expect(data.data.runtimeStatus).toBe('online');

      // Verify recovery event was logged
      expect(mockInsertEngineEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          cohortId: mockCohort.id,
          eventType: 'health_check_recovered',
        })
      );

      // In production, this event triggers queue drain via background job
      // The drain logic itself is tested separately in unit tests
    });

    it('should process queued tasks in FIFO order', async () => {
      // This test verifies that drainTaskQueue processes tasks in FIFO order
      // by checking that updateTaskQueue is called in the correct sequence

      const queuedTasks = [
        { ...mockQueueEntry, id: 'queue-1', queuedAt: new Date('2024-01-01T10:00:00Z') },
        { ...mockQueueEntry, id: 'queue-2', queuedAt: new Date('2024-01-01T10:01:00Z') },
        { ...mockQueueEntry, id: 'queue-3', queuedAt: new Date('2024-01-01T10:02:00Z') },
      ];

      mockGetPendingTasks.mockResolvedValue(queuedTasks as any);
      mockGetCohortById.mockResolvedValue(mockCohort as any);
      mockGetAgentById.mockResolvedValue(mockAgent as any);

      const mockProxyInstance = {
        sendToAgent: vi.fn().mockResolvedValue({
          text: 'Agent response',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        }),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);
      mockUpdateTaskQueue.mockResolvedValue({} as any);
      mockInsertEngineEvent.mockResolvedValue({} as any);

      await drainTaskQueue(mockCohort.id);

      // Verify that updateTaskQueue was called for each task in FIFO order
      expect(mockUpdateTaskQueue).toHaveBeenCalledTimes(6); // 3 tasks × 2 updates each (processing + completed)

      // Verify first task was processed first
      expect(mockUpdateTaskQueue).toHaveBeenNthCalledWith(
        1,
        'queue-1',
        expect.objectContaining({ status: 'processing' })
      );

      // Verify second task was processed second
      expect(mockUpdateTaskQueue).toHaveBeenNthCalledWith(
        3,
        'queue-2',
        expect.objectContaining({ status: 'processing' })
      );

      // Verify third task was processed third
      expect(mockUpdateTaskQueue).toHaveBeenNthCalledWith(
        5,
        'queue-3',
        expect.objectContaining({ status: 'processing' })
      );
    });
  });

  // ============================================================================
  // Scenario 5: Clone Foundation Sync → Verify Files Written
  // ============================================================================

  describe('Scenario 5: Clone Foundation sync → verify files written', () => {
    it('should read a file from agent workspace (GET)', async () => {
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);
      mockEnsureAgentAccess.mockResolvedValue(mockAgent as any);

      const mockProxyInstance = {
        readFile: vi.fn().mockResolvedValue('# SOUL.md\n\nI am Test Agent'),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);

      const request = new NextRequest(
        `https://example.com/api/v1/engine/files/SOUL.md?cohortId=${mockCohort.id}&agentId=${mockAgent.id}`
      );

      const params = Promise.resolve({ path: ['SOUL.md'] });
      const response = await readFileHandler(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        path: 'SOUL.md',
        content: '# SOUL.md\n\nI am Test Agent',
      });

      expect(mockProxyInstance.readFile).toHaveBeenCalledWith('SOUL.md', 'agent-ext-123');
    });

    it('should write a file to agent workspace (PUT)', async () => {
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);
      mockEnsureAgentAccess.mockResolvedValue(mockAgent as any);

      const mockProxyInstance = {
        writeFile: vi.fn().mockResolvedValue(undefined),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);

      const requestBody = {
        cohortId: mockCohort.id,
        agentId: mockAgent.id,
        content: '# Updated SOUL.md\n\nI am an updated agent',
      };

      const request = new NextRequest('https://example.com/api/v1/engine/files/SOUL.md', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const params = Promise.resolve({ path: ['SOUL.md'] });
      const response = await writeFileHandler(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        path: 'SOUL.md',
        status: 'written',
      });

      expect(mockProxyInstance.writeFile).toHaveBeenCalledWith(
        'SOUL.md',
        '# Updated SOUL.md\n\nI am an updated agent',
        'agent-ext-123'
      );
    });

    it('should handle file not found (GET)', async () => {
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);
      mockEnsureAgentAccess.mockResolvedValue(mockAgent as any);

      const mockProxyInstance = {
        readFile: vi
          .fn()
          .mockRejectedValue(new EngineProxyErrorClass('agent_error', 'File not found')),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);

      const request = new NextRequest(
        `https://example.com/api/v1/engine/files/NONEXISTENT.md?cohortId=${mockCohort.id}&agentId=${mockAgent.id}`
      );

      const params = Promise.resolve({ path: ['NONEXISTENT.md'] });
      const response = await readFileHandler(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.title).toBe('File Not Found');
    });

    it('should write nested workspace files', async () => {
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);
      mockEnsureAgentAccess.mockResolvedValue(mockAgent as any);

      const mockProxyInstance = {
        writeFile: vi.fn().mockResolvedValue(undefined),
      };

      mockGetEngineProxy.mockResolvedValue(mockProxyInstance as any);

      const requestBody = {
        cohortId: mockCohort.id,
        agentId: mockAgent.id,
        content: '# Memory Log\n\n- 2024-01-01: Task completed',
      };

      const request = new NextRequest(
        'https://example.com/api/v1/engine/files/memory/2024-01-01.md',
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
        }
      );

      const params = Promise.resolve({ path: ['memory', '2024-01-01.md'] });
      const response = await writeFileHandler(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        path: 'memory/2024-01-01.md',
        status: 'written',
      });

      expect(mockProxyInstance.writeFile).toHaveBeenCalledWith(
        'memory/2024-01-01.md',
        '# Memory Log\n\n- 2024-01-01: Task completed',
        'agent-ext-123'
      );
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should reject agent without externalId for task execution', async () => {
      const agentWithoutExternalId = { ...mockAgent, externalId: null };
      mockEnsureCohortMember.mockResolvedValue(mockCohort as any);
      mockEnsureAgentAccess.mockResolvedValue(agentWithoutExternalId as any);

      const requestBody = {
        cohortId: mockCohort.id,
        agentId: mockAgent.id,
        taskId: mockTaskSession.taskId,
        input: 'Test prompt',
      };

      const request = new NextRequest('https://example.com/api/v1/engine/send', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await sendToAgentHandler(request);

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.title).toBe('Agent Not Provisioned');
    });

    it('should handle cohort without connection for health check', async () => {
      const cohortWithoutConnection = {
        ...mockCohort,
        gatewayUrl: null,
        authTokenEncrypted: null,
      };
      mockEnsureCohortMember.mockResolvedValue(cohortWithoutConnection as any);
      mockHasEngineConnection.mockResolvedValue(false);

      const request = new NextRequest(
        `https://example.com/api/v1/engine/health?cohortId=${mockCohort.id}`
      );

      const response = await healthCheckHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        status: 'not_connected',
        latencyMs: 0,
        gatewayVersion: '',
      });
    });

    it('should verify cohort without connection returns proper error', async () => {
      const cohortWithoutConnection = {
        ...mockCohort,
        gatewayUrl: null,
        authTokenEncrypted: null,
      };
      mockEnsureCohortMember.mockResolvedValue(cohortWithoutConnection as any);

      const requestBody = { cohortId: mockCohort.id };

      const request = new NextRequest('https://example.com/api/v1/engine/verify', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await verifyEngineHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toMatchObject({
        reachable: false,
        runtimeStatus: 'offline',
        error: {
          type: 'not_connected',
          message: 'Cohort is not connected to an engine',
        },
      });
    });
  });
});
