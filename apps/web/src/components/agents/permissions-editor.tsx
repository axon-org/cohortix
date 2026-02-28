'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Check, X, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionMatrix {
  tasks: { create: boolean; read: boolean; update: boolean; delete: boolean };
  knowledge: { create: boolean; read: boolean; update: boolean; delete: boolean };
  comments: { create: boolean; read: boolean; update: boolean; delete: boolean };
  settings: { read: boolean; update: boolean };
}

const DEFAULT_PERMISSIONS: PermissionMatrix = {
  tasks: { create: true, read: true, update: true, delete: false },
  knowledge: { create: false, read: true, update: false, delete: false },
  comments: { create: true, read: true, update: true, delete: false },
  settings: { read: true, update: false },
};

export function PermissionsEditor({
  initialPermissions = DEFAULT_PERMISSIONS,
  onChange,
}: {
  initialPermissions?: PermissionMatrix;
  onChange: (p: PermissionMatrix) => void;
}) {
  const [permissions, setPermissions] = useState<PermissionMatrix>(initialPermissions);

  const togglePermission = (resource: keyof PermissionMatrix, action: string) => {
    const next = {
      ...permissions,
      [resource]: {
        ...permissions[resource],
        [action]: !(permissions[resource] as any)[action],
      },
    };
    setPermissions(next);
    onChange(next);
  };

  const ResourceSection = ({
    label,
    resource,
    actions,
  }: {
    label: string;
    resource: keyof PermissionMatrix;
    actions: string[];
  }) => (
    <div className="flex flex-col space-y-3 pb-4 border-b border-border last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Badge variant="outline" className="text-[9px] font-mono h-4 px-1.5 opacity-50">
          resource.{resource}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <div
            key={action}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-muted hover:border-primary/20 transition-all group"
          >
            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] font-bold uppercase tracking-tight capitalize">
                {action}
              </Label>
              <span className="text-[9px] text-muted-foreground italic">
                Can {action} {resource}
              </span>
            </div>
            <Switch
              checked={(permissions[resource] as any)[action]}
              onCheckedChange={() => togglePermission(resource, action)}
              className="scale-75"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-amber-500/10 rounded-xl">
            <Shield className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-bold tracking-tight uppercase">
              Agent Permissions
            </CardTitle>
            <CardDescription className="text-[11px] font-medium text-muted-foreground italic">
              Configure what this agent can access and do within this cohort.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0 flex flex-col space-y-6">
        <ResourceSection
          label="Tasks"
          resource="tasks"
          actions={['read', 'create', 'update', 'delete']}
        />
        <ResourceSection
          label="Knowledge Hub"
          resource="knowledge"
          actions={['read', 'create', 'update', 'delete']}
        />
        <ResourceSection
          label="Communication"
          resource="comments"
          actions={['read', 'create', 'update', 'delete']}
        />
        <ResourceSection
          label="Admin & Settings"
          resource="settings"
          actions={['read', 'update']}
        />

        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex gap-3">
          <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-500/80 leading-relaxed font-medium italic">
            Granting &apos;Delete&apos; permissions allows the agent to remove records permanently.
            Use caution with personal data and critical infrastructure.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
