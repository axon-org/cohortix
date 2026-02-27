/**
 * Cohort Queries Module (COH-B2)
 *
 * Server-side data fetching for cohorts using Drizzle ORM.
 */

import { db } from '@repo/database/client';
import {
  activityLog,
  agents,
  cohortAgentMembers,
  cohortUserMembers,
  cohorts,
  profiles,
} from '@repo/database/schema';
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or } from 'drizzle-orm';
import { getAuthContext } from '@/lib/auth-helper';

export type CohortStatus = 'active' | 'paused' | 'at-risk' | 'completed';
export type CohortType = 'personal' | 'shared';
export type CohortHosting = 'managed' | 'self_hosted';
export type CohortRuntimeStatus = 'provisioning' | 'online' | 'offline' | 'error' | 'paused';

export interface CohortFilters {
  type?: CohortType;
  status?: CohortStatus;
  hosting?: CohortHosting;
  runtimeStatus?: CohortRuntimeStatus;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: 'name' | 'created_at' | 'member_count' | 'engagement_percent' | 'start_date';
  sortOrder?: 'asc' | 'desc';
}

export interface CohortPagination {
  page?: number;
  pageSize?: number;
}

type CohortMemberStat = {
  memberCount: number;
  engagementPercent: number;
};

type MemberStatsMap = Record<string, CohortMemberStat>;

function normalizeGetCohortsArgs(
  organizationId?: string,
  userIdOrFilters?: string | CohortFilters,
  filtersOrPagination?: CohortFilters | CohortPagination,
  pagination?: CohortPagination
) {
  if (typeof userIdOrFilters === 'object' && userIdOrFilters !== null) {
    return {
      organizationId,
      userId: undefined,
      filters: userIdOrFilters as CohortFilters,
      pagination: (filtersOrPagination as CohortPagination) || {},
    };
  }

  return {
    organizationId,
    userId: userIdOrFilters as string | undefined,
    filters: (filtersOrPagination as CohortFilters) || {},
    pagination: pagination || {},
  };
}

async function getMemberStats(cohortIds: string[]): Promise<MemberStatsMap> {
  if (cohortIds.length === 0) return {};

  const [userCounts, agentRows] = await Promise.all([
    db
      .select({
        cohortId: cohortUserMembers.cohortId,
        count: count(),
      })
      .from(cohortUserMembers)
      .where(inArray(cohortUserMembers.cohortId, cohortIds))
      .groupBy(cohortUserMembers.cohortId),
    db
      .select({
        cohortId: cohortAgentMembers.cohortId,
        engagementScore: cohortAgentMembers.engagementScore,
      })
      .from(cohortAgentMembers)
      .where(inArray(cohortAgentMembers.cohortId, cohortIds)),
  ]);

  const stats: MemberStatsMap = {};

  userCounts.forEach((row) => {
    stats[row.cohortId] = {
      memberCount: Number(row.count || 0),
      engagementPercent: 0,
    };
  });

  const engagementAccumulator: Record<string, { total: number; count: number }> = {};
  agentRows.forEach((row) => {
    if (!engagementAccumulator[row.cohortId]) {
      engagementAccumulator[row.cohortId] = { total: 0, count: 0 };
    }
    engagementAccumulator[row.cohortId]!.total += Number(row.engagementScore || 0);
    engagementAccumulator[row.cohortId]!.count += 1;
  });

  Object.entries(engagementAccumulator).forEach(([cohortId, value]) => {
    const base = stats[cohortId] ?? { memberCount: 0, engagementPercent: 0 };
    const avg = value.count > 0 ? value.total / value.count : 0;
    stats[cohortId] = {
      memberCount: base.memberCount + value.count,
      engagementPercent: Math.round(avg * 100) / 100,
    };
  });

  return stats;
}

function buildAccessPredicate(organizationId?: string, userId?: string, type?: CohortType) {
  if (type === 'personal') {
    return userId ? eq(cohorts.ownerUserId, userId) : undefined;
  }

  if (type === 'shared') {
    return organizationId ? eq(cohorts.organizationId, organizationId) : undefined;
  }

  if (organizationId && userId) {
    return or(
      eq(cohorts.organizationId, organizationId),
      eq(cohorts.ownerUserId, userId)
    );
  }

  if (organizationId) return eq(cohorts.organizationId, organizationId);
  if (userId) return eq(cohorts.ownerUserId, userId);

  return undefined;
}

/**
 * List cohorts with pagination, filtering, and sorting
 */
