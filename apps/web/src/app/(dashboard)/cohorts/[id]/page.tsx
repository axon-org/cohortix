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
import { ArrowLeft, Pencil, Save, X } from 'lucide-react';
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

export default function CohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
  if (error || !cohort) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Cohort not found</p>
        <Link href="/cohorts" className="text-sm text-foreground underline mt-2 inline-block">
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
      startDate: cohort.start_date || '',
      endDate: cohort.end_date || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({ id, data: form });
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/cohorts');
  };

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/cohorts"
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
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[cohort.status])} />
              {cohort.status}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {cohort.member_count} members · {cohort.engagement_percent}% engagement
          </span>
        </div>
      </div>

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
        <Field label="Start Date" editing={editing}>
          {editing ? (
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-48"
            />
          ) : (
            <p className="text-sm">{cohort.start_date || '—'}</p>
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
            <p className="text-sm">{cohort.end_date || '—'}</p>
          )}
        </Field>
        <Field label="Created">
          <p className="text-sm text-muted-foreground">
            {new Date(cohort.created_at).toLocaleDateString()}
          </p>
        </Field>
      </div>

      {/* Engagement Timeline */}
      {timelineData && <EngagementTimeline data={timelineData.timeline} days={30} />}

      {/* Two-Column Layout: Members (left, wider) + Activity (right, narrower) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List - Takes 2/3 of the space */}
        <div className="lg:col-span-2">
          {membersData && <BatchMembers members={membersData.members} />}
        </div>

        {/* Activity Log - Takes 1/3 of the space */}
        <div className="lg:col-span-1">
          {activityData && <ActivityLog activities={activityData.activities} />}
        </div>
      </div>
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
