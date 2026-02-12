// Cohortix Sprint 2: Cohorts Mutations Module (COH-B3)
// Author: John (Backend) - Task brief: /tmp/john-sprint2-backend.md
// Date: 2026-02-12

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Schema for creating a new cohort (without org_id and created_by, those are injected)
 */
export const createCohortSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'at-risk', 'completed']).default('active'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

/**
 * Schema for updating an existing cohort
 */
export const updateCohortSchema = createCohortSchema.partial();

/**
 * Create a new cohort
 */
export async function createCohort(
  organizationId: string,
  createdBy: string, // Reserved for future use when schema adds created_by field
  data: z.infer<typeof createCohortSchema>
) {
  const validated = createCohortSchema.parse(data);
  const supabase = createClient();

  const { data: cohort, error } = await supabase
    .from('cohorts')
    .insert({
      organization_id: organizationId,
      // created_by: createdBy, // TODO: Add to schema
      ...validated,
    })
    .select()
    .single();

  if (error) {
    console.error('createCohort error:', error);
    throw error;
  }

  return cohort;
}

/**
 * Update an existing cohort
 */
export async function updateCohort(id: string, data: z.infer<typeof updateCohortSchema>) {
  const validated = updateCohortSchema.parse(data);
  const supabase = createClient();

  const { data: cohort, error } = await supabase
    .from('cohorts')
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateCohort error:', error);
    throw error;
  }

  return cohort;
}

/**
 * Soft delete a cohort by setting status to archived
 * (Hard delete: use .delete() instead)
 */
export async function deleteCohort(id: string, hardDelete = false) {
  const supabase = createClient();

  if (hardDelete) {
    const { error } = await supabase.from('cohorts').delete().eq('id', id);

    if (error) {
      console.error('deleteCohort (hard) error:', error);
      throw error;
    }

    return { success: true };
  }

  // Soft delete
  const { data, error } = await supabase
    .from('cohorts')
    .update({ status: 'archived' as const, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('deleteCohort (soft) error:', error);
    throw error;
  }

  return data;
}

/**
 * Add a member to a cohort
 */
export async function addCohortMember(cohortId: string, userId?: string, allyId?: string) {
  if (!userId && !allyId) {
    throw new Error('Either userId or allyId must be provided');
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('cohort_members')
    .insert({
      cohort_id: cohortId,
      user_id: userId || null,
      ally_id: allyId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('addCohortMember error:', error);
    throw error;
  }

  return data;
}

/**
 * Remove a member from a cohort
 */
export async function removeCohortMember(cohortId: string, memberId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('cohort_members')
    .delete()
    .eq('id', memberId)
    .eq('cohort_id', cohortId);

  if (error) {
    console.error('removeCohortMember error:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Update a member's engagement score
 */
export async function updateMemberEngagement(cohortId: string, memberId: string, score: number) {
  if (score < 0 || score > 100) {
    throw new Error('Engagement score must be between 0 and 100');
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('cohort_members')
    .update({
      engagement_score: score,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .eq('cohort_id', cohortId)
    .select()
    .single();

  if (error) {
    console.error('updateMemberEngagement error:', error);
    throw error;
  }

  return data;
}
