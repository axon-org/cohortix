import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as listAgentsHandler, POST as createAgentHandler } from '@/app/api/v1/agents/route';

vi.mock('@/lib/auth-helper', () => ({
  getAuthContext: vi.fn(),
}));

vi.mock('@/server/db/queries/agents', () => ({
  getAgents: vi.fn(),
}));

vi.mock('@/server/db/queries/cohorts', () => ({
  getCohortById: vi.fn(),
  getCohortUserMembers: vi.fn(),
}));

vi.mock('@/server/db/mutations/agents', () => ({
  createAgent: vi.fn(),
}));

import { getAuthContext } from '@/lib/auth-helper';
import { getAgents } from '@/server/db/queries/agents';
import { createAgent } from '@/server/db/mutations/agents';

const mockGetAuthContext = vi.mocked(getAuthContext);
const mockGetAgents = vi.mocked(getAgents);
const mockCreateAgent = vi.mocked(createAgent);

describe('Agents API', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    mockGetAuthContext.mockResolvedValue({
      supabase: {} as any,
      organizationId: 'org-123',
      userId: 'user-123',
    });
  });

  it('lists agents', async () => {
    mockGetAgents.mockResolvedValue([{ id: 'agent-1', name: 'Agent' }] as any);

    const request = new NextRequest('https://example.com/api/v1/agents');
    const response = await listAgentsHandler(request);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data).toHaveLength(1);
  });

  it('creates an agent', async () => {
    mockCreateAgent.mockResolvedValue({ id: 'agent-1', name: 'Agent' } as any);

    const request = new NextRequest('https://example.com/api/v1/agents', {
      method: 'POST',
      body: JSON.stringify({ name: 'Agent', scopeType: 'org' }),
    });

    const response = await createAgentHandler(request);
    expect(response.status).toBe(201);
    expect(mockCreateAgent).toHaveBeenCalled();
  });
});
