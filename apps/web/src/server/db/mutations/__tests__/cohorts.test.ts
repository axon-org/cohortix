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

const makeQueryMock = <T>(result: T) => {
  const query: any = {
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

const mockDb = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
}));

vi.mock('@repo/database/client', () => ({
  db: mockDb,
}));

import { addUserMember, createCohort, deleteCohort, removeMember, updateCohort } from '../cohorts';

describe('Cohort Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createCohort inserts a cohort row', async () => {
    const cohortRow = { id: '00000000-0000-0000-0000-000000000002', name: 'Alpha' };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([cohortRow]));
    mockDb.insert.mockReturnValueOnce(makeMutationMock([]));

    const result = await createCohort({
      name: 'Alpha',
      type: 'shared',
      organizationId: '00000000-0000-0000-0000-000000000001',
      createdBy: '00000000-0000-0000-0000-000000000004',
    });

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000002');
  });

  it('updateCohort updates a cohort row', async () => {
    const cohortRow = { id: '00000000-0000-0000-0000-000000000002', name: 'Updated' };
    mockDb.update.mockReturnValueOnce(makeMutationMock([cohortRow]));

    const result = await updateCohort('00000000-0000-0000-0000-000000000002', { name: 'Updated' });
    expect(result?.name).toBe('Updated');
  });

  it('deleteCohort soft deletes a cohort', async () => {
    const cohortRow = { id: '00000000-0000-0000-0000-000000000002', status: 'completed' };
    mockDb.update.mockReturnValueOnce(makeMutationMock([cohortRow]));

    const result = await deleteCohort('00000000-0000-0000-0000-000000000002');
    expect(result?.status).toBe('completed');
  });

  it('addUserMember inserts a member row', async () => {
    const memberRow = {
      id: '00000000-0000-0000-0000-000000000005',
      cohortId: '00000000-0000-0000-0000-000000000002',
      userId: '00000000-0000-0000-0000-000000000004',
    };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([memberRow]));

    const result = await addUserMember({
      cohortId: '00000000-0000-0000-0000-000000000002',
      userId: '00000000-0000-0000-0000-000000000004',
      role: 'member',
    });

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000005');
  });

  it('removeMember deletes a user member', async () => {
    const memberRow = {
      id: '00000000-0000-0000-0000-000000000005',
      cohortId: '00000000-0000-0000-0000-000000000002',
      userId: '00000000-0000-0000-0000-000000000004',
    };
    mockDb.delete.mockReturnValueOnce(makeMutationMock([memberRow]));

    const result = await removeMember({
      cohortId: '00000000-0000-0000-0000-000000000002',
      memberId: '00000000-0000-0000-0000-000000000004',
      type: 'user',
    });

    expect(result?.id).toBe('00000000-0000-0000-0000-000000000005');
  });
});
