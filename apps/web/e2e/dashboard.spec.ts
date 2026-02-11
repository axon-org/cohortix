/**
 * E2E Tests - Dashboard Loading
 * Codex v1.2 Section 4.3
 * 
 * Tests dashboard page load and initial render:
 * - Page loads successfully
 * - All KPI cards render
 * - Charts load
 * - Accessibility compliance
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real scenario, we'd need to authenticate first
    // For now, we'll test the public-facing aspects or unauthenticated behavior
    await page.goto('/')
  })

  test('should load dashboard page or redirect to sign-in', async ({ page }) => {
    // Dashboard may redirect to /sign-in if not authenticated
    // We check for either scenario
    
    const currentUrl = page.url()
    
    if (currentUrl.includes('/sign-in')) {
      // Not authenticated - verify sign-in page loads
      await expect(page).toHaveTitle(/Sign In/)
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeVisible()
    } else {
      // Authenticated or public dashboard - verify it loads
      await expect(page).toHaveTitle(/Dashboard|Cohortix/)
      
      // Check that page content loads (not just blank)
      const body = await page.textContent('body')
      expect(body).toBeTruthy()
      expect(body!.length).toBeGreaterThan(100)
    }
  })

  test('should have valid HTML structure', async ({ page }) => {
    // Check for main structural elements
    const main = page.locator('main, [role="main"], .main-content')
    const mainCount = await main.count()
    expect(mainCount).toBeGreaterThan(0)
  })

  test('should pass accessibility checks', async ({ page }) => {
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#webpack-dev-server-client-overlay') // Exclude dev overlay if present
      .analyze()

    // Log violations for debugging if any exist
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations:', JSON.stringify(accessibilityScanResults.violations, null, 2))
    }

    // Assert no critical violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(criticalViolations).toEqual([])
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Reload page
    await page.reload()

    // Check that content is still visible and not overflowing
    const body = page.locator('body')
    const box = await body.boundingBox()
    
    expect(box).toBeTruthy()
    expect(box!.width).toBeLessThanOrEqual(375)
  })

  test('should have no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter out known acceptable errors (like dev-only warnings)
    const criticalErrors = consoleErrors.filter(
      err => !err.includes('DevTools') && 
             !err.includes('favicon') &&
             !err.includes('Download the React DevTools')
    )

    expect(criticalErrors).toEqual([])
  })
})

test.describe('Dashboard - Authenticated User', () => {
  // This test assumes we can set up authentication
  // In a real scenario, you'd use a test account or mock auth
  
  test.skip('should display KPI cards when authenticated', async ({ page }) => {
    // TODO: Implement authentication setup
    // For now, this test is skipped
    
    // Mock or set authentication
    // await authenticateUser(page)
    
    await page.goto('/')

    // Check for KPI cards
    const kpiCards = page.locator('[data-testid*="kpi"], .kpi-card')
    const cardCount = await kpiCards.count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test.skip('should display charts when authenticated', async ({ page }) => {
    // TODO: Implement authentication setup
    
    await page.goto('/')

    // Check for chart elements (canvas, svg, etc.)
    const charts = page.locator('canvas, svg.chart, [data-testid*="chart"]')
    const chartCount = await charts.count()
    expect(chartCount).toBeGreaterThan(0)
  })

  test.skip('should display recent activity feed', async ({ page }) => {
    // TODO: Implement authentication setup
    
    await page.goto('/')

    // Check for activity feed
    const activityFeed = page.locator('[data-testid="recent-activity"], .activity-feed')
    await expect(activityFeed).toBeVisible()
  })
})

test.describe('Dashboard Performance', () => {
  test('should load within acceptable time (Core Web Vitals)', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime

    // Should load within 3 seconds (generous for local dev)
    // In production with CDN, target would be <2 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have good Largest Contentful Paint (LCP)', async ({ page }) => {
    await page.goto('/')

    // Measure LCP using Performance API
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
          resolve(lastEntry.renderTime || lastEntry.loadTime || 0)
        }).observe({ entryTypes: ['largest-contentful-paint'] })

        // Timeout after 10 seconds
        setTimeout(() => resolve(0), 10000)
      })
    })

    // LCP should be less than 2.5 seconds (Good threshold)
    expect(lcp).toBeGreaterThan(0)
    expect(lcp).toBeLessThan(2500)
  })
})
