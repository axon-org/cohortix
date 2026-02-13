/**
 * Centralized Auth Context Helper
 * Codex v1.2 - DRY Principle for Auth Logic
 * 
 * Replaces duplicated dev auth bypass logic across routes.
 */

import { createClient } from '@/lib/supabase/server'
import { UnauthorizedError, ForbiddenError } from './errors'

export interface AuthContext {
  supabase: any
  organizationId: string
  userId: string
}

/**
 * Get authenticated context with organization membership
 * 
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {ForbiddenError} If user is not associated with any organization
 * @returns {AuthContext} Supabase client, organization ID, and user ID
 */
export async function getAuthContext(): Promise<AuthContext> {
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
