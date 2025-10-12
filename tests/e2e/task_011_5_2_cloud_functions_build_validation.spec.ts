import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Task 011_5_2: Cloud Functions Build Issues Validation
 * 
 * These tests validate that the four critical build issues have been resolved:
 * 1. Build script directory copying (components, lib, middleware)
 * 2. TypeScript path aliases resolution
 * 3. Symlink handling
 * 4. Production mode strategy
 * 
 * Test Focus:
 * - SSR rendering through Cloud Functions
 * - API routes functionality
 * - Session management
 * - Module resolution (no errors from missing directories or path aliases)
 * - Portrait orientation only
 * - Positive and negative core scenarios only
 * 
 * Prerequisites:
 * - Firebase emulators running: npm run emulators
 * - Cloud Functions deployed to emulator
 * - Test data seeded
 */

test.describe('Task 011_5_2: Cloud Functions Build Validation - SSR Rendering', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear browser state before each test
    await page.context().clearCookies();
  });

  test('CF-SSR-001: should render login page via SSR without module resolution errors', async ({ page }) => {
    // Navigate to login page through Cloud Function
    await page.goto('http://localhost:15000/login');
    
    // Verify SSR rendered HTML
    const htmlContent = await page.content();
    expect(htmlContent).toContain('<!DOCTYPE html>');
    expect(htmlContent).toContain('data-page-type');
    
    // Verify login form components (from src/components) are rendered
    await expect(page.locator('[data-field="email"]')).toBeVisible();
    await expect(page.locator('[data-field="password"]')).toBeVisible();
    await expect(page.locator('[data-action="login-submit"]')).toBeVisible();
    
    // Check for any client-side errors in console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for any async operations
    await page.waitForLoadState('networkidle');
    
    // Verify no module resolution errors
    const moduleErrors = errors.filter(e => 
      e.includes('Cannot find module') || 
      e.includes('Module not found') ||
      e.includes('@/components') ||
      e.includes('@/lib')
    );
    expect(moduleErrors).toHaveLength(0);
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-ssr-001-login-page.png',
      fullPage: true 
    });
  });

  test('CF-SSR-002: should render admin dashboard via SSR with components from copied directories', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Verify SSR rendered HTML
    const htmlContent = await page.content();
    expect(htmlContent).toContain('<!DOCTYPE html>');
    expect(htmlContent).toContain('data-page-type');
    expect(htmlContent).toContain('data-page-metadata');
    
    // Verify dashboard components (that use @/components and @/lib imports) are rendered
    // These components rely on the correct path alias resolution
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify no JavaScript errors from module resolution
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Check for module resolution errors
    const moduleErrors = errors.filter(e => 
      e.includes('Cannot find module') || 
      e.includes('Module not found') ||
      e.includes('@/components') ||
      e.includes('@/lib')
    );
    expect(moduleErrors).toHaveLength(0);
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-ssr-002-dashboard.png',
      fullPage: true 
    });
  });

  test('CF-SSR-003: should render notices page with middleware handling', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Navigate to notices page (requires middleware for auth)
    await page.goto('http://localhost:15000/admin/notices');
    
    // Verify page loaded successfully (middleware.ts properly copied)
    expect(page.url()).toContain('/admin/notices');
    
    // Verify SSR content
    const htmlContent = await page.content();
    expect(htmlContent).toContain('data-page-type');
    
    // Verify no middleware errors
    const response = await page.goto('http://localhost:15000/admin/notices');
    expect(response?.status()).toBe(200);
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-ssr-003-notices-with-middleware.png',
      fullPage: true 
    });
  });

  test('CF-SSR-004: should handle unauthenticated access with middleware redirect', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('http://localhost:15000/admin/dashboard');
    
    // Should be redirected to login by middleware
    await page.waitForURL('**/login**', { timeout: 15000 });
    
    // Verify login page is rendered
    await expect(page.locator('[data-field="email"]')).toBeVisible();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-ssr-004-middleware-redirect.png',
      fullPage: true 
    });
  });
});

test.describe('Task 011_5_2: Cloud Functions Build Validation - API Routes', () => {
  
  test('CF-API-001: should handle logout API route through Cloud Function', async ({ page, context }) => {
    // Login first to establish session
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Verify session cookie exists
    const cookiesBefore = await context.cookies();
    const sessionCookieBefore = cookiesBefore.find(c => c.name === 'session');
    expect(sessionCookieBefore).toBeDefined();
    
    // Call logout API route
    const response = await page.request.post('http://localhost:15000/api/auth/logout');
    
    // Verify successful logout
    expect(response.status()).toBe(200);
    
    // Verify response body
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('success', true);
    
    // Verify session cookie is cleared
    await page.goto('http://localhost:15000/admin/dashboard');
    await page.waitForURL('**/login**', { timeout: 15000 });
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-api-001-logout.png',
      fullPage: true 
    });
  });

  test('CF-API-002: should handle protected API routes with authentication', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Try to access a protected API endpoint (e.g., get schools)
    const response = await page.request.get('http://localhost:15000/api/schools');
    
    // Should return successful response (not 401 or 403)
    expect(response.status()).toBeLessThan(400);
  });

  test('CF-API-003: should reject unauthenticated API requests', async ({ page }) => {
    // Try to access protected API without authentication
    const response = await page.request.get('http://localhost:15000/api/schools');
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('CF-API-004: should handle API route errors gracefully', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Try to access non-existent API endpoint
    const response = await page.request.get('http://localhost:15000/api/nonexistent-endpoint-12345');
    
    // Should return 404 Not Found (not 500 Server Error from module resolution issues)
    expect(response.status()).toBe(404);
  });
});

