import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin/dashboard');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('should view users list', async ({ page }) => {
    // Navigate to users page from dashboard
    await page.goto('/admin/users');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Users');
    
    // Wait for users to load
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Check that at least one user is displayed
    const userRows = page.locator('[data-testid="user-row"]');
    await expect(userRows.first()).toBeVisible();
    
    // Check for admin user
    await expect(page.locator('text=admin@myschools.app')).toBeVisible();
  });

  test('should edit a user', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users');
    
    // Wait for users to load
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Find edit button for first user (not admin)
    const editButtons = page.locator('[data-testid="edit-user-button"]');
    const firstEditButton = editButtons.first();
    
    // Get the user ID from the edit button href
    const href = await firstEditButton.getAttribute('href');
    expect(href).toMatch(/^\/admin\/users\/[^\/]+\/edit$/);
    
    // Click edit button
    await firstEditButton.click();
    
    // Wait for edit page to load
    await page.waitForURL(/\/admin\/users\/[^\/]+\/edit/);
    await expect(page.locator('h1')).toContainText('Edit User');
    
    // Check form is pre-populated
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="schoolId"]')).toBeVisible();
    await expect(page.locator('input[name="displayName"]')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();
    
    // Update display name
    const displayNameInput = page.locator('input[name="displayName"]');
    const currentName = await displayNameInput.inputValue();
    const newName = `${currentName} (Updated)`;
    await displayNameInput.clear();
    await displayNameInput.fill(newName);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect back to users list
    await page.waitForURL('/admin/users');
    
    // Verify success message (if implemented)
    // Note: Success message might be shown as a toast or alert
  });

  test('should delete a user', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users');
    
    // Wait for users to load
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Count users before deletion
    const userRowsBefore = await page.locator('[data-testid="user-row"]').count();
    
    // Find delete button for a non-admin user
    const deleteButtons = page.locator('[data-testid="delete-user-button"]');
    
    // Skip if no deleteable users (only admin exists)
    if (await deleteButtons.count() === 0) {
      test.skip();
      return;
    }
    
    const firstDeleteButton = deleteButtons.first();
    
    // Click delete button
    await firstDeleteButton.click();
    
    // Wait for confirmation modal
    await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Confirm Delete User');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Wait for modal to close and user to be removed
    await page.waitForSelector('[data-testid="delete-modal"]', { state: 'hidden' });
    
    // Wait a moment for the list to update
    await page.waitForTimeout(1000);
    
    // Verify user count decreased
    const userRowsAfter = await page.locator('[data-testid="user-row"]').count();
    expect(userRowsAfter).toBe(userRowsBefore - 1);
  });

  test('should prevent deletion of last admin', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users');
    
    // Wait for users to load
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Find admin user row
    const adminRow = page.locator('[data-testid="user-row"]:has-text("admin@test.com")');
    
    // Check that delete button is disabled for admin
    const deleteButton = adminRow.locator('[data-testid="delete-user-button"]');
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toHaveAttribute('title', 'Cannot delete the last admin user');
  });

  test('should show validation errors on edit form', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users');
    
    // Wait for users to load
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Find edit button for first user
    const editButtons = page.locator('[data-testid="edit-user-button"]');
    if (await editButtons.count() === 0) {
      test.skip();
      return;
    }
    
    await editButtons.first().click();
    
    // Wait for edit page to load
    await page.waitForURL(/\/admin\/users\/[^\/]+\/edit/);
    
    // Clear email field
    const emailInput = page.locator('input[name="email"]');
    await emailInput.clear();
    
    // Try to submit form
    await page.click('button[type="submit"]');
    
    // Check for validation error
    await expect(page.locator('text=Email is required')).toBeVisible();
    
    // Fill invalid email
    await emailInput.fill('invalid-email');
    await page.click('button[type="submit"]');
    
    // Check for email format error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should navigate back to users list on cancel', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users');
    
    // Wait for users to load
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Find edit button for first user
    const editButtons = page.locator('[data-testid="edit-user-button"]');
    if (await editButtons.count() === 0) {
      test.skip();
      return;
    }
    
    await editButtons.first().click();
    
    // Wait for edit page to load
    await page.waitForURL(/\/admin\/users\/[^\/]+\/edit/);
    
    // Click cancel button
    await page.click('a[href="/admin/users"]');
    
    // Should redirect back to users list
    await page.waitForURL('/admin/users');
    await expect(page.locator('h1')).toContainText('Users');
  });
});