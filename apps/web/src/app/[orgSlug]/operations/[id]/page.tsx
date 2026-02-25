'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOperation, useUpdateOperation, useDeleteOperation } from '@/hooks/use-operations';
import { useMission } from '@/hooks/use-missions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pencil, Save, X, ExternalLink } from 'lucide-react';
import { OperationStatusChip, type OperationStatus } from '@/components/ui/operation-status-chip';
import { cn, formatDate } from '@/lib/utils';

const STATUS_OPTIONS: OperationStatus[] = [
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived',
];

export default function OperationDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = use(params);
  const router = useRouter();
  const { data: operation, isLoading, error } = useOperation(id);
  const { data: missionData } = useMission(operation?.missionId || '');
  const updateMutation = useUpdateOperation();
  const deleteMutation = useDeleteOperation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  if (isLoading) return <DetailSkeleton />;
  if (error || !operation) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Operation not found</p>
        <Link
          href={`/${orgSlug}/operations`}
          className="text-sm text-foreground underline mt-2 inline-block"
        >
          Back to Operations
        </Link>
      </div>
    );
  }

  const startEditing = () => {
    setForm({
      name: operation.name,
      description: operation.description || '',
      status: operation.status,
      startDate: operation.startDate || '',
      targetDate: operation.targetDate || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({ id, data: form });
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push(`/${orgSlug}/operations`);
  };

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${orgSlug}/operations`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Operations
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
                title="Delete operation"
                description={`Are you sure you want to delete "${operation.name}"? This action cannot be undone.`}
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
          <h1 className="text-2xl font-bold">{operation.name}</h1>
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
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          ) : (
            <OperationStatusChip status={operation.status} />
          )}
          {operation.missionId && missionData && (
            <Link
              href={`/missions/${operation.missionId}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Mission: {missionData.name}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        <Field label="Description" editing={editing}>
          {editing ? (
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {operation.description || 'No description'}
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
            <p className="text-sm">{operation.startDate ? formatDate(operation.startDate) : '—'}</p>
          )}
        </Field>
        <Field label="Target Date" editing={editing}>
          {editing ? (
            <Input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              className="w-48"
            />
          ) : (
            <p className="text-sm">
              {operation.targetDate ? formatDate(operation.targetDate) : '—'}
            </p>
          )}
        </Field>
        <Field label="Mission">
          <p className="text-sm text-muted-foreground">
            {operation.missionId && missionData ? (
              <Link
                href={`/missions/${operation.missionId}`}
                className="hover:text-foreground transition-colors"
              >
                {missionData.name}
              </Link>
            ) : (
              '—'
            )}
          </p>
        </Field>
        <Field label="Created">
          <p className="text-sm text-muted-foreground">{formatDate(operation.created_at)}</p>
        </Field>
        <Field label="Last Updated">
          <p className="text-sm text-muted-foreground">{formatDate(operation.updated_at)}</p>
        </Field>
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
