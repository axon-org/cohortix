/**
 * Clerk Webhook Handler
 * Syncs Clerk user events to Supabase database
 *
 * Events handled:
 * - user.created: Create user profile in Supabase
 * - user.updated: Update user profile in Supabase
 * - user.deleted: Soft delete or mark user as inactive
 * - organization.created: Sync organization to Supabase
 * - organizationMembership.created: Add user to organization
 */

import { createHash } from 'node:crypto';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { WebhookEvent } from '@clerk/nextjs/server';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

type EventStatus = 'processing' | 'processed' | 'failed';

type WebhookEventRecord = {
  event_id: string;
  event_type: string;
  status: EventStatus;
  attempts: number;
  processed_at: string | null;
};

/**
 * Create Supabase service client (bypasses RLS for admin operations)
 */
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

async function getEventRecord(supabase: ReturnType<typeof createServiceClient>, eventId: string) {
  const { data, error } = await supabase
    .from('webhook_events')
    .select('event_id, event_type, status, attempts, processed_at')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) throw error;
  return data as WebhookEventRecord | null;
}

async function acquireEventLock(
  supabase: ReturnType<typeof createServiceClient>,
  eventId: string,
  eventType: string,
  payload: string
) {
  const now = new Date().toISOString();
  const payloadHash = createHash('sha256').update(payload).digest('hex');

  const { error } = await supabase.from('webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    status: 'processing',
    attempts: 1,
    payload_hash: payloadHash,
    received_at: now,
    updated_at: now,
  });

  if (!error) {
    return { duplicateProcessed: false };
  }

  if (error.code !== '23505') {
    throw error;
  }

  const existing = await getEventRecord(supabase, eventId);

  if (!existing) {
    throw error;
  }

  if (existing.status === 'processed') {
    return { duplicateProcessed: true };
  }

  const { error: updateError } = await supabase
    .from('webhook_events')
    .update({
      status: 'processing',
      attempts: (existing.attempts || 0) + 1,
      updated_at: now,
      error_message: null,
    })
    .eq('event_id', eventId);

  if (updateError) throw updateError;

  return { duplicateProcessed: false };
}

async function markEventStatus(
  supabase: ReturnType<typeof createServiceClient>,
  eventId: string,
  status: EventStatus,
  errorMessage?: string
) {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status,
    updated_at: now,
    error_message: errorMessage || null,
  };

  if (status === 'processed') {
    payload.processed_at = now;
  }

  const { error } = await supabase.from('webhook_events').update(payload).eq('event_id', eventId);
  if (error) throw error;
}

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Missing svix headers', { status: 400 });
  }

  // IMPORTANT: Signature must be verified against the raw request body bytes/text.
  const rawBody = await req.text();

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(rawBody, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const supabase = createServiceClient();
  const eventType = evt.type;
  const eventId = evt.data?.id && typeof evt.data.id === 'string' ? `${eventType}:${evt.data.id}` : svix_id;

  try {
    const lock = await acquireEventLock(supabase, eventId, eventType, rawBody);
    if (lock.duplicateProcessed) {
      return new NextResponse('Duplicate event ignored', { status: 200 });
    }

    switch (eventType) {
      case 'user.created':
      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id);

        const { error } = await supabase.from('users').upsert(
          {
            clerk_user_id: id,
            email: primaryEmail?.email_address || '',
            first_name: first_name || null,
            last_name: last_name || null,
            avatar_url: image_url || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'clerk_user_id' }
        );

        if (error) throw error;
        break;
      }

      case 'user.deleted': {
        const { id } = evt.data;

        const { error } = await supabase
          .from('users')
          .update({ deleted_at: new Date().toISOString() })
          .eq('clerk_user_id', id);

        if (error) throw error;
        break;
      }

      case 'organization.created': {
        const { id, name, slug, image_url } = evt.data;

        const { error } = await supabase.from('organizations').upsert(
          {
            clerk_org_id: id,
            name,
            slug: slug || null,
            logo_url: image_url || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'clerk_org_id' }
        );

        if (error) throw error;
        break;
      }

      case 'organizationMembership.created': {
        const { organization, public_user_data } = evt.data;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', public_user_data.user_id)
          .single();

        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('clerk_org_id', organization.id)
          .single();

        if (!user || !org) {
          throw new Error('User or organization not found in Supabase');
        }

        const { error } = await supabase.from('organization_memberships').upsert(
          {
            user_id: user.id,
            organization_id: org.id,
            role: evt.data.role === 'org:admin' ? 'admin' : 'member',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,organization_id' }
        );

        if (error) throw error;
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    await markEventStatus(supabase, eventId, 'processed');
    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);

    try {
      await markEventStatus(
        supabase,
        eventId,
        'failed',
        error instanceof Error ? error.message : 'Unknown webhook processing error'
      );
    } catch (markError) {
      console.error('Failed to persist webhook failure state:', markError);
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
}
