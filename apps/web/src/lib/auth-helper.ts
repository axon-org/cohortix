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
  isDevBypass: boolean
}

/**
 * Get authenticated context with organization membership
 * 
 * Handles both production auth (Supabase) and development auth bypass.
 * 
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {ForbiddenError} If user is not associated with any organization
 * @returns {AuthContext} Supabase client, organization ID, and user ID
 */
export async function getAuthContext(): Promise<AuthContext> {
  // DEV MODE: Bypass auth for testing
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Use first available organization for testing
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single()
    
    return {
      supabase,
      organizationId: org?.id || '',
      userId: 'dev-bypass',
      isDevBypass: true,
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
    isDevBypass: false,
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