export async function getCohorts(
  organizationId: string,
  filters?: CohortFilters,
  pagination?: CohortPagination
): Promise<{
  cohorts: Array<Record<string, unknown>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>;
export async function getCohorts(
  organizationId?: string,
  userId?: string,
  filters?: CohortFilters,
  pagination?: CohortPagination
): Promise<{
  cohorts: Array<Record<string, unknown>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>;
export async function getCohorts(
  organizationId?: string,
  userIdOrFilters?: string | CohortFilters,
  filtersOrPagination?: CohortFilters | CohortPagination,
  pagination?: CohortPagination
) {
  const { organizationId: orgId, userId, filters, pagination: pageOpts } =
    normalizeGetCohortsArgs(organizationId, userIdOrFilters, filtersOrPagination, pagination);

  const {
    type,
    status,
    hosting,
    runtimeStatus,
    search,
    startDateFrom,
    startDateTo,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  const page = pageOpts.page ?? 1;
  const pageSize = pageOpts.pageSize ?? 20;

  const predicates = [buildAccessPredicate(orgId, userId, type)].filter(Boolean);

  if (status) predicates.push(eq(cohorts.status, status));
  if (hosting) predicates.push(eq(cohorts.hosting, hosting));
  if (runtimeStatus) predicates.push(eq(cohorts.runtimeStatus, runtimeStatus));
  if (search) predicates.push(ilike(cohorts.name, `%${search}%`));
  if (startDateFrom) predicates.push(gte(cohorts.startDate, startDateFrom));
  if (startDateTo) predicates.push(lte(cohorts.startDate, startDateTo));

  const whereClause = predicates.length > 0 ? and(...predicates) : undefined;

  const totalQuery = db.select({ total: count() }).from(cohorts);
  if (whereClause) {
    totalQuery.where(whereClause);
  }
  const totalRow = (await totalQuery)[0];
  const total = totalRow?.total ?? 0;

  const orderBy =
    sortBy === 'name'
      ? sortOrder === 'asc'
        ? asc(cohorts.name)
        : desc(cohorts.name)
      : sortBy === 'start_date'
        ? sortOrder === 'asc'
          ? asc(cohorts.startDate)
          : desc(cohorts.startDate)
        : sortBy === 'member_count'
          ? sortOrder === 'asc'
            ? asc(cohorts.memberCount)
            : desc(cohorts.memberCount)
          : sortBy === 'engagement_percent'
            ? sortOrder === 'asc'
              ? asc(cohorts.engagementPercent)
              : desc(cohorts.engagementPercent)
            : sortOrder === 'asc'
              ? asc(cohorts.createdAt)
              : desc(cohorts.createdAt);

  const cohortsQuery = db.select().from(cohorts);
  if (whereClause) {
    cohortsQuery.where(whereClause);
  }

  const cohortRows = await cohortsQuery
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const cohortIds = cohortRows.map((cohort) => cohort.id);
  const statsMap = await getMemberStats(cohortIds);

  const enriched = cohortRows.map((cohort) => ({
    ...cohort,
    memberCount: statsMap[cohort.id]?.memberCount ?? 0,
    engagementPercent: statsMap[cohort.id]?.engagementPercent ?? 0,
  }));

  return {
    cohorts: enriched,
    total: Number(total || 0),
    page,
    pageSize,
    totalPages: Math.ceil(Number(total || 0) / pageSize),
  };
}

/**
 * Get a single cohort by ID with related data
 */
export async function getCohortById(cohortId: string) {
  const { organizationId, userId } = await getAuthContext();
  const accessPredicate = buildAccessPredicate(organizationId, userId);

  const cohortQuery = db.select().from(cohorts);
  cohortQuery.where(
    accessPredicate ? and(eq(cohorts.id, cohortId), accessPredicate) : eq(cohorts.id, cohortId)
  );

  const [cohort] = await cohortQuery;

  if (!cohort) return null;

  const statsMap = await getMemberStats([cohort.id]);

  return {
    ...cohort,
    memberCount: statsMap[cohort.id]?.memberCount ?? 0,
    engagementPercent: statsMap[cohort.id]?.engagementPercent ?? 0,
  };
}

/**
 * Get cohort statistics: engagement metrics, member breakdown, activity
 */
export async function getCohortStats(cohortId: string) {
  const cohort = await getCohortById(cohortId);

  if (!cohort) return null;

  const [activityCount] = await db
    .select({ count: count() })
    .from(activityLog)
    .where(and(eq(activityLog.entityId, cohortId), eq(activityLog.entityType, 'cohort')));

  const [latestActivity] = await db
    .select({ createdAt: activityLog.createdAt })
    .from(activityLog)
    .where(and(eq(activityLog.entityId, cohortId), eq(activityLog.entityType, 'cohort')))
    .orderBy(desc(activityLog.createdAt))
    .limit(1);

  const startDate = cohort.startDate ? new Date(cohort.startDate) : new Date(cohort.createdAt);
  const endDate = cohort.endDate ? new Date(cohort.endDate) : new Date();
  const daysActive = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    memberCount: cohort.memberCount,
    engagementPercent: cohort.engagementPercent,
    daysActive,
    status: cohort.status,
    startDate: cohort.startDate,
    endDate: cohort.endDate,
    activitySummary: {
      count: Number(activityCount?.count || 0),
      lastActivityAt: latestActivity?.createdAt ?? null,
    },
  };
}

/**
 * Get cohort user members with roles
 */
export async function getCohortUserMembers(cohortId: string) {
  const rows = await db
    .select({
      id: cohortUserMembers.id,
      cohortId: cohortUserMembers.cohortId,
      userId: cohortUserMembers.userId,
      role: cohortUserMembers.role,
      joinedAt: cohortUserMembers.joinedAt,
      updatedAt: cohortUserMembers.updatedAt,
      name: profiles.name,
      email: profiles.email,
      avatarUrl: profiles.avatarUrl,
    })
    .from(cohortUserMembers)
    .leftJoin(profiles, eq(cohortUserMembers.userId, profiles.id))
    .where(eq(cohortUserMembers.cohortId, cohortId))
    .orderBy(desc(cohortUserMembers.joinedAt));

  return rows;
}

/**
 * Get cohort agent members with engagement scores
 */
export async function getCohortAgentMembers(cohortId: string) {
  const rows = await db
    .select({
      id: cohortAgentMembers.id,
      cohortId: cohortAgentMembers.cohortId,
      agentId: cohortAgentMembers.agentId,
      role: cohortAgentMembers.role,
      engagementScore: cohortAgentMembers.engagementScore,
      joinedAt: cohortAgentMembers.joinedAt,
      updatedAt: cohortAgentMembers.updatedAt,
      name: agents.name,
      slug: agents.slug,
      avatarUrl: agents.avatarUrl,
      status: agents.status,
    })
    .from(cohortAgentMembers)
    .leftJoin(agents, eq(cohortAgentMembers.agentId, agents.id))
    .where(eq(cohortAgentMembers.cohortId, cohortId))
    .orderBy(desc(cohortAgentMembers.engagementScore));

  return rows;
}

/**
 * Get cohort activity timeline
 */
export async function getCohortActivity(cohortId: string, limit = 20) {
  const { organizationId } = await getAuthContext();

  return db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.organizationId, organizationId),
        eq(activityLog.entityId, cohortId),
        eq(activityLog.entityType, 'cohort')
      )
    )
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

