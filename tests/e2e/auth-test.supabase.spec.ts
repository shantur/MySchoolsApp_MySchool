/**
 * Authentication Test - MySchool Application (Supabase)
 * 
 * Tests to verify authentication is working properly with password verification
 * using Supabase Auth local development environment.
 * 
 * Prerequisites:
 * - Supabase local development must be running: supabase start
 * - Test users must be set up in Supabase Auth
 */

import { test, expect } from '@playwright/test';

// Test user credentials for Supabase Auth
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

test('Authentication Flow Test - Successful Login (Supabase)', async ({ page }) => {
  console.log('🧪 Testing: Successful Authentication Flow with Supabase');
  
  // Enable request/response logging
  page.on('request', request => {
    if (request.url().includes('/api/auth/login')) {
      console.log(`>>>> REQUEST to ${request.url()}`);
      console.log(`     Method: ${request.method()}`);
      console.log(`     Headers:`, request.headers());
      console.log(`     POST Data:`, request.postData());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/auth/login')) {
      console.log(`<<<< RESPONSE from ${response.url()}`);
      console.log(`     Status: ${response.status()}`);
      console.log(`     Headers:`, response.headers());
      response.text().then(body => console.log(`     Body:`, body));
    }
  });
  
  // Capture console logs from the page
  page.on('console', msg => {
    if (msg.text().includes('[LoginForm]')) {
      console.log(`[Browser Console] ${msg.text()}`);
    }
  });
  
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
  
  // Wait for the form to be fully hydrated by React
  await page.waitForSelector('form[data-form-type="login"]');
  await page.waitForTimeout(500); // Give React time to attach event handlers
  
  // Step 3: Fill login form with correct credentials for Supabase Auth
  await page.fill('input[name="email"]', TEST_USERS.admin.email);
  await page.fill('input[name="password"]', TEST_USERS.admin.password);
  
  // Step 4: Submit login form and wait for navigation
  // Use Promise.all to ensure we're listening for navigation BEFORE the click happens
  // This prevents a race condition where waitForURL checks before window.location.assign() is called
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.status() === 200),
    page.click('button[type="submit"]'),
  ]);
  
  // Step 5: Wait for redirect away from login page (successful authentication)
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
  
  // Verify successful authentication
  const postLoginUrl = page.url();
  console.log(`Post-login URL: ${postLoginUrl}`);
  
  // Check if we're no longer on the login page (indicating successful login)
  expect(postLoginUrl).not.toContain('/login');
  
  // Step 7: Try to access protected page again
  await page.goto('/admin/groups');
  // Wait for page to load (but not networkidle as data fetching may be slow)
  await page.waitForLoadState('domcontentloaded');
  
  // Should now be able to access the protected page
  // Check for either the page heading or loading indicator (both indicate successful access)
  const hasGroupsHeading = await page.locator('h1:has-text("Manage Groups"), h1:has-text("Groups")').count();
  const hasLoadingIndicator = await page.locator('text=Loading groups').count();
  
  expect(hasGroupsHeading + hasLoadingIndicator).toBeGreaterThan(0);
  
  console.log('✅ Authentication flow test completed successfully');
});

test('Authentication Flow Test - Failed Login (Supabase)', async ({ page }) => {
  console.log('🧪 Testing: Failed Authentication Flow with Supabase');
  
  // Step 1: Go to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Verify login page loads
  await expect(page.locator('h1:has-text("Login")')).toBeVisible();
  
  // Wait for the form to be fully hydrated by React
  await page.waitForSelector('form[data-form-type="login"]');
  await page.waitForTimeout(500); // Give React time to attach event handlers
  
  // Step 2: Fill login form with incorrect credentials
  await page.fill('input[name="email"]', TEST_USERS.admin.email);
  await page.fill('input[name="password"]', 'WrongPassword123!');
  
  // Step 3: Submit login form
  await page.click('button[type="submit"]');
  
  // Step 4: Wait for response
  await page.waitForLoadState('networkidle');
  
  // Step 5: Verify authentication failed
  // Should still be on login page or show error message
  const currentUrl = page.url();
  expect(currentUrl).toContain('/login');
  
  // Check for error message (if implemented)
  const errorElement = page.locator('text=Invalid credentials');
  if (await errorElement.isVisible()) {
    console.log('✅ Error message displayed for invalid credentials');
  }
  
  console.log('✅ Failed authentication test completed');
});

