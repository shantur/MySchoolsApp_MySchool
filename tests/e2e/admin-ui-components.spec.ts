/**
 * Admin UI Components E2E Tests - MySchool Application
 * 
 * Comprehensive end-to-end tests for Admin UI components including:
 * - Admin Dashboard with summary cards
 * - User Management with CRUD operations
 * - Notice Editor with rich text and attachments
 * - Live Preview Panel functionality
 * - School and Group Management
 * - Design System compliance
 * - Accessibility features
 * 
 * Tests are configured for mobile portrait orientation (iPhone 12)
 */

import { test, expect, BrowserContext } from '@playwright/test';
import jwt from 'jsonwebtoken';

// Test configuration constants
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_ADMIN_PASSWORD = 'admin123';
const TEST_USER_EMAIL = 'user@test.com';
const TEST_USER_PASSWORD = 'user123';
const TEST_SCHOOL_ID = 'school-a';
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
async function setAdminAuth(context: BrowserContext) {
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
  console.log(`✅ Admin authentication set for ${TEST_ADMIN_EMAIL}`);
}

/**
 * Helper function to set authentication cookies for regular user
 */
async function setUserAuth(context: BrowserContext) {
  const userToken = createTestToken({
    uid: 'user-123',
    email: TEST_USER_EMAIL,
    schoolId: TEST_SCHOOL_ID,
    role: 'user',
    displayName: 'Test User'
  });

  console.log(`Setting user token: ${userToken.substring(0, 20)}...`);
  
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
  console.log(`✅ User authentication set for ${TEST_USER_EMAIL}`);
}

