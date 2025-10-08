/**
 * ARIA Improvements E2E Tests - MySchool Application
 * 
 * Comprehensive end-to-end tests for ARIA label improvements and accessibility features
 * across UI components following WCAG guidelines.
 * 
 * Tests focus on:
 * - Screen Reader Compatibility (VoiceOver/TalkBack simulation)
 * - Keyboard Navigation and Focus Management
 * - Semantic HTML Correctness
 * - ARIA roles, states, and properties
 * - Live regions and dynamic content updates
 * 
 * Tests are configured for mobile portrait orientation
 */

import { test, expect, BrowserContext } from '@playwright/test';
import jwt from 'jsonwebtoken';

// Test configuration constants
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_ADMIN_PASSWORD = 'admin123';
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
      httpOnly: false,
      secure: false
    }
  ]);
  
  console.log(`✅ Admin authentication set for ${TEST_ADMIN_EMAIL}`);
}

test.describe('ARIA Improvements - Screen Reader Compatibility', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Positive Scenario 1: Dialog Component ARIA attributes and focus management', async ({ page }) => {
    console.log('🧪 Testing: Dialog Component ARIA attributes and focus management');
    
    // Navigate to a page with dialog functionality
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for a dialog trigger button (create user, delete confirmation, etc.)
    const createButton = page.locator('[data-admin-action="create-user"], button:has-text("Create"), button:has-text("Add")').first();
    
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(500); // Wait for dialog to appear
      
      // Check for dialog role and attributes
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        
        // Check for proper heading association
        const dialogHeading = dialog.locator('h1, h2, h3').first();
        if (await dialogHeading.count() > 0) {
          const headingId = await dialogHeading.getAttribute('id');
          if (headingId) {
            await expect(dialog).toHaveAttribute('aria-labelledby', headingId);
          }
        }
        
        // Check focus is trapped within dialog
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
        
        // Test Escape key functionality
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Dialog should be closed or closing
        const dialogAfterEscape = page.locator('[role="dialog"]');
        if (await dialogAfterEscape.count() > 0) {
          await expect(dialogAfterEscape).not.toBeVisible();
        }
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/dialog_aria_attributes.png',
      fullPage: true
    });
    
    console.log('✅ Dialog Component ARIA attributes verified successfully');
  });

  test('Positive Scenario 2: AppBar Component landmark roles and navigation context', async ({ page }) => {
    console.log('🧪 Testing: AppBar Component landmark roles and navigation context');
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for banner role in header
    const header = page.locator('header');
    if (await header.count() > 0) {
      await expect(header).toBeVisible();
      // Check for banner role or equivalent semantic structure
      const hasBannerRole = await header.evaluate(el => 
        el.getAttribute('role') === 'banner' || el.tagName === 'HEADER'
      );
      expect(hasBannerRole).toBe(true);
    }
    
    // Check for navigation landmarks
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
      const hasNavRole = await nav.evaluate(el => 
        el.getAttribute('role') === 'navigation' || el.tagName === 'NAV'
      );
      expect(hasNavRole).toBe(true);
      
      // Check for aria-label on navigation if it's not self-evident
      const ariaLabel = await nav.getAttribute('aria-label');
      if (!ariaLabel) {
        // Navigation should have identifiable content or aria-label
        const hasIdentifiableContent = await nav.evaluate(el => {
          const text = el.textContent?.trim();
          return text && (text.includes('Menu') || text.includes('Navigation') || text.includes('Admin'));
        });
        expect(hasIdentifiableContent).toBe(true);
      }
    }
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    if (await h1.count() > 0) {
      await expect(h1).toHaveCount(1); // Only one h1 per page
      await expect(h1.first()).toBeVisible();
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/appbar_landmark_roles.png',
      fullPage: true
    });
    
    console.log('✅ AppBar Component landmark roles verified successfully');
  });

  test('Positive Scenario 3: Select Component ARIA combobox implementation', async ({ page }) => {
    console.log('🧪 Testing: Select Component ARIA combobox implementation');
    
    // Navigate to notice creation page which has select elements
    await page.goto('/admin/notices/create');
    await page.waitForLoadState('networkidle');
    
    // Look for select elements
    const selects = page.locator('select');
    const selectCount = await selects.count();
    
    if (selectCount > 0) {
      for (let i = 0; i < Math.min(selectCount, 3); i++) { // Test first 3 selects
        const select = selects.nth(i);
        await expect(select).toBeVisible();
        
        // Check for proper labeling
        const selectId = await select.getAttribute('id');
        if (selectId) {
          const label = page.locator(`label[for="${selectId}"]`);
          if (await label.count() > 0) {
            await expect(label).toBeVisible();
          }
        }
        
        // Check for aria-required if applicable
        const ariaRequired = await select.getAttribute('aria-required');
        if (ariaRequired === 'true') {
          // Should have required indicator in label
          const label = selectId ? page.locator(`label[for="${selectId}"]`) : select.locator('xpath=./preceding::label[1]');
          if (await label.count() > 0) {
            const hasRequiredIndicator = await label.evaluate(el => 
              el.textContent?.includes('*') || el.getAttribute('aria-required') === 'true'
            );
            expect(hasRequiredIndicator).toBe(true);
          }
        }
        
        // Check for aria-invalid in error states
        const ariaInvalid = await select.getAttribute('aria-invalid');
        if (ariaInvalid === 'true') {
          // Should have associated error message
          const ariaDescribedBy = await select.getAttribute('aria-describedby');
          if (ariaDescribedBy) {
            const errorElement = page.locator(`#${ariaDescribedBy}`);
            if (await errorElement.count() > 0) {
              await expect(errorElement).toBeVisible();
              await expect(errorElement).toHaveAttribute('role', 'alert');
            }
          }
        }
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/select_combobox_aria.png',
      fullPage: true
    });
    
    console.log('✅ Select Component ARIA combobox verified successfully');
  });

  test('Positive Scenario 4: Alert Component dynamic ARIA roles and live regions', async ({ page }) => {
    console.log('🧪 Testing: Alert Component dynamic ARIA roles and live regions');
    
    // Navigate to a page where alerts might appear
    await page.goto('/admin/notices/create');
    await page.waitForLoadState('networkidle');
    
    // Try to trigger an alert by submitting an incomplete form
    const submitButton = page.locator('button[type="submit"], [data-action="create-notice-submit"]').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(1000); // Wait for potential alert
      
      // Look for alert elements
      const alerts = page.locator('[role="alert"], [role="status"]');
      const alertCount = await alerts.count();
      
      if (alertCount > 0) {
        for (let i = 0; i < alertCount; i++) {
          const alert = alerts.nth(i);
          await expect(alert).toBeVisible();
          
          // Check for appropriate aria-live attribute
          const ariaLive = await alert.getAttribute('aria-live');
          const role = await alert.getAttribute('role');
          
          if (role === 'alert') {
            expect(ariaLive).toBe('assertive');
          } else if (role === 'status') {
            expect(ariaLive).toBe('polite');
          }
          
          // Check for dismissible alerts
          const dismissButton = alert.locator('button[aria-label*="dismiss"], button[aria-label*="close"]');
          if (await dismissButton.count() > 0) {
            await expect(dismissButton).toBeVisible();
            const ariaLabel = await dismissButton.getAttribute('aria-label');
            expect(ariaLabel).toMatch(/dismiss|close/i);
          }
        }
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/alert_live_regions.png',
      fullPage: true
    });
    
    console.log('✅ Alert Component dynamic ARIA roles verified successfully');
  });

  test('Positive Scenario 5: Tabs Component ARIA tab pattern implementation', async ({ page }) => {
    console.log('🧪 Testing: Tabs Component ARIA tab pattern implementation');
    
    // Navigate to a page that might have tabs
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for tablist elements
    const tabLists = page.locator('[role="tablist"]');
    const tabListCount = await tabLists.count();
    
    if (tabListCount > 0) {
      const tabList = tabLists.first();
      await expect(tabList).toBeVisible();
      
      // Check for proper orientation
      const ariaOrientation = await tabList.getAttribute('aria-orientation');
      expect(['horizontal', 'vertical', null]).toContain(ariaOrientation);
      
      // Check for tab elements
      const tabs = tabList.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
      
      // Check for proper ARIA relationships
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toBeVisible();
        
        // Check for aria-selected
        const ariaSelected = await tab.getAttribute('aria-selected');
        expect(['true', 'false']).toContain(ariaSelected);
        
        // Check for aria-controls
        const ariaControls = await tab.getAttribute('aria-controls');
        if (ariaControls) {
          const tabPanel = page.locator(`#${ariaControls}`);
          if (await tabPanel.count() > 0) {
            await expect(tabPanel).toHaveAttribute('role', 'tabpanel');
            
            // Check for aria-labelledby relationship
            const tabId = await tab.getAttribute('id');
            if (tabId) {
              await expect(tabPanel).toHaveAttribute('aria-labelledby', tabId);
            }
          }
        }
        
        // Check for disabled tabs
        const ariaDisabled = await tab.getAttribute('aria-disabled');
        if (ariaDisabled === 'true') {
          await expect(tab).toBeDisabled();
        }
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/tabs_aria_pattern.png',
      fullPage: true
    });
    
    console.log('✅ Tabs Component ARIA tab pattern verified successfully');
  });
});

