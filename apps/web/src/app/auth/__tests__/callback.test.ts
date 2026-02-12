import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../callback/route'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('Auth Callback Route', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
    }
    vi.mocked(createClient).mockReturnValue(mockSupabase)
  })

  it('should exchange code for session when code is present', async () => {
    const request = new Request('https://example.com/auth/callback?code=test-code')

    const response = await GET(request)

    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code')
    expect(response.status).toBe(307) // Redirect
    expect(response.headers.get('Location')).toBe('https://example.com/')
  })

  it('should redirect without exchanging when code is missing', async () => {
    const request = new Request('https://example.com/auth/callback')

    const response = await GET(request)

    expect(mockSupabase.auth.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.status).toBe(307)
    expect(response.headers.get('Location')).toBe('https://example.com/')
  })

  it('should handle redirect with query parameters', async () => {
    const request = new Request(
      'https://example.com/auth/callback?code=test-code&next=/dashboard'
    )

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('Location')
    expect(location).toContain('example.com')
  })
})
