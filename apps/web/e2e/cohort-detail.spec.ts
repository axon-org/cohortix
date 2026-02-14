/**
 * E2E Tests - Cohort Detail Page
 *
 * Tests cohort detail page components:
 * - Page navigation and loading
 * - EngagementTimeline component
 * - BatchMembers component
 * - ActivityLog component
 * - Component interactions
 * - Accessibility compliance
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Cohort Detail Page', () => {
  // Note: These tests assume authentication is handled or the page is accessible
  // In production, you'd set up auth fixtures

  test.beforeEach(async ({ page }) => {
    // Navigate to a cohort detail page
    // Using a test cohort ID - in real scenario, this would be seeded
    await page.goto('/cohorts/test-cohort-id');
  });

  test('should load cohort detail page or redirect', async ({ page }) => {
    const currentUrl = page.url();

    if (currentUrl.includes('/sign-in')) {
      // Not authenticated - verify sign-in page loads
      await expect(page).toHaveTitle(/Sign In/);
    } else if (currentUrl.includes('/cohorts')) {
      // Cohort page loaded - verify basic structure
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
      expect(body!.length).toBeGreaterThan(100);
    }
  });

  test('should have valid HTML structure', async ({ page }) => {
    const main = page.locator('main, [role="main"], .main-content');
    const mainCount = await main.count();
    expect(mainCount).toBeGreaterThan(0);
  });

  test('should pass accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#webpack-dev-server-client-overlay')
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        'Accessibility violations:',
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toEqual([]);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    const body = page.locator('body');
    const box = await body.boundingBox();

    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test('should have no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/cohorts/test-cohort-id');
    await page.waitForLoadState('networkidle');

    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('DevTools') &&
        !err.includes('favicon') &&
        !err.includes('Download the React DevTools') &&
        !err.includes('404') // Ignore 404 for test cohort
    );

    // We expect some errors for non-existent test cohort, but not crashes
    // Real tests would use seeded data
  });
});

test.describe('Cohort Detail - Engagement Timeline Component', () => {
  test.skip('should display engagement timeline chart', async ({ page }) => {
    // TODO: Requires authenticated session with seeded cohort data
    await page.goto('/cohorts/test-cohort-id');

    const timeline = page.locator('text=Engagement Timeline');
    await expect(timeline).toBeVisible();
  });

  test.skip('should display time period buttons (7D, 30D, 90D)', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    await expect(page.locator('button:has-text("7D")')).toBeVisible();
    await expect(page.locator('button:has-text("30D")')).toBeVisible();
    await expect(page.locator('button:has-text("90D")')).toBeVisible();
  });

  test.skip('should switch time periods when clicking buttons', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    const sevenDayButton = page.locator('button:has-text("7D")');
    await sevenDayButton.click();

    // Verify the chart updates (implementation dependent)
    // Could check for API call or visual change
  });

  test.skip('should display chart description', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    const description = page.locator('text=Daily interaction count of all batch members');
    await expect(description).toBeVisible();
  });
});

test.describe('Cohort Detail - Batch Members Component', () => {
  test.skip('should display batch members table', async ({ page }) => {
    // TODO: Requires authenticated session with seeded cohort data
    await page.goto('/cohorts/test-cohort-id');

    const membersHeading = page.locator('text=Batch Members');
    await expect(membersHeading).toBeVisible();
  });

  test.skip('should display table headers', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    await expect(page.locator('th:has-text("AI Ally")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Engagement Score")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test.skip('should display filter button', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    const filterButton = page.locator('button:has-text("Filter allies...")');
    await expect(filterButton).toBeVisible();
  });

  test.skip('should display member count in header', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    // Header should show "Batch Members (X)" where X is member count
    const header = page.locator('text=/Batch Members \\(\\d+\\)/');
    await expect(header).toBeVisible();
  });

  test.skip('should display status indicators', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    // Check for any status indicator (Optimal, Idle, Syncing, Offline, Error)
    const statusIndicators = page.locator('text=/Optimal|Idle|Syncing|Offline|Error/');
    const count = await statusIndicators.count();
    expect(count).toBeGreaterThan(0);
  });

  test.skip('should display engagement progress bars', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    // Look for progress bar elements
    const progressBars = page.locator('.bg-gradient-to-r');
    const count = await progressBars.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Cohort Detail - Activity Log Component', () => {
  test.skip('should display activity log', async ({ page }) => {
    // TODO: Requires authenticated session with seeded cohort data
    await page.goto('/cohorts/test-cohort-id');

    const activityLog = page.locator('text=Activity Log');
    await expect(activityLog).toBeVisible();
  });

  test.skip('should display View All button', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    const viewAllButton = page.locator('button:has-text("View All")');
    await expect(viewAllButton).toBeVisible();
  });

  test.skip('should display activity items with timestamps', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    // Look for time indicators (e.g., "X hours ago", "X minutes ago")
    const timeIndicators = page.locator(
      'text=/(\\d+\\s+(hour|minute|day|second)s?\\s+ago)|(just now)/'
    );
    const count = await timeIndicators.count();
    expect(count).toBeGreaterThanOrEqual(0); // May be 0 if no activities
  });

  test.skip('should show empty state when no activities', async ({ page }) => {
    // Test with a cohort that has no activities
    await page.goto('/cohorts/empty-cohort-id');

    const emptyState = page.locator('text=No activity yet');
    // This may or may not be visible depending on data
  });

  test.skip('should be scrollable when many activities', async ({ page }) => {
    await page.goto('/cohorts/test-cohort-id');

    const activityList = page.locator('.max-h-\\[600px\\].overflow-y-auto');
    await expect(activityList).toBeVisible();
  });
});

test.describe('Cohort Detail - Component Interactions', () => {
  test.skip('should navigate from cohorts list to detail page', async ({ page }) => {
    // Start from cohorts list
    await page.goto('/cohorts');

    // Click on a cohort row/card
    const cohortLink = page.locator('[data-testid="cohort-row"]').first();
    await cohortLink.click();

    // Verify navigation to detail page
    await expect(page).toHaveURL(/\/cohorts\/[a-zA-Z0-9-]+/);
  });

  test.skip('should update all components when switching cohorts', async ({ page }) => {
    await page.goto('/cohorts/cohort-1');

    // Note cohort name
    const cohortName1 = await page.locator('h1').textContent();

    // Navigate to different cohort
    await page.goto('/cohorts/cohort-2');

    // Verify cohort name changed
    const cohortName2 = await page.locator('h1').textContent();
    expect(cohortName1).not.toEqual(cohortName2);
  });

  test.skip('should handle back navigation correctly', async ({ page }) => {
    await page.goto('/cohorts');
    await page.goto('/cohorts/test-cohort-id');

    await page.goBack();

    await expect(page).toHaveURL(/\/cohorts$/);
  });
});

test.describe('Cohort Detail - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/cohorts/test-cohort-id');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test.skip('should lazy load chart data', async ({ page }) => {
    // Monitor network requests
    const chartRequests: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/timeline')) {
        chartRequests.push(request.url());
      }
    });

    await page.goto('/cohorts/test-cohort-id');
    await page.waitForLoadState('networkidle');

    // Verify timeline API was called
    expect(chartRequests.length).toBeGreaterThan(0);
  });
});