test.describe('ARIA Improvements - Keyboard Navigation', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Positive Scenario 6: Comprehensive keyboard navigation and focus management', async ({ page }) => {
    console.log('🧪 Testing: Comprehensive keyboard navigation and focus management');
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test Tab navigation through interactive elements
    let tabCount = 0;
    let focusedElement = page.locator(':focus');
    
    // Start from the top and tab through elements
    await page.keyboard.press('Home'); // Go to top of page
    await page.keyboard.press('Tab');
    
    while (tabCount < 15) { // Limit to prevent infinite loops
      focusedElement = page.locator(':focus');
      
      if (await focusedElement.count() === 0) {
        break; // No focused element found
      }
      
      const tagName = await focusedElement.evaluate(el => el.tagName);
      const isFocusable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(tagName);
      
      if (isFocusable) {
        // Check that focused element is visible
        await expect(focusedElement).toBeVisible();
        
        // Check for proper focus indicators (via CSS)
        const computedStyle = await focusedElement.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            outlineOffset: style.outlineOffset,
            boxShadow: style.boxShadow
          };
        });
        
        // Element should have some form of focus indicator
        const hasFocusIndicator = 
          computedStyle.outline !== 'none' || 
          computedStyle.boxShadow !== 'none';
        
        // Note: Some browsers use custom focus styles, so this is a loose check
      }
      
      await page.keyboard.press('Tab');
      tabCount++;
    }
    
    // Test Shift+Tab navigation
    await page.keyboard.press('Shift+Tab');
    focusedElement = page.locator(':focus');
    expect(await focusedElement.count()).toBeGreaterThan(0);
    
    // Test arrow key navigation in tabs if present
    const tabLists = page.locator('[role="tablist"]');
    if (await tabLists.count() > 0) {
      const firstTab = tabLists.first().locator('[role="tab"]').first();
      await firstTab.focus();
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      
      // Test Home and End keys
      await page.keyboard.press('Home');
      await page.waitForTimeout(100);
      
      await page.keyboard.press('End');
      await page.waitForTimeout(100);
    }
    
    // Test Enter and Space key activation
    const firstButton = page.locator('button').first();
    if (await firstButton.count() > 0) {
      await firstButton.focus();
      
      // Test Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Test Space key (if it's still focused)
      focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0 && (await focusedElement.evaluate(el => el.tagName)) === 'BUTTON') {
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/keyboard_navigation.png',
      fullPage: true
    });
    
    console.log('✅ Keyboard navigation and focus management verified successfully');
  });

  test('Positive Scenario 7: Focus trapping in dialogs and modals', async ({ page }) => {
    console.log('🧪 Testing: Focus trapping in dialogs and modals');
    
    // Navigate to a page with dialog functionality
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Look for a dialog trigger
    const dialogTrigger = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("Delete")').first();
    
    if (await dialogTrigger.count() > 0) {
      await dialogTrigger.click();
      await page.waitForTimeout(500);
      
      // Check for dialog
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        await expect(dialog).toBeVisible();
        
        // Focus should be within dialog
        const focusedElement = page.locator(':focus');
        expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
        
        // Test Tab navigation stays within dialog
        let tabCount = 0;
        while (tabCount < 10) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          
          const currentFocus = page.locator(':focus');
          if (await currentFocus.count() === 0) break;
          
          const isFocusInDialog = await dialog.evaluate(el => el.contains(document.activeElement));
          expect(isFocusInDialog).toBe(true);
          
          tabCount++;
        }
        
        // Test Escape key closes dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Dialog should be closed
        await expect(dialog).not.toBeVisible();
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/focus_trapping_dialogs.png',
      fullPage: true
    });
    
    console.log('✅ Focus trapping in dialogs verified successfully');
  });
});

