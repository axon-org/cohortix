/**
 * Cohort Utility Functions
 *
 * Helper functions for cohort operations including slug generation,
 * engagement calculations, and data transformations.
 */

/**
 * Generate a URL-friendly slug from a cohort name
 *
 * @param name - Cohort name
 * @param suffix - Optional unique suffix (e.g., timestamp or UUID)
 * @returns URL-safe slug
 *
 * @example
 * generateSlug('Spring 2024 Beta') // => 'spring-2024-beta'
 * generateSlug('Alpha Pioneers', '1234') // => 'alpha-pioneers-1234'
 */
export function generateSlug(name: string, suffix?: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end

  return suffix ? `${baseSlug}-${suffix}` : baseSlug;
}

/**
 * Calculate engagement percentage based on metrics
 *
 * @param activeMembers - Number of active members
 * @param totalMembers - Total member count
 * @returns Engagement percentage (0-100)
 *
 * @example
 * calculateEngagement(80, 100) // => 80.00
 * calculateEngagement(0, 0) // => 0
 */
export function calculateEngagement(activeMembers: number, totalMembers: number): number {
  if (totalMembers === 0) return 0;
  return Math.round((activeMembers / totalMembers) * 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Format cohort status for display
 *
 * @param status - Raw status enum value
 * @returns Human-readable status string
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    paused: 'Paused',
    'at-risk': 'At Risk',
    completed: 'Completed',
  };

  return statusMap[status] || status;
}

/**
 * Determine cohort health based on engagement
 *
 * @param engagementPercent - Engagement percentage
 * @returns Health status: 'healthy', 'warning', or 'at-risk'
 */
export function getCohortHealth(engagementPercent: number): 'healthy' | 'warning' | 'at-risk' {
  if (engagementPercent >= 70) return 'healthy';
  if (engagementPercent >= 50) return 'warning';
  return 'at-risk';
}

/**
 * Check if a cohort is overdue (past end date)
 *
 * @param endDate - Cohort end date
 * @returns true if cohort is overdue
 */
export function isOverdue(endDate: string | null): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

/**
 * Calculate days remaining until cohort end date
 *
 * @param endDate - Cohort end date
 * @returns Number of days remaining (negative if overdue, null if no end date)
 */
export function getDaysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;

  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
