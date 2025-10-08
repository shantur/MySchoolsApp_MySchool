import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for ARIA Improvements E2E Tests
 * 
 * This configuration is optimized for testing ARIA improvements
 * using the existing server on port 3000.
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI and for authentication tests. */
  workers: 1,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['json', { outputFile: 'test-results-aria.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['iPhone 12'], // Portrait orientation mobile device
        viewport: { width: 390, height: 844 }, // iPhone 12 portrait dimensions
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    
    {
      name: 'webkit',
      use: {
        ...devices['iPhone 12'], // Portrait orientation mobile device
        viewport: { width: 390, height: 844 }, // iPhone 12 portrait dimensions
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  /* Use existing server - don't start a new one */
  webServer: undefined,
  
  /* Global setup and teardown */
  globalSetup: './tests/e2e/global-setup.ts',
  
  /* Test timeout */
  timeout: 60000,
  
  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
});