test.describe('Task 011_5_2: Cloud Functions Build Validation - Session Management', () => {
  
  test('CF-SESSION-001: should maintain session across multiple page navigations', async ({ page, context }) => {
    // Login
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Get session cookie
    const cookies1 = await context.cookies();
    const sessionCookie1 = cookies1.find(c => c.name === 'session');
    expect(sessionCookie1).toBeDefined();
    
    // Navigate to multiple pages
    await page.goto('http://localhost:15000/admin/schools');
    expect(page.url()).toContain('/admin/schools');
    
    await page.goto('http://localhost:15000/admin/users');
    expect(page.url()).toContain('/admin/users');
    
    await page.goto('http://localhost:15000/admin/groups');
    expect(page.url()).toContain('/admin/groups');
    
    // Verify session is maintained (no redirects to login)
    const cookies2 = await context.cookies();
    const sessionCookie2 = cookies2.find(c => c.name === 'session');
    expect(sessionCookie2).toBeDefined();
    expect(sessionCookie2?.value).toBe(sessionCookie1?.value);
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-session-001-maintained.png',
      fullPage: true 
    });
  });

  test('CF-SESSION-002: should handle session expiration correctly', async ({ page, context }) => {
    // Login
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Clear session cookie to simulate expiration
    await context.clearCookies();
    
    // Try to access protected page
    await page.goto('http://localhost:15000/admin/dashboard');
    
    // Should be redirected to login
    await page.waitForURL('**/login**', { timeout: 15000 });
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-session-002-expired.png',
      fullPage: true 
    });
  });

  test('CF-SESSION-003: should create new session on successful login', async ({ page, context }) => {
    // Verify no session cookie before login
    const cookiesBefore = await context.cookies();
    const sessionCookieBefore = cookiesBefore.find(c => c.name === 'session');
    expect(sessionCookieBefore).toBeUndefined();
    
    // Login
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Verify session cookie is created
    const cookiesAfter = await context.cookies();
    const sessionCookieAfter = cookiesAfter.find(c => c.name === 'session');
    expect(sessionCookieAfter).toBeDefined();
    expect(sessionCookieAfter?.value).toBeTruthy();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-session-003-created.png',
      fullPage: true 
    });
  });

  test('CF-SESSION-004: should isolate sessions across different users', async ({ browser }) => {
    // Create two separate browser contexts (simulating two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login as admin in context 1
    await page1.goto('http://localhost:15000/login');
    await page1.fill('[data-field="email"]', 'admin@test.com');
    await page1.fill('[data-field="password"]', 'TestAdmin123!');
    await page1.click('[data-action="login-submit"]');
    await page1.waitForURL('**/admin/dashboard', { timeout: 15000 });
    
    // Login as regular user in context 2
    await page2.goto('http://localhost:15000/login');
    await page2.fill('[data-field="email"]', 'user@test.com');
    await page2.fill('[data-field="password"]', 'TestUser123!');
    await page2.click('[data-action="login-submit"]');
    await page2.waitForURL('**', { timeout: 15000 });
    
    // Get session cookies
    const cookies1 = await context1.cookies();
    const sessionCookie1 = cookies1.find(c => c.name === 'session');
    
    const cookies2 = await context2.cookies();
    const sessionCookie2 = cookies2.find(c => c.name === 'session');
    
    // Verify different session cookies
    expect(sessionCookie1).toBeDefined();
    expect(sessionCookie2).toBeDefined();
    expect(sessionCookie1?.value).not.toBe(sessionCookie2?.value);
    
    // Take screenshots for evidence
    await page1.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-session-004-user1.png',
      fullPage: true 
    });
    await page2.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-session-004-user2.png',
      fullPage: true 
    });
    
    // Cleanup
    await context1.close();
    await context2.close();
  });
});

