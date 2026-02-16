import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHeaders = vi.fn();
const mockVerify = vi.fn();
const mockCreateServerClient = vi.fn();

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(function MockWebhook() {
    return {
      verify: mockVerify,
    };
  }),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}));

describe('POST /api/webhooks/clerk', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    mockHeaders.mockResolvedValue(
      new Headers({
        'svix-id': 'evt_123',
        'svix-timestamp': '123456',
        'svix-signature': 'sig_123',
      })
    );
  });

  function createSupabaseMock({ existingProcessed = false }: { existingProcessed?: boolean } = {}) {
    const from = vi.fn((table: string) => {
      if (table === 'webhook_events') {
        return {
          insert: vi.fn().mockResolvedValue(
            existingProcessed
              ? { error: { code: '23505' } }
              : {
                  error: null,
                }
          ),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: existingProcessed
                  ? {
                      event_id: 'evt_123',
                      event_type: 'user.created',
                      status: 'processed',
                      attempts: 1,
                      processed_at: new Date().toISOString(),
                    }
                  : null,
                error: null,
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        };
      }

      if (table === 'users') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'id' } }) })),
        })),
      };
    });

    const client = { from };
    mockCreateServerClient.mockReturnValue(client);
    return client;
  }

  it('verifies webhook using raw request body text', async () => {
    createSupabaseMock();

    const rawBody = '{"id":"evt_data","type":"user.created"}';
    const request = new Request('http://localhost/api/webhooks/clerk', {
      method: 'POST',
      body: rawBody,
      headers: { 'content-type': 'application/json' },
    });

    mockVerify.mockReturnValue({
      type: 'user.created',
      data: {
        id: 'user_1',
        email_addresses: [{ id: 'email_1', email_address: 'a@b.com' }],
        primary_email_address_id: 'email_1',
        first_name: 'A',
        last_name: 'B',
        image_url: null,
      },
    });

    const { POST } = await import('./route');
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockVerify).toHaveBeenCalledWith(
      rawBody,
      expect.objectContaining({
        'svix-id': 'evt_123',
        'svix-signature': 'sig_123',
      })
    );
  });

  it('returns 200 for already-processed duplicate webhook event', async () => {
    const supabase = createSupabaseMock({ existingProcessed: true });

    const request = new Request('http://localhost/api/webhooks/clerk', {
      method: 'POST',
      body: '{"id":"evt_data","type":"user.created"}',
      headers: { 'content-type': 'application/json' },
    });

    mockVerify.mockReturnValue({
      type: 'user.created',
      data: {
        id: 'user_1',
        email_addresses: [{ id: 'email_1', email_address: 'a@b.com' }],
        primary_email_address_id: 'email_1',
        first_name: 'A',
        last_name: 'B',
        image_url: null,
      },
    });

    const { POST } = await import('./route');
    const response = await POST(request);

    expect(response.status).toBe(200);
    const usersCalls = supabase.from.mock.calls.filter(([table]) => table === 'users');
    expect(usersCalls.length).toBe(0);
  });
});
