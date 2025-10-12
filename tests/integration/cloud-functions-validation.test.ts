import { test, expect, Page } from '@playwright/test';

/**
 * Cloud Functions Integration E2E Tests
 * 
 * These tests validate that the Cloud Functions infrastructure fixes are working correctly:
 * 1. Source directory copying (app, components, lib, middleware)
 * 2. TypeScript path aliases (@/* resolving correctly)
 * 3. Symlink handling (no broken symlinks)
 * 4. Production mode strategy (NODE_ENV=production)
 * 
 * Test Strategy:
 * - Focus on positive and negative core scenarios only
 * - Portrait orientation only
 * - Validate SSR rendering, API routes, and session management through Cloud Functions
 * - Ensure no module resolution errors
 * 
 * Prerequisites:
 * - Firebase emulators must be running: npm run emulators:functions
 * - Functions must be built: npm run build:functions
 */

test.describe('Cloud Functions Infrastructure Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Store errors on page for later access
    (page as any).consoleErrors = consoleErrors;
  });

  test('CF-INFRA-001: should have all source directories properly copied', async ({ page }) => {
    // This test verifies that module imports from @/components and @/lib work correctly
    // by attempting to render pages that use these imports
    
    await page.goto('/login');
    
    // Check for module resolution errors in console
    const consoleErrors = (page as any).consoleErrors as string[];
    const moduleErrors = consoleErrors.filter((err: string) =>
      err.includes('Cannot find module') ||
      err.includes('Module not found') ||
      err.includes('@/components') ||
      err.includes('@/lib')
    );
    
    expect(moduleErrors).toHaveLength(0);
    
    // Verify page rendered successfully (ErrorBoundary from @/components should work)
    await expect(page.locator('[data-page-type="login"]')).toBeVisible({ timeout: 10000 });
  });

  test('CF-INFRA-002: should resolve TypeScript path aliases (@/*) correctly', async ({ page }) => {
    // Navigate to a page that heavily uses @/ imports
    await page.goto('/login');
    
    // Check console for path resolution errors
    const consoleErrors = (page as any).consoleErrors as string[];
    const pathAliasErrors = consoleErrors.filter((err: string) =>
      err.includes('@/') || err.includes('path alias')
    );
    
    expect(pathAliasErrors).toHaveLength(0);
    
    // Verify components from @/components render correctly
    await expect(page.locator('[data-field="email"]')).toBeVisible();
    await expect(page.locator('[data-field="password"]')).toBeVisible();
  });

  test('CF-INFRA-003: should execute middleware without symlink issues', async ({ page }) => {
    // Middleware should redirect unauthenticated users away from protected routes
    const response = await page.goto('/admin/dashboard');
    
    // Should be redirected to login (307 or similar redirect)
    // Or should see login page if already redirected client-side
    const finalUrl = page.url();
    expect(finalUrl).toContain('login');
    
    // No middleware execution errors
    const consoleErrors = (page as any).consoleErrors as string[];
    const middlewareErrors = consoleErrors.filter((err: string) =>
      err.toLowerCase().includes('middleware')
    );
    
    expect(middlewareErrors).toHaveLength(0);
  });

  test('CF-INFRA-004: should run in production mode with optimizations', async ({ page }) => {
    // Production mode should serve optimized builds
    await page.goto('/login');
    
    // Check that page loads successfully (production builds should work)
    await expect(page.locator('[data-page-type="login"]')).toBeVisible({ timeout: 10000 });
    
    // Verify no development-only warnings
    const consoleErrors = (page as any).consoleErrors as string[];
    const devWarnings = consoleErrors.filter((err: string) =>
      err.includes('development mode') || err.includes('dev mode')
    );
    
    expect(devWarnings).toHaveLength(0);
  });
});

