import { pgTable, uuid, text, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { agents } from './agents';
import { cohorts } from './cohorts';
import { scopeTypeEnum } from './scope-types';

export const agentEvolutionEventTypeEnum = pgEnum('agent_evolution_event_type', [
  'learning',
  'correction',
  'milestone',
]);

export const agentEvolutionEvents = pgTable(
  'agent_evolution_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    cohortId: uuid('cohort_id').references(() => cohorts.id, { onDelete: 'set null' }),
    scopeType: scopeTypeEnum('scope_type').default('personal').notNull(),
    scopeId: uuid('scope_id').notNull(),
    eventType: agentEvolutionEventTypeEnum('event_type').notNull(),
    summary: text('summary').notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    agentCreatedIdx: index('idx_agent_evolution_agent_created').on(table.agentId, table.createdAt),
    eventTypeIdx: index('idx_agent_evolution_event_type').on(table.eventType),
  })
);

export type AgentEvolutionEvent = typeof agentEvolutionEvents.$inferSelect;
export type InsertAgentEvolutionEvent = typeof agentEvolutionEvents.$inferInsert;
