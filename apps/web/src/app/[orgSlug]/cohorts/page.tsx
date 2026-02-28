'use client';

import { use } from 'react';
import { CohortsTableClient } from '@/components/cohorts/cohorts-table-client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CohortFormModal } from '@/components/cohorts/cohort-form-modal';
import { useState } from 'react';

export default function CohortsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = use(params);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cohorts</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your cohorts performance.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Cohort
        </Button>
      </div>

      {/* Cohorts Table - Now using real API data */}
      <CohortsTableClient />

      <CohortFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        orgId={orgSlug} // Assuming orgSlug is used as ID or we have access to orgId
      />
    </div>
  );
}
