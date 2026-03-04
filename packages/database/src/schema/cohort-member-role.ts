import { pgEnum } from 'drizzle-orm/pg-core';

export const cohortMemberRoleEnum = pgEnum('cohort_member_role', [
  'owner',
  'admin',
  'member',
  'viewer',
]);
