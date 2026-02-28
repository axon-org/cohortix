import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { startOnboarding } from '../onboarding';

const makeSupabaseClient = (settings: Record<string, unknown>) => {
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { settings }, error: null }),
  };

  const updateChain = {
    eq: vi.fn().mockResolvedValue({ error: null }),
  };

  const from = vi.fn(() => ({
    select: vi.fn(() => selectChain),
    update: vi.fn(() => updateChain),
  }));

  return { from } as unknown as SupabaseClient;
};

describe('onboarding service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('startOnboarding initializes state', async () => {
    const supabase = makeSupabaseClient({});

    const state = await startOnboarding({
      supabase,
      userId: 'user-1',
      organizationId: 'org-1',
    });

    expect(state.status).toBe('in_progress');
    expect(state.currentStep).toBe(1);
  });
});
