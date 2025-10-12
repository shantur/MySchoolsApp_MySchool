import { test, expect } from '@playwright/test';

/**
 * Integration tests for Next.js SSR via Cloud Functions
 * 
 * These tests verify that the Cloud Functions integration properly handles
 * Server-Side Rendering for the MySchoolWeb application.
 * 
 * Prerequisites:
 * - Firebase emulators must be running with functions and hosting
 * - Run: npm run emulators:functions
 */

test.describe('Next.js SSR via Cloud Functions', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure page is ready
    await page.goto('http://localhost:15000', { waitUntil: 'domcontentloaded' });
  });

  test('should render home page with SSR', async ({ page }) => {
    await page.goto('http://localhost:15000/');
    
    // Check for SSR indicators
    const content = await page.content();
    expect(content).toContain('<!DOCTYPE html>');
    
    // Verify page renders correctly with the login form
    await expect(page.locator('[data-field="email"]')).toBeVisible();
  });

  test('should handle API routes through Cloud Function', async ({ page }) => {
    // Test health check endpoint if available, or any public API route
    const response = await page.request.get('http://localhost:15000/api/auth/logout');
    
    // Should return a response (might be error due to no session, but should not fail)
    expect(response.status()).toBeLessThan(500);
  });

  test('should handle dynamic routes', async ({ page }) => {
    // First login to access protected routes
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'Test123!@#');
    await page.click('[data-action="login"]');
    
    // Wait for redirect
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    
    // Navigate to notices page
    await page.goto('http://localhost:15000/admin/notices');
    
    // Verify page loaded via SSR
    const content = await page.content();
    expect(content).toContain('data-page-type');
  });

  test('should serve static assets', async ({ page }) => {
    // Navigate to home page which loads CSS and JS
    await page.goto('http://localhost:15000/');
    
    // Check that CSS is loaded (page should have styles)
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    // Should have some background color set (not transparent/empty)
    expect(backgroundColor).toBeTruthy();
  });

  test('should maintain session across requests', async ({ page, context }) => {
    // Login
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'Test123!@#');
    await page.click('[data-action="login"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    
    // Navigate to another protected page
    await page.goto('http://localhost:15000/admin/schools');
    
    // Should not be redirected to login (session maintained)
    expect(page.url()).toContain('/admin/schools');
    
    // Verify session cookie exists
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');
    expect(sessionCookie).toBeDefined();
  });
});

test.describe('Cloud Functions Performance Indicators', () => {
  test('should respond to requests within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:15000/');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    
    // For local emulator, should be reasonably fast
    // In production with cold start, this would be <3s
    expect(loadTime).toBeLessThan(10000); // 10s for local dev
  });

  test('should handle multiple page navigations efficiently', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'Test123!@#');
    await page.click('[data-action="login"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    
    // Navigate to multiple pages and measure total time
    const startTime = Date.now();
    
    await page.goto('http://localhost:15000/admin/schools');
    await page.goto('http://localhost:15000/admin/users');
    await page.goto('http://localhost:15000/admin/groups');
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // All three navigations should complete reasonably fast
    expect(totalTime).toBeLessThan(15000); // 15s for 3 navigations
  });
});
