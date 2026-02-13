/**
 * Centralized Auth Context Helper
 * Codex v1.2 - DRY Principle for Auth Logic
 * 
 * Replaces duplicated dev auth bypass logic across routes.
 */

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { UnauthorizedError, ForbiddenError } from './errors'

// Evaluated at call time, not module load time
function isBypassAuth() { return process.env.BYPASS_AUTH === 'true' }

export interface AuthContext {
  supabase: any
  organizationId: string
  userId: string
}

/**
 * Create a service-role Supabase client (bypasses RLS).
 * Used only when BYPASS_AUTH=true for local development.
 */
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

/**
 * Get authenticated context with organization membership
 * 
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {ForbiddenError} If user is not associated with any organization
 * @returns {AuthContext} Supabase client, organization ID, and user ID
 */
export async function getAuthContext(): Promise<AuthContext> {
  // DEV BYPASS: Use service role + first org found
  if (isBypassAuth()) {
    const supabase = createServiceClient()
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id, user_id')
      .limit(1)
      .single()

    return {
      supabase,
      organizationId: membership?.organization_id ?? 'dev-org',
      userId: membership?.user_id ?? 'dev-user',
    }
  }

  // PRODUCTION: Standard Supabase auth
  const supabase = await createClient()
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new UnauthorizedError('Authentication required')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (membershipError || !membership) {
    throw new ForbiddenError('User is not associated with any organization')
  }

  return {
    supabase,
    organizationId: membership.organization_id,
    userId: user.id,
  }
}

/**
 * Get authenticated context without organization requirement
 * 
 * Use for routes that don't require organization membership (e.g., user profile).
 * 
 * @throws {UnauthorizedError} If user is not authenticated
 * @returns Supabase client and user ID
 */
export async function getAuthContextBasic(): Promise<{
  supabase: any
  userId: string
}> {
  const supabase = await createClient()
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new UnauthorizedError('Authentication required')
  }

  return {
    supabase,
    userId: user.id,
  }
}
