/**
 * Centralized Auth Context Helper
 * Codex v1.2 - DRY Principle for Auth Logic
 *
 * Migrated to Clerk for authentication, Supabase for database operations.
 */

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { UnauthorizedError, ForbiddenError } from './errors';
import { generateOrgSlug } from './utils';

// Evaluated at call time, not module load time
function isBypassAuth() {
  return process.env.BYPASS_AUTH === 'true';
}

export interface AuthContext {
  supabase: any;
  organizationId: string;
  userId: string;
  clerkUserId?: string;
}

/**
 * Create a service-role Supabase client (bypasses RLS).
 * Used for authenticated operations that need admin access.
 */
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

/**
 * Resolve or auto-provision user from Clerk
 * @param supabase Service client
 * @param clerkUserId Clerk user ID
 * @returns User with internal ID
 */
async function resolveOrProvisionUser(
  supabase: ReturnType<typeof createServiceClient>,
  clerkUserId: string
): Promise<{ id: string }> {
  // Get internal user ID from Clerk user ID
  let { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  // Auto-provision: user authenticated in Clerk but not yet in DB
  if (userError || !user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const { data: newUser, error: insertError } = await supabase
        .from('profiles')
        .insert({
          clerk_user_id: clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          first_name: clerkUser.firstName || null,
          last_name: clerkUser.lastName || null,
          avatar_url: clerkUser.imageUrl || null,
        })
        .select('id')
        .single();

      if (insertError || !newUser) {
        console.error('Failed to provision user:', insertError);
        throw new UnauthorizedError('Failed to provision user');
      }
      user = newUser;
    } else {
      throw new UnauthorizedError('User not found');
    }
  }

  return user;
}

/**
 * Get authenticated context with organization membership
 *
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {ForbiddenError} If user is not associated with any organization
 * @returns {AuthContext} Supabase client, organization ID, user ID, and Clerk user ID
 */
export async function getAuthContext(): Promise<AuthContext> {
  // DEV BYPASS: Use service role + first org found
  if (isBypassAuth()) {
    const supabase = createServiceClient();
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id, user_id')
      .limit(1)
      .single();

    return {
      supabase,
      organizationId: membership?.organization_id ?? 'dev-org',
      userId: membership?.user_id ?? 'dev-user',
      clerkUserId: 'dev-clerk-user',
    };
  }

  // PRODUCTION: Clerk auth + Supabase service client
  const { userId: clerkUserId, orgId } = await auth();

  if (!clerkUserId) {
    throw new UnauthorizedError('Authentication required');
  }

  const supabase = createServiceClient();

  // Get or provision user
  const user = await resolveOrProvisionUser(supabase, clerkUserId);

  // If Clerk has an active organization, use it
  if (orgId) {
    let { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', orgId)
      .single();

    // Auto-provision: org exists in Clerk but not yet in DB
    if (orgError || !org) {
      try {
        // Fetch organization details from Clerk
        const client = await clerkClient();
        const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });
        const orgMembership = await client.organizations.getOrganizationMembershipList({
          organizationId: orgId,
        });
        const userMembership = orgMembership.data.find(
          (m) => m.publicUserData?.userId === clerkUserId
        );

        if (clerkOrg && userMembership) {
          const slug = clerkOrg.slug || generateOrgSlug(clerkOrg.name, orgId);

          const { data: newOrg, error: insertOrgError } = await supabase
            .from('organizations')
            .insert({
              clerk_org_id: orgId,
              name: clerkOrg.name,
              slug,
              logo_url: clerkOrg.imageUrl || null,
            })
            .select('id')
            .single();

          if (insertOrgError || !newOrg) {
            console.error('Failed to provision organization:', insertOrgError);
            throw new ForbiddenError('Failed to provision organization');
          }
          org = newOrg;

          // Create organization membership
          const role = userMembership.role === 'org:admin' ? 'admin' : 'member';
          await supabase.from('organization_memberships').insert({
            user_id: user.id,
            organization_id: org.id,
            role,
          });
        } else {
          throw new ForbiddenError('Organization not found in Clerk');
        }
      } catch (error) {
        // Re-throw ForbiddenError instances to preserve specific error messages
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Failed to fetch organization from Clerk:', error);
        throw new ForbiddenError('Organization not found in database');
      }
    }

    return {
      supabase,
      organizationId: org.id,
      userId: user.id,
      clerkUserId,
    };
  }

  // If no active organization in Clerk, get from membership
  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    throw new ForbiddenError('User is not associated with any organization');
  }

  return {
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
    clerkUserId,
  };
}

/**
 * Get authenticated context without organization requirement
 *
 * Use for routes that don't require organization membership (e.g., user profile).
 *
 * @throws {UnauthorizedError} If user is not authenticated
 * @returns Supabase client, user ID, and Clerk user ID
 */
export async function getAuthContextBasic(): Promise<{
  supabase: any;
  userId: string;
  clerkUserId: string;
}> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new UnauthorizedError('Authentication required');
  }

  const supabase = createServiceClient();

  // Get or provision user
  const user = await resolveOrProvisionUser(supabase, clerkUserId);

  return {
    supabase,
    userId: user.id,
    clerkUserId,
  };
}
