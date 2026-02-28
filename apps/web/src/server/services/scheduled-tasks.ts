/**
 * Scheduled Tasks Service (Recurrence)
 */

import { db } from '@repo/database/client';
import { tasks } from '@repo/database/schema';
import { eq } from 'drizzle-orm';
import { BadRequestError } from '@/lib/errors';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'cron';

export type RecurrenceRule =
  | {
      frequency: 'daily';
      time: string; // HH:MM
      timezone?: string;
    }
  | {
      frequency: 'weekly';
      days: number[]; // 0-6 (Sun-Sat)
      time: string;
      timezone?: string;
    }
  | {
      frequency: 'monthly';
      day: number; // 1-31
      time: string;
      timezone?: string;
    }
  | {
      frequency: 'cron';
      cron: string; // standard 5-part cron
      timezone?: string;
    };

export interface RecurrenceInput {
  frequency: RecurrenceFrequency;
  time?: string;
  days?: number[];
  day?: number;
  cron?: string;
  timezone?: string;
}

function parseTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) throw new BadRequestError('Invalid time format (HH:MM)');

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

export function parseRecurrenceRule(input: RecurrenceInput): RecurrenceRule {
  if (input.frequency === 'daily') {
    if (!input.time) throw new BadRequestError('Daily recurrence requires time');
    parseTime(input.time);
    return { frequency: 'daily', time: input.time, timezone: input.timezone };
  }

  if (input.frequency === 'weekly') {
    if (!input.time) throw new BadRequestError('Weekly recurrence requires time');
    if (!input.days || input.days.length === 0) {
      throw new BadRequestError('Weekly recurrence requires days');
    }
    parseTime(input.time);
    return { frequency: 'weekly', time: input.time, days: input.days, timezone: input.timezone };
  }

  if (input.frequency === 'monthly') {
    if (!input.time) throw new BadRequestError('Monthly recurrence requires time');
    if (!input.day || input.day < 1 || input.day > 31) {
      throw new BadRequestError('Monthly recurrence requires a day between 1 and 31');
    }
    parseTime(input.time);
    return { frequency: 'monthly', time: input.time, day: input.day, timezone: input.timezone };
  }

  if (!input.cron) throw new BadRequestError('Cron recurrence requires cron expression');
  return { frequency: 'cron', cron: input.cron, timezone: input.timezone };
}

function nextDaily(time: string, from: Date) {
  const { hours, minutes } = parseTime(time);
  const next = new Date(from);
  next.setHours(hours, minutes, 0, 0);
  if (next <= from) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function nextWeekly(days: number[], time: string, from: Date) {
  const { hours, minutes } = parseTime(time);
  const sorted = [...new Set(days)].sort();
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + offset);
    if (sorted.includes(candidate.getDay())) {
      candidate.setHours(hours, minutes, 0, 0);
      if (candidate > from) return candidate;
    }
  }
  return nextDaily(time, from);
}

function nextMonthly(day: number, time: string, from: Date) {
  const { hours, minutes } = parseTime(time);
  const candidate = new Date(from);
  candidate.setDate(day);
  candidate.setHours(hours, minutes, 0, 0);

  if (candidate <= from) {
    candidate.setMonth(candidate.getMonth() + 1);
    candidate.setDate(day);
    candidate.setHours(hours, minutes, 0, 0);
  }

  return candidate;
}

function parseCronParts(cron: string) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new BadRequestError('Cron expression must have 5 parts');
  }
  return parts;
}

function cronMatches(value: number, part: string) {
  if (part === '*') return true;
  const num = Number(part);
  return Number.isInteger(num) && num === value;
}

function nextCron(cron: string, from: Date) {
  const [
    minPart = '*',
    hourPart = '*',
    domPart = '*',
    monthPart = '*',
    dowPart = '*',
  ] = parseCronParts(cron);
  const start = new Date(from.getTime() + 60000);

  for (let i = 0; i < 525600; i++) {
    const candidate = new Date(start.getTime() + i * 60000);

    if (!cronMatches(candidate.getMinutes(), minPart)) continue;
    if (!cronMatches(candidate.getHours(), hourPart)) continue;
    if (!cronMatches(candidate.getDate(), domPart)) continue;
    if (!cronMatches(candidate.getMonth() + 1, monthPart)) continue;
    if (!cronMatches(candidate.getDay(), dowPart)) continue;

    return candidate;
  }

  return null;
}

export function calculateNextOccurrence(rule: RecurrenceRule, from: Date = new Date()) {
  switch (rule.frequency) {
    case 'daily':
      return nextDaily(rule.time, from);
    case 'weekly':
      return nextWeekly(rule.days, rule.time, from);
    case 'monthly':
      return nextMonthly(rule.day, rule.time, from);
    case 'cron':
      return nextCron(rule.cron, from);
    default:
      return null;
  }
}

export async function setTaskRecurrence(taskId: string, rule: RecurrenceRule) {
  const nextOccurrenceAt = calculateNextOccurrence(rule);

  const [task] = await db
    .update(tasks)
    .set({
      isRecurring: true,
      recurrence: {
        ...rule,
        nextOccurrenceAt: nextOccurrenceAt?.toISOString() ?? null,
      },
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return task ?? null;
}

export async function generateNextOccurrence(taskId: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task || !task.isRecurring || !task.recurrence) return null;

  const rule = task.recurrence as RecurrenceRule;
  const nextOccurrenceAt = calculateNextOccurrence(rule, new Date());
  if (!nextOccurrenceAt) return null;

  const [nextTask] = await db
    .insert(tasks)
    .values({
      organizationId: task.organizationId,
      projectId: task.projectId,
      rhythmId: task.rhythmId,
      scopeType: task.scopeType,
      scopeId: task.scopeId,
      cohortId: task.cohortId,
      parentTaskId: task.id,
      milestoneId: task.milestoneId,
      assigneeType: task.assigneeType,
      assigneeId: task.assigneeId,
      createdByType: task.createdByType,
      createdById: task.createdById,
      title: task.title,
      description: task.description,
      status: 'todo',
      priority: task.priority,
      dueDate: nextOccurrenceAt,
      orderIndex: task.orderIndex,
      position: task.position,
      estimatedHours: task.estimatedHours,
      actualHours: null,
      tags: task.tags,
      metadata: {
        ...(task.metadata ?? {}),
        recurrenceParentId: task.id,
      },
    })
    .returning();

  await db
    .update(tasks)
    .set({
      recurrence: {
        ...rule,
        nextOccurrenceAt: calculateNextOccurrence(rule, nextOccurrenceAt)?.toISOString() ?? null,
      },
    })
    .where(eq(tasks.id, task.id));

  return nextTask ?? null;
}
