'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Database, Search, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeResultCardProps {
  result: {
    layer: 'builtin' | 'mem0' | 'cognee' | 'qmd';
    source: string;
    snippet: string;
    relevance: number;
    url?: string;
    date?: string;
    entityType?: string;
  };
}

const layerIcons = {
  builtin: <Database className="h-3 w-3" />,
  mem0: <Sparkles className="h-3 w-3" />,
  cognee: <Search className="h-3 w-3" />,
  qmd: <ExternalLink className="h-3 w-3" />,
};

const layerColors = {
  builtin: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  mem0: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  cognee: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  qmd: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

export function KnowledgeResultCard({ result }: KnowledgeResultCardProps) {
  const relevancePercent = Math.round(result.relevance * 100);

  return (
    <Card className="flex flex-col h-full bg-card hover:border-primary/50 transition-colors">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={`flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              layerColors[result.layer]
            }`}
          >
            {layerIcons[result.layer]}
            {result.layer}
          </Badge>
          <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-2">
            Score: <span className="text-foreground">{relevancePercent}%</span>
          </div>
        </div>
        <CardTitle className="text-sm font-semibold line-clamp-1 mt-2">
          {result.source}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 italic">
          "{result.snippet}"
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {result.date && <span>{formatDistanceToNow(new Date(result.date))} ago</span>}
          {result.entityType && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[9px] uppercase">
              {result.entityType}
            </Badge>
          )}
        </div>
        {result.url && (
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-muted rounded-md"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
