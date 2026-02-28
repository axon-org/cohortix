import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GET as getAgentHandler,
  PATCH as patchAgentHandler,
  DELETE as deleteAgentHandler,
} from '@/app/api/v1/agents/[id]/route';
import { GET as statsHandler } from '@/app/api/v1/agents/[id]/stats/route';
import { GET as evolutionHandler } from '@/app/api/v1/agents/[id]/evolution/route';

vi.mock('@/lib/auth-helper', () => ({
  getAuthContext: vi.fn(),
}));

vi.mock('@/server/db/queries/agents', () => ({
  getAgentById: vi.fn(),
  getAgentStats: vi.fn(),
  getAgentEvolution: vi.fn(),
}));

vi.mock('@/server/db/queries/cohorts', () => ({
  getCohortUserMembers: vi.fn(),
}));

vi.mock('@/server/db/mutations/agents', () => ({
  updateAgent: vi.fn(),
  deleteAgent: vi.fn(),
}));

import { getAuthContext } from '@/lib/auth-helper';
import { getAgentById, getAgentStats, getAgentEvolution } from '@/server/db/queries/agents';
import { updateAgent, deleteAgent } from '@/server/db/mutations/agents';

const mockGetAuthContext = vi.mocked(getAuthContext);
const mockGetAgentById = vi.mocked(getAgentById);
const mockGetAgentStats = vi.mocked(getAgentStats);
const mockGetAgentEvolution = vi.mocked(getAgentEvolution);
const mockUpdateAgent = vi.mocked(updateAgent);
const mockDeleteAgent = vi.mocked(deleteAgent);

describe('Agent profile API', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    mockGetAuthContext.mockResolvedValue({
      supabase: {} as any,
      organizationId: '00000000-0000-0000-0000-000000000001',
      userId: '00000000-0000-0000-0000-000000000004',
    });
    mockGetAgentById.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000006',
      scopeType: 'org',
      organizationId: '00000000-0000-0000-0000-000000000001',
    } as any);
  });

  it('gets agent profile', async () => {
    const request = new NextRequest('https://example.com/api/v1/agents/agent-123');
    const response = await getAgentHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000006' }),
    });

    expect(response.status).toBe(200);
  });

  it('updates agent', async () => {
    mockUpdateAgent.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Updated',
    } as any);

    const request = new NextRequest('https://example.com/api/v1/agents/agent-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await patchAgentHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000006' }),
    });

    expect(response.status).toBe(200);
  });

  it('deletes agent', async () => {
    mockDeleteAgent.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000006',
      status: 'offline',
    } as any);

    const request = new NextRequest('https://example.com/api/v1/agents/agent-123', {
      method: 'DELETE',
    });
    const response = await deleteAgentHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000006' }),
    });

    expect(response.status).toBe(200);
  });

  it('gets agent stats', async () => {
    mockGetAgentStats.mockResolvedValue({ totalSessions: 1 } as any);

    const request = new NextRequest('https://example.com/api/v1/agents/agent-123/stats');
    const response = await statsHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000006' }),
    });

    expect(response.status).toBe(200);
  });

  it('gets agent evolution', async () => {
    mockGetAgentEvolution.mockResolvedValue([] as any);

    const request = new NextRequest('https://example.com/api/v1/agents/agent-123/evolution');
    const response = await evolutionHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000006' }),
    });

    expect(response.status).toBe(200);
  });
});
