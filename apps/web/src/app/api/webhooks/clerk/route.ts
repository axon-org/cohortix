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

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { WebhookEvent } from '@clerk/nextjs/server';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

if (!webhookSecret) {
  throw new Error('CLERK_WEBHOOK_SECRET is not set');
}

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

export async function POST(req: Request) {
  // Get webhook headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Missing svix headers', { status: 400 });
  }

  // Get webhook body
  const payload = await req.json();
  const body = JSON.stringify(payload) as string;

  // Verify webhook signature
  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id!,
      'svix-timestamp': svix_timestamp!,
      'svix-signature': svix_signature!,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const supabase = createServiceClient();
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id);

        // Create user profile in Supabase
        const { error } = await supabase.from('users').insert({
          clerk_user_id: id,
          email: primaryEmail?.email_address || '',
          first_name: first_name || null,
          last_name: last_name || null,
          avatar_url: image_url || null,
        });

        if (error) {
          console.error('Failed to create user in Supabase:', error);
          throw error;
        }

        console.log(`User created: ${id}`);
        break;
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id);

        // Update user profile in Supabase
        const { error } = await supabase
          .from('users')
          .update({
            email: primaryEmail?.email_address || '',
            first_name: first_name || null,
            last_name: last_name || null,
            avatar_url: image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', id);

        if (error) {
          console.error('Failed to update user in Supabase:', error);
          throw error;
        }

        console.log(`User updated: ${id}`);
        break;
      }

      case 'user.deleted': {
        const { id } = evt.data;

        // Soft delete user (mark as deleted but keep data for audit)
        const { error } = await supabase
          .from('users')
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', id);

        if (error) {
          console.error('Failed to delete user in Supabase:', error);
          throw error;
        }

        console.log(`User deleted: ${id}`);
        break;
      }

      case 'organization.created': {
        const { id, name, slug, image_url } = evt.data;

        // Create organization in Supabase
        const { error } = await supabase.from('organizations').insert({
          clerk_org_id: id,
          name: name,
          slug: slug || null,
          logo_url: image_url || null,
        });

        if (error) {
          console.error('Failed to create organization in Supabase:', error);
          throw error;
        }

        console.log(`Organization created: ${id}`);
        break;
      }

      case 'organizationMembership.created': {
        const { organization, public_user_data } = evt.data;

        // Get internal IDs
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

        // Create organization membership
        const { error } = await supabase.from('organization_memberships').insert({
          user_id: user.id,
          organization_id: org.id,
          role: evt.data.role === 'org:admin' ? 'admin' : 'member',
        });

        if (error) {
          console.error('Failed to create organization membership in Supabase:', error);
          throw error;
        }

        console.log(`User ${public_user_data.user_id} added to organization ${organization.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
