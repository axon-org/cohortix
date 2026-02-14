'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { CohortMember } from '@/lib/api/client';

interface BatchMembersProps {
  members: CohortMember[];
}

const statusConfig = {
  active: { label: 'Optimal', dotColor: 'bg-success' },
  idle: { label: 'Idle', dotColor: 'bg-muted-foreground' },
  busy: { label: 'Syncing', dotColor: 'bg-warning' },
  offline: { label: 'Offline', dotColor: 'bg-muted-foreground' },
  error: { label: 'Error', dotColor: 'bg-destructive' },
} as const;

export function BatchMembers({ members }: BatchMembersProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Batch Members ({members.length})</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Filter allies...
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Ally
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Engagement Score
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-background/50 transition-colors">
                {/* AI Ally */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {member.agent_avatar_url ? (
                        <img
                          src={member.agent_avatar_url}
                          alt={member.agent_name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-primary">
                          {member.agent_name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{member.agent_name}</div>
                      <div className="text-xs text-muted-foreground">{member.agent_slug}</div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-foreground">{member.agent_role || '—'}</span>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        statusConfig[member.agent_status].dotColor
                      )}
                    />
                    <span className="text-sm">{statusConfig[member.agent_status].label}</span>
                  </div>
                </td>

                {/* Engagement Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[120px]">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/80"
                          style={{ width: `${member.engagement_score}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-mono text-foreground tabular-nums">
                      {member.engagement_score}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-muted-foreground hover:text-foreground text-xl">⋯</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {members.length > 8 && (
        <div className="px-6 py-4 border-t border-border text-center">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View Full Audit Trail
          </button>
        </div>
      )}
    </div>
  );
}
