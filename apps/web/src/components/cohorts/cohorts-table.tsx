// Cohortix Sprint 2: Cohorts Data Table Component (COH-F2)
// Author: Sami (Frontend) - Task brief: /tmp/sami-sprint2-frontend.md
// Date: 2026-02-12
// Design: Linear-inspired dark theme, mockup 02-cohort-grid-linear-dark.png

import Link from 'next/link';

export interface CohortRow {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'at-risk' | 'completed';
  members_count: number;
  avg_engagement: number;
  start_date: string | null;
}

interface CohortsTableProps {
  cohorts: CohortRow[];
  onRowClick?: (cohortId: string) => void;
}

export function CohortsTable({ cohorts, onRowClick }: CohortsTableProps) {
  const statusStyles = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'at-risk': 'bg-red-500/20 text-red-400 border-red-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  if (cohorts.length === 0) {
    return (
      <div className="bg-[#1A1A1E] rounded-lg p-12 text-center">
        <p className="text-gray-400">No cohorts found</p>
        <p className="text-sm text-gray-500 mt-2">Create your first cohort to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1E] rounded-lg overflow-hidden border border-[#2A2A2E]">
      <table className="w-full">
        <thead className="bg-[#0A0A0B] border-b border-[#2A2A2E]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Members
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Engagement
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Start Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A2A2E]">
          {cohorts.map((cohort) => (
            <tr
              key={cohort.id}
              className="hover:bg-[#202025] cursor-pointer transition-colors"
              onClick={() => onRowClick?.(cohort.id)}
            >
              <td className="px-6 py-4">
                <Link href={`/cohorts/${cohort.id}`} className="text-white hover:text-blue-400 font-medium">
                  {cohort.name}
                </Link>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    statusStyles[cohort.status]
                  }`}
                >
                  {cohort.status}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-300">
                {cohort.members_count || 0}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                      style={{ width: `${cohort.avg_engagement}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-10 text-right">
                    {Math.round(cohort.avg_engagement)}%
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-300">
                {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : '—'}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Open actions menu
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Actions"
                >
                  •••
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
