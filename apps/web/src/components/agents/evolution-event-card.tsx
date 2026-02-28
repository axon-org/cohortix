'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, Milestone, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface EvolutionEventCardProps {
  event: {
    event_type: 'learning' | 'correction' | 'milestone';
    summary: string;
    metadata: any;
    created_at: string;
  };
}

const eventConfigs = {
  learning: {
    icon: <Sparkles className="h-3 w-3" />,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    dotColor: 'bg-blue-500',
  },
  correction: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    dotColor: 'bg-amber-500',
  },
  milestone: {
    icon: <Milestone className="h-3 w-3" />,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    dotColor: 'bg-emerald-500',
  },
};

export function EvolutionEventCard({ event }: EvolutionEventCardProps) {
  const config = eventConfigs[event.event_type] || eventConfigs.learning;

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      <div className={cn("absolute left-[-1.3rem] top-1.5 h-3 w-3 rounded-full border-4 border-card", config.dotColor)} />
      
      <Card className="bg-card border-border hover:border-muted transition-colors">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-[10px] font-bold uppercase py-0.5 px-2 tracking-wider gap-1.5", config.color)}>
                {config.icon}
                {event.event_type}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                {formatDistanceToNow(new Date(event.created_at))} ago
              </span>
            </div>
            
            {event.metadata?.taskId && (
              <Badge variant="secondary" className="bg-muted text-[10px] flex items-center gap-1 cursor-pointer hover:bg-muted/80">
                T-{event.metadata.taskId.split('-')[0]} <ExternalLink className="h-2 w-2" />
              </Badge>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium tracking-tight leading-relaxed">
              {event.summary}
            </p>
            {event.metadata?.correction && (
              <div className="mt-1 p-2 bg-muted/30 rounded-lg text-[11px] font-mono text-muted-foreground">
                <span className="text-amber-500/80 mr-2 uppercase">Correction:</span>
                {event.metadata.correction}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