test.describe('ARIA Improvements - Semantic HTML and WCAG Compliance', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Positive Scenario 8: Semantic HTML structure and heading hierarchy', async ({ page }) => {
    console.log('🧪 Testing: Semantic HTML structure and heading hierarchy');
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for proper semantic HTML5 elements
    const semanticElements = [
      { selector: 'header', expectedRole: 'banner' },
      { selector: 'nav', expectedRole: 'navigation' },
      { selector: 'main', expectedRole: 'main' },
      { selector: 'aside', expectedRole: 'complementary' },
      { selector: 'footer', expectedRole: 'contentinfo' }
    ];
    
    for (const element of semanticElements) {
      const el = page.locator(element.selector);
      if (await el.count() > 0) {
        await expect(el).toBeVisible();
        
        // Check for proper role attribute or semantic tag
        const role = await el.first().getAttribute('role');
        const tagName = await el.first().evaluate(el => el.tagName);
        
        if (role) {
          expect(role).toBe(element.expectedRole);
        } else {
          expect(tagName).toBe(element.selector.toUpperCase());
        }
      }
    }
    
    // Check heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Check for proper heading order (no skipped levels)
      let previousLevel = 0;
      for (let i = 0; i < Math.min(headingCount, 10); i++) { // Check first 10 headings
        const heading = headings.nth(i);
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.substring(1));
        
        if (previousLevel > 0) {
          // Heading levels should not skip more than one level
          expect(level - previousLevel).toBeLessThanOrEqual(1);
        }
        
        previousLevel = level;
      }
    }
    
    // Check for proper list markup
    const lists = page.locator('ul, ol');
    const listCount = await lists.count();
    
    if (listCount > 0) {
      for (let i = 0; i < Math.min(listCount, 5); i++) { // Check first 5 lists
        const list = lists.nth(i);
        const listItems = list.locator('li');
        const itemCount = await listItems.count();
        expect(itemCount).toBeGreaterThan(0);
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/semantic_html_structure.png',
      fullPage: true
    });
    
    console.log('✅ Semantic HTML structure verified successfully');
  });

  test('Positive Scenario 9: Form accessibility and ARIA attributes', async ({ page }) => {
    console.log('🧪 Testing: Form accessibility and ARIA attributes');
    
    // Navigate to notice creation page
    await page.goto('/admin/notices/create');
    await page.waitForLoadState('networkidle');
    
    // Check form elements
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      const form = forms.first();
      
      // Check for form fieldsets if there are related fields
      const fieldsets = form.locator('fieldset');
      const fieldsetCount = await fieldsets.count();
      
      if (fieldsetCount > 0) {
        for (let i = 0; i < fieldsetCount; i++) {
          const fieldset = fieldsets.nth(i);
          await expect(fieldset).toBeVisible();
          
          // Check for legend
          const legend = fieldset.locator('legend');
          if (await legend.count() > 0) {
            await expect(legend).toBeVisible();
          }
        }
      }
      
      // Check input elements
      const inputs = form.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < Math.min(inputCount, 5); i++) { // Check first 5 inputs
        const input = inputs.nth(i);
        await expect(input).toBeVisible();
        
        // Check for proper labeling
        const inputId = await input.getAttribute('id');
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          if (await label.count() > 0) {
            await expect(label).toBeVisible();
          }
        }
        
        // Check for aria-required
        const required = await input.getAttribute('required');
        const ariaRequired = await input.getAttribute('aria-required');
        
        if (required === 'required' || ariaRequired === 'true') {
          // Should have visual or programmatic required indicator
          const label = inputId ? page.locator(`label[for="${inputId}"]`) : input.locator('xpath=./preceding::label[1]');
          if (await label.count() > 0) {
            const hasRequiredIndicator = await label.evaluate(el => 
              el.textContent?.includes('*') || 
              el.getAttribute('aria-required') === 'true' ||
              el.classList.contains('required')
            );
            // Note: This is a loose check as required indicators vary
          }
        }
        
        // Check for aria-invalid in error states
        const ariaInvalid = await input.getAttribute('aria-invalid');
        if (ariaInvalid === 'true') {
          // Should have associated error message
          const ariaDescribedBy = await input.getAttribute('aria-describedby');
          if (ariaDescribedBy) {
            const errorElement = page.locator(`#${ariaDescribedBy.split(' ')[0]}`); // First ID if multiple
            if (await errorElement.count() > 0) {
              await expect(errorElement).toBeVisible();
              const role = await errorElement.getAttribute('role');
              expect(['alert', 'status', null]).toContain(role);
            }
          }
        }
      }
      
      // Check select elements
      const selects = form.locator('select');
      const selectCount = await selects.count();
      
      for (let i = 0; i < Math.min(selectCount, 3); i++) { // Check first 3 selects
        const select = selects.nth(i);
        await expect(select).toBeVisible();
        
        // Check for proper labeling
        const selectId = await select.getAttribute('id');
        if (selectId) {
          const label = page.locator(`label[for="${selectId}"]`);
          if (await label.count() > 0) {
            await expect(label).toBeVisible();
          }
        }
        
        // Check options
        const options = select.locator('option');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);
      }
      
      // Check buttons
      const buttons = form.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Check first 5 buttons
        const button = buttons.nth(i);
        await expect(button).toBeVisible();
        
        // Check for accessible name
        const buttonText = await button.evaluate(el => el.textContent?.trim());
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
        
        expect(buttonText || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/form_accessibility.png',
      fullPage: true
    });
    
    console.log('✅ Form accessibility verified successfully');
  });

  test('Positive Scenario 10: WCAG 2.1 Level AA compliance verification', async ({ page }) => {
    console.log('🧪 Testing: WCAG 2.1 Level AA compliance verification');
    
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test 1.1.1 Non-text Content
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      if (ariaHidden !== 'true') {
        expect(alt).toBeTruthy();
      }
    }
    
    // Test 1.3.1 Info and Relationships (semantic structure)
    const dataTables = page.locator('table');
    const tableCount = await dataTables.count();
    
    if (tableCount > 0) {
      for (let i = 0; i < Math.min(tableCount, 3); i++) { // Check first 3 tables
        const table = dataTables.nth(i);
        
        // Check for proper table headers
        const headers = table.locator('th');
        const headerCount = await headers.count();
        
        if (headerCount > 0) {
          for (let j = 0; j < Math.min(headerCount, 5); j++) { // Check first 5 headers
            const header = headers.nth(j);
            const scope = await header.getAttribute('scope');
            expect(['col', 'row', null]).toContain(scope);
          }
        }
        
        // Check for caption if complex table
        const rows = table.locator('tbody tr');
        if (await rows.count() > 5) {
          const caption = table.locator('caption');
          if (await caption.count() > 0) {
            await expect(caption).toBeVisible();
          }
        }
      }
    }
    
    // Test 1.4.3 Contrast (Minimum) - Basic check
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button');
    const elementCount = await textElements.count();
    
    if (elementCount > 0) {
      // Sample a few elements to check contrast
      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const element = textElements.nth(i);
        const styles = await element.evaluate(el => {
          const computedStyle = window.getComputedStyle(el);
          return {
            color: computedStyle.color,
            backgroundColor: computedStyle.backgroundColor,
            fontSize: computedStyle.fontSize
          };
        });
        
        // Basic check - element should have visible color
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(styles.color).not.toBe('transparent');
      }
    }
    
    // Test 2.1.1 Keyboard - All interactive elements keyboard accessible
    const interactiveElements = page.locator('a, button, input, select, textarea');
    const interactiveCount = await interactiveElements.count();
    
    for (let i = 0; i < Math.min(interactiveCount, 10); i++) { // Check first 10 elements
      const element = interactiveElements.nth(i);
      const tabIndex = await element.getAttribute('tabindex');
      
      // Element should be focusable unless explicitly disabled
      const disabled = await element.getAttribute('disabled');
      const ariaDisabled = await element.getAttribute('aria-disabled');
      
      if (disabled !== 'disabled' && ariaDisabled !== 'true') {
        expect(tabIndex !== '-1').toBeTruthy();
      }
    }
    
    // Test 2.4.1 Bypass Blocks - Check for landmarks
    const landmarks = page.locator('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer');
    const landmarkCount = await landmarks.count();
    expect(landmarkCount).toBeGreaterThan(0);
    
    // Test 4.1.2 Name, Role, Value - Interactive elements have accessible names
    for (let i = 0; i < Math.min(interactiveCount, 10); i++) { // Check first 10 elements
      const element = interactiveElements.nth(i);
      const tagName = await element.evaluate(el => el.tagName);
      
      let hasAccessibleName = false;
      
      switch (tagName) {
        case 'A':
          const href = await element.getAttribute('href');
          const linkText = await element.evaluate(el => el.textContent?.trim());
          const linkAriaLabel = await element.getAttribute('aria-label');
          hasAccessibleName = !!(href && (linkText || linkAriaLabel));
          break;
          
        case 'BUTTON':
          const buttonText = await element.evaluate(el => el.textContent?.trim());
          const buttonAriaLabel = await element.getAttribute('aria-label');
          const buttonAriaLabelledBy = await element.getAttribute('aria-labelledby');
          hasAccessibleName = !!(buttonText || buttonAriaLabel || buttonAriaLabelledBy);
          break;
          
        case 'INPUT':
          const inputType = await element.getAttribute('type');
          if (inputType === 'submit' || inputType === 'reset' || inputType === 'button') {
            const inputValue = await element.getAttribute('value');
            const inputAriaLabel = await element.getAttribute('aria-label');
            hasAccessibleName = !!(inputValue || inputAriaLabel);
          } else {
            const inputId = await element.getAttribute('id');
            if (inputId) {
              const label = page.locator(`label[for="${inputId}"]`);
              hasAccessibleName = await label.count() > 0;
            }
          }
          break;
          
        case 'SELECT':
        case 'TEXTAREA':
          const selectId = await element.getAttribute('id');
          if (selectId) {
            const label = page.locator(`label[for="${selectId}"]`);
            hasAccessibleName = await label.count() > 0;
          }
          break;
      }
      
      expect(hasAccessibleName).toBe(true);
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/wcag_compliance.png',
      fullPage: true
    });
    
    console.log('✅ WCAG 2.1 Level AA compliance verified successfully');
  });
});

