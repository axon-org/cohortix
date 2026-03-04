import { describe, it, expect, vi, beforeEach } from 'vitest';

const makeQueryMock = <T>(result: T) => {
  const query: any = {
    from: vi.fn(() => query),
    leftJoin: vi.fn(() => query),
    where: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(() => query),
    offset: vi.fn(() => query),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
}));

vi.mock('@repo/database/client', () => ({
  db: mockDb,
}));

import { getAgents, getAgentStats, getAgentEvolution } from '../agents';

describe('Agent Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAgents returns scoped agents', async () => {
    mockDb.select.mockReturnValueOnce(makeQueryMock([{ id: 'agent-1', name: 'Agent' }]));

    const result = await getAgents('personal', 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('agent-1');
  });

  it('getAgentStats aggregates session metrics', async () => {
    mockDb.select.mockReturnValueOnce(
      makeQueryMock([
        {
          status: 'completed',
          startedAt: new Date('2024-01-01T00:00:00Z'),
          endedAt: new Date('2024-01-01T00:01:00Z'),
        },
        {
          status: 'failed',
          startedAt: new Date('2024-01-02T00:00:00Z'),
          endedAt: new Date('2024-01-02T00:02:00Z'),
        },
      ])
    );

    const stats = await getAgentStats('agent-1');
    expect(stats.totalSessions).toBe(2);
    expect(stats.completedCount).toBe(1);
    expect(stats.successRate).toBe(50);
    expect(stats.avgResponseTimeMs).toBe(60000);
  });

  it('getAgentEvolution returns ordered events', async () => {
    mockDb.select.mockReturnValueOnce(
      makeQueryMock([
        { id: 'event-1', eventType: 'learning' },
        { id: 'event-2', eventType: 'milestone' },
      ])
    );

    const events = await getAgentEvolution('agent-1', 2);
    expect(events).toHaveLength(2);
    expect(events[0]!.id).toBe('event-1');
  });
});
