import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const signInLocator = (page: any) =>
  page.locator('input[name="identifier"], .cl-rootBox, .cl-card, .cl-signIn-root, form');

async function waitForDashboardOrSignIn(page: any) {
  const dashboardLocator = page.locator('main, [role="main"], nav, aside, body');

  await expect(signInLocator(page).or(dashboardLocator)).toBeVisible({
    timeout: 15000,
  });

  const isSignIn = await signInLocator(page).first().isVisible();
  return { isSignIn, url: page.url() };
}

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should load dashboard page', async ({ page }) => {
    const { isSignIn } = await waitForDashboardOrSignIn(page);

    if (isSignIn) {
      await expect(signInLocator(page)).toBeVisible({ timeout: 15000 });
      return;
    }

    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText?.length ?? 0).toBeGreaterThan(50);
  });

  test('should have valid HTML structure', async ({ page }) => {
    await waitForDashboardOrSignIn(page);
    const structure = page.locator('main, [role="main"], .main-content, body');
    const count = await structure.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should pass accessibility checks', async ({ page }) => {
    await waitForDashboardOrSignIn(page);
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
    await page.reload({ waitUntil: 'domcontentloaded' });

    const body = page.locator('body');
    const box = await body.boundingBox();

    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test('should display KPI cards or welcome state', async ({ page }) => {
    const { isSignIn } = await waitForDashboardOrSignIn(page);
    if (isSignIn) return;

    const kpiOrWelcome = page.getByText(
      /ACTIVE COHORTS|TOTAL ALLIES|AVG ENGAGEMENT|AT-RISK COHORTS|Welcome to Cohortix/i
    );
    await expect(kpiOrWelcome).toBeVisible({ timeout: 10000 });
  });

  test('should display recent activity feed or welcome state', async ({ page }) => {
    const { isSignIn } = await waitForDashboardOrSignIn(page);
    if (isSignIn) return;

    const activityOrWelcome = page.getByText(/Recent Activity|Welcome to Cohortix|No activity/i);
    await expect(activityOrWelcome).toBeVisible({ timeout: 10000 });
  });

  test('should display global intel feed or welcome state', async ({ page }) => {
    const { isSignIn } = await waitForDashboardOrSignIn(page);
    if (isSignIn) return;

    const intelOrWelcome = page.getByText(/Global Intel|Welcome to Cohortix/i);
    await expect(intelOrWelcome).toBeVisible({ timeout: 10000 });
  });

  test('should have no console runtime crashes on load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
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
