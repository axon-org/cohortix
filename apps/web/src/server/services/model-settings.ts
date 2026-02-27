/**
 * Model Settings Service (BYOK)
 */

import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import { getCohortById } from '@/server/db/queries/cohorts';
import { updateCohort } from '@/server/db/mutations/cohorts';

export type ModelProvider = 'openai' | 'anthropic' | 'google';

export interface ProviderSettingsInput {
  apiKey?: string;
  allowedModels?: string[];
}

export interface UpdateModelSettingsInput {
  providers: Partial<Record<ModelProvider, ProviderSettingsInput>>;
  defaultProvider?: ModelProvider;
}

interface StoredProviderSettings {
  apiKeyEncrypted?: string;
  allowedModels?: string[];
  updatedAt?: string;
}

interface StoredModelSettings {
  providers: Partial<Record<ModelProvider, StoredProviderSettings>>;
  defaultProvider?: ModelProvider;
}

const providerKeyPatterns: Record<ModelProvider, RegExp> = {
  openai: /^sk-[A-Za-z0-9-_]{20,}$/,
  anthropic: /^sk-ant-[A-Za-z0-9-_]{20,}$/,
  google: /^AIza[0-9A-Za-z-_]{20,}$/,
};

function getEncryptionKey() {
  const rawKey = process.env.MODEL_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new BadRequestError('MODEL_ENCRYPTION_KEY is not configured');
  }

  return createHash('sha256').update(rawKey).digest();
}

function encryptApiKey(value: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function validateApiKey(provider: ModelProvider, apiKey: string) {
  const pattern = providerKeyPatterns[provider];
  if (!pattern.test(apiKey)) {
    throw new BadRequestError(`Invalid ${provider} API key format`);
  }
}

function sanitizeSettings(settings: StoredModelSettings | null) {
  if (!settings) return { providers: {} } as StoredModelSettings;

  const providers: StoredModelSettings['providers'] = {};

  (['openai', 'anthropic', 'google'] as ModelProvider[]).forEach((provider) => {
    const entry = settings.providers?.[provider];
    if (!entry) return;
    providers[provider] = {
      allowedModels: entry.allowedModels ?? [],
      updatedAt: entry.updatedAt,
      apiKeyEncrypted: entry.apiKeyEncrypted ? 'redacted' : undefined,
    };
  });

  return {
    defaultProvider: settings.defaultProvider,
    providers,
  } as StoredModelSettings;
}

export async function getCohortModelSettings(cohortId: string) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) throw new NotFoundError('Cohort', cohortId);

  const settings = (cohort.settings ?? {}) as Record<string, unknown>;
  const models = (settings.models ?? { providers: {} }) as StoredModelSettings;

  return sanitizeSettings(models);
}

export async function updateCohortModelSettings(
  cohortId: string,
  input: UpdateModelSettingsInput
) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) throw new NotFoundError('Cohort', cohortId);

  const existingSettings = (cohort.settings ?? {}) as Record<string, unknown>;
  const existingModels = (existingSettings.models ?? { providers: {} }) as StoredModelSettings;

  const providers: StoredModelSettings['providers'] = {
    ...existingModels.providers,
  };

  (Object.entries(input.providers) as Array<[ModelProvider, ProviderSettingsInput]>).forEach(
    ([provider, config]) => {
      const current = providers[provider] ?? {};
      const next: StoredProviderSettings = {
        ...current,
        allowedModels: config.allowedModels ?? current.allowedModels,
        updatedAt: new Date().toISOString(),
      };

      if (config.apiKey) {
        validateApiKey(provider, config.apiKey);
        next.apiKeyEncrypted = encryptApiKey(config.apiKey);
      }

      providers[provider] = next;
    }
  );

  const models: StoredModelSettings = {
    providers,
    defaultProvider: input.defaultProvider ?? existingModels.defaultProvider,
  };

  const updated = await updateCohort(cohortId, {
    settings: {
      ...existingSettings,
      models,
    },
  });

  const updatedSettings = (updated?.settings ?? {}) as Record<string, unknown>;
  return sanitizeSettings((updatedSettings.models ?? models) as StoredModelSettings);
}
