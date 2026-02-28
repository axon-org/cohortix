export const sharedCohort = {
  id: 'cohort-shared-1',
  name: 'Shared Cohort',
  type: 'shared' as const,
  organizationId: 'org-123',
  ownerUserId: null,
  status: 'active',
  hosting: 'managed',
  runtimeStatus: 'online',
};

export const personalCohort = {
  id: 'cohort-personal-1',
  name: "Alex's Cohort",
  type: 'personal' as const,
  organizationId: null,
  ownerUserId: 'user-123',
  status: 'active',
  hosting: 'self_hosted',
  runtimeStatus: 'offline',
};

export const cohortUserMembers = [
  { id: 'member-1', cohortId: sharedCohort.id, userId: 'user-123', role: 'owner' as const },
  { id: 'member-2', cohortId: sharedCohort.id, userId: 'user-456', role: 'member' as const },
];

export const cohortAgentMembers = [
  {
    id: 'agent-member-1',
    cohortId: sharedCohort.id,
    agentId: 'agent-123',
    role: 'member' as const,
  },
];

export const heartbeatPayload = {
  hardwareInfo: {
    cpu: 'Apple M2',
    memoryGb: 16,
    os: 'macOS',
  },
};
