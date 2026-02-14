import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export const mockSupabaseClient: Partial<SupabaseClient> = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  } as any,
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn(),
  })) as any,
};

export const createMockSupabaseClient = (): Partial<SupabaseClient> => {
  return {
    ...mockSupabaseClient,
  };
};
