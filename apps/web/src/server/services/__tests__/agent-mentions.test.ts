import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = vi.hoisted(() => ({
  update: vi.fn(),
}));

vi.mock('@repo/database/client', () => ({
  db: mockDb,
}));

vi.mock('@/server/db/queries/cohorts', () => ({
  getCohortAgentMembers: vi.fn().mockResolvedValue([
    { agentId: '00000000-0000-0000-0000-000000000010', slug: 'clone', name: 'Clone' },
    { agentId: '00000000-0000-0000-0000-000000000011', slug: 'researcher', name: 'Researcher' },
  ]),
}));

vi.mock('@/server/services/task-sessions', () => ({
  createTaskSession: vi.fn().mockResolvedValue({ id: '00000000-0000-0000-0000-000000000007' }),
}));

import { parseAgentMentions, handleCommentMentions } from '../agent-mentions';

const makeUpdateMock = () => ({
  set: vi.fn(() => ({
    where: vi.fn().mockResolvedValue(null),
  })),
});

describe('agent mention service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parseAgentMentions extracts unique slugs', () => {
    const result = parseAgentMentions('Hello @clone and @researcher and @clone');
    expect(result).toEqual(['clone', 'researcher']);
  });

  it('handleCommentMentions creates sessions', async () => {
    mockDb.update.mockReturnValue(makeUpdateMock());

    const result = await handleCommentMentions({
      commentId: '00000000-0000-0000-0000-000000000015',
      commentText: 'Ping @clone',
      taskId: '00000000-0000-0000-0000-000000000016',
      cohortId: '00000000-0000-0000-0000-000000000002',
      scopeType: 'cohort',
      scopeId: '00000000-0000-0000-0000-000000000002',
    });

    expect(result.mentionedAgentIds).toEqual(['00000000-0000-0000-0000-000000000010']);
    expect(result.sessions).toHaveLength(1);
  });
});