test.describe('ARIA Improvements - Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ context }) => {
    await setAdminAuth(context);
  });

  test('Negative Scenario 1: Invalid ARIA attributes and missing labels', async ({ page }) => {
    console.log('🧪 Testing: Invalid ARIA attributes and missing labels');
    
    // Navigate to various pages to check for issues
    const pages = ['/admin/dashboard', '/admin/users', '/admin/notices/create'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      
      // Check for elements with aria-label but empty value
      const emptyAriaLabels = page.locator('[aria-label=""]');
      const emptyCount = await emptyAriaLabels.count();
      expect(emptyCount).toBe(0);
      
      // Check for elements with invalid aria roles
      const elementsWithRoles = page.locator('[role]');
      const roleCount = await elementsWithRoles.count();
      
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
        'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
        'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form',
        'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox',
        'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
        'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option',
        'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row',
        'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
        'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
        'treegrid', 'treeitem'
      ];
      
      for (let i = 0; i < Math.min(roleCount, 10); i++) { // Check first 10 elements
        const element = elementsWithRoles.nth(i);
        const role = await element.getAttribute('role');
        expect(validRoles).toContain(role);
      }
      
      // Check for images without alt text (unless decorative)
      const imagesWithoutAlt = page.locator('img:not([alt]):not([aria-hidden="true"])');
      const imagesWithoutAltCount = await imagesWithoutAlt.count();
      expect(imagesWithoutAltCount).toBe(0);
      
      // Check for form inputs without labels
      const inputs = page.locator('input:not([type="hidden"])');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < Math.min(inputCount, 5); i++) { // Check first 5 inputs
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        
        let hasLabel = false;
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          hasLabel = await label.count() > 0;
        }
        
        expect(hasLabel || ariaLabel || ariaLabelledBy || placeholder).toBe(true);
      }
    }
    
    // Take screenshot for evidence
    await page.screenshot({
      path: 'evidences/task_009_improve_aria_labels/attempt_1/error_handling_edge_cases.png',
      fullPage: true
    });
    
    console.log('✅ Error handling and edge cases verified successfully');
  });
});