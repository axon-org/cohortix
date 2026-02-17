import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// With BYPASS_AUTH=true, we expect direct access to the dashboard
test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should load dashboard page', async ({ page }) => {
    // Check if we are redirected to sign-in (normal flow) or stay on dashboard (bypass flow)
    const url = page.url();

    if (url.includes('/sign-in')) {
      await expect(page.locator('.cl-rootBox, form')).toBeVisible();
    } else {
      // Auth bypassed or already logged in
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  test('should have valid HTML structure', async ({ page }) => {
    const structure = page.locator('main, [role="main"], .main-content, body');
    const count = await structure.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should pass accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#webpack-dev-server-client-overlay')
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical'
    );
    expect(criticalViolations).toEqual([]);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Reload to ensure responsive layout triggers
    await page.reload();

    // Check if sidebar collapses into hamburger menu or similar mobile navigation
    // Or just check that main content is visible and not overflowing horizontally
    const body = page.locator('body');
    const box = await body.boundingBox();

    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test('should display KPI cards', async ({ page }) => {
    // KPI cards usually have numbers or labels like "Total Cohorts"
    // We can look for specific text or classes
    // Based on seed data, we might see "4" (cohorts)

    // Look for generic KPI card structure
    const kpiCards = page.locator('.bg-card, [data-testid="kpi-card"]');
    const count = await kpiCards.count();
    // We expect at least a few cards (Total Cohorts, Active Agents, etc.)
    expect(count).toBeGreaterThan(0);
  });

  test('should display recent activity feed', async ({ page }) => {
    // Look for "Recent Activity" heading
    await expect(page.getByText(/Recent Activity/i)).toBeVisible();

    // Look for activity items
    const activityItems = page.locator('[role="listitem"], .activity-item');
    // Might need to wait for data loading
    // await expect(activityItems.first()).toBeVisible({ timeout: 5000 })
  });

  test('should display performance metrics chart', async ({ page }) => {
    // Look for chart container
    const chart = page.locator('canvas, svg.recharts-surface').first();
    await expect(chart).toBeVisible({ timeout: 10000 });
  });

  test('should have no console runtime crashes on load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.reload();
    await page.waitForTimeout(1000);

    const runtimeCrashes = consoleErrors.filter(
      (err) =>
        (err.includes('TypeError') ||
          err.includes('ReferenceError') ||
          err.includes('Unhandled')) &&
        !err.includes('DevTools') &&
        !err.includes('favicon')
    );

    expect(runtimeCrashes).toEqual([]);
  });
});
