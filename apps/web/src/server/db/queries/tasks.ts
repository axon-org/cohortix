import { getAuthContext } from '@/lib/auth-helper';

export async function getTasks() {
  const { supabase, organizationId } = await getAuthContext();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data || [];
}
