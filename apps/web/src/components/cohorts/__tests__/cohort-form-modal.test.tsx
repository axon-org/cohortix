/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CohortFormModal } from '../cohort-form-modal';

const mockCreateCohort = vi.fn();
const mockUpdateCohort = vi.fn();

vi.mock('@/hooks/use-cohorts', () => ({
  useCreateCohort: () => ({
    mutateAsync: mockCreateCohort,
    isPending: false,
  }),
  useUpdateCohort: () => ({
    mutateAsync: mockUpdateCohort,
    isPending: false,
  }),
}));

describe('CohortFormModal', () => {
  beforeEach(() => {
    mockCreateCohort.mockReset();
    mockUpdateCohort.mockReset();
  });

  it.todo('submits create flow with required fields', async () => {
    const onOpenChange = vi.fn();

    render(<CohortFormModal open onOpenChange={onOpenChange} orgId="org-123" />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Q1 Engineering Sprint'), {
      target: { value: 'Q1 Engineering' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Cohort' }));

    expect(mockCreateCohort).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Q1 Engineering',
        organizationId: '00000000-0000-0000-0000-000000000001',
        type: 'shared',
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it.todo('submits update flow in edit mode', async () => {
    const onOpenChange = vi.fn();

    render(
      <CohortFormModal
        open
        onOpenChange={onOpenChange}
        orgId="org-123"
        cohort={{
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Original Name',
          description: 'Initial',
          hosting: 'managed',
          startDate: '2026-01-01',
          endDate: '2026-02-01',
        }}
      />
    );

    const nameInput = screen.getByPlaceholderText('e.g. Q1 Engineering Sprint');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(mockUpdateCohort).toHaveBeenCalledWith({
      id: '00000000-0000-0000-0000-000000000002',
      data: expect.objectContaining({
        name: 'Updated Name',
      }),
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
