/**
 * E2E Tests - Authentication Flow
 * Codex v1.2 Section 4.3
 *
 * Tests critical authentication user journeys including:
 * - Login flow
 * - Sign up flow
 * - Password reset flow
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the sign-in page
    await page.goto('/sign-in');
  });

  test('should display sign-in page with all required elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sign In/);

    // Check for email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('name', 'email');

    // Check for password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('name', 'password');

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText(/sign in/i);

    // Check for sign-up link
    const signUpLink = page.locator('a[href*="sign-up"]');
    await expect(signUpLink).toBeVisible();

    // Check for forgot password link
    const forgotPasswordLink = page.locator('a[href*="forgot-password"]');
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Check for validation messages
    // Note: Actual validation behavior depends on form implementation
    await page.waitForTimeout(500);

    // Email field should have required attribute or show error
    const emailInput = page.locator('input[type="email"]');
    const isEmailRequired = await emailInput.getAttribute('required');
    expect(isEmailRequired).toBeTruthy();
  });

  test('should show error for invalid email format', async ({ page }) => {
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Check for HTML5 validation or custom error message
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    // HTML5 validation should catch this
    expect(validationMessage).toBeTruthy();
  });

  test('should navigate to sign-up page', async ({ page }) => {
    // Click sign-up link
    await page.click('a[href*="sign-up"]');

    // Verify navigation
    await expect(page).toHaveURL(/sign-up/);
    await expect(page).toHaveTitle(/Sign Up/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.click('a[href*="forgot-password"]');

    // Verify navigation
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page).toHaveTitle(/Forgot Password|Reset Password/);
  });

  test('should pass accessibility checks on sign-in page', async ({ page }) => {
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Assert no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('sign-in form should be keyboard navigable', async ({ page }) => {
    // Focus should start on email field or be tabbable
    await page.keyboard.press('Tab');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();

    // Tab to password field
    await page.keyboard.press('Tab');
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeFocused();

    // Tab to submit button
    await page.keyboard.press('Tab');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();

    // Should be able to submit with Enter
    await page.keyboard.press('Enter');
    // Form will attempt to submit (validation will catch empty fields)
  });
});

test.describe('Sign Up Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
  });

  test('should display sign-up form with required fields', async ({ page }) => {
    await expect(page).toHaveTitle(/Sign Up/);

    // Check for name/email/password fields (adjust based on actual form)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should pass accessibility checks on sign-up page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Forgot Password Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('should display password reset form', async ({ page }) => {
    await expect(page).toHaveTitle(/Forgot Password|Reset Password/);

    // Check for email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should pass accessibility checks on forgot password page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
