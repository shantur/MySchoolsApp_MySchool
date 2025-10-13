import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for MySchoolWeb Cloud Functions E2E Tests
 * 
 * This configuration is optimized for testing Cloud Functions integration
 * with Next.js SSR in portrait orientation, focusing on positive and negative
 * core scenarios only (no edge cases, performance, or load testing).
 */
export default defineConfig({
  testDir: './tests/integration',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for Cloud Functions testing
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests for Cloud Functions */
  workers: 1,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'test-results/cloud-functions-e2e', open: 'never' }],
    ['json', { outputFile: 'test-results/cloud-functions-e2e-results.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use - Cloud Functions hosting emulator */
    baseURL: 'http://127.0.0.1:15001/myschools-app-dev/us-central1/nextjsFunc',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 15000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for browsers with portrait orientation */
  projects: [
    {
      name: 'chromium-portrait',
      use: {
        ...devices['Pixel 5'], // Portrait mobile device
        viewport: { width: 393, height: 851 }, // Portrait orientation
      },
    },

    {
      name: 'webkit-portrait',
      use: {
        ...devices['iPhone 12'], // Portrait mobile device
        viewport: { width: 390, height: 844 }, // Portrait orientation
      },
    },
  ],

  /* Global timeout for each test */
  timeout: 60000, // 60 seconds per test

  /* Expect timeout */
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
});
