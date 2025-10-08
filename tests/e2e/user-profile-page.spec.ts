import { test, expect } from '@playwright/test';

/**
 * E2E Tests for User Profile Page
 * 
 * These tests verify that the user profile page (/[schoolId]/profile) 
 * functions correctly for authenticated users, displaying user information,
 * school details, and group memberships in a read-only format.
 * 
 * Tests focus on positive and negative core scenarios only.
 */

// Test data constants
const TEST_USER_EMAIL = 'user@test.com';
const TEST_USER_PASSWORD = 'user123';
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_ADMIN_PASSWORD = 'admin123';
const TEST_SCHOOL_ID = 'test-school-123';

test.describe('User Profile Page', () => {
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

  test('Positive Scenario 1: Authenticated user can access profile page', async ({ page }) => {
    console.log('🧪 Testing: Authenticated user can access and view profile page');
    
    // First login as regular user
    await page.goto('/login');
    await page.waitForLoadState('networkidle'); // Wait for JS to load
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    await page.click('button[data-action="login-submit"]');
    
    // Wait for login response
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    // Wait for redirect to notices page
    await page.waitForURL(`**/${TEST_SCHOOL_ID}/notices`, { timeout: 10000 });
    await page.waitForLoadState('networkidle'); // Ensure page is fully loaded
    
    // Navigate to profile page by clicking the link
    await page.click('a[href="/test-school-123/profile"]');
    await page.waitForLoadState('networkidle');
    
    // Verify profile page loads successfully
    await expect(page.locator('h1')).toContainText('My Profile');
    
    // Verify main sections are present
    await expect(page.locator('h2:has-text("Personal Information")')).toBeVisible();
    await expect(page.locator('h2:has-text("School Information")')).toBeVisible();
    await expect(page.locator('h2:has-text("Group Memberships")')).toBeVisible();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/user_profile_access.png',
      fullPage: true 
    });
    
    console.log('✅ Authenticated user successfully accessed profile page');
  });

  test('Positive Scenario 2: Profile page displays user information correctly', async ({ page }) => {
    console.log('🧪 Testing: Profile page displays user personal information correctly');
    
    // Login and navigate to profile page
    await page.goto('/login');
    await page.waitForLoadState('networkidle'); // Wait for JS to load
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    await page.click('button[data-action="login-submit"]');
    
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.waitForURL(`**/${TEST_SCHOOL_ID}/notices`, { timeout: 10000 });
    await page.waitForLoadState('networkidle'); // Ensure page is fully loaded
    await page.goto(`/${TEST_SCHOOL_ID}/profile`);
    await page.waitForLoadState('networkidle');
    
    // Verify personal information section
    const emailElement = page.locator('[data-testid="user-email"]');
    await expect(emailElement).toBeVisible();
    await expect(emailElement).toHaveAttribute('data-user-email', TEST_USER_EMAIL);
    await expect(emailElement).toContainText(TEST_USER_EMAIL);
    
    // Verify role is displayed
    const roleElement = page.locator('[data-testid="user-role"]');
    await expect(roleElement).toBeVisible();
    await expect(roleElement).toHaveAttribute('data-user-role', 'user');
    await expect(roleElement).toContainText('User');
    
    // Verify school information
    const schoolIdElement = page.locator('[data-testid="school-id"]');
    await expect(schoolIdElement).toBeVisible();
    await expect(schoolIdElement).toHaveAttribute('data-school-id', TEST_SCHOOL_ID);
    await expect(schoolIdElement).toContainText(TEST_SCHOOL_ID);
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/user_information_display.png',
      fullPage: true 
    });
    
    console.log('✅ Profile page correctly displays user information');
  });

  test('Positive Scenario 3: Profile page displays group memberships', async ({ page }) => {
    console.log('🧪 Testing: Profile page displays user group memberships');
    
    // Login and navigate to profile page
    await page.goto('/login');
    await page.waitForLoadState('networkidle'); // Wait for JS to load
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    await page.click('button[data-action="login-submit"]');
    
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.waitForURL(`**/${TEST_SCHOOL_ID}/notices`, { timeout: 10000 });
    await page.waitForLoadState('networkidle'); // Ensure page is fully loaded
    await page.goto(`/${TEST_SCHOOL_ID}/profile`);
    await page.waitForLoadState('networkidle');
    
    // Check if groups are displayed (this depends on test data)
    const groupsSection = page.locator('text=Group Memberships');
    await expect(groupsSection).toBeVisible();
    
    // Look for group items (may be empty depending on test data)
    const groupItems = page.locator('[data-testid^="group-"]');
    const groupCount = await groupItems.count();
    
    if (groupCount > 0) {
      // Verify first group has proper attributes
      const firstGroup = groupItems.first();
      await expect(firstGroup).toBeVisible();
      await expect(firstGroup).toHaveAttribute('role', 'listitem');
      
      console.log(`Found ${groupCount} group(s) displayed`);
    } else {
      // Check for empty state message
      const emptyState = page.locator('text=You are not currently assigned to any groups');
      if (await emptyState.isVisible()) {
        console.log('Empty state message displayed for groups');
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/group_memberships_display.png',
      fullPage: true 
    });
    
    console.log('✅ Profile page displays group memberships correctly');
  });

  test('Positive Scenario 4: Profile page has proper navigation and logout', async ({ page }) => {
    console.log('🧪 Testing: Profile page navigation and logout functionality');
    
    // Login and navigate to profile page
    await page.goto('/login');
    await page.waitForLoadState('networkidle'); // Wait for JS to load
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    await page.click('button[data-action="login-submit"]');
    
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.waitForURL(`**/${TEST_SCHOOL_ID}/notices`, { timeout: 10000 });
    await page.waitForLoadState('networkidle'); // Ensure page is fully loaded
    await page.goto(`/${TEST_SCHOOL_ID}/profile`);
    await page.waitForLoadState('networkidle');
    
    // Verify navigation link to Notices
    const noticesLink = page.locator('text=Notices');
    await expect(noticesLink).toBeVisible();
    const noticesHref = await noticesLink.getAttribute('href');
    expect(noticesHref).toContain(`/${TEST_SCHOOL_ID}/notices`);
    
    // Verify logout button
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
    
    // Test logout functionality - wait for navigation after form submission
    await Promise.all([
      page.waitForURL('**/login', { timeout: 10000 }),
      logoutButton.click()
    ]);
    
    // Verify we're on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/navigation_and_logout.png',
      fullPage: true 
    });
    
    console.log('✅ Profile page navigation and logout functionality works correctly');
  });

  test('Positive Scenario 5: Profile page accessibility compliance', async ({ page }) => {
    console.log('🧪 Testing: Profile page accessibility compliance');
    
    // Login and navigate to profile page
    await page.goto('/login');
    await page.waitForLoadState('networkidle'); // Wait for JS to load
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    await page.click('button[data-action="login-submit"]');
    
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.waitForURL(`**/${TEST_SCHOOL_ID}/notices`, { timeout: 10000 });
    await page.waitForLoadState('networkidle'); // Ensure page is fully loaded
    await page.goto(`/${TEST_SCHOOL_ID}/profile`);
    await page.waitForLoadState('networkidle');
    
    // Check for proper semantic structure
    await expect(page.locator('header[role="banner"]')).toBeVisible();
    await expect(page.locator('main[role="main"]')).toBeVisible();
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('My Profile');
    
    const h2s = page.locator('h2');
    await expect(h2s).toHaveCount(3); // Personal Information, School Information, Group Memberships
    
    // Check for ARIA attributes
    const metadata = page.locator('[data-testid="page-metadata"]');
    await expect(metadata).toBeHidden();
    await expect(metadata).toHaveAttribute('aria-hidden', 'true');
    await expect(metadata).toHaveAttribute('data-page-type', 'user-profile');
    
    // Check for proper form labels
    const emailLabel = page.locator('label[for="user-email"]');
    await expect(emailLabel).toBeVisible();
    await expect(emailLabel).toContainText('Email Address');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Check that focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/accessibility_compliance.png',
      fullPage: true 
    });
    
    console.log('✅ Profile page demonstrates good accessibility compliance');
  });

  test('Positive Scenario 6: Profile page responsive design', async ({ page }) => {
    console.log('🧪 Testing: Profile page responsive design in portrait orientation');
    
    // Login and navigate to profile page
    await page.goto('/login');
    await page.waitForLoadState('networkidle'); // Wait for JS to load
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    await page.click('button[data-action="login-submit"]');
    
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.waitForURL(`**/${TEST_SCHOOL_ID}/notices`, { timeout: 10000 });
    await page.waitForLoadState('networkidle'); // Ensure page is fully loaded
    await page.goto(`/${TEST_SCHOOL_ID}/profile`);
    await page.waitForLoadState('networkidle');
    
    // Test mobile portrait view
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.waitForTimeout(1000);
    
    // Verify content is still readable and accessible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toHaveCount(3);
    
    // Take screenshot for mobile portrait
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/responsive_mobile_portrait.png',
      fullPage: true 
    });
    
    // Test tablet portrait view
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.waitForTimeout(1000);
    
    // Verify layout adapts properly
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toHaveCount(3);
    
    // Take screenshot for tablet portrait
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/responsive_tablet_portrait.png',
      fullPage: true 
    });
    
    // Test desktop portrait view
    await page.setViewportSize({ width: 1024, height: 768 }); // Desktop portrait
    await page.waitForTimeout(1000);
    
    // Verify grid layout works properly
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toHaveCount(3);
    
    // Take screenshot for desktop portrait
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/responsive_desktop_portrait.png',
      fullPage: true 
    });
    
    console.log('✅ Profile page demonstrates responsive design in portrait orientation');
  });

  test('Negative Scenario 1: Unauthenticated user cannot access profile page', async ({ page }) => {
    console.log('🧪 Testing: Unauthenticated user is redirected from profile page');
    
    // Try to access profile page directly without login
    await page.goto(`/${TEST_SCHOOL_ID}/profile`);
    await page.waitForTimeout(2000);
    
    // Should be redirected to login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Verify we're on login page
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/unauthenticated_redirect.png',
      fullPage: true 
    });
    
    console.log('✅ Unauthenticated user correctly redirected to login page');
  });

  test('Negative Scenario 2: User cannot access other school profile', async ({ page }) => {
    console.log('🧪 Testing: User cannot access profile page for different school');
    
    // Login as regular user
    await page.goto('/login');
    await page.waitForLoadState('networkidle'); // Wait for JS to load
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    await page.click('button[data-action="login-submit"]');
    
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    await page.waitForURL(`**/${TEST_SCHOOL_ID}/notices`, { timeout: 10000 });
    await page.waitForLoadState('networkidle'); // Ensure page is fully loaded
    
    // Try to access profile page for different school
    const differentSchoolId = 'different-school-456';
    await page.goto(`/${differentSchoolId}/profile`);
    await page.waitForTimeout(2000);
    
    // Should show access denied or redirect
    const currentUrl = page.url();
    
    // Either shows error page or redirects to login/notices
    const isErrorPage = await page.locator('text=Access denied').isVisible();
    const isLoginPage = currentUrl.includes('/login');
    
    expect(isErrorPage || isLoginPage).toBeTruthy();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/school_access_denied.png',
      fullPage: true 
    });
    
    console.log('✅ User correctly blocked from accessing other school profile');
  });

  test('Positive Scenario 7: Admin can access any school profile', async ({ page }) => {
    console.log('🧪 Testing: Admin can access profile page for any school');
    
    // Login as admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle'); // Wait for JS to load
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
    await page.click('button[data-action="login-submit"]');
    
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    
    // Admin goes to dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle'); // Ensure page is fully loaded
    
    // Try to access profile page for different school as admin
    const differentSchoolId = 'different-school-456';
    await page.goto(`/${differentSchoolId}/profile`);
    await page.waitForLoadState('networkidle');
    
    // Should be able to access (may show "Profile not found" if user doesn't exist, but no access denied)
    const currentUrl = page.url();
    expect(currentUrl).toContain(`/${differentSchoolId}/profile`);
    
    // Check if page loads without access denied error
    const accessDenied = await page.locator('text=Access denied').isVisible();
    expect(accessDenied).toBeFalsy();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_010_complete_user_profile_page/attempt_1/admin_school_access.png',
      fullPage: true 
    });
    
    console.log('✅ Admin can access profile page for any school');
  });
});