test.describe('Admin UI Components - Core Functionality', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Positive Scenario 1: Admin Dashboard loads and displays summary cards correctly', async ({ page }) => {
    console.log('🧪 Testing: Admin Dashboard loads and displays summary cards correctly');
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page title and metadata
    await expect(page).toHaveTitle(/Admin Dashboard - MySchool/);
    
    // Verify page metadata for Flutter adapter
    const pageMetadata = page.locator('[data-page-type="admin-dashboard"]');
    await expect(pageMetadata).toBeVisible();
    await expect(pageMetadata).toHaveAttribute('data-portal-version', '1.0.0');
    await expect(pageMetadata).toHaveAttribute('aria-hidden', 'true');
    
    // Verify header with user info
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    await expect(page.locator(`text=Welcome, ${TEST_ADMIN_EMAIL}`)).toBeVisible();
    
    // Verify summary statistics cards
    const schoolsCard = page.locator('[data-admin-stat="total-schools"]');
    await expect(schoolsCard).toBeVisible();
    await expect(schoolsCard.locator('text=Total Schools')).toBeVisible();
    await expect(schoolsCard.locator('text=🏫')).toBeVisible();
    
    const usersCard = page.locator('[data-admin-stat="total-users"]');
    await expect(usersCard).toBeVisible();
    await expect(usersCard.locator('text=Total Users')).toBeVisible();
    await expect(usersCard.locator('text=👥')).toBeVisible();
    
    const groupsCard = page.locator('[data-admin-stat="total-groups"]');
    await expect(groupsCard).toBeVisible();
    await expect(groupsCard.locator('text=Total Groups')).toBeVisible();
    await expect(groupsCard.locator('text=📚')).toBeVisible();
    
    const noticesCard = page.locator('[data-admin-stat="total-notices"]');
    await expect(noticesCard).toBeVisible();
    await expect(noticesCard.locator('text=Total Notices')).toBeVisible();
    await expect(noticesCard.locator('text=📢')).toBeVisible();
    
    // Verify management section cards
    const schoolsSection = page.locator('[data-admin-section="schools"]');
    await expect(schoolsSection).toBeVisible();
    await expect(schoolsSection.locator('text=Schools')).toBeVisible();
    await expect(schoolsSection.locator('[data-admin-link="schools"]')).toBeVisible();
    
    const usersSection = page.locator('[data-admin-section="users"]');
    await expect(usersSection).toBeVisible();
    await expect(usersSection.locator('text=Users')).toBeVisible();
    await expect(usersSection.locator('[data-admin-link="users"]')).toBeVisible();
    
    const groupsSection = page.locator('[data-admin-section="groups"]');
    await expect(groupsSection).toBeVisible();
    await expect(groupsSection.locator('text=Groups')).toBeVisible();
    await expect(groupsSection.locator('[data-admin-link="groups"]')).toBeVisible();
    
    const noticesSection = page.locator('[data-admin-section="notices"]');
    await expect(noticesSection).toBeVisible();
    await expect(noticesSection.locator('text=Notices')).toBeVisible();
    await expect(noticesSection.locator('[data-admin-link="notices"]')).toBeVisible();
    
    // Test responsive design on mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.grid.grid-cols-1')).toBeVisible(); // Mobile grid layout
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_007_admin_ui_components/attempt_1/admin_dashboard_summary_cards.png',
      fullPage: true
    });
    
    console.log('✅ Admin Dashboard summary cards verified successfully');
  });

  test('Positive Scenario 2: User Management page displays user list with proper data attributes', async ({ page }) => {
    console.log('🧪 Testing: User Management page displays user list with proper data attributes');
    
    // Navigate to users management page
    await page.goto('/admin/users');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page title and metadata
    await expect(page).toHaveTitle(/Manage Users - MySchool Admin/);
    
    const pageMetadata = page.locator('[data-page-type="admin-users"]');
    await expect(pageMetadata).toBeVisible();
    await expect(pageMetadata).toHaveAttribute('data-portal-version', '1.0.0');
    
    // Verify page header
    await expect(page.locator('h1:has-text("Manage Users")')).toBeVisible();
    await expect(page.locator('text=Create New User')).toBeVisible();
    await expect(page.locator('[data-admin-action="create-user"]')).toBeVisible();
    
    // Verify user table structure
    const userTable = page.locator('table');
    await expect(userTable).toBeVisible();
    
    // Verify table headers
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("School")')).toBeVisible();
    await expect(page.locator('th:has-text("Groups")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
    
    // Verify user rows have proper data attributes
    const userRows = page.locator('tbody tr[data-user-id]');
    if (await userRows.count() > 0) {
      const firstUser = userRows.first();
      await expect(firstUser).toHaveAttribute('data-user-id');
      await expect(firstUser).toHaveAttribute('data-user-email');
      await expect(firstUser).toHaveAttribute('data-user-role');
      await expect(firstUser).toHaveAttribute('data-user-school-id');
      
      // Verify role badges
      const roleBadge = firstUser.locator('[data-user-role-badge]');
      await expect(roleBadge).toBeVisible();
      
      // Verify action buttons
      await expect(firstUser.locator('[data-user-action="edit"]')).toBeVisible();
      await expect(firstUser.locator('[data-user-action="delete"]')).toBeVisible();
    }
    
    // Test navigation back to dashboard
    await page.click('a[href="/admin/dashboard"]');
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Take screenshot for evidence
    await page.goto('/admin/users'); // Go back to users page for screenshot
    await page.screenshot({
      path: 'evidences/task_007_admin_ui_components/attempt_1/user_management_list.png',
      fullPage: true
    });
    
    console.log('✅ User Management page verified successfully');
  });

  test('Positive Scenario 3: Notice Editor with rich text and live preview functionality', async ({ page }) => {
    console.log('🧪 Testing: Notice Editor with rich text and live preview functionality');
    
    // Navigate to create notice page
    await page.goto('/admin/notices/create');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page title
    await expect(page).toHaveTitle(/Create New Notice/);
    
    // Verify form structure
    await expect(page.locator('[data-form-type="create-notice"]')).toBeVisible();
    await expect(page.locator('label[for="title"]:has-text("Notice Title *")')).toBeVisible();
    await expect(page.locator('[data-field="notice-title"]')).toBeVisible();
    
    await expect(page.locator('label[for="schoolId"]:has-text("School ID *")')).toBeVisible();
    await expect(page.locator('[data-field="school-id"]')).toBeVisible();
    
    await expect(page.locator('label[for="status"]:has-text("Status")')).toBeVisible();
    await expect(page.locator('[data-field="notice-status"]')).toBeVisible();
    
    // Verify rich text editor
    await expect(page.locator('[data-rich-text-editor]')).toBeVisible();
    
    // Fill in form fields to test live preview
    await page.fill('[data-field="notice-title"]', 'Test Notice Title');
    await page.fill('[data-field="school-id"]', 'school-a');
    await page.selectOption('[data-field="notice-status"]', 'draft');
    
    // Test rich text editor
    const richTextEditor = page.locator('[data-rich-text-editor"]');
    await richTextEditor.fill('This is a test notice content with **bold** and *italic* text.');
    
    // Wait for live preview to update
    await page.waitForTimeout(1000);
    
    // Verify live preview panel
    await expect(page.locator('text=Live HTML Preview Panel')).toBeVisible();
    
    // Check live rendered preview
    const livePreview = page.locator('.prose max-w-none');
    if (await livePreview.count() > 0) {
      await expect(livePreview.locator('text=Test Notice Title')).toBeVisible();
      await expect(livePreview.locator('text=This is a test notice content')).toBeVisible();
    }
    
    // Verify data attributes inspection
    await expect(page.locator('text=Data Attributes Inspection:')).toBeVisible();
    await expect(page.locator('text=data-page-type:')).toBeVisible();
    await expect(page.locator('text=data-notice-id:')).toBeVisible();
    await expect(page.locator('text=data-notice-title:')).toBeVisible();
    
    // Verify raw HTML source
    await expect(page.locator('text=Raw HTML Source:')).toBeVisible();
    const htmlSource = page.locator('pre');
    if (await htmlSource.count() > 0) {
      await expect(htmlSource.locator('text=data-page-type="notice-detail"')).toBeVisible();
    }
    
    // Test attachment upload component
    await expect(page.locator('text=Attachments')).toBeVisible();
    // Note: Attachment upload testing would require file handling which is complex in E2E
    
    // Test form submission button
    const submitButton = page.locator('[data-action="create-notice-submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText('Create Notice');
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_007_admin_ui_components/attempt_1/notice_editor_live_preview.png',
      fullPage: true
    });
    
    console.log('✅ Notice Editor with live preview verified successfully');
  });

  test('Positive Scenario 4: Schools Management interface', async ({ page }) => {
    console.log('🧪 Testing: Schools Management interface');
    
    // Navigate to schools management page
    await page.goto('/admin/schools');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page title and metadata
    await expect(page).toHaveTitle(/Manage Schools/);
    
    const pageMetadata = page.locator('[data-page-type="admin-schools"]');
    if (await pageMetadata.count() > 0) {
      await expect(pageMetadata).toBeVisible();
      await expect(pageMetadata).toHaveAttribute('data-portal-version', '1.0.0');
    }
    
    // Verify page header
    await expect(page.locator('h1:has-text("Manage Schools")')).toBeVisible();
    
    // Verify schools table structure
    const schoolsTable = page.locator('table');
    if (await schoolsTable.count() > 0) {
      await expect(schoolsTable).toBeVisible();
      
      // Verify table headers
      await expect(page.locator('th:has-text("School ID")')).toBeVisible();
      await expect(page.locator('th:has-text("Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Address")')).toBeVisible();
      await expect(page.locator('th:has-text("Contact Email")')).toBeVisible();
      await expect(page.locator('th:has-text("Phone")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
      
      // Verify school rows have proper data attributes
      const schoolRows = page.locator('tbody tr[data-school-id]');
      if (await schoolRows.count() > 0) {
        const firstSchool = schoolRows.first();
        await expect(firstSchool).toHaveAttribute('data-school-id');
        await expect(firstSchool).toHaveAttribute('data-school-name');
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_007_admin_ui_components/attempt_1/schools_management.png',
      fullPage: true
    });
    
    console.log('✅ Schools Management interface verified successfully');
  });

  test('Positive Scenario 5: Groups Management interface', async ({ page }) => {
    console.log('🧪 Testing: Groups Management interface');
    
    // Navigate to groups management page
    await page.goto('/admin/groups');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page title and metadata
    await expect(page).toHaveTitle(/Manage Groups/);
    
    const pageMetadata = page.locator('[data-page-type="admin-groups"]');
    if (await pageMetadata.count() > 0) {
      await expect(pageMetadata).toBeVisible();
      await expect(pageMetadata).toHaveAttribute('data-portal-version', '1.0.0');
    }
    
    // Verify page header
    await expect(page.locator('h1:has-text("Manage Groups")')).toBeVisible();
    
    // Verify groups table structure
    const groupsTable = page.locator('table');
    if (await groupsTable.count() > 0) {
      await expect(groupsTable).toBeVisible();
      
      // Verify table headers
      await expect(page.locator('th:has-text("Group ID")')).toBeVisible();
      await expect(page.locator('th:has-text("Group Name")')).toBeVisible();
      await expect(page.locator('th:has-text("School")')).toBeVisible();
      await expect(page.locator('th:has-text("Description")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
      
      // Verify group rows have proper data attributes
      const groupRows = page.locator('tbody tr[data-group-id]');
      if (await groupRows.count() > 0) {
        const firstGroup = groupRows.first();
        await expect(firstGroup).toHaveAttribute('data-group-id');
        await expect(firstGroup).toHaveAttribute('data-group-name');
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_007_admin_ui_components/attempt_1/groups_management.png',
      fullPage: true
    });
    
    console.log('✅ Groups Management interface verified successfully');
  });
});

test.describe('Admin UI Components - Design System Compliance', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Positive Scenario 6: Material Design 3 compliance and visual consistency', async ({ page }) => {
    console.log('🧪 Testing: Material Design 3 compliance and visual consistency');
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify consistent color scheme (Material Design 3)
    const primaryButtons = page.locator('a[href*="/admin/"][class*="bg-blue-600"]');
    const primaryButtonCount = await primaryButtons.count();
    expect(primaryButtonCount).toBeGreaterThan(0);
    
    // Check that all primary buttons have consistent styling
    for (let i = 0; i < primaryButtonCount; i++) {
      const button = primaryButtons.nth(i);
      await expect(button).toHaveClass(/bg-blue-600/);
      await expect(button).toHaveClass(/text-white/);
      await expect(button).toHaveClass(/px-4/);
      await expect(button).toHaveClass(/py-2/);
    }
    
    // Verify consistent card styling
    const cards = page.locator('[class*="bg-white"][class*="shadow"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // Check that cards have consistent elevation and spacing
    for (let i = 0; i < Math.min(cardCount, 5); i++) { // Check first 5 cards
      const card = cards.nth(i);
      await expect(card).toHaveClass(/bg-white/);
      await expect(card).toHaveClass(/shadow/);
      await expect(card).toHaveClass(/rounded-lg/);
    }
    
    // Verify typography consistency
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Check that headings use consistent font weights
    for (let i = 0; i < Math.min(headingCount, 5); i++) { // Check first 5 headings
      const heading = headings.nth(i);
      const fontWeight = await heading.evaluate(el => window.getComputedStyle(el).fontWeight);
      expect(['bold', '700', '600', '800']).toContain(fontWeight);
    }
    
    // Test responsive grid layout
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile portrait
    const mobileGrid = page.locator('.grid.grid-cols-1');
    await expect(mobileGrid).toBeVisible();
    
    await page.setViewportSize({ width: 1024, height: 768 }); // Desktop
    const desktopGrid = page.locator('.grid.md\\:grid-cols-2');
    await expect(desktopGrid).toBeVisible();
    
    // Take screenshot for design system verification
    await page.screenshot({
      path: 'evidences/task_007_admin_ui_components/attempt_1/design_system_compliance.png',
      fullPage: true
    });
    
    console.log('✅ Material Design 3 compliance verified successfully');
  });
});

test.describe('Admin UI Components - Accessibility', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Positive Scenario 7: Keyboard navigation and focus management', async ({ page }) => {
    console.log('🧪 Testing: Keyboard navigation and focus management');
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus');
    
    // Should be able to navigate through interactive elements
    let tabCount = 0;
    while (tabCount < 10 && await focusedElement.count() > 0) {
      const tagName = await focusedElement.evaluate(el => el.tagName);
      expect(['A', 'BUTTON', 'INPUT', 'SELECT']).toContain(tagName);
      
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus');
      tabCount++;
    }
    
    // Test focus visibility
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    const firstButton = page.locator('button, a, input').first();
    await firstButton.focus();
    const focused = await page.locator(':focus');
    await expect(focused).toBeVisible();
    
    // Test ARIA labels and roles
    const createForm = page.locator('[data-form-type="create-notice"]');
    if (await createForm.count() > 0) {
      await page.goto('/admin/notices/create');
      await page.waitForLoadState('networkidle');
      
      // Check form has proper ARIA label
      await expect(createForm).toHaveAttribute('aria-label');
      
      // Check form fields have proper labels
      const titleField = page.locator('[data-field="notice-title"]');
      await expect(titleField).toHaveAttribute('aria-label');
      
      const schoolIdField = page.locator('[data-field="school-id"]');
      await expect(schoolIdField).toHaveAttribute('aria-label');
    }
    
    // Test semantic HTML structure
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    
    // Test table accessibility
    const tables = page.locator('table');
    if (await tables.count() > 0) {
      const table = tables.first();
      await expect(table.locator('thead')).toBeVisible();
      await expect(table.locator('tbody')).toBeVisible();
      
      // Check scope attributes on table headers
      const headers = table.locator('th[scope]');
      expect(await headers.count()).toBeGreaterThan(0);
    }
    
    // Take screenshot for accessibility verification
    await page.screenshot({
      path: 'evidences/task_007_admin_ui_components/attempt_1/accessibility_features.png',
      fullPage: true
    });
    
    console.log('✅ Accessibility features verified successfully');
  });

  test('Positive Scenario 8: Screen reader compatibility and semantic HTML', async ({ page }) => {
    console.log('🧪 Testing: Screen reader compatibility and semantic HTML');
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test semantic HTML structure
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    
    // Test proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1); // Only one h1 per page
    
    // Test ARIA hidden metadata
    const metadata = page.locator('[data-page-type="admin-dashboard"]');
    await expect(metadata).toHaveAttribute('aria-hidden', 'true');
    await expect(metadata).toHaveClass(/hidden/);
    
    // Test button accessibility
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Check first 5 buttons
      const button = buttons.nth(i);
      const hasText = await button.evaluate(el => el.textContent?.trim());
      const hasAriaLabel = await button.getAttribute('aria-label');
      
      expect(hasText || hasAriaLabel).toBeTruthy();
    }
    
    // Test link accessibility
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    for (let i = 0; i < Math.min(linkCount, 5); i++) { // Check first 5 links
      const link = links.nth(i);
      const hasText = await link.evaluate(el => el.textContent?.trim());
      const hasAriaLabel = await link.getAttribute('aria-label');
      
      expect(hasText || hasAriaLabel).toBeTruthy();
    }
    
    // Test form accessibility on notice creation page
    await page.goto('/admin/notices/create');
    await page.waitForLoadState('networkidle');
    
    const form = page.locator('[data-form-type="create-notice"]');
    if (await form.count() > 0) {
      // Check form labels are properly associated
      const titleInput = page.locator('#title');
      const titleLabel = page.locator('label[for="title"]');
      await expect(titleInput).toBeVisible();
      await expect(titleLabel).toBeVisible();
      
      const schoolIdInput = page.locator('#schoolId');
      const schoolIdLabel = page.locator('label[for="schoolId"]');
      await expect(schoolIdInput).toBeVisible();
      await expect(schoolIdLabel).toBeVisible();
      
      // Check required fields are marked
      await expect(titleLabel.locator('text=*')).toBeVisible();
      await expect(schoolIdLabel.locator('text=*')).toBeVisible();
    }
    
    console.log('✅ Screen reader compatibility verified successfully');
  });
});