/**
 * Get engagement timeline data for a cohort
 */
export async function getCohortEngagementTimeline(
  cohortId: string,
  daysBack: number = 30
): Promise<Array<{ date: string; interaction_count: number }>> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const [userRows, agentRows] = await Promise.all([
    db
      .select({ joinedAt: cohortUserMembers.joinedAt })
      .from(cohortUserMembers)
      .where(
        and(
          eq(cohortUserMembers.cohortId, cohortId),
          gte(cohortUserMembers.joinedAt, startDate),
          lte(cohortUserMembers.joinedAt, endDate)
        )
      ),
    db
      .select({ joinedAt: cohortAgentMembers.joinedAt })
      .from(cohortAgentMembers)
      .where(
        and(
          eq(cohortAgentMembers.cohortId, cohortId),
          gte(cohortAgentMembers.joinedAt, startDate),
          lte(cohortAgentMembers.joinedAt, endDate)
        )
      ),
  ]);

  const timelineMap = new Map<string, number>();
  [...userRows, ...agentRows].forEach((row) => {
    const date = new Date(row.joinedAt).toISOString().split('T')[0]!;
    timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
  });

  const timeline: Array<{ date: string; interaction_count: number }> = [];
  for (let i = 0; i < daysBack; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (daysBack - i - 1));
    const dateKey = date.toISOString().split('T')[0]!;
    timeline.push({
      date: dateKey,
      interaction_count: timelineMap.get(dateKey) || 0,
    });
  }

  return timeline;
}
