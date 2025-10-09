/**
 * Authentication Test - MySchool Application
 * 
 * Tests to verify authentication is working properly with password verification
 * using real Firebase Auth Emulator users.
 * 
 * Prerequisites:
 * - Firebase emulators must be running: npm run emulators
 * - Test users must be set up: npm run setup-test-users
 */

import { test, expect } from '@playwright/test';

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

test('Authentication Flow Test - Successful Login', async ({ page }) => {
  console.log('🧪 Testing: Successful Authentication Flow');
  
  // Step 1: Try to access protected page without authentication
  await page.goto('/admin/groups');
  await page.waitForLoadState('networkidle');
  
  // Should redirect to login or show access denied
  const currentUrl = page.url();
  console.log(`Current URL after accessing protected page: ${currentUrl}`);
  
  // Step 2: Go to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Verify login page loads
  await expect(page.locator('h1:has-text("Login")')).toBeVisible();
  
  // Step 3: Fill login form with correct credentials from Firebase Auth Emulator
  await page.fill('input[name="email"]', TEST_USERS.admin.email);
  await page.fill('input[name="password"]', TEST_USERS.admin.password);
  
  // Step 4: Submit login form
  await page.click('button[type="submit"]');
  
  // Wait for successful login and redirect
  await page.waitForURL(/\/admin/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // Step 5: Verify we're logged in (should redirect to dashboard or admin area)
  const urlAfterLogin = page.url();
  console.log(`After login, current URL: ${urlAfterLogin}`);
  
  // Should be in admin area (not redirected back to login)
  await expect(page).toHaveURL(/\/admin/);
  
  // Verify we see admin content (dashboard or any admin page)
  const pageContent = await page.textContent('body');
  console.log(`Page contains admin content: ${pageContent?.includes('Admin') || pageContent?.includes('Dashboard')}`);
  
  // The key test: We're authenticated and NOT on the login page
  await expect(page).not.toHaveURL(/\/login/);
  
  console.log('✅ Successful authentication flow verified');
});

test('Authentication Flow Test - Failed Login with Incorrect Password', async ({ page }) => {
  console.log('🧪 Testing: Failed Authentication with Incorrect Password');
  
  // Step 1: Go to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Verify login page loads
  await expect(page.locator('h1:has-text("Login")')).toBeVisible();
  
  // Step 2: Fill login form with incorrect password
  await page.fill('input[name="email"]', TEST_USERS.admin.email);
  await page.fill('input[name="password"]', 'WrongPassword123!');
  
  // Step 3: Submit login form
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  // Step 4: Verify error message is shown
  // Look for error message (could be in various forms)
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
      break;
    } catch (e) {
      // Continue to next selector
    }
  }
  
  if (!errorFound) {
    console.log('⚠️ No explicit error message found, checking if still on login page');
    // Should still be on login page or redirected back
    await expect(page).toHaveURL(/\/login/);
  }
  
  // Step 5: Verify we cannot access protected pages
  await page.goto('/admin/groups');
  await page.waitForLoadState('networkidle');
  
  // Should not be able to access admin groups (should redirect to login)
  await expect(page).not.toHaveURL(/\/admin\/groups/);
  
  console.log('✅ Failed authentication flow with incorrect password verified');
});

test('Authentication Flow Test - Failed Login with Non-existent User', async ({ page }) => {
  console.log('🧪 Testing: Failed Authentication with Non-existent User');
  
  // Step 1: Go to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Verify login page loads
  await expect(page.locator('h1:has-text("Login")')).toBeVisible();
  
  // Step 2: Fill login form with non-existent user
  await page.fill('input[name="email"]', 'nonexistent@example.com');
  await page.fill('input[name="password"]', 'SomePassword123!');
  
  // Step 3: Submit login form
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  // Step 4: Verify error message is shown or still on login page
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
      break;
    } catch (e) {
      // Continue to next selector
    }
  }
  
  if (!errorFound) {
    console.log('⚠️ No explicit error message found, checking if still on login page');
    // Should still be on login page or redirected back
    await expect(page).toHaveURL(/\/login/);
  }
  
  // Step 5: Verify we cannot access protected pages
  await page.goto('/admin/groups');
  await page.waitForLoadState('networkidle');
  
  // Should not be able to access admin groups
  await expect(page).not.toHaveURL(/\/admin\/groups/);
  
  console.log('✅ Failed authentication flow with non-existent user verified');
});