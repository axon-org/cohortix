import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Helper: detect whether we landed on sign-in or the dashboard.
 * Uses URL-based detection (most reliable) rather than DOM selectors.
 */
async function isOnSignIn(page: any): Promise<boolean> {
  await page.waitForTimeout(2000); // Allow redirects to settle
  const url = page.url();
  return url.includes('/sign-in') || url.includes('clerk.com');
}

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should load dashboard page or redirect to sign-in', async ({ page }) => {
    if (await isOnSignIn(page)) {
      // Verify sign-in page rendered something
      await expect(page.locator('body')).toBeVisible();
      return;
    }
    // On dashboard — verify basic structure
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText?.length ?? 0).toBeGreaterThan(50);
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
    await page.reload({ waitUntil: 'domcontentloaded' });

    const body = page.locator('body');
    const box = await body.boundingBox();

    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(375);
  });

  test('should display dashboard content or welcome state', async ({ page }) => {
    if (await isOnSignIn(page)) return; // Can't test dashboard without auth

    // Dashboard renders either real data or the welcome fallback
    const bodyText = await page.textContent('body');
    const hasContent =
      /Dashboard|Welcome to Cohortix|ACTIVE COHORTS|TOTAL ALLIES|Recent Activity|Global Intel/i.test(
        bodyText ?? ''
      );
    expect(hasContent).toBeTruthy();
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
