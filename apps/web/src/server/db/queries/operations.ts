/**
 * Operations Data Queries  
 * Server-side data fetching for Operations (PPV: Mission → Operation → Task)
 * Operations are bounded initiatives stored in the 'projects' table
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Create Supabase client with service role for server-side queries
 */
async function createServerClient() {
  // Production: Import SSR client
  const { createServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

/**
 * Get organization ID for current user
 */
async function getOrganizationId() {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  
  return membership?.organization_id || null
}

/**
 * Get all operations for the current organization
 * Operations are stored in the 'projects' table
 */
export async function getOperations() {
  const supabase = await createServerClient()
  const organizationId = await getOrganizationId()

  if (!organizationId) {
    return []
  }

  const { data: operations, error } = await supabase
    .from('projects')
    .select(`
      *,
      tasks(
        id,
        status
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching operations:', error)
    return []
  }

  // Transform to include task counts
  return operations?.map((op: any) => ({
    ...op,
    taskStats: {
      total: op.tasks?.length || 0,
      completed: op.tasks?.filter((t: any) => t.status === 'done').length || 0,
      inProgress: op.tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
    }
  })) || []
}

/**
 * Get single operation by ID
 */
export async function getOperation(id: string) {
  const supabase = await createServerClient()
  const organizationId = await getOrganizationId()

  if (!organizationId) {
    return null
  }

  const { data: operation, error } = await supabase
    .from('projects')
    .select(`
      *,
      tasks(
        id,
        title,
        description,
        status,
        priority,
        order_index
      )
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    console.error('Error fetching operation:', error)
    return null
  }

  return operation
}

/**
 * Get operations by status
 */
export async function getOperationsByStatus(status: string) {
  const supabase = await createServerClient()
  const organizationId = await getOrganizationId()

  if (!organizationId) {
    return []
  }

  const { data: operations, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching operations by status:', error)
    return []
  }

  return operations || []
}
