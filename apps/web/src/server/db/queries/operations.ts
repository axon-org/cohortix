/**
 * Operations Data Queries  
 * Server-side data fetching for Operations (PPV: Mission → Operation → Task)
 * Operations are bounded initiatives stored in the 'projects' table
 */

import { getAuthContext } from '@/lib/auth-helper'

/**
 * Get all operations for the current organization
 * Operations are stored in the 'projects' table
 */
export async function getOperations() {
  const { supabase, organizationId } = await getAuthContext()

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
  const { supabase, organizationId } = await getAuthContext()

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
  const { supabase, organizationId } = await getAuthContext()

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
