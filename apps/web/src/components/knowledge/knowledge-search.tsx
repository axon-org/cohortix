'use client';

import React, { useState } from 'react';
import { Search, Loader2, Filter, Calendar, Layers, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { KnowledgeResultCard } from './knowledge-result-card';
import { useKnowledgeSearch } from '@/hooks/use-knowledge-search';
import { Skeleton } from '@/components/ui/skeleton';

interface KnowledgeSearchProps {
  orgSlug: string;
}

export function KnowledgeSearch({ orgSlug }: KnowledgeSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    layers: ['builtin', 'mem0', 'cognee', 'qmd'],
    date: 'all',
    entity: 'all',
  });

  const { results, isLoading, error, mutate } = useKnowledgeSearch({
    query,
    filters,
    orgSlug,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  const toggleLayer = (layer: string) => {
    setFilters((prev) => ({
      ...prev,
      layers: prev.layers.includes(layer)
        ? prev.layers.filter((l) => l !== layer)
        : [...prev.layers, layer],
    }));
  };

  return (
    <div className="flex flex-col space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across memory layers..."
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Layers className="h-3 w-3" /> Layers
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.layers.includes('builtin')}
              onCheckedChange={() => toggleLayer('builtin')}
            >
              Built-in (Markdown)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.layers.includes('mem0')}
              onCheckedChange={() => toggleLayer('mem0')}
            >
              Mem0
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.layers.includes('cognee')}
              onCheckedChange={() => toggleLayer('cognee')}
            >
              Cognee
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.layers.includes('qmd')}
              onCheckedChange={() => toggleLayer('qmd')}
            >
              QMD
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Time Range
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFilters((p) => ({ ...p, date: '7d' }))}>
              Last 7 Days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters((p) => ({ ...p, date: '30d' }))}>
              Last 30 Days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters((p) => ({ ...p, date: 'all' }))}>
              All Time
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </form>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          {error.message || 'Failed to search knowledge hub'}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results?.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center space-y-2">
              <div className="p-4 rounded-full bg-muted">
                <Info className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-muted-foreground max-w-xs">
                Try a different search query or check your layer filters.
              </p>
            </div>
          ) : (
            results?.map((result: any, i: number) => (
              <KnowledgeResultCard key={i} result={result} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
