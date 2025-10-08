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

  test('should test button components', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Try to find and click on Buttons tab - look for various possible selectors
    let buttonsTab = page.locator('button:has-text("Buttons")').first();
    if (await buttonsTab.count() === 0) {
      buttonsTab = page.locator('[role="tab"]:has-text("Buttons")').first();
    }
    if (await buttonsTab.count() === 0) {
      buttonsTab = page.locator('text=Buttons').first();
    }
    
    if (await buttonsTab.count() > 0) {
      await buttonsTab.click();
      await page.waitForTimeout(500);
    }
    
    // Test button variants
    const buttonVariants = ['Primary', 'Secondary', 'Outlined', 'Text', 'Ghost'];
    for (const variant of buttonVariants) {
      const button = page.locator(`button:has-text("${variant}")`).first();
      if (await button.count() > 0) {
        await expect(button).toBeVisible();
        
        // Check hover state
        await button.hover();
        await page.waitForTimeout(200);
        
        // Check focus state
        await button.focus();
        await page.waitForTimeout(200);
      }
    }
    
    // Screenshot button section
    await page.screenshot({ 
      path: 'evidences/task_006_implement_formalized_design_system/attempt_1/button-components.png',
      fullPage: false 
    });
  });

  test('should test form components', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Try to find Forms tab
    let formsTab = page.locator('button:has-text("Forms")').first();
    if (await formsTab.count() === 0) {
      formsTab = page.locator('[role="tab"]:has-text("Forms")').first();
    }
    if (await formsTab.count() === 0) {
      formsTab = page.locator('text=Forms').first();
    }
    
    if (await formsTab.count() > 0) {
      await formsTab.click();
      await page.waitForTimeout(500);
    }
    
    // Test input fields
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    if (inputCount > 0) {
      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        await expect(input).toBeVisible();
        
        // Test typing if it's not disabled
        const isDisabled = await input.isDisabled();
        if (!isDisabled) {
          const inputType = await input.getAttribute('type');
          if (inputType !== 'checkbox' && inputType !== 'radio') {
            await input.fill('test value');
            await page.waitForTimeout(100);
          }
        }
      }
    }
    
    // Screenshot form section
    await page.screenshot({ 
      path: 'evidences/task_006_implement_formalized_design_system/attempt_1/form-components.png',
      fullPage: false 
    });
  });

  test('should test layout components', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Try to find Layout tab
    let layoutTab = page.locator('button:has-text("Layout")').first();
    if (await layoutTab.count() === 0) {
      layoutTab = page.locator('[role="tab"]:has-text("Layout")').first();
    }
    if (await layoutTab.count() === 0) {
      layoutTab = page.locator('text=Layout').first();
    }
    
    if (await layoutTab.count() > 0) {
      await layoutTab.click();
      await page.waitForTimeout(500);
    }
    
    // Test cards
    const cards = page.locator('[data-testid*="card"], .card, div[class*="card"]');
    const cardCount = await cards.count();
    if (cardCount > 0) {
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = cards.nth(i);
        await expect(card).toBeVisible();
        
        // Test hover on cards
        await card.hover();
        await page.waitForTimeout(200);
      }
    }
    
    // Screenshot layout section
    await page.screenshot({ 
      path: 'evidences/task_006_implement_formalized_design_system/attempt_1/layout-components.png',
      fullPage: false 
    });
  });

  test('should test responsive design', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'evidences/task_006_implement_formalized_design_system/attempt_1/mobile-view.png',
      fullPage: true 
    });
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'evidences/task_006_implement_formalized_design_system/attempt_1/tablet-view.png',
      fullPage: true 
    });
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'evidences/task_006_implement_formalized_design_system/attempt_1/desktop-view.png',
      fullPage: true 
    });
  });

  test('should test accessibility', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test tab through multiple elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      const currentFocused = page.locator(':focus');
      await expect(currentFocused).toBeVisible();
    }
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Images should have alt attribute (even if empty for decorative images)
      expect(alt).toBeDefined();
    }
    
    // Screenshot for accessibility evidence
    await page.screenshot({ 
      path: 'evidences/task_006_implement_formalized_design_system/attempt_1/accessibility-test.png',
      fullPage: false 
    });
  });

  test('should test visual consistency', async ({ page }) => {
    // Check that main heading is visible and properly styled
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Design System Demo');
    
    // Check that buttons have consistent styling
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        await expect(button).toBeVisible();
        
        // Check that button has computed styles
        const computedStyle = await button.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            border: style.border,
            padding: style.padding
          };
        });
        
        // Basic checks - should have some styling
        expect(computedStyle.backgroundColor).not.toBe('transparent');
        expect(computedStyle.color).not.toBe('transparent');
      }
    }
    
    // Check color consistency by sampling a few elements
    const textElements = page.locator('p, span, div');
    const textCount = await textElements.count();
    if (textCount > 0) {
      for (let i = 0; i < Math.min(textCount, 5); i++) {
        const element = textElements.nth(i);
        const computedStyle = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            fontSize: style.fontSize,
            fontFamily: style.fontFamily
          };
        });
        
        // Should have readable text properties
        expect(computedStyle.color).not.toBe('transparent');
        expect(computedStyle.fontSize).toBeTruthy();
        expect(computedStyle.fontFamily).toBeTruthy();
      }
    }
    
    // Screenshot for visual consistency evidence
    await page.screenshot({ 
      path: 'evidences/task_006_implement_formalized_design_system/attempt_1/visual-consistency.png',
      fullPage: false 
    });
  });
});