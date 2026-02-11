/**
 * Cohort Mutations Module (COH-B3)
 * 
 * Server-side write operations for cohorts.
 * Uses Supabase client with RLS for automatic tenant isolation.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const createCohortSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'at-risk', 'completed']).default('active'),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  settings: z.record(z.unknown()).optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  { message: 'End date must be after start date', path: ['end_date'] }
);

export const updateCohortSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'at-risk', 'completed']).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  settings: z.record(z.unknown()).optional(),
});

export type CreateCohortInput = z.infer<typeof createCohortSchema>;
export type UpdateCohortInput = z.infer<typeof updateCohortSchema>;

// ============================================================================
// Mutations
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Create a new cohort
 */
export async function createCohort(
  organizationId: string,
  createdBy: string,
  input: CreateCohortInput
) {
  const validated = createCohortSchema.parse(input);
  const supabase = await createClient();

  const slug = slugify(validated.name) + '-' + Date.now().toString(36);

  const { data, error } = await supabase
    .from('cohorts')
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      slug,
      name: validated.name,
      description: validated.description || null,
      status: validated.status,
      start_date: validated.start_date || null,
      end_date: validated.end_date || null,
      settings: validated.settings || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating cohort:', error);
    throw new Error(`Failed to create cohort: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing cohort
 */
export async function updateCohort(cohortId: string, input: UpdateCohortInput) {
  const validated = updateCohortSchema.parse(input);
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    ...validated,
    updated_at: new Date().toISOString(),
  };

  // Update slug if name changed
  if (validated.name) {
    updateData.slug = slugify(validated.name) + '-' + Date.now().toString(36);
  }

  const { data, error } = await supabase
    .from('cohorts')
    .update(updateData)
    .eq('id', cohortId)
    .select()
    .single();

  if (error) {
    console.error('Error updating cohort:', error);
    throw new Error(`Failed to update cohort: ${error.message}`);
  }

  return data;
}

/**
 * Soft delete (archive) a cohort
 */
export async function deleteCohort(cohortId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cohorts')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', cohortId)
    .select()
    .single();

  if (error) {
    console.error('Error archiving cohort:', error);
    throw new Error(`Failed to archive cohort: ${error.message}`);
  }

  return data;
}

/**
 * Update cohort member count (increment/decrement)
 */
export async function updateCohortMemberCount(cohortId: string, delta: number) {
  const supabase = await createClient();

  // Get current count
  const { data: cohort } = await supabase
    .from('cohorts')
    .select('member_count')
    .eq('id', cohortId)
    .single();

  if (!cohort) throw new Error('Cohort not found');

  const newCount = Math.max(0, cohort.member_count + delta);

  const { data, error } = await supabase
    .from('cohorts')
    .update({ member_count: newCount, updated_at: new Date().toISOString() })
    .eq('id', cohortId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update member count: ${error.message}`);
  }

  return data;
}

/**
 * Update cohort engagement percentage
 */
export async function updateCohortEngagement(cohortId: string, engagementPercent: number) {
  const supabase = await createClient();

  const clamped = Math.min(100, Math.max(0, engagementPercent));

  const { data, error } = await supabase
    .from('cohorts')
    .update({
      engagement_percent: clamped,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cohortId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update engagement: ${error.message}`);
  }

  return data;
}
