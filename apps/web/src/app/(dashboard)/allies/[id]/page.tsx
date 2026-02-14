'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAlly, useUpdateAlly, useDeleteAlly } from '@/hooks/use-allies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pencil, Save, X, Bot } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['active', 'idle', 'busy', 'offline', 'error'] as const;
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success',
  idle: 'bg-warning',
  busy: 'bg-info',
  offline: 'bg-muted-foreground',
  error: 'bg-destructive',
};

export default function AllyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: ally, isLoading, error } = useAlly(id);
  const updateMutation = useUpdateAlly();
  const deleteMutation = useDeleteAlly();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  if (isLoading) return <DetailSkeleton />;
  if (error || !ally) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Ally not found</p>
        <Link href="/allies" className="text-sm text-foreground underline mt-2 inline-block">
          Back to Allies
        </Link>
      </div>
    );
  }

  const startEditing = () => {
    setForm({
      name: ally.name,
      description: ally.description || '',
      role: ally.role || '',
      status: ally.status,
      capabilities: (ally.capabilities || []).join(', '),
    });
    setEditing(true);
  };

  const handleSave = async () => {
    const data: any = { ...form };
    data.capabilities = form.capabilities
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    await updateMutation.mutateAsync({ id, data });
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/allies');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/allies"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Allies
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
                title="Delete ally"
                description={`Are you sure you want to delete "${ally.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
          {ally.avatar_url ? (
            <img
              src={ally.avatar_url}
              alt={ally.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <Bot className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          {editing ? (
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="text-2xl font-bold h-auto py-1 px-2 bg-transparent border-border"
            />
          ) : (
            <h1 className="text-2xl font-bold">{ally.name}</h1>
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
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[ally.status])} />
                {ally.status}
              </span>
            )}
            {ally.role && <span className="text-xs text-muted-foreground">{ally.role}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Tasks Completed" value={ally.total_tasks_completed || 0} />
        <StatCard label="Runtime" value={ally.runtime_type} />
        <StatCard
          label="Last Active"
          value={ally.last_active_at ? new Date(ally.last_active_at).toLocaleDateString() : '—'}
        />
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
            <p className="text-sm text-muted-foreground">{ally.description || 'No description'}</p>
          )}
        </Field>
        <Field label="Role">
          {editing ? (
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-64"
            />
          ) : (
            <p className="text-sm">{ally.role || '—'}</p>
          )}
        </Field>
        <Field label="Capabilities">
          {editing ? (
            <Input
              value={form.capabilities}
              onChange={(e) => setForm({ ...form, capabilities: e.target.value })}
              placeholder="Comma-separated"
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(ally.capabilities || []).length > 0 ? (
                ally.capabilities.map((cap: string) => (
                  <span key={cap} className="px-2 py-0.5 bg-secondary rounded text-xs font-medium">
                    {cap}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          )}
        </Field>
        <Field label="Created">
          <p className="text-sm text-muted-foreground">
            {new Date(ally.created_at).toLocaleDateString()}
          </p>
        </Field>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
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
      <div className="flex gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
