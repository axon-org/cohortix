import { describe, it, expect, vi, beforeEach } from 'vitest';

const makeQueryMock = <T>(result: T) => {
  const query: any = {
    from: vi.fn(() => query),
    leftJoin: vi.fn(() => query),
    where: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(() => query),
    offset: vi.fn(() => query),
    groupBy: vi.fn(() => query),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@repo/database/client', () => ({
  db: mockDb,
}));

vi.mock('@/lib/auth-helper', () => ({
  getAuthContext: vi.fn().mockResolvedValue({
    organizationId: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000004',
  }),
}));

import { getCohorts, getCohortUserMembers, getCohortAgentMembers } from '../cohorts';

describe('Cohort Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCohorts returns enriched cohort list', async () => {
    const cohortRow = {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Alpha',
      createdAt: new Date(),
      memberCount: 0,
      engagementPercent: '0',
    };

    mockDb.select
      .mockReturnValueOnce(makeQueryMock([{ total: 1 }]))
      .mockReturnValueOnce(makeQueryMock([cohortRow]))
      .mockReturnValueOnce(
        makeQueryMock([{ cohortId: '00000000-0000-0000-0000-000000000002', count: 1 }])
      )
      .mockReturnValueOnce(
        makeQueryMock([{ cohortId: '00000000-0000-0000-0000-000000000002', engagementScore: 0.75 }])
      );

    const result = await getCohorts(
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000004',
      {}
    );

    expect(result.total).toBe(1);
    expect(result.cohorts).toHaveLength(1);
    expect(result.cohorts[0]!.memberCount).toBe(2);
    expect(result.cohorts[0]!.engagementPercent).toBe(0.75);
  });

  it('getCohortUserMembers returns joined user data', async () => {
    mockDb.select.mockReturnValueOnce(
      makeQueryMock([
        {
          id: '00000000-0000-0000-0000-000000000005',
          cohortId: '00000000-0000-0000-0000-000000000002',
          userId: '00000000-0000-0000-0000-000000000004',
          role: 'owner',
          joinedAt: new Date(),
          updatedAt: new Date(),
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: null,
        },
      ])
    );

    const members = await getCohortUserMembers('00000000-0000-0000-0000-000000000002');

    expect(members).toHaveLength(1);
    expect(members[0]!.role).toBe('owner');
    expect(members[0]!.email).toBe('test@example.com');
  });

  it('getCohortAgentMembers returns joined agent data', async () => {
    mockDb.select.mockReturnValueOnce(
      makeQueryMock([
        {
          id: '00000000-0000-0000-0000-000000000005',
          cohortId: '00000000-0000-0000-0000-000000000002',
          agentId: '00000000-0000-0000-0000-000000000006',
          role: 'member',
          engagementScore: 0.9,
          joinedAt: new Date(),
          updatedAt: new Date(),
          name: 'Agent',
          slug: 'agent',
          avatarUrl: null,
          status: 'idle',
        },
      ])
    );

    const members = await getCohortAgentMembers('00000000-0000-0000-0000-000000000002');

    expect(members).toHaveLength(1);
    expect(members[0]!.agentId).toBe('00000000-0000-0000-0000-000000000006');
    expect(members[0]!.engagementScore).toBe(0.9);
  });
});
