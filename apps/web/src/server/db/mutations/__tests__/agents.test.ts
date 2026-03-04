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

const mockDb = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
}));

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
    const agentRow = { id: '00000000-0000-0000-0000-000000000010', name: 'Agent' };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([agentRow]));

    const result = await createAgent({
      name: 'Agent',
      scopeType: 'personal',
      scopeId: '00000000-0000-0000-0000-000000000004',
    });

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000010');
  });

  it('createCloneAgent provisions a clone agent', async () => {
    const agentRow = { id: '00000000-0000-0000-0000-000000000011', name: 'Clone' };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([agentRow]));

    const result = await createCloneAgent(
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000002',
      { key: 'value' }
    );
    expect(result?.name).toBe('Clone');
  });

  it('updateAgent updates an agent', async () => {
    const agentRow = { id: '00000000-0000-0000-0000-000000000010', name: 'Updated' };
    mockDb.update.mockReturnValueOnce(makeMutationMock([agentRow]));

    const result = await updateAgent('00000000-0000-0000-0000-000000000010', { name: 'Updated' });
    expect(result?.name).toBe('Updated');
  });

  it('deleteAgent soft deletes an agent', async () => {
    const agentRow = { id: '00000000-0000-0000-0000-000000000010', status: 'offline' };
    mockDb.update.mockReturnValueOnce(makeMutationMock([agentRow]));

    const result = await deleteAgent('00000000-0000-0000-0000-000000000010');
    expect(result?.status).toBe('offline');
  });

  it('recordEvolutionEvent inserts event', async () => {
    const eventRow = { id: '00000000-0000-0000-0000-000000000017', eventType: 'learning' };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([eventRow]));

    const result = await recordEvolutionEvent({
      agentId: '00000000-0000-0000-0000-000000000010',
      type: 'learning',
      summary: 'Learned something',
      scopeType: 'personal',
      scopeId: '00000000-0000-0000-0000-000000000004',
    });

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000017');
  });
});