test.describe('Cloud Functions SSR Rendering', () => {
  test('CF-SSR-001: should render home/login page with server-side rendering', async ({ page }) => {
    const response = await page.goto('/');
    
    // Verify SSR response
    expect(response?.status()).toBe(200);
    
    // Check for SSR indicators in HTML
    const content = await page.content();
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<html');
    
    // Verify page metadata (should be server-rendered)
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Verify main content rendered
    await expect(page.locator('[data-page-type="login"]')).toBeVisible({ timeout: 10000 });
  });

  test('CF-SSR-002: should handle SSR for dynamic admin routes', async ({ page }) => {
    // Attempt to access admin route (should redirect to login via middleware)
    const response = await page.goto('/admin/dashboard');
    
    // Should either get redirect response or be redirected to login
    const finalUrl = page.url();
    expect(finalUrl).toContain('login');
    
    // No SSR errors
    const consoleErrors = (page as any).consoleErrors as string[];
    const ssrErrors = consoleErrors.filter((err: string) =>
      err.includes('SSR') || err.includes('server-side')
    );
    
    expect(ssrErrors).toHaveLength(0);
  });

  test('CF-SSR-003: should serve static assets correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Verify CSS is loaded (check computed styles)
    const body = await page.locator('body');
    const backgroundColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have background color set (not default transparent)
    expect(backgroundColor).toBeTruthy();
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    
    // Check for successful asset loading
    const consoleErrors = (page as any).consoleErrors as string[];
    const assetErrors = consoleErrors.filter((err: string) =>
      err.includes('Failed to load') || err.includes('404')
    );
    
    expect(assetErrors).toHaveLength(0);
  });
});

test.describe('Cloud Functions API Routes', () => {
  test('CF-API-001: should handle API routes through Cloud Function', async ({ page }) => {
    // Test logout API route (public endpoint)
    const response = await page.request.post('http://localhost:15000/api/auth/logout');
    
    // Should return a valid response (might be redirect or error, but not 500)
    expect(response.status()).toBeLessThan(500);
  });

  test('CF-API-002: should return proper responses for unauthenticated API requests', async ({ page }) => {
    // Try to access a protected API endpoint without authentication
    const response = await page.request.get('http://localhost:15000/api/admin/users');
    
    // Should return 401 or redirect
    expect([401, 302, 307, 308]).toContain(response.status());
  });

  test('CF-API-003: should handle API errors gracefully', async ({ page }) => {
    // Request a non-existent API route
    const response = await page.request.get('http://localhost:15000/api/nonexistent-route-12345');
    
    // Should return 404 or similar, not crash
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500); // No server errors
  });
});

test.describe('Cloud Functions Session Management', () => {
  test('CF-SESSION-001: should maintain session across authenticated requests', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Verify session cookie was set
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'session');
    expect(sessionCookie).toBeDefined();
    
    // Navigate to another protected page
    await page.goto('/admin/schools');
    
    // Should remain authenticated (not redirected to login)
    await page.waitForURL('**/admin/schools', { timeout: 10000 });
    expect(page.url()).toContain('/admin/schools');
  });

  test('CF-SESSION-002: should block unauthenticated access to protected routes', async ({ page }) => {
    // Try to access admin dashboard without login
    await page.goto('/admin/dashboard');
    
    // Should be redirected to login
    const finalUrl = page.url();
    expect(finalUrl).toContain('login');
    
    // Verify login page is displayed
    await expect(page.locator('[data-page-type="login"]')).toBeVisible({ timeout: 10000 });
  });

  test('CF-SESSION-003: should handle logout and clear session', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Logout
    await page.click('[data-action="logout"]');
    
    // Wait for redirect to login
    await page.waitForURL('**/login', { timeout: 10000 });
    
    // Try to access protected route again
    await page.goto('/admin/dashboard');
    
    // Should be redirected back to login
    const finalUrl = page.url();
    expect(finalUrl).toContain('login');
  });
});

