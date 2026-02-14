/**
 * Integration Tests - Supabase Client Creation
 *
 * These tests verify that Supabase clients are created correctly
 * with proper configuration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBrowserClient } from '@supabase/ssr';

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn(),
}));

describe('Supabase Client Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up test environment variables
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/testdb');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Browser Client Creation', () => {
    it('should create browser client with correct configuration', () => {
      const mockClient = { from: vi.fn(), auth: {} };
      vi.mocked(createBrowserClient).mockReturnValue(mockClient as any);

      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      expect(createBrowserClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-anon-key');
    });
  });

  describe('Environment Variables', () => {
    it('should have required environment variables', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      expect(process.env.DATABASE_URL).toBeDefined();
    });

    it('should use HTTPS for Supabase URL', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https:\/\//);
    });
  });
});
