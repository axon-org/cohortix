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

const cohort = { id: 'cohort-123', type: 'shared', ownerUserId: null } as any;
const members = [{ userId: 'user-123', role: 'owner' }] as any;

describe('Cohort members API', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    mockGetAuthContext.mockResolvedValue({
      supabase: {} as any,
      organizationId: 'org-123',
      userId: 'user-123',
    });
    mockGetCohortById.mockResolvedValue(cohort);
    mockGetCohortUserMembers.mockResolvedValue(members);
    mockGetCohortAgentMembers.mockResolvedValue([]);
  });

  it('lists members', async () => {
    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/members');
    const response = await getMembersHandler(request, {
      params: Promise.resolve({ id: 'cohort-123' }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.users).toHaveLength(1);
  });

  it('adds a user member', async () => {
    mockAddUserMember.mockResolvedValue({ id: 'member-1', userId: 'user-456' } as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/members/users', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-456', role: 'member' }),
    });

    const response = await addUserHandler(request, {
      params: Promise.resolve({ id: 'cohort-123' }),
    });

    expect(response.status).toBe(201);
    expect(mockAddUserMember).toHaveBeenCalled();
  });

  it('blocks non-admins from adding members', async () => {
    mockGetCohortUserMembers.mockResolvedValue([{ userId: 'user-123', role: 'member' }] as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/members/users', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-789', role: 'member' }),
    });

    const response = await addUserHandler(request, {
      params: Promise.resolve({ id: 'cohort-123' }),
    });

    expect(response.status).toBe(403);
  });

  it('blocks org admins from accessing personal cohorts', async () => {
    mockGetCohortById.mockResolvedValue({
      id: 'cohort-999',
      type: 'personal',
      ownerUserId: 'user-owner',
    } as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-999/members');
    const response = await getMembersHandler(request, {
      params: Promise.resolve({ id: 'cohort-999' }),
    });

    expect(response.status).toBe(403);
  });
});
