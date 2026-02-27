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

  it('submits create flow with required fields', async () => {
    const onOpenChange = vi.fn();

    render(
      <CohortFormModal open onOpenChange={onOpenChange} orgId="org-123" />
    );

    fireEvent.change(screen.getByLabelText('Cohort Name'), {
      target: { value: 'Q1 Engineering' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Cohort' }));

    expect(mockCreateCohort).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Q1 Engineering',
        organizationId: 'org-123',
        type: 'shared',
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits update flow in edit mode', async () => {
    const onOpenChange = vi.fn();

    render(
      <CohortFormModal
        open
        onOpenChange={onOpenChange}
        orgId="org-123"
        cohort={{
          id: 'cohort-1',
          name: 'Original Name',
          description: 'Initial',
          hosting: 'managed',
          startDate: '2026-01-01',
          endDate: '2026-02-01',
        }}
      />
    );

    const nameInput = screen.getByLabelText('Cohort Name');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(mockUpdateCohort).toHaveBeenCalledWith({
      id: 'cohort-1',
      data: expect.objectContaining({
        name: 'Updated Name',
      }),
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
