'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useMission, useUpdateMission, useDeleteMission } from '@/hooks/use-missions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pencil, Save, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['planning', 'active', 'on_hold', 'completed', 'archived'] as const;
const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-muted-foreground',
  active: 'bg-success',
  on_hold: 'bg-warning',
  completed: 'bg-info',
  archived: 'bg-muted-foreground',
};

export default function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: mission, isLoading, error } = useMission(id);
  const updateMutation = useUpdateMission();
  const deleteMutation = useDeleteMission();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  if (isLoading) return <DetailSkeleton />;
  if (error || !mission) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Mission not found</p>
        <Link
          href="/dashboard/missions"
          className="text-sm text-foreground underline mt-2 inline-block"
        >
          Back to Missions
        </Link>
      </div>
    );
  }

  const startEditing = () => {
    setForm({
      name: mission.name,
      description: mission.description || '',
      status: mission.status,
      startDate: mission.start_date || '',
      targetDate: mission.target_date || '',
      color: mission.color || '#5E6AD2',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({ id, data: form });
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/missions');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/missions"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Missions
        </Link>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-1" /> {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <DeleteDialog
                title="Delete mission"
                description={`Are you sure you want to delete "${mission.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: mission.color || '#5E6AD2' }}
        />
        <div className="flex-1">
          {editing ? (
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="text-2xl font-bold h-auto py-1 px-2 bg-transparent border-border"
            />
          ) : (
            <h1 className="text-2xl font-bold">{mission.name}</h1>
          )}
          <div className="flex items-center gap-3 mt-1">
            {editing ? (
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="bg-secondary border border-border rounded px-2 py-1 text-xs"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[mission.status])} />
                {mission.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        <Field label="Description">
          {editing ? (
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {mission.description || 'No description'}
            </p>
          )}
        </Field>
        <Field label="Color">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{form.color}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: mission.color || '#5E6AD2' }}
              />
              <span className="text-sm">{mission.color || '#5E6AD2'}</span>
            </div>
          )}
        </Field>
        <Field label="Start Date">
          {editing ? (
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-48"
            />
          ) : (
            <p className="text-sm">{mission.start_date || '—'}</p>
          )}
        </Field>
        <Field label="Target Date">
          {editing ? (
            <Input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              className="w-48"
            />
          ) : (
            <p className="text-sm">{mission.target_date || '—'}</p>
          )}
        </Field>
        {mission.completed_at && (
          <Field label="Completed">
            <p className="text-sm text-success">
              {new Date(mission.completed_at).toLocaleDateString()}
            </p>
          </Field>
        )}
        <Field label="Created">
          <p className="text-sm text-muted-foreground">
            {new Date(mission.created_at).toLocaleDateString()}
          </p>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
