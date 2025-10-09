/**
 * Authentication Test with Screenshots - MySchool Application
 * 
 * Comprehensive E2E tests with screenshot capture to verify authentication flows
 * and UI/UX consistency after the password vulnerability fix.
 * 
 * Tests to verify:
 * 1. Successful login with correct credentials
 * 2. Failed login with incorrect passwords  
 * 3. Failed login with non-existent users
 * 4. Generic error messages (user enumeration prevention)
 * 5. Protected route access control
 * 6. UI/UX consistency in portrait orientation
 * 
 * Prerequisites:
 * - Firebase emulators must be running: npm run emulators
 * - Test users must be set up: npm run setup-test-users
 */

import { test, expect } from '@playwright/test';
import path from 'path';

// Test user credentials from Firebase Auth Emulator
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
  },
  user: {
    email: 'user@test.com',
    password: 'TestUser123!',
  },
};

// Screenshot capture helper
async function captureScreenshot(page, name, description) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}_${timestamp}.png`;
  const screenshotPath = path.join(process.cwd(), 'client', 'evidences', 'task_007_myschoolweb_fix_auth_password_vulnerability', 'attempt_1', filename);
  
  await page.screenshot({ 
    path: screenshotPath, 
    fullPage: true,
    style: `
      * {
        animation: none !important;
        transition: none !important;
      }
    `
  });
  
  console.log(`📸 Screenshot captured: ${filename} - ${description}`);
  return screenshotPath;
}

test.describe('Authentication Flow with Screenshots', () => {
  test('Successful Admin Login with UI Verification', async ({ page }) => {
    console.log('🧪 Testing: Successful Admin Login Flow');
    
    // Set viewport to portrait orientation (mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Step 1: Try to access protected page without authentication
    await page.goto('/admin/groups');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '01_protected_page_redirect', 'Protected page redirect to login');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Step 2: Go to login page and capture initial state
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '02_login_page_initial', 'Login page initial state');
    
    // Verify login page elements
    await expect(page.locator('h1:has-text("Login")')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Step 3: Fill login form with correct admin credentials
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    await captureScreenshot(page, '03_login_form_filled', 'Login form filled with admin credentials');
    
    // Step 4: Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for successful login and redirect
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '04_admin_dashboard_success', 'Admin dashboard after successful login');
    
    // Step 5: Verify successful login
    const urlAfterLogin = page.url();
    console.log(`After login, current URL: ${urlAfterLogin}`);
    
    await expect(page).toHaveURL(/\/admin/);
    await expect(page).not.toHaveURL(/\/login/);
    
    // Verify admin content is visible
    const pageContent = await page.textContent('body');
    expect(pageContent?.includes('Admin') || pageContent?.includes('Dashboard')).toBeTruthy();
    
    // Step 6: Test navigation to another admin page
    await page.goto('/admin/groups');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '05_admin_groups_access', 'Admin groups page access');
    
    await expect(page).toHaveURL(/\/admin\/groups/);
    
    console.log('✅ Successful admin authentication flow verified');
  });

  test('Successful User Login with UI Verification', async ({ page }) => {
    console.log('🧪 Testing: Successful User Login Flow');
    
    // Set viewport to portrait orientation (mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Step 1: Go to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Fill login form with correct user credentials
    await page.fill('input[name="email"]', TEST_USERS.user.email);
    await page.fill('input[name="password"]', TEST_USERS.user.password);
    await captureScreenshot(page, '06_user_form_filled', 'Login form filled with user credentials');
    
    // Step 3: Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '07_user_login_success', 'User dashboard after successful login');
    
    // Step 4: Verify successful login
    await expect(page).not.toHaveURL(/\/login/);
    
    console.log('✅ Successful user authentication flow verified');
  });

  test('Failed Login with Incorrect Password', async ({ page }) => {
    console.log('🧪 Testing: Failed Authentication with Incorrect Password');
    
    // Set viewport to portrait orientation (mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Step 1: Go to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Fill login form with incorrect password
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await captureScreenshot(page, '08_incorrect_password_filled', 'Login form with incorrect password');
    
    // Step 3: Submit login form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '09_incorrect_password_error', 'Error state after incorrect password');
    
    // Step 4: Verify error handling
    const errorSelectors = [
      'text=Invalid email or password',
      'text=Authentication failed',
      '[role="alert"]',
      '.error-message',
      '.text-red-600'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        errorFound = true;
        console.log(`✅ Found error message: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!errorFound) {
      console.log('⚠️ No explicit error message found, verifying still on login page');
      await expect(page).toHaveURL(/\/login/);
    }
    
    // Step 5: Verify cannot access protected pages
    await page.goto('/admin/groups');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '10_protected_access_denied', 'Protected access denied after failed login');
    
    await expect(page).not.toHaveURL(/\/admin\/groups/);
    
    console.log('✅ Failed authentication flow with incorrect password verified');
  });

  test('Failed Login with Non-existent User', async ({ page }) => {
    console.log('🧪 Testing: Failed Authentication with Non-existent User');
    
    // Set viewport to portrait orientation (mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Step 1: Go to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Fill login form with non-existent user
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'SomePassword123!');
    await captureScreenshot(page, '11_nonexistent_user_filled', 'Login form with non-existent user');
    
    // Step 3: Submit login form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await captureScreenshot(page, '12_nonexistent_user_error', 'Error state for non-existent user');
    
    // Step 4: Verify error handling (should be same generic message)
    const errorSelectors = [
      'text=Invalid email or password',
      'text=Authentication failed',
      '[role="alert"]',
      '.error-message',
      '.text-red-600'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        errorFound = true;
        console.log(`✅ Found error message: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!errorFound) {
      console.log('⚠️ No explicit error message found, verifying still on login page');
      await expect(page).toHaveURL(/\/login/);
    }
    
    // Step 5: Verify cannot access protected pages
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
    
    console.log('✅ Failed authentication flow with non-existent user verified');
  });

  test('Security Verification - User Enumeration Prevention', async ({ page }) => {
    console.log('🧪 Testing: User Enumeration Prevention');
    
    // Set viewport to portrait orientation (mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test 1: Try incorrect password for existing user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    const existingUserError = await page.textContent('body');
    await captureScreenshot(page, '13_existing_user_wrong_password', 'Existing user with wrong password');
    
    // Test 2: Try any password for non-existent user
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'AnyPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    const nonExistentUserError = await page.textContent('body');
    await captureScreenshot(page, '14_nonexistent_user_any_password', 'Non-existent user with any password');
    
    // Verify both scenarios show similar generic error messages
    console.log('Existing user error:', existingUserError?.substring(0, 100));
    console.log('Non-existent user error:', nonExistentUserError?.substring(0, 100));
    
    // Both should contain generic error messages, not specific ones
    expect(existingUserError).toContain('Invalid email or password');
    expect(nonExistentUserError).toContain('Invalid email or password');
    
    console.log('✅ User enumeration prevention verified - generic error messages used');
  });

  test('UI/UX Consistency Verification', async ({ page }) => {
    console.log('🧪 Testing: UI/UX Consistency in Portrait Orientation');
    
    // Test different mobile portrait sizes
    const portraitSizes = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 414, height: 896 }, // iPhone 11
      { width: 360, height: 640 }, // Android small
    ];
    
    for (let i = 0; i < portraitSizes.length; i++) {
      const size = portraitSizes[i];
      console.log(`Testing portrait size: ${size.width}x${size.height}`);
      
      await page.setViewportSize(size);
      
      // Test login page layout
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await captureScreenshot(page, `15_login_portrait_${i + 1}`, `Login page portrait ${size.width}x${size.height}`);
      
      // Verify login form is properly sized and positioned
      await expect(page.locator('h1:has-text("Login")')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Test successful login and dashboard layout
      await page.fill('input[name="email"]', TEST_USERS.admin.email);
      await page.fill('input[name="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/\/admin/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await captureScreenshot(page, `16_dashboard_portrait_${i + 1}`, `Dashboard portrait ${size.width}x${size.height}`);
      
      // Go back to login for next test
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ UI/UX consistency verified across portrait orientations');
  });
});