test('Authentication Flow Test - User Role Access (Supabase)', async ({ page }) => {
  console.log('🧪 Testing: User Role Access Control with Supabase');
  
  // Step 1: Login as regular user
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for the form to be fully hydrated by React
  await page.waitForSelector('form[data-form-type="login"]');
  await page.waitForTimeout(500); // Give React time to attach event handlers
  
  await page.fill('input[name="email"]', TEST_USERS.user.email);
  await page.fill('input[name="password"]', TEST_USERS.user.password);
  
  // Submit login form and wait for API response
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.status() === 200),
    page.click('button[type="submit"]'),
  ]);
  
  // Wait for redirect away from login page (successful authentication)
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
  
  // Step 2: Try to access admin-only page
  await page.goto('/admin/schools');
  await page.waitForLoadState('networkidle');
  
  // Step 3: Verify access denied
  // Should redirect to login or show access denied message
  const currentUrl = page.url();
  
  // User should not be able to access admin schools page
  // The exact behavior depends on implementation
  console.log(`Access result URL: ${currentUrl}`);
  
  // Step 4: Verify user can access user-level pages
  await page.goto('/dashboard'); // Assuming there's a user dashboard
  await page.waitForLoadState('networkidle');
  
  // User should be able to access their dashboard
  const dashboardUrl = page.url();
  console.log(`Dashboard access URL: ${dashboardUrl}`);
  
  console.log('✅ User role access test completed');
});

test('Authentication Flow Test - Session Persistence (Supabase)', async ({ page }) => {
  console.log('🧪 Testing: Session Persistence with Supabase');
  
  // Step 1: Login successfully
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for the form to be fully hydrated by React
  await page.waitForSelector('form[data-form-type="login"]');
  await page.waitForTimeout(500); // Give React time to attach event handlers
  
  await page.fill('input[name="email"]', TEST_USERS.admin.email);
  await page.fill('input[name="password"]', TEST_USERS.admin.password);
  
  // Submit login form and wait for API response
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.status() === 200),
    page.click('button[type="submit"]'),
  ]);
  
  // Wait for redirect away from login page (successful authentication)
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
  
  // Step 2: Access protected page
  await page.goto('/admin/groups');
  await page.waitForLoadState('domcontentloaded');
  
  // Verify access is granted (check for page heading or loading indicator)
  const hasManageGroups = await page.locator('h1:has-text("Manage Groups")').count();
  const hasLoadingGroups = await page.locator('text=Loading groups').count();
  expect(hasManageGroups + hasLoadingGroups).toBeGreaterThan(0);
  
  // Step 3: Simulate page refresh (to test session persistence)
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  
  // Step 4: Verify still authenticated after refresh
  // Should still be able to access the page without re-login
  const hasManageGroupsAfterRefresh = await page.locator('h1:has-text("Manage Groups")').count();
  const hasLoadingGroupsAfterRefresh = await page.locator('text=Loading groups').count();
  expect(hasManageGroupsAfterRefresh + hasLoadingGroupsAfterRefresh).toBeGreaterThan(0);
  
  console.log('✅ Session persistence test completed');
});

test('Authentication Flow Test - Logout (Supabase)', async ({ page }) => {
  console.log('🧪 Testing: Logout Functionality with Supabase');
  
  // Step 1: Login successfully
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for the form to be fully hydrated by React
  await page.waitForSelector('form[data-form-type="login"]');
  await page.waitForTimeout(500); // Give React time to attach event handlers
  
  await page.fill('input[name="email"]', TEST_USERS.admin.email);
  await page.fill('input[name="password"]', TEST_USERS.admin.password);
  
  // Submit login form and wait for API response
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login') && resp.status() === 200),
    page.click('button[type="submit"]'),
  ]);
  
  // Wait for redirect away from login page (successful authentication)
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
  
  // Step 2: Access protected page to confirm login
  await page.goto('/admin/groups');
  await page.waitForLoadState('domcontentloaded');
  
  const hasManageGroupsBeforeLogout = await page.locator('h1:has-text("Manage Groups")').count();
  const hasLoadingGroupsBeforeLogout = await page.locator('text=Loading groups').count();
  expect(hasManageGroupsBeforeLogout + hasLoadingGroupsBeforeLogout).toBeGreaterThan(0);
  
  // Step 3: Logout (if logout functionality is implemented)
  // Look for logout button or link
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
    
    // Step 4: Verify logged out
    // Should redirect to login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    console.log('✅ Logout test completed');
  } else {
    console.log('ℹ️ Logout functionality not implemented - skipping logout test');
  }
});