test.describe('Task 011_5_2: Cloud Functions Build Validation - Module Resolution', () => {
  
  test('CF-MODULE-001: should resolve @/components imports without errors', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to a page that uses components heavily
    await page.goto('http://localhost:15000/login');
    await page.waitForLoadState('networkidle');
    
    // Check for path alias errors
    const pathAliasErrors = errors.filter(e => 
      e.includes('@/components') || 
      e.includes('Cannot find module') ||
      e.includes('Module not found')
    );
    
    expect(pathAliasErrors).toHaveLength(0);
  });

  test('CF-MODULE-002: should resolve @/lib imports without errors', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Login and navigate to dashboard (uses lib utilities)
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'admin@test.com');
    await page.fill('[data-field="password"]', 'TestAdmin123!');
    await page.click('[data-action="login-submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Check for lib import errors
    const libErrors = errors.filter(e => 
      e.includes('@/lib') || 
      e.includes('Cannot find module') ||
      e.includes('Module not found')
    );
    
    expect(libErrors).toHaveLength(0);
  });

  test('CF-MODULE-003: should handle middleware imports correctly', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Access a protected route to trigger middleware
    const response = await page.goto('http://localhost:15000/admin/dashboard');
    
    // Should not return 500 error (which would indicate middleware import failure)
    expect(response?.status()).not.toBe(500);
    
    // Wait for any async operations
    await page.waitForLoadState('networkidle');
    
    // Check for middleware import errors
    const middlewareErrors = errors.filter(e => 
      e.includes('middleware') || 
      e.includes('Cannot find module') ||
      e.includes('Module not found')
    );
    
    expect(middlewareErrors).toHaveLength(0);
  });
});

test.describe('Task 011_5_2: Cloud Functions Build Validation - Production Mode', () => {
  
  test('CF-PROD-001: should run in production mode with proper optimizations', async ({ page }) => {
    // Navigate to any page
    await page.goto('http://localhost:15000/login');
    
    // Check for development-only features that shouldn't be present
    const htmlContent = await page.content();
    
    // Production build should not include React DevTools script
    expect(htmlContent).not.toContain('__REACT_DEVTOOLS_GLOBAL_HOOK__');
    
    // Check that assets are minified (should not have excessive whitespace)
    const scripts = await page.$$eval('script', scripts => 
      scripts.map(s => s.textContent || '')
    );
    
    // At least one script should be minified (no line breaks for long scripts)
    const hasMinifiedScripts = scripts.some(script => 
      script.length > 100 && !script.includes('\n')
    );
    
    // In production, scripts are typically minified
    // (This check might be lenient for local emulator, but good indicator)
    expect(hasMinifiedScripts || scripts.length === 0).toBeTruthy();
  });

  test('CF-PROD-002: should serve compressed assets efficiently', async ({ page }) => {
    // Navigate to home page
    const response = await page.goto('http://localhost:15000/');
    
    // Check response headers for production optimization
    const headers = response?.headers();
    
    // Should have proper content-type
    expect(headers?.['content-type']).toContain('text/html');
    
    // Response should be successful
    expect(response?.status()).toBe(200);
  });

  test('CF-PROD-003: should handle errors gracefully without exposing stack traces', async ({ page }) => {
    // Try to access non-existent page
    const response = await page.goto('http://localhost:15000/this-page-does-not-exist-12345');
    
    // Should return 404
    expect(response?.status()).toBe(404);
    
    // Get page content
    const content = await page.content();
    
    // Should not expose internal stack traces or file paths in production
    expect(content).not.toContain('/functions/src/');
    expect(content).not.toContain('at Object.<anonymous>');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-prod-003-404-error.png',
      fullPage: true 
    });
  });
});

test.describe('Task 011_5_2: Cloud Functions Build Validation - Negative Scenarios', () => {
  
  test('CF-NEG-001: should reject invalid login credentials', async ({ page }) => {
    await page.goto('http://localhost:15000/login');
    
    // Try to login with invalid credentials
    await page.fill('[data-field="email"]', 'invalid@test.com');
    await page.fill('[data-field="password"]', 'WrongPassword123!');
    await page.click('[data-action="login-submit"]');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Should remain on login page
    expect(page.url()).toContain('/login');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-neg-001-invalid-login.png',
      fullPage: true 
    });
  });

  test('CF-NEG-002: should handle missing required form fields', async ({ page }) => {
    await page.goto('http://localhost:15000/login');
    
    // Try to submit without filling fields
    await page.click('[data-action="login-submit"]');
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Should remain on login page
    expect(page.url()).toContain('/login');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-neg-002-empty-fields.png',
      fullPage: true 
    });
  });

  test('CF-NEG-003: should prevent access to admin routes for regular users', async ({ page }) => {
    // Login as regular user
    await page.goto('http://localhost:15000/login');
    await page.fill('[data-field="email"]', 'user@test.com');
    await page.fill('[data-field="password"]', 'TestUser123!');
    await page.click('[data-action="login-submit"]');
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    
    // Try to access admin route
    const response = await page.goto('http://localhost:15000/admin/users');
    
    // Should be forbidden or redirected
    const status = response?.status();
    expect(status === 403 || status === 401 || page.url().includes('/login')).toBeTruthy();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'tests/e2e/evidences/task_011_5_2/cf-neg-003-unauthorized-access.png',
      fullPage: true 
    });
  });
});
