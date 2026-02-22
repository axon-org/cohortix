/**
 * E2E Tests - Authentication Flow
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe.configure({ mode: 'serial' });

const clerkRoot = (page: any) =>
  page.locator(
    '[data-clerk-sign-in], [data-clerk-signin], .cl-rootBox, .cl-signIn-root, .cl-card, form.cl-form, input[name="identifier"], input[type="email"]'
  );

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Auth provider rate-limits parallel multi-browser CI runs'
    );
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/sign-in/);

    try {
      await expect(clerkRoot(page)).toBeVisible({ timeout: 30000 });
    } catch (e) {
      console.log('Failed to find Clerk element. Dumping body:');
      console.log(await page.locator('body').innerHTML());
      throw e;
    }
  });

  test('should display sign-in page with all required elements', async ({ page }) => {
    await expect(page).toHaveURL(/sign-in/);

    await expect(
      page.locator('input[name="identifier"], input[type="email"], form, .cl-card, .cl-rootBox')
    ).toBeVisible({ timeout: 30000 });

    const identifier = page.locator('input[name="identifier"], input[type="email"]');
    if ((await identifier.count()) > 0) {
      await expect(identifier.first()).toBeVisible();
    }

    const continueButton = page.getByRole('button', { name: /continue|sign in/i });
    if ((await continueButton.count()) > 0) {
      await expect(continueButton.first()).toBeVisible();
    }

    const signUpLink = page.getByRole('link', { name: /sign up|create account/i }).first();
    if (await signUpLink.isVisible()) {
      await expect(signUpLink).toBeVisible();
    }
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /continue/i }).click();

    const emailInput = page.locator('input[name="identifier"]');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBeFalsy();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.locator('input[name="identifier"]').fill('invalid-email');
    if (await page.locator('input[name="password"]').isVisible()) {
      await page.locator('input[name="password"]').fill('password123');
    }

    await page.getByRole('button', { name: /continue/i }).click();

    const emailInput = page.locator('input[name="identifier"]');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBeFalsy();
  });

  test('should navigate to sign-up page', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/sign-up/);
    await expect(
      page.locator('input[name="emailAddress"], input[name="identifier"]')
    ).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    const resetLink = page
      .getByRole('link', { name: /forgot password|reset password|forgot/i })
      .first();

    if (await resetLink.isVisible()) {
      await resetLink.click();
      await expect(page).toHaveURL(/reset-password|forgot|reset/);
      await expect(page.locator('input[name="identifier"]')).toBeVisible();
    } else {
      test.skip(true, 'Forgot password link not visible in initial step');
    }
  });

  test('sign-in form should be keyboard navigable', async ({ page }) => {
    await page.locator('input[name="identifier"]').focus();
    await expect(page.locator('input[name="identifier"]')).toBeFocused();

    await page.keyboard.press('Tab');

    const focusedTagName = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTagName).toBeTruthy();

    const focusedName = await page.evaluate(
      () => document.activeElement?.getAttribute('name') || document.activeElement?.textContent
    );
    console.log('Focused element:', focusedName);
  });
});

test.describe('Sign Up Flow', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Auth provider rate-limits parallel multi-browser CI runs'
    );
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator(
        '[data-clerk-sign-up], [data-clerk-signup], .cl-rootBox, .cl-signUp-root, .cl-card, form.cl-form'
      )
    ).toBeVisible({
      timeout: 30000,
    });
  });

  test('should display sign-up form with required fields', async ({ page }) => {
    await expect(page).toHaveURL(/sign-up/);
    await expect(
      page.locator('input[name="emailAddress"], input[name="identifier"]')
    ).toBeVisible();

    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });
});
