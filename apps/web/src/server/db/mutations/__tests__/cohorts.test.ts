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

const mockDb = {
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
};

vi.mock('@repo/database/client', () => ({
  db: mockDb,
}));

import {
  addUserMember,
  createCohort,
  deleteCohort,
  removeMember,
  updateCohort,
} from '../cohorts';

describe('Cohort Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createCohort inserts a cohort row', async () => {
    const cohortRow = { id: 'cohort-1', name: 'Alpha' };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([cohortRow]));

    const result = await createCohort({
      name: 'Alpha',
      type: 'shared',
      organizationId: 'org-1',
      createdBy: 'user-1',
    });

    expect(result?.id).toBe('cohort-1');
  });

  it('updateCohort updates a cohort row', async () => {
    const cohortRow = { id: 'cohort-1', name: 'Updated' };
    mockDb.update.mockReturnValueOnce(makeMutationMock([cohortRow]));

    const result = await updateCohort('cohort-1', { name: 'Updated' });
    expect(result?.name).toBe('Updated');
  });

  it('deleteCohort soft deletes a cohort', async () => {
    const cohortRow = { id: 'cohort-1', status: 'completed' };
    mockDb.update.mockReturnValueOnce(makeMutationMock([cohortRow]));

    const result = await deleteCohort('cohort-1');
    expect(result?.status).toBe('completed');
  });

  it('addUserMember inserts a member row', async () => {
    const memberRow = { id: 'member-1', cohortId: 'cohort-1', userId: 'user-1' };
    mockDb.insert.mockReturnValueOnce(makeMutationMock([memberRow]));

    const result = await addUserMember({
      cohortId: 'cohort-1',
      userId: 'user-1',
      role: 'member',
    });

    expect(result?.id).toBe('member-1');
  });

  it('removeMember deletes a user member', async () => {
    const memberRow = { id: 'member-1', cohortId: 'cohort-1', userId: 'user-1' };
    mockDb.delete.mockReturnValueOnce(makeMutationMock([memberRow]));

    const result = await removeMember({
      cohortId: 'cohort-1',
      memberId: 'user-1',
      type: 'user',
    });

    expect(result?.id).toBe('member-1');
  });
});
