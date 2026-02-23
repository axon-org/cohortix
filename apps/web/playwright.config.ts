import path from 'path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 * Codex v1.2 Section 4.3
 */
const repoRoot = path.resolve(__dirname, '../..');
const webPort = Number(process.env.PLAYWRIGHT_WEB_PORT || 3100);
const webBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${webPort}`;

export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentagent left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }], ['list']],

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: webBaseUrl,

    /* Force bypass auth for E2E tests if not explicitly disabled */
    extraHTTPHeaders: {
      'x-e2e-bypass-auth': process.env.E2E_BYPASS_SECRET || 'true',
    },

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: process.env.CI
    ? [
        /* CI: chromium only (others not installed) */
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        /* Mobile viewports */
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ],

  /* Run your local dev server before starting the tests (skip in CI when testing against preview URL) */
  ...(process.env.CI && process.env.PLAYWRIGHT_TEST_BASE_URL
    ? {}
    : {
        webServer: {
          command: `pnpm -C apps/web dev -p ${webPort}`,
          cwd: repoRoot,
          url: `${webBaseUrl}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }),
});
