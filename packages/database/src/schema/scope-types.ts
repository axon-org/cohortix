import { pgEnum } from 'drizzle-orm/pg-core';

export const scopeTypeEnum = pgEnum('scope_type', ['personal', 'cohort', 'org']);
