/**
 * E2E Tests - Authentication Flow
 *
 * These tests verify the sign-in and sign-up pages render correctly.
 * They do NOT require auth bypass since they test the public auth pages.
 */

import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Authentication Flow', () => {
  test('should render sign-in page', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/sign-in/);

    // Wait for Clerk to mount — it loads async, give it plenty of time
    const clerkMounted = page.locator(
      'input[name="identifier"], input[type="email"], .cl-rootBox, .cl-card, [data-clerk-sign-in]'
    );
    await expect(clerkMounted).toBeVisible({ timeout: 30000 });
  });

  test('should render sign-up page', async ({ page }) => {
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/sign-up/);

    const clerkMounted = page.locator(
      'input[name="emailAddress"], input[name="identifier"], .cl-rootBox, .cl-card, [data-clerk-sign-up]'
    );
    await expect(clerkMounted).toBeVisible({ timeout: 30000 });
  });

  test('should have keyboard-navigable sign-in form', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input[name="identifier"], input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 30000 });

    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();
  });
});
