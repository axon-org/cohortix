// Cohortix Sprint 2: Cohorts Grid Page (COH-F1)
// Author: Sami (Frontend) - Task brief: /tmp/sami-sprint2-frontend.md
// Date: 2026-02-12
// Design: Mockup 02-cohort-grid-linear-dark.png

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CohortsTable, type CohortRow } from '@/components/cohorts/cohorts-table';

export default function CohortsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCohorts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status]);

  async function fetchCohorts() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const res = await fetch(`/api/cohorts?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch cohorts: ${res.statusText}`);
      }

      const data = await res.json();
      setCohorts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch cohorts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleRowClick(cohortId: string) {
    router.push(`/cohorts/${cohortId}`);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Cohorts</h1>
          <p className="text-gray-400 mt-1">Manage and track your AI cohorts</p>
        </div>
        <button
          onClick={() => router.push('/cohorts/new')}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          + New Cohort
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search cohorts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-[#1A1A1E] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 bg-[#1A1A1E] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="at-risk">At-Risk</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-gray-400 mt-3">Loading cohorts...</p>
        </div>
      )}

      {/* Table */}
      {!loading && <CohortsTable cohorts={cohorts} onRowClick={handleRowClick} />}
    </div>
  );
}
