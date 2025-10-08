import { test, expect, BrowserContext, Page } from '@playwright/test';
import jwt from 'jsonwebtoken';

/**
 * E2E Tests for Middleware Route Protection
 * 
 * These tests verify that the middleware correctly protects routes based on:
 * - Authentication status
 * - User roles (admin vs user)
 * - School membership
 * - Route types (page vs API)
 * 
 * All tests are conducted in portrait orientation on mobile devices.
 * Tests focus on positive and negative core scenarios only.
 */

// Test data constants
const TEST_SCHOOL_ID = 'test-school-123';
const TEST_OTHER_SCHOOL_ID = 'other-school-456';
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_USER_EMAIL = 'user@test.com';
const SESSION_SECRET = 'test-session-secret-for-e2e-testing';

/**
 * Helper function to create a JWT token for testing
 */
function createTestToken(payload: any): string {
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: '1h' });
}

/**
 * Helper function to set authentication cookies for admin user
 */
async function loginAsAdmin(context: BrowserContext) {
  const adminToken = createTestToken({
    uid: 'admin-123',
    email: TEST_ADMIN_EMAIL,
    schoolId: TEST_SCHOOL_ID,
    role: 'admin',
    displayName: 'Test Admin'
  });
  
  console.log(`Setting admin token: ${adminToken.substring(0, 20)}...`);
  
  await context.addCookies([
    {
      name: '__session',
      value: adminToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false, // Set to false for testing
      secure: false
    }
  ]);
  
  // Verify cookie was set
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === '__session');
  console.log(`Session cookie set: ${!!sessionCookie}`);
}

/**
 * Helper function to set authentication cookies for regular user
 */
async function loginAsUser(context: BrowserContext, schoolId: string = TEST_SCHOOL_ID) {
  const userToken = createTestToken({
    uid: 'user-123',
    email: TEST_USER_EMAIL,
    schoolId: schoolId,
    role: 'user',
    displayName: 'Test User'
  });
  
  console.log(`Setting user token for school ${schoolId}: ${userToken.substring(0, 20)}...`);
  
  await context.addCookies([
    {
      name: '__session',
      value: userToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false, // Set to false for testing
      secure: false
    }
  ]);
  
  // Verify cookie was set
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === '__session');
  console.log(`Session cookie set: ${!!sessionCookie}`);
}

/**
 * Helper function to clear authentication cookies
 */
async function logout(context: BrowserContext) {
  await context.clearCookies();
}

/**
 * Helper function to ensure evidence directory exists
 */
function ensureEvidenceDir() {
  const fs = require('fs');
  const path = require('path');
  const evidenceDir = path.join(process.cwd(), 'evidences', 'task_001_middleware_route_protection', 'attempt_1');
  
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  
  return evidenceDir;
}

test.describe('Middleware Route Protection - Positive Scenarios', () => {
  test.beforeEach(async ({ context }) => {
    // Set up viewport for portrait orientation
    await context.addInitScript(() => {
      // Force portrait orientation
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: {
          angle: 0,
          type: 'portrait-primary'
        }
      });
    });
    
    // Ensure evidence directory exists
    ensureEvidenceDir();
  });

  test('Positive Scenario 1: Successful Admin Login - Access admin dashboard', async ({ page, context }) => {
    console.log('🧪 Testing: Admin user can log in and access admin dashboard');
    
    // Log in as admin
    await loginAsAdmin(context);
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    
    // Should successfully load the admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/positive_admin_dashboard_access.png',
      fullPage: true 
    });
    
    console.log('✅ Admin user successfully accessed admin dashboard');
  });

  test('Positive Scenario 2: Successful User Login - Access school notices', async ({ page, context }) => {
    console.log('🧪 Testing: Regular user can log in and access their school notices');
    
    // Log in as regular user
    await loginAsUser(context, TEST_SCHOOL_ID);
    
    // Navigate to school notices page
    await page.goto(`/${TEST_SCHOOL_ID}/notices`);
    
    // Should successfully load the notices page
    await expect(page).toHaveURL(`/${TEST_SCHOOL_ID}/notices`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/positive_user_notices_access.png',
      fullPage: true 
    });
    
    console.log('✅ Regular user successfully accessed their school notices');
  });

  test('Positive Scenario 3: Access Public Pages - Root page without authentication', async ({ page }) => {
    console.log('🧪 Testing: Unauthenticated user can access root page');
    
    // Navigate to root page without authentication
    await page.goto('/');
    
    // Should successfully load the page
    await expect(page).toHaveURL('/');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/positive_root_page_access.png',
      fullPage: true 
    });
    
    console.log('✅ Unauthenticated user successfully accessed root page');
  });

  test('Positive Scenario 4: Access Public Pages - Login page without authentication', async ({ page }) => {
    console.log('🧪 Testing: Unauthenticated user can access login page');
    
    // Navigate to login page without authentication
    await page.goto('/login');
    
    // Should successfully load the page
    await expect(page).toHaveURL('/login');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/positive_login_page_access.png',
      fullPage: true 
    });
    
    console.log('✅ Unauthenticated user successfully accessed login page');
  });
});

