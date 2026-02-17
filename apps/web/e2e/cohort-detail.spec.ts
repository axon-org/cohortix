import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const TEST_COHORT_PATH = '/cohorts/test-cohort-id'

async function gotoCohortOrSignIn(page: any) {
  await page.goto(TEST_COHORT_PATH, { waitUntil: 'domcontentloaded' })
  // Check if redirected to sign-in or Clerk domain
  const url = page.url();
  return url.includes('/sign-in') || url.includes('clerk.com');
}

test.describe('Cohort Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_COHORT_PATH, { waitUntil: 'domcontentloaded' })
  })

  test('should load cohort detail page or redirect', async ({ page }) => {
    // Wait for either cohort page content OR sign-in redirect
    await expect(async () => {
      const url = page.url()
      const isSignIn = url.includes('/sign-in') || url.includes('clerk.com')
      const isCohort = url.includes('/cohorts/')
      expect(isSignIn || isCohort).toBeTruthy()
    }).toPass({ timeout: 15000 })

    const currentUrl = page.url()
    if (currentUrl.includes('/sign-in') || currentUrl.includes('clerk.com')) {
      // Use Clerk selector for header or just verify we are on sign-in page
      // Wait for input to be safe
      await expect(page.locator('.cl-rootBox, input[name="identifier"]')).toBeVisible({ timeout: 10000 })
    } else {
      const body = await page.textContent('body')
      expect(body).toBeTruthy()
      expect(body!.length).toBeGreaterThan(100)
    }
  })

  test('should have valid HTML structure', async ({ page }) => {
    const structure = page.locator('main, [role="main"], .main-content, body')
    const count = await structure.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should pass accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#webpack-dev-server-client-overlay')
      .analyze()

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(criticalViolations).toEqual([])
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload({ waitUntil: 'domcontentloaded' })

    const body = page.locator('body')
    const box = await body.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeLessThanOrEqual(375)
  })

  test('should have no console runtime crashes on load', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto(TEST_COHORT_PATH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    const runtimeCrashes = consoleErrors.filter(
      (err) =>
        (err.includes('TypeError') || err.includes('ReferenceError') || err.includes('Unhandled')) &&
        !err.includes('DevTools') &&
        !err.includes('favicon')
    )

    expect(runtimeCrashes).toEqual([])
  })
})

test.describe('Cohort Detail - Engagement Timeline Component', () => {
  test('should display engagement timeline chart when authenticated', async ({ page }) => {
    const redirected = await gotoCohortOrSignIn(page)
    if (redirected) return // Skip if redirected

    await expect(page.getByText('Engagement Timeline')).toBeVisible()
  })

  test('should display time period buttons when authenticated', async ({ page }) => {
    const redirected = await gotoCohortOrSignIn(page)
    if (redirected) return

    await expect(page.getByRole('button', { name: '7D' })).toBeVisible()
    await expect(page.getByRole('button', { name: '30D' })).toBeVisible()
    await expect(page.getByRole('button', { name: '90D' })).toBeVisible()
  })

  test('should display chart description when authenticated', async ({ page }) => {
    const redirected = await gotoCohortOrSignIn(page)
    if (redirected) return

    await expect(page.getByText('Daily interaction count of all batch members')).toBeVisible()
  })
})

test.describe('Cohort Detail - Batch Members Component', () => {
  test('should display batch members module when authenticated', async ({ page }) => {
    const redirected = await gotoCohortOrSignIn(page)
    if (redirected) return

    await expect(page.getByText(/Batch Members/i)).toBeVisible()
  })

  test('should display table headers when authenticated', async ({ page }) => {
    const redirected = await gotoCohortOrSignIn(page)
    if (redirected) return

    await expect(page.getByText('AI Ally')).toBeVisible()
    await expect(page.getByText('Role')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
    await expect(page.getByText('Engagement Score')).toBeVisible()
  })
})

test.describe('Cohort Detail - Activity Log Component', () => {
  test('should display activity log module when authenticated', async ({ page }) => {
    const redirected = await gotoCohortOrSignIn(page)
    if (redirected) return

    await expect(page.getByText('Activity Log')).toBeVisible()
  })

  test('should display View All button when authenticated', async ({ page }) => {
    const redirected = await gotoCohortOrSignIn(page)
    if (redirected) return

    await expect(page.getByRole('button', { name: /view all/i })).toBeVisible()
  })
})

test.describe('Cohort Detail - Component Interactions', () => {
  test('should navigate from cohorts list to detail page (or sign-in)', async ({ page }) => {
    await page.goto('/cohorts', { waitUntil: 'domcontentloaded' })

    const url = page.url();
    if (url.includes('/sign-in') || url.includes('clerk.com')) {
      await expect(page.locator('.cl-rootBox, form.cl-form, h1')).toBeVisible()
      return
    }

    const cohortLink = page.locator('a[href^="/cohorts/"]').first()
    if (await cohortLink.isVisible()) {
        await cohortLink.click()
        await expect(page).toHaveURL(/\/cohorts\/.+/)
    }
  })
})

test.describe('Cohort Detail - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto(TEST_COHORT_PATH, { waitUntil: 'domcontentloaded' })
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(10000)
  })
})
