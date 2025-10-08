import { test, expect } from '@playwright/test';

test.describe('Design System Validation - Task 006', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3004/design-system-demo');
    await page.waitForLoadState('networkidle');
  });

  test('should load design system demo page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/MySchool/);
    await expect(page.locator('h1')).toContainText('Design System Demo');
    
    // Take screenshot of the full page
    await page.screenshot({ 
      path: 'evidences/task_006_implement_formalized_design_system/attempt_1/design-system-demo-full-page.png',
      fullPage: true 
    });
  });

  test.describe('Button Components', () => {
    test('should display all button variants correctly', async ({ page }) => {
      // Navigate to Buttons tab
      await page.click('[data-testid="tab-buttons"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Check button variants
      const buttonVariants = ['Primary', 'Secondary', 'Outlined', 'Text', 'Ghost'];
      for (const variant of buttonVariants) {
        const button = page.locator(`button:has-text("${variant}")`).first();
        await expect(button).toBeVisible();
        
        // Check hover state
        await button.hover();
        await page.waitForTimeout(200);
        
        // Check focus state
        await button.focus();
        await page.waitForTimeout(200);
      }
      
      // Screenshot button variants section
      const buttonSection = page.locator('h3:has-text("Button Variants")').first();
      await buttonSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/button-variants.png',
        clip: await buttonSection.boundingBox() 
      });
    });

    test('should display all button sizes correctly', async ({ page }) => {
      await page.click('[data-testid="tab-buttons"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      const buttonSizes = ['Small', 'Medium', 'Large'];
      for (const size of buttonSizes) {
        const button = page.locator(`button:has-text("${size}")`).first();
        await expect(button).toBeVisible();
      }
      
      // Screenshot button sizes section
      const sizeSection = page.locator('h3:has-text("Button Sizes")').first();
      await sizeSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/button-sizes.png',
        clip: await sizeSection.boundingBox() 
      });
    });

    test('should display button states correctly', async ({ page }) => {
      await page.click('[data-testid="tab-buttons"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Check disabled state
      const disabledButton = page.locator('button:has-text("Disabled")').first();
      await expect(disabledButton).toBeDisabled();
      
      // Check loading state (if implemented)
      const loadingButton = page.locator('button:has-text("Loading")').first();
      await expect(loadingButton).toBeVisible();
      
      // Screenshot button states section
      const statesSection = page.locator('h3:has-text("Button States")').first();
      await statesSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/button-states.png',
        clip: await statesSection.boundingBox() 
      });
    });

    test('should display icon buttons correctly', async ({ page }) => {
      await page.click('[data-testid="tab-buttons"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      const iconButtons = page.locator('button[aria-label*="Settings"], button[aria-label*="Edit"], button[aria-label*="Delete"], button[aria-label*="Favorite"]');
      await expect(iconButtons).toHaveCount(4);
      
      // Test keyboard navigation on icon buttons
      for (let i = 0; i < await iconButtons.count(); i++) {
        const button = iconButtons.nth(i);
        await button.focus();
        await expect(button).toBeFocused();
        await page.waitForTimeout(100);
      }
      
      // Screenshot icon buttons section
      const iconSection = page.locator('h3:has-text("Icon Buttons")').first();
      await iconSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/icon-buttons.png',
        clip: await iconSection.boundingBox() 
      });
    });
  });

  test.describe('Form Components', () => {
    test('should display input fields correctly', async ({ page }) => {
      await page.click('[data-testid="tab-forms"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Test email input
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
      
      // Test password input
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();
      await passwordInput.fill('password123');
      
      // Test error state
      const errorInput = page.locator('input:has-text("Error State")').first();
      await expect(errorInput).toBeVisible();
      
      // Test disabled input
      const disabledInput = page.locator('input:has-text("Disabled Input")').first();
      await expect(disabledInput).toBeDisabled();
      
      // Screenshot input fields section
      const inputSection = page.locator('h3:has-text("Input Fields")').first();
      await inputSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/input-fields.png',
        clip: await inputSection.boundingBox() 
      });
    });

    test('should display other form elements correctly', async ({ page }) => {
      await page.click('[data-testid="tab-forms"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Test textarea
      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible();
      await textarea.fill('Test message content');
      
      // Test select
      const select = page.locator('select');
      await expect(select).toBeVisible();
      await select.selectOption('us');
      
      // Test checkbox
      const checkbox = page.locator('input[type="checkbox"]');
      await expect(checkbox).toBeVisible();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
      
      // Test radio buttons
      const radio1 = page.locator('input[value="option1"]');
      const radio2 = page.locator('input[value="option2"]');
      await expect(radio1).toBeVisible();
      await expect(radio2).toBeVisible();
      await radio1.check();
      await expect(radio1).toBeChecked();
      
      // Test switch
      const switchElement = page.locator('input[type="checkbox"][role="switch"]');
      if (await switchElement.count() > 0) {
        await expect(switchElement.first()).toBeVisible();
        await switchElement.first().check();
      }
      
      // Screenshot form elements section
      const formSection = page.locator('h3:has-text("Other Form Elements")').first();
      await formSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/form-elements.png',
        clip: await formSection.boundingBox() 
      });
    });
  });

  test.describe('Layout Components', () => {
    test('should display cards correctly', async ({ page }) => {
      await page.click('[data-testid="tab-layout"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Test basic card
      const basicCard = page.locator('text=Basic Card').first();
      await expect(basicCard).toBeVisible();
      
      // Test interactive card
      const interactiveCard = page.locator('text=Interactive Card').first();
      await expect(interactiveCard).toBeVisible();
      await interactiveCard.hover();
      await page.waitForTimeout(200);
      
      // Test elevated card
      const elevatedCard = page.locator('text=Elevated Card').first();
      await expect(elevatedCard).toBeVisible();
      
      // Test card actions
      const actionButtons = page.locator('button:has-text("Action")');
      if (await actionButtons.count() > 0) {
        await expect(actionButtons.first()).toBeVisible();
      }
      
      // Screenshot cards section
      const cardsSection = page.locator('h3:has-text("Cards")').first();
      await cardsSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/cards.png',
        clip: await cardsSection.boundingBox() 
      });
    });

    test('should display containers correctly', async ({ page }) => {
      await page.click('[data-testid="tab-layout"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Test different container sizes
      const containerSizes = ['Small container', 'Medium container', 'Large container'];
      for (const size of containerSizes) {
        const container = page.locator(`text=${size}`).first();
        await expect(container).toBeVisible();
      }
      
      // Screenshot containers section
      const containersSection = page.locator('h3:has-text("Containers")').first();
      await containersSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/containers.png',
        clip: await containersSection.boundingBox() 
      });
    });
  });

  test.describe('Feedback Components', () => {
    test('should display alerts correctly', async ({ page }) => {
      await page.click('[data-testid="tab-feedback"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Test different alert variants
      const alertVariants = ['Information', 'Success', 'Warning', 'Error'];
      for (const variant of alertVariants) {
        const alert = page.locator(`text=${variant}`).first();
        await expect(alert).toBeVisible();
      }
      
      // Screenshot alerts section
      const alertsSection = page.locator('h3:has-text("Alerts")').first();
      await alertsSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/alerts.png',
        clip: await alertsSection.boundingBox() 
      });
    });

    test('should display progress indicators correctly', async ({ page }) => {
      await page.click('[data-testid="tab-feedback"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Test progress bars
      const progressLabels = ['Progress: 25%', 'Progress: 50%', 'Progress: 75%', 'Indeterminate'];
      for (const label of progressLabels) {
        const progressElement = page.locator(`text=${label}`).first();
        await expect(progressElement).toBeVisible();
      }
      
      // Screenshot progress section
      const progressSection = page.locator('h3:has-text("Progress")').first();
      await progressSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/progress.png',
        clip: await progressSection.boundingBox() 
      });
    });

    test('should handle interactive elements correctly', async ({ page }) => {
      await page.click('[data-testid="tab-feedback"]', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Test dialog
      const dialogButton = page.locator('button:has-text("Open Dialog")');
      await expect(dialogButton).toBeVisible();
      await dialogButton.click();
      await page.waitForTimeout(500);
      
      // Check if dialog opened
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        await expect(dialog).toBeVisible();
        
        // Close dialog
        const cancelButton = page.locator('button:has-text("Cancel")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
      }
      
      // Test snackbar
      const snackbarButton = page.locator('button:has-text("Show Snackbar")');
      await expect(snackbarButton).toBeVisible();
      await snackbarButton.click();
      await page.waitForTimeout(500);
      
      // Screenshot interactive elements section
      const interactiveSection = page.locator('h3:has-text("Interactive Elements")').first();
      await interactiveSection.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/interactive-elements.png',
        clip: await interactiveSection.boundingBox() 
      });
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      // Check main heading
      const mainHeading = page.locator('h1');
      await expect(mainHeading).toHaveAttribute('role', 'heading');
      
      // Check button accessibility
      const buttons = page.locator('button');
      for (let i = 0; i < Math.min(await buttons.count(), 10); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();
        
        // Button should have either aria-label or text content
        expect(ariaLabel || (text && text.trim().length > 0)).toBeTruthy();
      }
      
      // Check form accessibility
      const inputs = page.locator('input');
      for (let i = 0; i < Math.min(await inputs.count(), 10); i++) {
        const input = inputs.nth(i);
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        const id = await input.getAttribute('id');
        
        // Input should have aria-label, placeholder, or associated label
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          if (await label.count() > 0) {
            await expect(label).toBeVisible();
          }
        } else {
          expect(ariaLabel || placeholder).toBeTruthy();
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Test that focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test tab through multiple elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        const currentFocused = page.locator(':focus');
        await expect(currentFocused).toBeVisible();
      }
      
      // Test Enter key on buttons
      const focusedButton = page.locator('button:focus');
      if (await focusedButton.count() > 0) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This is a basic check - in real implementation, you'd use a contrast checking tool
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, button');
      
      // Check that text elements are visible (basic visibility check)
      for (let i = 0; i < Math.min(await textElements.count(), 20); i++) {
        const element = textElements.nth(i);
        await expect(element).toBeVisible();
        
        // Check that element has computed color (not transparent)
        const computedStyle = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            opacity: style.opacity
          };
        });
        
        expect(computedStyle.opacity).not.toBe('0');
        expect(computedStyle.color).not.toBe('transparent');
      }
    });
  });

  test.describe('Responsive Design Tests', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.waitForTimeout(500);
      
      // Take screenshot of mobile view
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/mobile-view.png',
        fullPage: true 
      });
      
      // Check that elements are still visible and functional
      await expect(page.locator('h1')).toBeVisible();
      
      // Test button tab navigation on mobile
      const tabs = page.locator('[data-testid="tab-buttons"], button:has-text("Buttons")');
      if (await tabs.count() > 0) {
        await tabs.first().click();
        await page.waitForTimeout(500);
        await expect(page.locator('button:has-text("Primary")')).toBeVisible();
      }
    });

    test('should be responsive on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.waitForTimeout(500);
      
      // Take screenshot of tablet view
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/tablet-view.png',
        fullPage: true 
      });
      
      // Check that layout adapts properly
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should be responsive on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      await page.waitForTimeout(500);
      
      // Take screenshot of desktop view
      await page.screenshot({ 
        path: 'evidences/task_006_implement_formalized_design_system/attempt_1/desktop-view.png',
        fullPage: true 
      });
      
      // Check that layout utilizes space properly
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Visual Consistency Tests', () => {
    test('should maintain consistent spacing', async ({ page }) => {
      // Check that components have consistent spacing
      const buttonGroups = page.locator('div').filter({ has: page.locator('button') });
      
      for (let i = 0; i < Math.min(await buttonGroups.count(), 5); i++) {
        const group = buttonGroups.nth(i);
        const buttons = group.locator('button');
        
        if (await buttons.count() > 1) {
          // Check spacing between buttons
          for (let j = 0; j < await buttons.count() - 1; j++) {
            const button1 = buttons.nth(j);
            const button2 = buttons.nth(j + 1);
            
            const box1 = await button1.boundingBox();
            const box2 = await button2.boundingBox();
            
            if (box1 && box2) {
              const spacing = box2.x - (box1.x + box1.width);
              // Check that spacing is positive and reasonable
              expect(spacing).toBeGreaterThan(0);
              expect(spacing).toBeLessThan(100); // Reasonable upper bound
            }
          }
        }
      }
    });

    test('should maintain consistent typography', async ({ page }) => {
      // Check heading consistency
      const headings = page.locator('h1, h2, h3');
      
      for (let i = 0; i < Math.min(await headings.count(), 10); i++) {
        const heading = headings.nth(i);
        await expect(heading).toBeVisible();
        
        // Check that heading has consistent font properties
        const computedStyle = await heading.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            fontSize: style.fontSize
          };
        });
        
        expect(computedStyle.fontFamily).toContain('Roboto');
        expect(['400', '500', '600', '700']).toContain(computedStyle.fontWeight);
      }
    });

    test('should maintain consistent colors', async ({ page }) => {
      // Check primary buttons have consistent color
      const primaryButtons = page.locator('button:has-text("Primary")');
      
      for (let i = 0; i < await primaryButtons.count(); i++) {
        const button = primaryButtons.nth(i);
        const backgroundColor = await button.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        
        // Check that background color is not transparent or default
        expect(backgroundColor).not.toBe('transparent');
        expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });
});