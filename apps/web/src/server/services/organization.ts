/**
 * Organization Provisioning Service
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { generateSlug } from '@/lib/slug-utils';

export interface ClerkOrganizationPayload {
  id: string;
  name: string;
  slug?: string | null;
  imageUrl?: string | null;
}

export async function syncOrganizationFromClerk(
  supabase: SupabaseClient,
  payload: ClerkOrganizationPayload
) {
  const orgSlug = payload.slug || generateSlug(payload.name);

  const { data, error } = await supabase
    .from('organizations')
    .upsert(
      {
        clerk_org_id: payload.id,
        name: payload.name,
        slug: orgSlug,
        logo_url: payload.imageUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_org_id' }
    )
    .select('id, name')
    .single();

  if (error) throw error;
  return data;
}

export async function ensureDefaultSharedCohort(
  supabase: SupabaseClient,
  orgId: string,
  ownerUserId: string,
  orgName: string
) {
  const { data: existing } = await supabase
    .from('cohorts')
    .select('id')
    .eq('organization_id', orgId)
    .eq('type', 'shared')
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const cohortName = `${orgName} Cohort`;
  const cohortSlug = generateSlug(cohortName);

  const { data: cohort, error: cohortError } = await supabase
    .from('cohorts')
    .insert({
      organization_id: orgId,
      type: 'shared',
      name: cohortName,
      slug: cohortSlug,
      status: 'active',
      hosting: 'managed',
      runtime_status: 'provisioning',
      created_by: ownerUserId,
      settings: { default: true },
    })
    .select('id')
    .single();

  if (cohortError) throw cohortError;

  if (cohort?.id) {
    await supabase.from('cohort_user_members').insert({
      cohort_id: cohort.id,
      user_id: ownerUserId,
      role: 'owner',
    });
  }

  return cohort?.id ?? null;
}
