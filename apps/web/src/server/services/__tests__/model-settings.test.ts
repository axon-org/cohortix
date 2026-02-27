import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/db/queries/cohorts', () => ({
  getCohortById: vi.fn().mockResolvedValue({
    id: 'cohort-1',
    settings: { models: { providers: {} } },
  }),
}));

vi.mock('@/server/db/mutations/cohorts', () => ({
  updateCohort: vi.fn().mockResolvedValue({
    id: 'cohort-1',
    settings: { models: { providers: { openai: { apiKeyEncrypted: 'secret' } } } },
  }),
}));

import { validateApiKey, updateCohortModelSettings } from '../model-settings';

describe('model settings service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MODEL_ENCRYPTION_KEY = 'test-key';
  });

  it('validateApiKey throws on invalid key', () => {
    expect(() => validateApiKey('openai', 'invalid')).toThrow();
  });

  it('updateCohortModelSettings returns redacted settings', async () => {
    const result = await updateCohortModelSettings('cohort-1', {
      providers: {
        openai: { apiKey: 'sk-test-12345678901234567890' },
      },
    });

    expect(result.providers?.openai?.apiKeyEncrypted).toBe('redacted');
  });
});
