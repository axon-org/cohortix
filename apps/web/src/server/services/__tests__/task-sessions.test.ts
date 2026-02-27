import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = {
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
};

vi.mock('@repo/database/client', () => ({
  db: mockDb,
}));

import { createTaskSession, closeTaskSession } from '../task-sessions';

const makeQueryMock = <T>(result: T) => ({
  values: vi.fn(() => ({
    returning: vi.fn().mockResolvedValue(result),
  })),
  set: vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue(result),
    })),
  })),
});

describe('task sessions service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createTaskSession inserts session', async () => {
    const session = { id: 'session-1' };
    mockDb.insert.mockReturnValue(makeQueryMock([session]));

    const result = await createTaskSession({
      taskId: 'task-1',
      agentId: 'agent-1',
      cohortId: null,
      scopeType: 'personal',
      scopeId: 'user-1',
    });

    expect(result?.id).toBe('session-1');
  });

  it('closeTaskSession updates session', async () => {
    const session = { id: 'session-1', status: 'completed' };
    mockDb.update.mockReturnValue(makeQueryMock([session]));

    const result = await closeTaskSession('session-1', 'completed');

    expect(result?.status).toBe('completed');
  });
});
