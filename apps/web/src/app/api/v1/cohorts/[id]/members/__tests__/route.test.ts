import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMembersHandler } from '@/app/api/v1/cohorts/[id]/members/route';
import { POST as addUserHandler } from '@/app/api/v1/cohorts/[id]/members/users/route';

vi.mock('@/lib/auth-helper', () => ({
  getAuthContext: vi.fn(),
}));

vi.mock('@/server/db/queries/cohorts', () => ({
  getCohortById: vi.fn(),
  getCohortUserMembers: vi.fn(),
  getCohortAgentMembers: vi.fn(),
}));

vi.mock('@/server/db/mutations/cohorts', () => ({
  addUserMember: vi.fn(),
  updateCohortMemberCount: vi.fn(),
}));

import { getAuthContext } from '@/lib/auth-helper';
import {
  getCohortById,
  getCohortUserMembers,
  getCohortAgentMembers,
} from '@/server/db/queries/cohorts';
import { addUserMember } from '@/server/db/mutations/cohorts';

const mockGetAuthContext = vi.mocked(getAuthContext);
const mockGetCohortById = vi.mocked(getCohortById);
const mockGetCohortUserMembers = vi.mocked(getCohortUserMembers);
const mockGetCohortAgentMembers = vi.mocked(getCohortAgentMembers);
const mockAddUserMember = vi.mocked(addUserMember);

const cohort = {
  id: '00000000-0000-0000-0000-000000000002',
  type: 'shared',
  ownerUserId: null,
} as any;
const members = [{ userId: '00000000-0000-0000-0000-000000000004', role: 'owner' }] as any;

describe('Cohort members API', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    mockGetAuthContext.mockResolvedValue({
      supabase: {} as any,
      organizationId: '00000000-0000-0000-0000-000000000001',
      userId: '00000000-0000-0000-0000-000000000004',
    });
    mockGetCohortById.mockResolvedValue(cohort);
    mockGetCohortUserMembers.mockResolvedValue(members);
    mockGetCohortAgentMembers.mockResolvedValue([]);
  });

  it('lists members', async () => {
    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/members');
    const response = await getMembersHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.users).toHaveLength(1);
  });

  it('adds a user member', async () => {
    mockAddUserMember.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000005',
      userId: '00000000-0000-0000-0000-000000000009',
    } as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/members/users', {
      method: 'POST',
      body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000009', role: 'member' }),
    });

    const response = await addUserHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(201);
    expect(mockAddUserMember).toHaveBeenCalled();
  });

  it('blocks non-admins from adding members', async () => {
    mockGetCohortUserMembers.mockResolvedValue([
      { userId: '00000000-0000-0000-0000-000000000004', role: 'member' },
    ] as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/members/users', {
      method: 'POST',
      body: JSON.stringify({ userId: '00000000-0000-0000-0000-00000000000a', role: 'member' }),
    });

    const response = await addUserHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(403);
  });

  it('blocks org admins from accessing personal cohorts', async () => {
    mockGetCohortById.mockResolvedValue({
      id: '00000000-0000-0000-0000-00000000000b',
      type: 'personal',
      ownerUserId: 'user-owner',
    } as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-999/members');
    const response = await getMembersHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-00000000000b' }),
    });

    expect(response.status).toBe(403);
  });
});
