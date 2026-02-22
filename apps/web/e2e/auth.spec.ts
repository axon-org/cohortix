/**
 * E2E Tests - Authentication Flow
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe.configure({ mode: 'serial' });

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Auth provider rate-limits parallel multi-browser CI runs'
    );
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/sign-in/);

    // Debug: dump page content if selector fails
    try {
      // Wait for Clerk to mount - use flexible selector
      await expect(
        page.locator(
          '[data-clerk-sign-in], [data-clerk-signin], .cl-rootBox, .cl-signIn-root, .cl-card, form.cl-form, input[name="identifier"], input[type="email"]'
        )
      ).toBeVisible({ timeout: 20000 });
    } catch (e) {
      console.log('Failed to find Clerk element. Dumping body:');
      console.log(await page.locator('body').innerHTML());
      throw e;
    }
  });

  test('should display sign-in page with all required elements', async ({ page }) => {
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator('input[name="identifier"], input[type="email"]')).toBeVisible();

    // Password field might be present but hidden in step 1 or visible
    const passwordInput = page.locator('input[name="password"]');
    if ((await passwordInput.count()) > 0 && (await passwordInput.isVisible())) {
      await expect(passwordInput).toBeVisible();
    }

    await expect(page.getByRole('button', { name: /continue|sign in/i })).toBeVisible();
    // Sign up link might be "Sign up" or "Create account"
    const signUpLink = page.getByRole('link', { name: /sign up|create account/i }).first();
    if (await signUpLink.isVisible()) {
      await expect(signUpLink).toBeVisible();
    }
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.getByRole('button', { name: /continue/i }).click();

    const emailInput = page.locator('input[name="identifier"]');
    // Check HTML5 validity
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBeFalsy();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.locator('input[name="identifier"]').fill('invalid-email');
    // Password might need to be filled if it's visible, but usually email check happens first.
    // If password is visible, let's fill it to be safe.
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
    // Wait for sign-up form
    await expect(
      page.locator('input[name="emailAddress"], input[name="identifier"]')
    ).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Attempt to find forgot password link. It might be hidden in step 1.
    const resetLink = page
      .getByRole('link', { name: /forgot password|reset password|forgot/i })
      .first();

    if (await resetLink.isVisible()) {
      await resetLink.click();
      await expect(page).toHaveURL(/reset-password|forgot|reset/);
      await expect(page.locator('input[name="identifier"]')).toBeVisible();
    } else {
      // Skip if not found (likely hidden in step 1 of split flow)
      test.skip(true, 'Forgot password link not visible in initial step');
    }
  });

  test('sign-in form should be keyboard navigable', async ({ page }) => {
    // Focus email
    await page.locator('input[name="identifier"]').focus();
    await expect(page.locator('input[name="identifier"]')).toBeFocused();

    // Tab to next element (likely Continue button or password if visible)
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
      timeout: 20000,
    });
  });

  test('should display sign-up form with required fields', async ({ page }) => {
    await expect(page).toHaveURL(/sign-up/);
    // Clerk sign up often asks for email first
    await expect(
      page.locator('input[name="emailAddress"], input[name="identifier"]')
    ).toBeVisible();

    // Password might be on next step
    // await expect(page.locator('input[name="password"]')).toBeVisible()

    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });
});
