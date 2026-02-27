/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentMentionAutocomplete } from '../agent-mention-autocomplete';

const mockUseAgents = vi.fn();

vi.mock('@/hooks/use-agents', () => ({
  useAgents: () => mockUseAgents(),
}));

describe('AgentMentionAutocomplete', () => {
  beforeEach(() => {
    mockUseAgents.mockReset();
    mockUseAgents.mockReturnValue({
      data: {
        data: [
          { id: 'agent-1', name: 'Clone', role: 'Founder', avatarUrl: null },
          { id: 'agent-2', name: 'Atlas', role: 'Ops', avatarUrl: null },
        ],
      },
      isLoading: false,
    });
  });

  it('filters agents and triggers selection', async () => {
    const onSelect = vi.fn();

    render(
      <AgentMentionAutocomplete
        open
        onOpenChange={vi.fn()}
        onSelect={onSelect}
        search="cl"
        triggerRef={{ current: null }}
      />
    );

    expect(screen.getByText('Clone')).toBeInTheDocument();
    expect(screen.queryByText('Atlas')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Clone'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'agent-1', name: 'Clone' })
    );
  });
});
