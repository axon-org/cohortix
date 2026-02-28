/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Suspense } from 'react';
import AgentDetailPage from './page';

const mockUseAgent = vi.fn();
const mockUpdateAgent = vi.fn();
const mockDeleteAgent = vi.fn();
const mockUseAgentEvolution = vi.fn();
const mockUseAgentStats = vi.fn();

vi.mock('@/hooks/use-agents', () => ({
  useAgent: (id: string) => mockUseAgent(id),
  useUpdateAgent: () => ({ mutateAsync: mockUpdateAgent, isPending: false }),
  useDeleteAgent: () => ({ mutateAsync: mockDeleteAgent, isPending: false }),
}));

vi.mock('@/hooks/use-agent-detail', () => ({
  useAgentEvolution: (id: string, limit?: number) => mockUseAgentEvolution(id, limit),
  useAgentStats: (id: string) => mockUseAgentStats(id),
}));

const agentFixture = {
  id: '00000000-0000-0000-0000-000000000006',
  name: 'Clone',
  status: 'active',
  scopeType: 'personal',
  role: 'Founder Assistant',
  description: 'Foundational clone agent',
  runtimeType: 'Managed',
  createdAt: '2026-01-01T00:00:00.000Z',
  totalTasksCompleted: 12,
  capabilities: ['research', 'analysis'],
};

describe('AgentDetailPage', () => {
  beforeEach(() => {
    mockUseAgent.mockReset();
    mockUpdateAgent.mockReset();
    mockDeleteAgent.mockReset();
    mockUseAgentEvolution.mockReset();
    mockUseAgentStats.mockReset();

    mockUseAgent.mockReturnValue({ data: agentFixture, isLoading: false, error: null });
    mockUseAgentEvolution.mockReturnValue({
      data: {
        events: [
          {
            eventType: 'learning',
            summary: 'Learned onboarding flow',
            createdAt: '2026-02-01T00:00:00.000Z',
            metadata: { note: 'Great improvement' },
          },
        ],
      },
    });
    mockUseAgentStats.mockReturnValue({
      data: {
        successRate: 92,
        completedCount: 18,
        avgResponseTimeMs: 450,
      },
    });
  });

  it('renders agent profile details', async () => {
    render(
      <Suspense fallback={null}>
        <AgentDetailPage
          params={Promise.resolve({
            orgSlug: 'test-org',
            id: '00000000-0000-0000-0000-000000000006',
          })}
        />
      </Suspense>
    );

    expect(await screen.findByText('Clone')).toBeInTheDocument();
    expect(screen.getByText('Founder Assistant')).toBeInTheDocument();
    expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('Learned onboarding flow')).toBeInTheDocument();
  });

  it('allows editing and saving updates', async () => {
    render(
      <Suspense fallback={null}>
        <AgentDetailPage
          params={Promise.resolve({
            orgSlug: 'test-org',
            id: '00000000-0000-0000-0000-000000000006',
          })}
        />
      </Suspense>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Edit/ }));

    const nameInput = screen.getByDisplayValue('Clone');
    fireEvent.change(nameInput, { target: { value: 'Clone Prime' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockUpdateAgent).toHaveBeenCalledWith({
      id: '00000000-0000-0000-0000-000000000006',
      data: expect.objectContaining({
        name: 'Clone Prime',
      }),
    });
  });
});
