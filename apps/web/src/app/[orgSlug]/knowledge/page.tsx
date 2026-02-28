import { Suspense } from 'react';
import { KnowledgeSearch } from '@/components/knowledge/knowledge-search';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Knowledge Hub | Cohortix',
};

export default async function KnowledgePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  return (
    <div className="flex flex-col h-full space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Hub</h1>
        <p className="text-muted-foreground">
          Search across 4 layers of memory (Built-in, Mem0, Cognee, QMD).
        </p>
      </div>

      <Suspense fallback={<KnowledgeSkeleton />}>
        <KnowledgeSearch orgSlug={orgSlug} />
      </Suspense>
    </div>
  );
}

function KnowledgeSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-lg" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
