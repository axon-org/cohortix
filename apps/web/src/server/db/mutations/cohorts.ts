/**
 * Cohort Mutations Module (COH-B3)
 *
 * Server-side write operations for cohorts.
 */

import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';

// ============================================================================
// Validation Schemas
// ============================================================================

export const createCohortSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().optional(),
    status: z.enum(['active', 'paused', 'at-risk', 'completed']).default('active'),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    settings: z.record(z.unknown()).optional(),
  })
  .refine(
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

/**
 * Create a new cohort
 */
export async function createCohort(
  organizationId: string,
  _createdBy: string,
  input: CreateCohortInput
) {
  const validated = createCohortSchema.parse(input);
  const { supabase } = await getAuthContext();

  const { data, error } = await supabase
    .from('cohorts')
    .insert({
      organization_id: organizationId,
      name: validated.name,
      description: validated.description || null,
      status: validated.status,
      start_date: validated.start_date || null,
      end_date: validated.end_date || null,
      metadata: validated.settings || {},
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
  const { supabase } = await getAuthContext();

  const updateData: Record<string, unknown> = {
    ...validated,
    updated_at: new Date().toISOString(),
  };

  if (validated.settings) {
    updateData.metadata = validated.settings;
    delete updateData.settings;
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
  const { supabase } = await getAuthContext();

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
 * Compute cohort member count
 */
export async function updateCohortMemberCount(cohortId: string, _delta: number) {
  const { supabase } = await getAuthContext();

  const { count, error } = await supabase
    .from('cohort_members')
    .select('*', { count: 'exact', head: true })
    .eq('cohort_id', cohortId);

  if (error) {
    throw new Error(`Failed to update member count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Compute cohort engagement percentage
 */
export async function updateCohortEngagement(cohortId: string, _engagementPercent: number) {
  const { supabase } = await getAuthContext();

  const { data, error } = await supabase
    .from('cohort_members')
    .select('engagement_score')
    .eq('cohort_id', cohortId);

  if (error) {
    throw new Error(`Failed to update engagement: ${error.message}`);
  }

  const scores = (data || []).map((m: any) => parseFloat(m.engagement_score) || 0);
  if (scores.length === 0) return 0;

  const avg = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
  return Math.round(avg * 100) / 100;
}