test.describe('Cloud Functions Module Resolution', () => {
  test('CF-MODULE-001: should import components from @/components without errors', async ({ page }) => {
    await page.goto('/login');
    
    // Components from @/components should render
    await expect(page.locator('[data-field="email"]')).toBeVisible();
    await expect(page.locator('[data-field="password"]')).toBeVisible();
    
    // Check for import errors
    const consoleErrors = (page as any).consoleErrors as string[];
    const importErrors = consoleErrors.filter((err: string) =>
      err.includes('@/components')
    );
    
    expect(importErrors).toHaveLength(0);
  });

  test('CF-MODULE-002: should import utilities from @/lib without errors', async ({ page }) => {
    await page.goto('/login');
    
    // Page should render successfully (uses lib utilities)
    await expect(page.locator('[data-page-type="login"]')).toBeVisible({ timeout: 10000 });
    
    // Check for lib import errors
    const consoleErrors = (page as any).consoleErrors as string[];
    const libErrors = consoleErrors.filter((err: string) =>
      err.includes('@/lib')
    );
    
    expect(libErrors).toHaveLength(0);
  });

  test('CF-MODULE-003: should execute middleware from src/middleware without errors', async ({ page }) => {
    // Middleware should execute for protected routes
    await page.goto('/admin/dashboard');
    
    // Should be redirected by middleware
    const finalUrl = page.url();
    expect(finalUrl).toContain('login');
    
    // No middleware module errors
    const consoleErrors = (page as any).consoleErrors as string[];
    const middlewareErrors = consoleErrors.filter((err: string) =>
      err.includes('middleware') && (err.includes('Cannot find') || err.includes('Module not found'))
    );
    
    expect(middlewareErrors).toHaveLength(0);
  });
});

test.describe('Cloud Functions Performance Indicators', () => {
  test('CF-PERF-001: should respond to SSR requests within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await expect(page.locator('[data-page-type="login"]')).toBeVisible({ timeout: 10000 });
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    
    // For local emulator, should load within 10 seconds (warm)
    // In production with cold start, target is <3s
    expect(loadTime).toBeLessThan(10000);
  });

  test('CF-PERF-002: should handle multiple page navigations efficiently', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Navigate to multiple pages
    const startTime = Date.now();
    
    await page.goto('/admin/schools');
    await page.waitForURL('**/admin/schools', { timeout: 10000 });
    
    await page.goto('/admin/users');
    await page.waitForURL('**/admin/users', { timeout: 10000 });
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Multiple navigations should complete reasonably fast
    expect(totalTime).toBeLessThan(20000); // 20 seconds for 2 navigations
  });
});

test.describe('Cloud Functions Error Handling', () => {
  test('CF-ERROR-001: should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-12345');
    
    // Should return 404 or redirect to error page
    // Should not crash the Cloud Function
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  test('CF-ERROR-002: should handle invalid form submissions gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Submit empty form
    await page.click('[data-action="login-submit"]');
    
    // Should show validation errors, not crash
    await page.waitForTimeout(2000);
    
    // Check for server errors in console
    const consoleErrors = (page as any).consoleErrors as string[];
    const serverErrors = consoleErrors.filter((err: string) =>
      err.includes('500') || err.includes('Internal Server Error')
    );
    
    expect(serverErrors).toHaveLength(0);
  });

  test('CF-ERROR-003: should handle authentication failures gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Try invalid credentials
    await page.fill('[data-field="email"]', 'invalid@test.com');
    await page.fill('[data-field="password"]', 'wrongpassword');
    await page.click('[data-action="login-submit"]');
    
    // Should show error message, not crash
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    expect(page.url()).toContain('login');
    
    // No server crashes
    const consoleErrors = (page as any).consoleErrors as string[];
    const serverErrors = consoleErrors.filter((err: string) =>
      err.includes('500') || err.includes('crashed')
    );
    
    expect(serverErrors).toHaveLength(0);
  });
});
