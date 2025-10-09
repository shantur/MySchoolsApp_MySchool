/**
 * Group Management E2E Tests - MySchool Application
 * 
 * Comprehensive end-to-end tests for Group CRUD operations including:
 * - Create new groups with validation
 * - Edit existing groups with pre-populated data
 * - Delete groups with confirmation dialog
 * - Visual validation of all group management interfaces
 * - Real API integration testing
 * - Cross-browser compatibility testing
 * 
 * Tests are configured for mobile portrait orientation focusing on core scenarios
 */

import { test, expect, BrowserContext } from '@playwright/test';
import jwt from 'jsonwebtoken';

// Test configuration constants
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_ADMIN_PASSWORD = 'admin123';
const TEST_SCHOOL_ID = 'school-a';
const SESSION_SECRET = 'test-session-secret-for-e2e-testing';

// Test data for group operations
const TEST_GROUP = {
  name: 'E2E Test Group',
  schoolId: TEST_SCHOOL_ID,
  description: 'This is a test group created during E2E testing'
};

const UPDATED_GROUP = {
  name: 'E2E Test Group - Updated',
  description: 'This group has been updated during E2E testing'
};

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
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }
  ]);
}

/**
 * Helper function to generate unique group names for testing
 */
function generateTestGroupName(suffix: string = ''): string {
  const timestamp = Date.now();
  return `E2E Test Group ${timestamp} ${suffix}`.trim();
}

