'use client';

import React, { useState } from 'react';
import { EvolutionEventCard } from './evolution-event-card';
import { CorrectionRateChart } from './correction-rate-chart';
import { useAgentEvolution } from '@/hooks/use-agent-evolution';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, Milestone, Activity, Filter, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface AgentEvolutionDashboardProps {
  agentId: string;
  orgSlug: string;
}

const EVENT_TYPES = [
  { value: 'all', label: 'All Events', icon: <Activity className="h-3 w-3" /> },
  { value: 'learning', label: 'Learnings', icon: <Sparkles className="h-3 w-3" /> },
  { value: 'correction', label: 'Corrections', icon: <AlertTriangle className="h-3 w-3" /> },
  { value: 'milestone', label: 'Milestones', icon: <Milestone className="h-3 w-3" /> },
];

export function AgentEvolutionDashboard({ agentId, orgSlug }: AgentEvolutionDashboardProps) {
  const [filter, setFilter] = useState('all');
  const { data: evolution, isLoading, error } = useAgentEvolution(agentId, orgSlug);

  const filteredEvents =
    evolution?.events?.filter((e: any) => filter === 'all' || e.event_type === filter) || [];

  const stats = [
    {
      label: 'Total Learnings',
      value: evolution?.stats?.learningCount || 0,
      icon: <Sparkles className="text-blue-500 h-4 w-4" />,
    },
    {
      label: 'Corrections',
      value: evolution?.stats?.correctionCount || 0,
      icon: <AlertTriangle className="text-amber-500 h-4 w-4" />,
    },
    {
      label: 'Milestones',
      value: evolution?.stats?.milestoneCount || 0,
      icon: <Milestone className="text-emerald-500 h-4 w-4" />,
    },
  ];

  if (isLoading)
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-card border-border hover:border-primary/50 transition-colors"
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
                <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
              </div>
              <div className="p-3 bg-muted rounded-xl">{stat.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex items-center gap-2">
              {EVENT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={filter === type.value ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(type.value)}
                  className="rounded-full px-3 h-8 text-[11px] font-semibold gap-1.5"
                >
                  {type.icon}
                  {type.label}
                </Button>
              ))}
            </div>
            {filter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('all')}
                className="h-8 text-[11px] gap-1 px-2 text-muted-foreground"
              >
                <FilterX className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>

          <div className="relative pl-4 space-y-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No events found for this filter.
              </div>
            ) : (
              filteredEvents.map((event: any, i: number) => (
                <EvolutionEventCard key={event.id || i} event={event} />
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CorrectionRateChart data={evolution?.chartData || []} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-sm font-semibold">Growth Milestones</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-4">
                {evolution?.milestones?.map((m: any, i: number) => (
                  <li key={i} className="flex gap-3">
                    <div className="p-1.5 bg-emerald-500/10 rounded-md h-fit mt-1">
                      <Milestone className="h-3 w-3 text-emerald-500" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold">{m.title}</span>
                      <span className="text-[10px] text-muted-foreground">{m.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
