/**
 * E2E Health Checks
 * Lightweight smoke checks for key auth and health endpoints.
 */

import { test, expect } from '@playwright/test';

test.describe('E2E Health', () => {
  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/sign-in/);

    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText?.length ?? 0).toBeGreaterThan(10);
  });

  test('health endpoint responds', async ({ request }) => {
    const healthResponse = await request.get('/api/health');
    if (healthResponse.status() !== 200) {
      const readyResponse = await request.get('/api/ready');
      expect(readyResponse.status()).toBe(200);
    } else {
      expect(healthResponse.status()).toBe(200);
    }
  });

  test('unauthenticated dashboard redirects to sign-in', async ({ browser }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string | undefined;
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    // Clerk may redirect to /sign-in, /onboarding, or its handshake URL
    // depending on auth state and browser cookies. All are valid unauthenticated outcomes.
    await expect(page).toHaveURL(/sign-in|onboarding|handshake/);

    await context.close();
  });
});
