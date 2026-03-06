'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCohort,
  useUpdateCohort,
  useDeleteCohort,
  useCohortMembers,
  useCohortTimeline,
  useCohortActivity,
} from '@/hooks/use-cohorts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pencil, Save, Server, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { EngagementTimeline } from '@/components/cohorts/engagement-timeline';
import { BatchMembers } from '@/components/cohorts/batch-members';
import { ActivityLog } from '@/components/cohorts/activity-log';

const STATUS_OPTIONS = ['active', 'paused', 'at-risk', 'completed'] as const;
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success',
  paused: 'bg-warning',
  'at-risk': 'bg-destructive',
  completed: 'bg-info',
};

const RUNTIME_STATUS_COLORS: Record<string, string> = {
  online: 'bg-success',
  error: 'bg-destructive',
  paused: 'bg-warning',
  offline: 'bg-muted-foreground',
  provisioning: 'bg-primary animate-pulse',
};

export default function CohortDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = use(params);
  const router = useRouter();
  const { data: cohort, isLoading, error } = useCohort(id);
  const { data: membersData } = useCohortMembers(id);
  const { data: timelineData } = useCohortTimeline(id, 30);
  const { data: activityData } = useCohortActivity(id, 20);
  const updateMutation = useUpdateCohort();
  const deleteMutation = useDeleteCohort();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  if (isLoading) return <DetailSkeleton />;

  // Handle 403 Forbidden error with access denied message
  const errorStatus = (error as any)?.response?.status || (error as any)?.status;
  if (errorStatus === 403) {
    return (
      <div className="text-center py-20">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            You don&apos;t have permission to view this cohort. Contact the cohort owner if you
            believe this is a mistake.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/cohorts`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cohorts
        </Link>
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Cohort not found</p>
        <Link
          href={`/${orgSlug}/cohorts`}
          className="text-sm text-foreground underline mt-2 inline-block"
        >
          Back to Cohorts
        </Link>
      </div>
    );
  }

  const startEditing = () => {
    setForm({
      name: cohort.name,
      description: cohort.description || '',
      status: cohort.status,
      startDate: cohort.startDate || '',
      endDate: cohort.endDate || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({ id, data: form });
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push(`/${orgSlug}/cohorts`);
  };

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${orgSlug}/cohorts`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Cohorts
        </Link>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-1" />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Link href={`/${orgSlug}/cohorts/${id}/engine`}>
                <Button variant="outline" size="sm">
                  <Server className="w-4 h-4 mr-1" /> Engine
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <DeleteDialog
                title="Delete cohort"
                description={`Are you sure you want to delete "${cohort.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div>
        {editing ? (
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="text-2xl font-bold h-auto py-1 px-2 bg-transparent border-border"
          />
        ) : (
          <h1 className="text-2xl font-bold">{cohort.name}</h1>
        )}
        <div className="flex items-center gap-3 mt-2">
          {editing ? (
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="bg-secondary border border-border rounded px-2 py-1 text-xs"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[cohort.status])} />
                {cohort.status}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium bg-secondary px-2 py-0.5 rounded-full">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    RUNTIME_STATUS_COLORS[cohort.runtimeStatus || 'offline']
                  )}
                />
                {cohort.runtimeStatus || 'offline'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                {cohort.type}
              </span>
            </>
          )}
          <span className="text-xs text-muted-foreground">
            {cohort.memberCount} members · {cohort.engagementPercent}% engagement
          </span>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard label="Total Agents" value={cohort.agentCount || 0} />
        <StatsCard label="Active Tasks" value={cohort.activeTasks || 0} />
        <StatsCard label="Engagement Score" value={`${cohort.engagementPercent}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Details */}
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <Field label="Description" editing={editing}>
              {editing ? (
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {cohort.description || 'No description'}
                </p>
              )}
            </Field>
            {cohort.hosting === 'self_hosted' && (
              <Field label="Gateway URL">
                <p className="text-sm font-mono text-primary">
                  {cohort.gatewayUrl || 'Pending...'}
                </p>
              </Field>
            )}
            <Field label="Start Date" editing={editing}>
              {editing ? (
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-48"
                />
              ) : (
                <p className="text-sm">{cohort.startDate || '—'}</p>
              )}
            </Field>
            <Field label="End Date" editing={editing}>
              {editing ? (
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-48"
                />
              ) : (
                <p className="text-sm">{cohort.endDate || '—'}</p>
              )}
            </Field>
          </div>

          {/* Engagement Timeline */}
          {timelineData && <EngagementTimeline data={timelineData.timeline} days={30} />}

          {/* Members List */}
          {membersData && <BatchMembers members={membersData.members} />}
        </div>

        {/* Activity Log - Takes 1/4 of the space */}
        <div className="lg:col-span-1 space-y-6">
          {activityData && <ActivityLog activities={activityData.activities} />}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Field({
  label,
  editing,
  children,
}: {
  label: string;
  editing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-8 w-64" />
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
