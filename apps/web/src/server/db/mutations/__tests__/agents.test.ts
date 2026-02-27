import { describe, it, expect, vi, beforeEach } from 'vitest';

const makeMutationMock = <T>(result: T) => {
  const query: any = {
    values: vi.fn(() => query),
    set: vi.fn(() => query),
    where: vi.fn(() => query),
    returning: vi.fn(() => Promise.resolve(result)),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

const mockDb = {
  insert: vi.fn(),
  update: vi.fn(),
};

vi.mock('@repo/database/client', () => ({
  db: mockDb,
}));

import {
  createAgent,
  updateAgent,
  deleteAgent,
  recordEvolutionEvent,
  createCloneAgent,
} from '../agents';

describe('Agent Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAgent inserts an agent', async () => {
    const agentRow = { id: 'agent-1', name: 'Agent' };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([agentRow]));

    const result = await createAgent({
      name: 'Agent',
      scopeType: 'personal',
      scopeId: 'user-1',
    });

    expect(result?.id).toBe('agent-1');
  });

  it('createCloneAgent provisions a clone agent', async () => {
    const agentRow = { id: 'agent-2', name: 'Clone' };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([agentRow]));

    const result = await createCloneAgent('user-1', 'cohort-1', { key: 'value' });
    expect(result?.name).toBe('Clone');
  });

  it('updateAgent updates an agent', async () => {
    const agentRow = { id: 'agent-1', name: 'Updated' };
    mockDb.update.mockReturnValueOnce(makeMutationMock([agentRow]));

    const result = await updateAgent('agent-1', { name: 'Updated' });
    expect(result?.name).toBe('Updated');
  });

  it('deleteAgent soft deletes an agent', async () => {
    const agentRow = { id: 'agent-1', status: 'offline' };
    mockDb.update.mockReturnValueOnce(makeMutationMock([agentRow]));

    const result = await deleteAgent('agent-1');
    expect(result?.status).toBe('offline');
  });

  it('recordEvolutionEvent inserts event', async () => {
    const eventRow = { id: 'event-1', eventType: 'learning' };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([eventRow]));

    const result = await recordEvolutionEvent({
      agentId: 'agent-1',
      type: 'learning',
      summary: 'Learned something',
      scopeType: 'personal',
      scopeId: 'user-1',
    });

    expect(result?.id).toBe('event-1');
  });
});
