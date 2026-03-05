import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildTaskPrompt } from '../task-execution';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock drizzle DB (must be defined in factory to avoid hoisting issues)
vi.mock('@repo/database/client', () => {
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  };
  return { db: mockDb };
});

vi.mock('@repo/database/schema', () => ({
  tasks: { id: 'id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

vi.mock('../../db/queries/operations', () => ({
  getOperation: vi.fn(),
}));

// Import mocked modules
import { db } from '@repo/database/client';
import { getOperation } from '../../db/queries/operations';

const mockDb = vi.mocked(db);
const mockGetOperation = vi.mocked(getOperation);

describe('task-execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildTaskPrompt', () => {
    it('should build prompt with task context only', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Implement feature X',
        description: 'Add new feature to the system',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2026-03-10'),
        projectId: null,
      };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([mockTask])),
        })),
      } as any);

      const prompt = await buildTaskPrompt('task-1', 'Please review this PR');

      expect(prompt).toContain('## Task: Implement feature X');
      expect(prompt).toContain('Add new feature to the system');
      expect(prompt).toContain('**Status:** in_progress');
      expect(prompt).toContain('**Priority:** high');
      expect(prompt).toContain('**Due:**');
      expect(prompt).toContain('## Request');
      expect(prompt).toContain('Please review this PR');
      expect(prompt).toContain('Post your response as a comment on this task');
    });

    it('should build prompt with operation context', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Fix bug',
        description: 'Critical bug fix',
        status: 'in_progress',
        priority: null,
        dueDate: null,
        projectId: 'project-1',
      };

      const mockOperation = {
        id: 'project-1',
        name: 'Q1 Launch',
        description: 'Prepare for Q1 product launch',
      };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([mockTask])),
        })),
      } as any);

      mockGetOperation.mockResolvedValueOnce(mockOperation as any);

      const prompt = await buildTaskPrompt('task-1', 'What is the status?');

      expect(prompt).toContain('## Task: Fix bug');
      expect(prompt).toContain('Critical bug fix');
      expect(prompt).toContain('## Operation: Q1 Launch');
      expect(prompt).toContain('Prepare for Q1 product launch');
      expect(prompt).toContain('What is the status?');
    });

    it('should handle missing optional fields', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Simple task',
        description: null,
        status: 'todo',
        priority: null,
        dueDate: null,
        projectId: null,
      };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([mockTask])),
        })),
      } as any);

      const prompt = await buildTaskPrompt('task-1', 'Help needed');

      expect(prompt).toContain('## Task: Simple task');
      expect(prompt).not.toContain('**Priority:**');
      expect(prompt).not.toContain('**Due:**');
      expect(prompt).toContain('Help needed');
    });

    it('should throw when task not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      } as any);

      await expect(buildTaskPrompt('nonexistent', 'test')).rejects.toThrow('Task not found');
    });
  });

  describe('session key format', () => {
    it('should follow cohortix:task:<taskId>:agent:<externalId> format', () => {
      // This is a documentation test to verify the expected format
      const taskId = 'task-789';
      const agentExternalId = 'agent-external-456';
      const expectedFormat = `cohortix:task:${taskId}:agent:${agentExternalId}`;

      expect(expectedFormat).toBe('cohortix:task:task-789:agent:agent-external-456');
      expect(expectedFormat).toMatch(/^cohortix:task:[^:]+:agent:[^:]+$/);
    });
  });
});