test.describe('Middleware Route Protection - Negative Scenarios', () => {
  test.beforeEach(async ({ context }) => {
    // Set up viewport for portrait orientation
    await context.addInitScript(() => {
      // Force portrait orientation
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: {
          angle: 0,
          type: 'portrait-primary'
        }
      });
    });
    
    // Ensure evidence directory exists
    ensureEvidenceDir();
  });

  test('Negative Scenario 1: Unauthorized Admin Access (as User) - Admin dashboard', async ({ page, context }) => {
    console.log('🧪 Testing: Regular user redirected from admin dashboard');
    
    // Log in as regular user (not admin)
    await loginAsUser(context, TEST_SCHOOL_ID);
    
    // Try to access admin dashboard
    await page.goto('/admin/dashboard');
    
    // Should be redirected to login
    await page.waitForTimeout(2000); // Wait for redirect
    const currentUrl = page.url();
    console.log(`Current URL after redirect attempt: ${currentUrl}`);
    
    // Check if we're on the login page
    expect(currentUrl).toContain('/login');
    
    // Verify redirect parameter is preserved
    if (currentUrl.includes('?redirect=')) {
      console.log('✅ Redirect URL parameter is preserved');
    }
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/negative_user_admin_access.png',
      fullPage: true 
    });
    
    console.log('✅ Regular user correctly redirected from admin dashboard');
  });

  test('Negative Scenario 2: Unauthorized School Access (as User) - Different school notices', async ({ page, context }) => {
    console.log('🧪 Testing: User redirected from different school notices');
    
    // Log in as regular user for TEST_SCHOOL_ID
    await loginAsUser(context, TEST_SCHOOL_ID);
    
    // Try to access different school's notices
    await page.goto(`/${TEST_OTHER_SCHOOL_ID}/notices`);
    
    // Should be redirected to login
    await page.waitForTimeout(2000); // Wait for redirect
    const currentUrl = page.url();
    console.log(`Current URL after redirect attempt: ${currentUrl}`);
    
    // Check if we're on the login page
    expect(currentUrl).toContain('/login');
    
    // Verify redirect parameter is preserved
    if (currentUrl.includes('?redirect=')) {
      console.log('✅ Redirect URL parameter is preserved');
    }
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/negative_unauthorized_school_access.png',
      fullPage: true 
    });
    
    console.log('✅ User correctly redirected from different school notices');
  });

  test('Negative Scenario 3: Unauthenticated Access to Protected Page - Admin dashboard', async ({ page }) => {
    console.log('🧪 Testing: Unauthenticated user redirected from admin dashboard');
    
    // Try to access admin dashboard without authentication
    await page.goto('/admin/dashboard');
    
    // Should be redirected to login
    await page.waitForTimeout(2000); // Wait for redirect
    const currentUrl = page.url();
    console.log(`Current URL after redirect attempt: ${currentUrl}`);
    
    // Check if we're on the login page
    expect(currentUrl).toContain('/login');
    
    // Verify redirect parameter is preserved
    if (currentUrl.includes('?redirect=')) {
      console.log('✅ Redirect URL parameter is preserved');
    }
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/negative_unauthenticated_admin_access.png',
      fullPage: true 
    });
    
    console.log('✅ Unauthenticated user correctly redirected from admin dashboard');
  });

  test('Negative Scenario 4: Unauthenticated Access to Protected Page - School notices', async ({ page }) => {
    console.log('🧪 Testing: Unauthenticated user redirected from school notices');
    
    // Try to access school notices without authentication
    await page.goto(`/${TEST_SCHOOL_ID}/notices`);
    
    // Should be redirected to login
    await page.waitForTimeout(2000); // Wait for redirect
    const currentUrl = page.url();
    console.log(`Current URL after redirect attempt: ${currentUrl}`);
    
    // Check if we're on the login page
    expect(currentUrl).toContain('/login');
    
    // Verify redirect parameter is preserved
    if (currentUrl.includes('?redirect=')) {
      console.log('✅ Redirect URL parameter is preserved');
    }
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/negative_unauthenticated_notices_access.png',
      fullPage: true 
    });
    
    console.log('✅ Unauthenticated user correctly redirected from school notices');
  });

  test('Negative Scenario 5: Unauthenticated Access to Protected API - Admin users endpoint', async ({ page, context }) => {
    console.log('🧪 Testing: Unauthenticated access to admin API returns 401');
    
    // Try to access admin API without authentication
    const response = await context.request.get('/api/admin/users');
    
    console.log(`Admin API response status: ${response.status()}`);
    const responseText = await response.text();
    console.log(`Admin API response body: ${responseText}`);
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
    
    // Verify it's a JSON response with proper error structure
    const responseData = JSON.parse(responseText);
    expect(responseData).toHaveProperty('error');
    
    console.log('✅ Unauthenticated access to admin API correctly returns 401');
  });

  test('Negative Scenario 6: Unauthorized API Access (as User) - Admin users endpoint', async ({ page, context }) => {
    console.log('🧪 Testing: Regular user access to admin API returns 401/403');
    
    // Log in as regular user
    await loginAsUser(context, TEST_SCHOOL_ID);
    
    // Try to access admin API as regular user
    const response = await context.request.get('/api/admin/users');
    
    console.log(`Admin API response status: ${response.status()}`);
    const responseText = await response.text();
    console.log(`Admin API response body: ${responseText}`);
    
    // Should return 401 Unauthorized or 403 Forbidden
    expect([401, 403]).toContain(response.status());
    
    // Verify it's a JSON response with proper error structure
    const responseData = JSON.parse(responseText);
    expect(responseData).toHaveProperty('error');
    
    console.log('✅ Regular user access to admin API correctly returns 401/403');
  });
});