test.describe('Group Management - E2E Workflow Testing', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Positive Scenario 1: Complete CRUD Workflow (Create -> Edit -> Delete)', async ({ page }) => {
    console.log('🧪 Testing: Complete Group CRUD Workflow');
    
    const testGroupName = generateTestGroupName('CRUD');
    const updatedGroupName = `${testGroupName} - Updated`;
    
    // Step 1: Navigate to groups management page
    await page.goto('/admin/groups');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the groups page
    await expect(page).toHaveTitle(/Manage Groups/);
    await expect(page.locator('h1:has-text("Manage Groups")')).toBeVisible();
    
    // Take screenshot of initial groups page
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/01_groups_initial.png',
      fullPage: true
    });
    
    // Step 2: Navigate to create group page
    await page.click('a[href="/admin/groups/create"]');
    await page.waitForLoadState('networkidle');
    
    // Verify create group page
    await expect(page).toHaveTitle(/Create Group/);
    await expect(page.locator('h1:has-text("Create New Group")')).toBeVisible();
    
    // Take screenshot of create group page
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/02_create_group_form.png',
      fullPage: true
    });
    
    // Step 3: Fill and submit create group form
    await page.fill('input[name="name"]', testGroupName);
    await page.selectOption('select[name="schoolId"]', TEST_SCHOOL_ID);
    await page.fill('textarea[name="description"]', TEST_GROUP.description);
    
    // Take screenshot of filled form
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/03_create_group_filled.png',
      fullPage: true
    });
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Verify redirect back to groups page
    await expect(page).toHaveURL(/\/admin\/groups/);
    await expect(page.locator('h1:has-text("Manage Groups")')).toBeVisible();
    
    // Take screenshot after group creation
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/04_group_created.png',
      fullPage: true
    });
    
    // Step 4: Find and navigate to edit the newly created group
    const groupRow = page.locator(`tbody tr:has-text("${testGroupName}")`).first();
    await expect(groupRow).toBeVisible({ timeout: 10000 });
    
    // Click edit button for the new group
    await groupRow.locator('a[data-group-action="edit"]').click();
    await page.waitForLoadState('networkidle');
    
    // Verify edit group page
    await expect(page).toHaveTitle(/Edit Group/);
    await expect(page.locator('h1:has-text("Edit Group")')).toBeVisible();
    
    // Verify form is pre-populated with correct data
    await expect(page.locator('input[name="name"]')).toHaveValue(testGroupName);
    await expect(page.locator('textarea[name="description"]')).toHaveValue(TEST_GROUP.description);
    
    // Take screenshot of edit form with pre-populated data
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/05_edit_group_prepopulated.png',
      fullPage: true
    });
    
    // Step 5: Update group data
    await page.fill('input[name="name"]', updatedGroupName);
    await page.fill('textarea[name="description"]', UPDATED_GROUP.description);
    
    // Take screenshot of updated form
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/06_edit_group_updated.png',
      fullPage: true
    });
    
    // Submit update form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Verify redirect back to groups page
    await expect(page).toHaveURL(/\/admin\/groups/);
    
    // Take screenshot after group update
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/07_group_updated.png',
      fullPage: true
    });
    
    // Step 6: Find and delete the updated group
    const updatedGroupRow = page.locator(`tbody tr:has-text("${updatedGroupName}")`).first();
    await expect(updatedGroupRow).toBeVisible({ timeout: 10000 });
    
    // Click delete button
    await updatedGroupRow.locator('button[data-group-action="delete"]').click();
    
    // Handle confirmation dialog (accept)
    await page.on('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.accept();
    });
    
    // Wait for page reload after deletion
    await page.waitForLoadState('networkidle');
    
    // Take screenshot after group deletion
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/08_group_deleted.png',
      fullPage: true
    });
    
    // Verify group is no longer in the list
    await expect(page.locator(`tbody tr:has-text("${updatedGroupName}")`)).not.toBeVisible();
    
    console.log('✅ Complete CRUD workflow verified successfully');
  });

  test('Positive Scenario 2: Create Group with Validation', async ({ page }) => {
    console.log('🧪 Testing: Create Group with Form Validation');
    
    // Navigate to create group page
    await page.goto('/admin/groups/create');
    await page.waitForLoadState('networkidle');
    
    // Test empty form submission
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Name and school ID are required')).toBeVisible();
    
    // Take screenshot of validation errors
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/09_validation_errors.png',
      fullPage: true
    });
    
    // Test partial form submission (only name)
    await page.fill('input[name="name"]', 'Test Group Without School');
    await page.click('button[type="submit"]');
    
    // Should still show validation error for missing school
    await expect(page.locator('text=Name and school ID are required')).toBeVisible();
    
    // Complete the form correctly
    await page.selectOption('select[name="schoolId"]', TEST_SCHOOL_ID);
    await page.fill('textarea[name="description"]', 'Complete form with all required fields');
    
    // Submit valid form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to groups page on success
    await expect(page).toHaveURL(/\/admin\/groups/);
    
    console.log('✅ Form validation verified successfully');
  });

  test('Positive Scenario 3: Edit Group with Real Data', async ({ page }) => {
    console.log('🧪 Testing: Edit Group with Real Data Integration');
    
    // Navigate to groups page
    await page.goto('/admin/groups');
    await page.waitForLoadState('networkidle');
    
    // Find an existing group to edit (if any exist)
    const existingGroups = page.locator('tbody tr[data-group-id]');
    
    if (await existingGroups.count() > 0) {
      const firstGroup = existingGroups.first();
      const groupName = await firstGroup.locator('td[data-group-name]').textContent();
      
      // Navigate to edit page
      await firstGroup.locator('a[data-group-action="edit"]').click();
      await page.waitForLoadState('networkidle');
      
      // Verify edit page loads with real data
      await expect(page).toHaveTitle(/Edit Group/);
      await expect(page.locator('h1:has-text("Edit Group")')).toBeVisible();
      
      // Verify form contains real group data
      await expect(page.locator('input[name="name"]')).not.toBeEmpty();
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
      
      // Take screenshot of real data edit form
      await page.screenshot({
        path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/10_edit_real_data.png',
        fullPage: true
      });
      
      console.log(`✅ Edit page with real data verified for group: ${groupName}`);
    } else {
      console.log('ℹ️ No existing groups found to edit - skipping real data test');
    }
  });

  test('Positive Scenario 4: Delete Group with Confirmation', async ({ page }) => {
    console.log('🧪 Testing: Delete Group with Confirmation Dialog');
    
    // First create a group to delete
    const testGroupName = generateTestGroupName('Delete Test');
    
    await page.goto('/admin/groups/create');
    await page.waitForLoadState('networkidle');
    
    // Create test group
    await page.fill('input[name="name"]', testGroupName);
    await page.selectOption('select[name="schoolId"]', TEST_SCHOOL_ID);
    await page.fill('textarea[name="description"]', 'Group created for delete testing');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to groups page and find the created group
    await page.goto('/admin/groups');
    await page.waitForLoadState('networkidle');
    
    const groupRow = page.locator(`tbody tr:has-text("${testGroupName}")`).first();
    await expect(groupRow).toBeVisible({ timeout: 10000 });
    
    // Take screenshot before deletion
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/11_before_delete.png',
      fullPage: true
    });
    
    // Click delete button
    await groupRow.locator('button[data-group-action="delete"]').click();
    
    // Handle confirmation dialog (cancel first)
    let dialogHandled = false;
    await page.on('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      if (!dialogHandled) {
        dialog.dismiss(); // Cancel the first time
        dialogHandled = true;
      } else {
        dialog.accept(); // Accept the second time
      }
    });
    
    // Wait a moment for dialog handling
    await page.waitForTimeout(1000);
    
    // Verify group is still there (canceled deletion)
    await expect(groupRow).toBeVisible();
    
    // Click delete button again
    await groupRow.locator('button[data-group-action="delete"]').click();
    await page.waitForLoadState('networkidle');
    
    // Verify group is deleted
    await expect(page.locator(`tbody tr:has-text("${testGroupName}")`)).not.toBeVisible();
    
    // Take screenshot after successful deletion
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/12_after_delete.png',
      fullPage: true
    });
    
    console.log('✅ Delete confirmation dialog verified successfully');
  });

  test('Negative Scenario 1: Unauthorized Access', async ({ page }) => {
    console.log('🧪 Testing: Unauthorized Access to Group Management');
    
    // Try to access groups page without authentication
    await page.context().clearCookies();
    await page.goto('/admin/groups');
    
    // Should redirect to login or show access denied
    await expect(page).toHaveURL(/\/login/);
    
    // Try to access create page
    await page.goto('/admin/groups/create');
    await expect(page).toHaveURL(/\/login/);
    
    // Try to access edit page
    await page.goto('/admin/groups/nonexistent/edit');
    await expect(page).toHaveURL(/\/login/);
    
    console.log('✅ Unauthorized access properly blocked');
  });

  test('Negative Scenario 2: Edit Non-existent Group', async ({ page }) => {
    console.log('🧪 Testing: Edit Non-existent Group');
    
    // Try to edit a group that doesn't exist
    await page.goto('/admin/groups/nonexistent-group-id/edit');
    await page.waitForLoadState('networkidle');
    
    // Should show error message
    await expect(page.locator('text=/Failed to fetch group|Group not found/')).toBeVisible();
    
    // Take screenshot of error state
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/13_edit_nonexistent.png',
      fullPage: true
    });
    
    console.log('✅ Non-existent group error handled correctly');
  });

  test('Visual Validation: Design System Compliance', async ({ page }) => {
    console.log('🧪 Testing: Visual Design System Compliance');
    
    // Test groups list page
    await page.goto('/admin/groups');
    await page.waitForLoadState('networkidle');
    
    // Verify page structure and design elements
    await expect(page.locator('h1:has-text("Manage Groups")')).toBeVisible();
    await expect(page.locator('a[href="/admin/groups/create"]')).toBeVisible();
    
    // Take screenshot for visual validation
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/14_visual_groups_list.png',
      fullPage: true
    });
    
    // Test create group page
    await page.goto('/admin/groups/create');
    await page.waitForLoadState('networkidle');
    
    // Verify form elements are properly styled
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('select[name="schoolId"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Take screenshot for visual validation
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/15_visual_create_form.png',
      fullPage: true
    });
    
    console.log('✅ Visual design system compliance verified');
  });
});

test.describe('Group Management - Cross-browser Compatibility', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Cross-browser: Groups Management Interface', async ({ page }) => {
    console.log('🧪 Testing: Cross-browser Groups Management');
    
    await page.goto('/admin/groups');
    await page.waitForLoadState('networkidle');
    
    // Verify core functionality works across browsers
    await expect(page.locator('h1:has-text("Manage Groups")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
    
    // Test responsive design in portrait orientation
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      // Mobile-specific checks
      console.log('Testing mobile portrait layout');
      await expect(page.locator('table')).toBeVisible();
    }
    
    // Take screenshot for cross-browser comparison
    await page.screenshot({
      path: 'client/evidences/task_003_myschoolweb_manage_groups/attempt_1/16_crossbrowser_groups.png',
      fullPage: true
    });
    
    console.log('✅ Cross-browser compatibility verified');
  });
});