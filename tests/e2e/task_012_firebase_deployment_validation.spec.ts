import { test, expect } from '@playwright/test';

/**
 * Task 012: Firebase Deployment Validation E2E Tests
 * 
 * Purpose: Validate that the MySchoolWeb Firebase deployment is working correctly,
 * focusing on SSR rendering, API routes, and session management through Cloud Functions.
 * 
 * Test Strategy:
 * - Portrait orientation only
 * - Positive and negative core scenarios only (no edge cases, performance, or load testing)
 * - Focus on deployment infrastructure validation
 * 
 * Prerequisites:
 * - Firebase emulators must be running (npm run emulators)
 * - Test users must be created (npm run setup-test-users)
 */

test.describe('Task 012: Firebase Deployment - SSR Validation', () => {
  test('DEPLOY-SSR-001: Login page renders with server-side rendering', async ({ page }) => {
    // Navigate to login page
    const response = await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Verify successful response
    expect(response?.status()).toBe(200);
    
    // Verify SSR indicators
    const content = await page.content();
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('data-page-type="login"');
    
    // Verify login form elements are present
    await expect(page.locator('[data-field="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-field="password"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-action="login-submit"]')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'tests/e2e/evidences/task_012/ssr_login_page.png',
      fullPage: true
    });
  });

  test('DEPLOY-SSR-002: Admin dashboard redirects unauthenticated users via middleware', async ({ page }) => {
    // Try to access protected admin dashboard without authentication
    await page.goto('http://localhost:3000/admin/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Verify redirect to login page
    const finalUrl = page.url();
    expect(finalUrl).toContain('login');
    
    // Verify login page is displayed
    await expect(page.locator('[data-page-type="login"]')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'tests/e2e/evidences/task_012/ssr_redirect_to_login.png',
      fullPage: true
    });
  });

  test('DEPLOY-SSR-003: Static assets load correctly', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Verify CSS is loaded by checking computed styles
    const body = await page.locator('body');
    const backgroundColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have background color set
    expect(backgroundColor).toBeTruthy();
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    
    // Verify page title
    const title = await page.title();
    expect(title).toContain('MySchool');
  });
});

test.describe('Task 012: Firebase Deployment - API Routes', () => {
  test('DEPLOY-API-001: Protected API endpoint returns 401 for unauthenticated requests', async ({ page }) => {
    // Test a protected API endpoint without authentication
    const response = await page.request.get('http://localhost:3000/api/admin/users');
    
    // Should return 401 Unauthorized or redirect (302/307/308)
    expect([401, 302, 307, 308]).toContain(response.status());
  });

  test('DEPLOY-API-002: Non-existent API routes return 404', async ({ page }) => {
    // Request a non-existent API route
    const response = await page.request.get('http://localhost:3000/api/nonexistent-endpoint-xyz123');
    
    // Should return 404 or similar client error, not server error
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('DEPLOY-API-003: Logout API endpoint is accessible', async ({ page }) => {
    // Test logout endpoint (should work even without session)
    const response = await page.request.post('http://localhost:3000/api/auth/logout');
    
    // Should return a valid response (not 500 server error)
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Task 012: Firebase Deployment - Session Management', () => {
  test('DEPLOY-SESSION-001: Successful login creates session and redirects to dashboard', async ({ page, context }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Take screenshot of login page
    await page.screenshot({
      path: 'tests/e2e/evidences/task_012/session_before_login.png',
      fullPage: true
    });
    
    // Fill in login credentials
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    
    // Submit login form
    await page.click('[data-action="login-submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Verify session cookie was set
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'session');
    expect(sessionCookie).toBeDefined();
    
    // Verify dashboard page is displayed
    await expect(page.locator('[data-page-type="admin-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot of dashboard
    await page.screenshot({
      path: 'tests/e2e/evidences/task_012/session_after_login.png',
      fullPage: true
    });
  });

  test('DEPLOY-SESSION-002: Session persists across page navigation', async ({ page, context }) => {
    // Login first
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Navigate to another protected page
    await page.goto('http://localhost:3000/admin/schools', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Should remain authenticated (not redirected to login)
    const finalUrl = page.url();
    expect(finalUrl).toContain('/admin/schools');
    expect(finalUrl).not.toContain('login');
    
    // Verify session cookie still exists
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'session');
    expect(sessionCookie).toBeDefined();
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'tests/e2e/evidences/task_012/session_persists_navigation.png',
      fullPage: true
    });
  });

  test('DEPLOY-SESSION-003: Logout clears session and redirects to login', async ({ page, context }) => {
    // Login first
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Logout
    await page.click('[data-action="logout"]');
    
    // Wait for redirect to login
    await page.waitForURL('**/login', { timeout: 10000 });
    
    // Try to access protected route again
    await page.goto('http://localhost:3000/admin/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Should be redirected back to login
    const finalUrl = page.url();
    expect(finalUrl).toContain('login');
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'tests/e2e/evidences/task_012/session_after_logout.png',
      fullPage: true
    });
  });

  test('DEPLOY-SESSION-004: Unauthenticated users cannot access protected routes', async ({ page }) => {
    // Try to access admin dashboard without login
    await page.goto('http://localhost:3000/admin/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Should be redirected to login
    const finalUrl = page.url();
    expect(finalUrl).toContain('login');
    
    // Verify login page is displayed
    await expect(page.locator('[data-page-type="login"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Task 012: Firebase Deployment - Build Configuration', () => {
  test('DEPLOY-BUILD-001: No module resolution errors in browser console', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Check for module resolution errors
    const moduleErrors = consoleErrors.filter((err) =>
      err.includes('Cannot find module') ||
      err.includes('Module not found') ||
      err.includes('@/components') ||
      err.includes('@/lib')
    );
    
    expect(moduleErrors).toHaveLength(0);
  });

  test('DEPLOY-BUILD-002: Middleware executes without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Try to access protected route (should trigger middleware)
    await page.goto('http://localhost:3000/admin/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Check for middleware errors
    const middlewareErrors = consoleErrors.filter((err) =>
      err.toLowerCase().includes('middleware')
    );
    
    expect(middlewareErrors).toHaveLength(0);
    
    // Verify redirect happened (middleware worked)
    const finalUrl = page.url();
    expect(finalUrl).toContain('login');
  });
});