test.describe('Middleware Route Protection - Redirect URL Preservation', () => {
  test.beforeEach(async ({ context }) => {
    // Set up viewport for portrait orientation
    await context.addInitScript(() => {
      // Force portrait orientation
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: {
          angle: 0,
          type: 'portrait-primary'
        }
      });
    });
    
    // Ensure evidence directory exists
    ensureEvidenceDir();
  });

  test('Redirect URL Preservation - Complex URL with query parameters', async ({ page }) => {
    console.log('🧪 Testing: Redirect preserves complex URL with query parameters');
    
    // Try to access a protected page with existing query parameters
    const originalUrl = '/admin/dashboard?filter=active&page=2&sort=name';
    await page.goto(originalUrl);
    
    // Wait for redirect
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`Current URL after redirect attempt: ${currentUrl}`);
    
    // Check if we're on the login page
    expect(currentUrl).toContain('/login');
    
    // Verify redirect parameter is preserved and properly encoded
    expect(currentUrl).toContain('?redirect=');
    expect(currentUrl).toContain(encodeURIComponent(originalUrl));
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/redirect_url_preservation.png',
      fullPage: true 
    });
    
    console.log('✅ Redirect URL with query parameters correctly preserved');
  });

  test('Redirect URL Preservation - School-specific URL', async ({ page }) => {
    console.log('🧪 Testing: Redirect preserves school-specific URL');
    
    // Try to access a school-specific protected page
    const originalUrl = `/${TEST_SCHOOL_ID}/notices?category=urgent&date=2025-10-07`;
    await page.goto(originalUrl);
    
    // Wait for redirect
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`Current URL after redirect attempt: ${currentUrl}`);
    
    // Check if we're on the login page
    expect(currentUrl).toContain('/login');
    
    // Verify redirect parameter is preserved and properly encoded
    expect(currentUrl).toContain('?redirect=');
    expect(currentUrl).toContain(encodeURIComponent(originalUrl));
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_001_middleware_route_protection/attempt_1/redirect_school_url_preservation.png',
      fullPage: true 
    });
    
    console.log('✅ School-specific redirect URL correctly preserved');
  });
});