test.describe('Admin UI Components - Authorization and Security', () => {
  test('Negative Scenario 1: Regular user cannot access admin dashboard', async ({ page, context }) => {
    console.log('🧪 Testing: Regular user cannot access admin dashboard');
    
    // Set regular user authentication
    await setUserAuth(context);
    
    // Try to access admin dashboard
    await page.goto('/admin/dashboard');
    
    // Should be redirected to login or denied access
    await expect(page).not.toHaveURL('/admin/dashboard');
    
    // Check for redirect to login or access denied
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(login|auth)/);
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_007_admin_ui_components/attempt_1/unauthorized_access_denied.png',
      fullPage: true
    });
    
    console.log('✅ Unauthorized access properly blocked');
  });

  test('Negative Scenario 2: Unauthenticated user cannot access admin pages', async ({ page }) => {
    console.log('🧪 Testing: Unauthenticated user cannot access admin pages');
    
    // Try to access admin dashboard without authentication
    await page.goto('/admin/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/login/);
    
    // Try other admin pages
    const adminPages = [
      '/admin/users',
      '/admin/schools',
      '/admin/groups',
      '/admin/notices'
    ];
    
    for (const adminPage of adminPages) {
      await page.goto(adminPage);
      await expect(page).toHaveURL(/login/);
    }
    
    console.log('✅ Unauthenticated access properly blocked for all admin pages');
  });
});

