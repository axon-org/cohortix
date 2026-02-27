'use client';

import { useState } from 'react';
import { useCohorts } from '@/hooks/use-cohorts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Users, Globe, User, Activity } from 'lucide-react';
import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';

export function CohortsTableClient() {
  const [filter, setFilter] = useState<'all' | 'personal' | 'shared'>('all');
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useCohorts();

  if (isLoading) {
    return <CohortsGridSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <p className="text-destructive font-medium">Failed to load cohorts</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  const filteredData = (data?.data || []).filter((cohort) => {
    const matchesFilter = filter === 'all' || cohort.type === filter;
    const matchesSearch = cohort.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (filteredData.length === 0) {
    return (
      <div className="space-y-6">
        <Toolbar filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
        <div className="bg-card border border-border border-dashed rounded-xl p-20 text-center">
          <p className="text-muted-foreground">No cohorts found matching your criteria.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or search terms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toolbar filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((cohort) => (
          <CohortCard key={cohort.id} cohort={cohort} />
        ))}
      </div>
    </div>
  );
}

function Toolbar({ filter, setFilter, search, setSearch }: any) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border">
        {(['all', 'personal', 'shared'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
              filter === t 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search cohorts..." 
          className="pl-9 bg-secondary/50 border-border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}

const RUNTIME_STATUS_COLORS: Record<string, string> = {
  online: 'bg-success',
  degraded: 'bg-warning',
  disconnected: 'bg-destructive',
  offline: 'bg-muted-foreground',
  provisioning: 'bg-primary animate-pulse',
};

function CohortCard({ cohort }: { cohort: any }) {
  const engagement = parseFloat(cohort.engagementPercent);
  
  return (
    <Link href={`cohorts/${cohort.id}`} className="group">
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all hover:shadow-lg h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              {cohort.type === 'personal' ? (
                <User className="w-5 h-5 text-primary" />
              ) : (
                <Users className="w-5 h-5 text-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {cohort.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {cohort.type}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(cohort.startDate || cohort.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            RUNTIME_STATUS_COLORS[cohort.runtimeStatus || 'offline']
          )} title={cohort.runtimeStatus} />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Members</p>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-bold">{cohort.memberCount}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Engagement</p>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-bold">{engagement}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${engagement}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function CohortsGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
