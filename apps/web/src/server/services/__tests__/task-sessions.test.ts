import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
}));

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
    const session = { id: '00000000-0000-0000-0000-000000000007' };
    mockDb.insert.mockReturnValue(makeQueryMock([session]));

    const result = await createTaskSession({
      taskId: '00000000-0000-0000-0000-000000000016',
      agentId: '00000000-0000-0000-0000-000000000010',
      cohortId: null,
      scopeType: 'personal',
      scopeId: '00000000-0000-0000-0000-000000000004',
    });

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000007');
  });

  it('closeTaskSession updates session', async () => {
    const session = { id: '00000000-0000-0000-0000-000000000007', status: 'completed' };
    mockDb.update.mockReturnValue(makeQueryMock([session]));

    const result = await closeTaskSession('00000000-0000-0000-0000-000000000007', 'completed');

    expect(result?.status).toBe('completed');
  });
});