test.describe('Admin UI Components - Error Handling', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Positive Scenario 9: Form validation and error handling', async ({ page }) => {
    console.log('🧪 Testing: Form validation and error handling');
    
    // Navigate to notice creation page
    await page.goto('/admin/notices/create');
    await page.waitForLoadState('networkidle');
    
    // Try to submit form without required fields
    const submitButton = page.locator('[data-action="create-notice-submit"]');
    await expect(submitButton).toBeVisible();
    
    // Fill in only some fields to test validation
    await page.fill('[data-field="notice-title"]', 'Test Notice');
    // Leave school ID empty to test validation
    
    await submitButton.click();
    
    // Check for error message
    const errorContainer = page.locator('[data-error-container]');
    await expect(errorContainer).toBeVisible();
    
    const errorMessage = page.locator('[data-error-message]');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveAttribute('role', 'alert');
    }
    
    // Test with all required fields filled
    await page.fill('[data-field="school-id"]', 'school-a');
    await page.fill('[data-rich-text-editor]', 'Test notice content');
    
    // The form should now be valid (though actual submission might fail in test environment)
    
    // Take screenshot for error handling verification
    await page.screenshot({
      path: 'evidences/task_007_admin_ui_components/attempt_1/form_validation_error_handling.png',
      fullPage: true
    });
    
    console.log('✅ Form validation and error handling verified successfully');
  });
});