import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = {
  update: vi.fn(),
};

vi.mock('@repo/database/client', () => ({
  db: mockDb,
}));

vi.mock('@/server/db/queries/cohorts', () => ({
  getCohortAgentMembers: vi.fn().mockResolvedValue([
    { agentId: 'agent-1', slug: 'clone', name: 'Clone' },
    { agentId: 'agent-2', slug: 'researcher', name: 'Researcher' },
  ]),
}));

vi.mock('@/server/services/task-sessions', () => ({
  createTaskSession: vi.fn().mockResolvedValue({ id: 'session-1' }),
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
      commentId: 'comment-1',
      commentText: 'Ping @clone',
      taskId: 'task-1',
      cohortId: 'cohort-1',
      scopeType: 'cohort',
      scopeId: 'cohort-1',
    });

    expect(result.mentionedAgentIds).toEqual(['agent-1']);
    expect(result.sessions).toHaveLength(1);
  });
});
