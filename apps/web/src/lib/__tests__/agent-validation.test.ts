import { describe, it, expect } from 'vitest';
import { agentScopeTypeEnum, createAgentSchema } from '../validations/agents';

describe('Agent Validation Schemas', () => {
  it('accepts valid scope types', () => {
    expect(() => agentScopeTypeEnum.parse('personal')).not.toThrow();
    expect(() => agentScopeTypeEnum.parse('cohort')).not.toThrow();
    expect(() => agentScopeTypeEnum.parse('org')).not.toThrow();
  });

  it('rejects invalid scope types', () => {
    expect(() => agentScopeTypeEnum.parse('team')).toThrow();
    expect(() => agentScopeTypeEnum.parse('')).toThrow();
  });

  it('requires scopeId for agent creation', () => {
    const result = createAgentSchema.safeParse({
      name: 'Agent',
      scopeType: 'personal',
    });

    expect(result.success).toBe(false);
  });
});
