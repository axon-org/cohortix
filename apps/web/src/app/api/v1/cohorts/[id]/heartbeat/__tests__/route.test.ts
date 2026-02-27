import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as heartbeatHandler } from '@/app/api/v1/cohorts/[id]/heartbeat/route';

vi.mock('@/lib/auth-helper', () => ({
  getAuthContext: vi.fn(),
}));

vi.mock('@/server/db/queries/cohorts', () => ({
  getCohortById: vi.fn(),
  getCohortUserMembers: vi.fn(),
}));

vi.mock('@/server/db/mutations/cohorts', () => ({
  updateCohortRuntime: vi.fn(),
}));

import { getAuthContext } from '@/lib/auth-helper';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
import { updateCohortRuntime } from '@/server/db/mutations/cohorts';

const mockGetAuthContext = vi.mocked(getAuthContext);
const mockGetCohortById = vi.mocked(getCohortById);
const mockGetCohortUserMembers = vi.mocked(getCohortUserMembers);
const mockUpdateCohortRuntime = vi.mocked(updateCohortRuntime);

describe('Cohort heartbeat API', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    mockGetAuthContext.mockResolvedValue({
      supabase: {} as any,
      organizationId: 'org-123',
      userId: 'user-123',
    });
    mockGetCohortById.mockResolvedValue({
      id: 'cohort-123',
      type: 'shared',
      ownerUserId: null,
    } as any);
    mockGetCohortUserMembers.mockResolvedValue([{ userId: 'user-123' }] as any);
    mockUpdateCohortRuntime.mockResolvedValue({ id: 'cohort-123', runtimeStatus: 'online' } as any);
  });

  it('records heartbeat', async () => {
    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/heartbeat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await heartbeatHandler(request, {
      params: Promise.resolve({ id: 'cohort-123' }),
    });

    expect(response.status).toBe(200);
    expect(mockUpdateCohortRuntime).toHaveBeenCalled();
  });
});
