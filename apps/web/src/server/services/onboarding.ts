/**
 * Onboarding Service - Clone Foundation Wizard
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import { validateData } from '@/lib/validation';
import { createCloneAgent, updateAgent } from '@/server/db/mutations/agents';
import { getPersonalCohortByOwner } from '@/server/db/queries/cohorts';

export type OnboardingStepNumber = 1 | 2 | 3 | 4 | 5;

export interface OnboardingState {
  status: 'not_started' | 'in_progress' | 'completed';
  currentStep: OnboardingStepNumber;
  completedSteps: OnboardingStepNumber[];
  startedAt?: string;
  completedAt?: string;
  cohortId?: string;
  cloneAgentId?: string;
  foundationData?: Record<string, unknown>;
  modelConfig?: {
    provider: 'openai' | 'anthropic' | 'google';
    model: string;
  };
  checkInTaskId?: string;
}

export interface OnboardingContext {
  supabase: SupabaseClient;
  userId: string;
  organizationId: string;
}

const foundationSchema = z.object({
  identity: z.string().min(1),
  values: z.string().min(1),
  decisionMaking: z.string().min(1),
  expertise: z.string().min(1),
  communication: z.string().min(1),
  aspirations: z.string().optional(),
});

const modelConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']),
  model: z.string().min(1),
});

const checkInSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
});

const defaultState: OnboardingState = {
  status: 'not_started',
  currentStep: 1,
  completedSteps: [],
};

async function getProfileSettings(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', userId)
    .single();

  if (error) {
    throw new BadRequestError(`Failed to load profile settings: ${error.message}`);
  }

  return (data?.settings ?? {}) as Record<string, unknown>;
}

async function updateProfileSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: Record<string, unknown>
) {
  const { error } = await supabase
    .from('profiles')
    .update({
      settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new BadRequestError(`Failed to update profile settings: ${error.message}`);
  }
}

function normalizeState(settings: Record<string, unknown>): OnboardingState {
  const onboarding = (settings.onboarding as OnboardingState | undefined) ?? defaultState;
  return {
    ...defaultState,
    ...onboarding,
    completedSteps: onboarding.completedSteps ?? [],
  };
}

function ensureStepNumber(stepNumber: number): asserts stepNumber is OnboardingStepNumber {
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 5) {
    throw new BadRequestError('Invalid onboarding step');
  }
}

function markStepComplete(state: OnboardingState, stepNumber: OnboardingStepNumber) {
  const completed = new Set(state.completedSteps);
  completed.add(stepNumber);
  const nextStep = (stepNumber < 5 ? stepNumber + 1 : 5) as OnboardingStepNumber;

  return {
    ...state,
    currentStep: nextStep,
    completedSteps: Array.from(completed) as OnboardingStepNumber[],
  };
}

export async function getOnboardingStatus(context: OnboardingContext) {
  const settings = await getProfileSettings(context.supabase, context.userId);
  return normalizeState(settings);
}

export async function startOnboarding(context: OnboardingContext) {
  const settings = await getProfileSettings(context.supabase, context.userId);
  const existing = normalizeState(settings);

  if (existing.status === 'completed') {
    return existing;
  }

  const state: OnboardingState = {
    ...existing,
    status: 'in_progress',
    currentStep: existing.currentStep ?? 1,
    startedAt: existing.startedAt ?? new Date().toISOString(),
  };

  await updateProfileSettings(context.supabase, context.userId, {
    ...settings,
    onboarding: state,
  });

  return state;
}

export async function processOnboardingStep(
  context: OnboardingContext,
  stepNumber: number,
  payload: unknown
) {
  ensureStepNumber(stepNumber);

  const settings = await getProfileSettings(context.supabase, context.userId);
  let state = normalizeState(settings);

  if (state.status === 'not_started') {
    state = {
      ...state,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    };
  }

  if (state.status === 'completed') {
    return state;
  }

  if (stepNumber > state.currentStep + 1) {
    throw new BadRequestError('Cannot skip onboarding steps');
  }

  switch (stepNumber) {
    case 1: {
      const personalCohort = await getPersonalCohortByOwner(context.userId);
      if (!personalCohort) {
        throw new NotFoundError('Personal cohort');
      }

      const cloneAgentId = state.cloneAgentId
        ? state.cloneAgentId
        : (await createCloneAgent(context.userId, personalCohort.id, {}))?.id;

      if (!cloneAgentId) {
        throw new BadRequestError('Failed to create Clone agent');
      }

      state = markStepComplete(
        {
          ...state,
          cohortId: personalCohort.id,
          cloneAgentId,
        },
        1
      );
      break;
    }
    case 2: {
      const data = validateData(foundationSchema, payload);
      if (!state.cloneAgentId) {
        throw new BadRequestError('Clone agent not initialized');
      }

      await updateAgent(state.cloneAgentId, {
        settings: {
          cloneFoundation: data,
        },
      });

      state = markStepComplete(
        {
          ...state,
          foundationData: data,
        },
        2
      );
      break;
    }
    case 3: {
      const data = validateData(modelConfigSchema, payload);
      if (!state.cloneAgentId) {
        throw new BadRequestError('Clone agent not initialized');
      }

      await updateAgent(state.cloneAgentId, {
        settings: {
          cloneFoundation: state.foundationData ?? {},
          modelPreference: data,
        },
      });

      state = markStepComplete(
        {
          ...state,
          modelConfig: data,
        },
        3
      );
      break;
    }
    case 4: {
      const data = validateData(checkInSchema, payload ?? {});

      if (!state.cloneAgentId || !state.cohortId) {
        throw new BadRequestError('Clone agent not initialized');
      }

      const { data: task, error: taskError } = await context.supabase
        .from('tasks')
        .insert({
          organization_id: context.organizationId,
          scope_type: 'personal',
          scope_id: context.userId,
          cohort_id: state.cohortId,
          assignee_type: 'agent',
          assignee_id: state.cloneAgentId,
          created_by_type: 'user',
          created_by_id: context.userId,
          title: 'Clone Check-in',
          description: 'Daily check-in with your Clone foundation.',
          status: 'todo',
          priority: 'medium',
          is_recurring: true,
          recurrence: {
            frequency: 'daily',
            time: data.time ?? '09:00',
            timezone: data.timezone ?? 'local',
          },
          metadata: {
            source: 'onboarding',
          },
        })
        .select('id')
        .single();

      if (taskError) {
        throw new BadRequestError(`Failed to create check-in task: ${taskError.message}`);
      }

      state = markStepComplete(
        {
          ...state,
          checkInTaskId: task?.id,
        },
        4
      );
      break;
    }
    case 5: {
      state = {
        ...state,
        status: 'completed',
        completedAt: new Date().toISOString(),
        currentStep: 5,
        completedSteps: [1, 2, 3, 4, 5],
      };
      break;
    }
    default:
      break;
  }

  await updateProfileSettings(context.supabase, context.userId, {
    ...settings,
    onboarding: state,
  });

  return state;
}
