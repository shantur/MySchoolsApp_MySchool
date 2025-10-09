/**
 * Authentication Test - MySchool Application
 * 
 * Simple test to verify authentication is working properly
 */

import { test, expect } from '@playwright/test';

test('Authentication Flow Test', async ({ page }) => {
  console.log('🧪 Testing: Authentication Flow');
  
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
  
  // Step 3: Fill login form
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'password123');
  
  // Step 4: Submit login form
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  // Step 5: Verify we're logged in and can access admin pages
  await page.goto('/admin/groups');
  await page.waitForLoadState('networkidle');
  
  // Should show groups page (not redirect to login)
  await expect(page).toHaveURL(/\/admin\/groups/);
  await expect(page.locator('h1:has-text("Manage Groups")')).toBeVisible();
  
  console.log('✅ Authentication flow verified successfully');
});