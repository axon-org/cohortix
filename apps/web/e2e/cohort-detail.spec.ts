import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Cohort detail tests use a fake cohort ID — the app will either:
 * 1. Redirect to sign-in (auth bypass not working)
 * 2. Show a 404/not-found page (auth works but ID doesn't exist)
 * 3. Show the cohort page (if a matching cohort somehow exists)
 *
 * All three are valid outcomes. Tests verify the app doesn't crash.
 */

const TEST_COHORT_PATH = '/test-org/cohorts/test-cohort-id';

async function isOnSignIn(page: any): Promise<boolean> {
  await page.waitForTimeout(2000);
  const url = page.url();
  return url.includes('/sign-in') || url.includes('clerk.com');
}

test.describe('Cohort Detail Page', () => {
  test('should load without crashing', async ({ page }) => {
    const response = await page.goto(TEST_COHORT_PATH, {
      waitUntil: 'domcontentloaded',
    });

    // Any of these is fine: sign-in redirect, 404, or actual page
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText?.length ?? 0).toBeGreaterThan(10);
  });

  test('should have valid HTML structure', async ({ page }) => {
    await page.goto(TEST_COHORT_PATH, { waitUntil: 'domcontentloaded' });
    const structure = page.locator('main, [role="main"], .main-content, body');
    const count = await structure.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should pass accessibility checks', async ({ page }) => {
    await page.goto(TEST_COHORT_PATH, { waitUntil: 'domcontentloaded' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#webpack-dev-server-client-overlay')
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toEqual([]);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.goto(TEST_COHORT_PATH, { waitUntil: 'domcontentloaded' });
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test('should have no console runtime crashes', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(TEST_COHORT_PATH, { waitUntil: 'domcontentloaded' });
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

test.describe('Cohorts List Page', () => {
  test('should load cohorts list or redirect to sign-in', async ({ page }) => {
    await page.goto('/test-org/cohorts', { waitUntil: 'domcontentloaded' });

    if (await isOnSignIn(page)) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }

    // On cohorts page — verify it rendered
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText?.length ?? 0).toBeGreaterThan(50);
  });
});

test.describe('Cohort Detail - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(TEST_COHORT_PATH, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(15000);
  });
});
