import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Login Completion Flow
 * 
 * These tests verify that users can successfully complete the login flow
 * by filling out and submitting the login form, and being redirected
 * to the appropriate post-login pages.
 * 
 * Tests focus on positive and negative core scenarios only.
 */

// Test data constants
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_ADMIN_PASSWORD = 'admin123';
const TEST_USER_EMAIL = 'user@test.com';
const TEST_USER_PASSWORD = 'user123';
const TEST_SCHOOL_ID = 'test-school-123';

test.describe('Login Completion Flow', () => {
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
  });

  test('Positive Scenario 1: Admin login completion with redirect to dashboard', async ({ page }) => {
    console.log('🧪 Testing: Admin can complete login flow and reach dashboard');
    
    // Navigate to login page
    await page.goto('/login');
    
    // Fill out login form
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
    
    // Submit form
    await page.click('button[data-action="login-submit"]');
    
    // Wait for network response to login API to complete
    const loginResponse = await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    // Check if login was successful
    const loginData = await loginResponse.json();
    console.log('Login API response:', loginResponse.status(), loginData);
    
    // Wait for the navigation to complete
    try {
      await page.waitForURL('**/admin/dashboard', { timeout: 5000 });
    } catch (error) {
      console.log('Navigation timeout - checking current state');
    }
    
    // Additional wait for any client-side navigation
    await page.waitForTimeout(2000);
    
    // Check if redirected to admin dashboard
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Should be on admin dashboard
    expect(currentUrl).toContain('/admin/dashboard');
    
    // Verify dashboard content loads
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_003_login_completion/attempt_1/admin_login_success.png',
      fullPage: true 
    });
    
    console.log('✅ Admin successfully completed login flow and reached dashboard');
  });

  test('Positive Scenario 2: User login completion with redirect to notices', async ({ page }) => {
    console.log('🧪 Testing: User can complete login flow and reach notices page');
    
    // Set up console logging to capture client-side redirect logic
    page.on('console', msg => {
      if (msg.text().includes('Redirecting')) {
        console.log('Browser redirect log:', msg.text());
      }
    });
    
    // Navigate to login page
    await page.goto('/login');
    
    // Fill out login form
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    
    // Submit form
    await page.click('button[data-action="login-submit"]');
    
    // Wait for network response to login API to complete
    const loginResponse = await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    // Check if login was successful
    const loginData = await loginResponse.json();
    console.log('Login API response:', loginResponse.status(), loginData);
    
    // Wait for the navigation to complete - since we see the redirect log, 
    // the JavaScript is trying to navigate, but we need to wait for it to actually happen
    try {
      await page.waitForURL(`**/${TEST_SCHOOL_ID}/notices`, { timeout: 5000 });
    } catch (error) {
      console.log('Navigation timeout - checking current state');
    }
    
    // Additional wait for any client-side navigation
    await page.waitForTimeout(2000);
    
    // Check if redirected to school notices page
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Should be on school notices page
    expect(currentUrl).toContain(`/${TEST_SCHOOL_ID}/notices`);
    
    // Verify notices content loads
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_003_login_completion/attempt_1/user_login_success.png',
      fullPage: true 
    });
    
    console.log('✅ User successfully completed login flow and reached notices page');
  });

  test('Positive Scenario 3: Login completion with preserved redirect URL', async ({ page }) => {
    console.log('🧪 Testing: Login completion honors preserved redirect URL');
    
    // Navigate to a protected page that will redirect to login
    const targetUrl = '/admin/dashboard?filter=active';
    await page.goto(targetUrl);
    
    // Should be redirected to login with redirect parameter
    await page.waitForTimeout(2000);
    let currentUrl = page.url();
    console.log(`URL after redirect to login: ${currentUrl}`);
    
    expect(currentUrl).toContain('/login');
    expect(currentUrl).toContain('?redirect=');
    
    // Fill out login form
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
    
    // Submit form
    await page.click('button[data-action="login-submit"]');
    
    // Wait for network response to login API to complete before checking URL
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    // Wait for the navigation to complete
    try {
      await page.waitForURL(`**${targetUrl}`, { timeout: 5000 });
    } catch (error) {
      console.log('Navigation timeout - checking current state');
    }
    
    // Additional wait for any client-side navigation
    await page.waitForTimeout(2000);
    
    // Check if redirected to original target URL
    currentUrl = page.url();
    console.log(`Final URL after login: ${currentUrl}`);
    
    // Should be on the originally requested page
    expect(currentUrl).toContain(targetUrl);
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_003_login_completion/attempt_1/redirect_url_preservation_success.png',
      fullPage: true 
    });
    
    console.log('✅ Login completion successfully honored preserved redirect URL');
  });

  test('Negative Scenario 1: Invalid credentials show error and stay on login page', async ({ page }) => {
    console.log('🧪 Testing: Invalid credentials show error and stay on login page');
    
    // Navigate to login page
    await page.goto('/login');
    
    // Fill out login form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[data-action="login-submit"]');
    
    // Wait for login processing
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Should show error message
    const errorElement = await page.locator('[data-error-message]');
    await expect(errorElement).toBeVisible();
    
    const errorText = await errorElement.textContent();
    expect(errorText).toContain('Invalid email or password');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_003_login_completion/attempt_1/invalid_credentials_error.png',
      fullPage: true 
    });
    
    console.log('✅ Invalid credentials correctly show error and stay on login page');
  });
});