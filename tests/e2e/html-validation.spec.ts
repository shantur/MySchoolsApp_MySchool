import { test, expect, BrowserContext, Page } from '@playwright/test';
import jwt from 'jsonwebtoken';

/**
 * E2E Tests for HTML Structure Validation
 * 
 * These tests validate that the rendered HTML structure of the MySchool component
 * conforms to the "HTML as API Contract" specification. The tests verify:
 * - Page-level metadata (data-page-metadata, data-version, data-page-type, data-timestamp)
 * - Data-* attributes on key HTML elements
 * - Consistent HTML structure for repeatable elements
 * - Semantic HTML5 markup
 * - ARIA labels for accessibility
 * 
 * Tests cover both authenticated and unauthenticated scenarios.
 */

// Test data constants
const TEST_SCHOOL_ID = 'test-school-123';
const TEST_ADMIN_EMAIL = 'admin@test.com';
const TEST_ADMIN_PASSWORD = 'admin123';
const TEST_USER_EMAIL = 'user@test.com';
const TEST_USER_PASSWORD = 'user123';
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
async function loginAsAdmin(context: BrowserContext) {
  const adminToken = createTestToken({
    uid: 'admin-123',
    email: TEST_ADMIN_EMAIL,
    schoolId: TEST_SCHOOL_ID,
    role: 'admin',
    displayName: 'Test Admin'
  });
  
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
}

/**
 * Helper function to set authentication cookies for regular user
 */
async function loginAsUser(context: BrowserContext) {
  const userToken = createTestToken({
    uid: 'user-123',
    email: TEST_USER_EMAIL,
    schoolId: TEST_SCHOOL_ID,
    role: 'user',
    displayName: 'Test User'
  });
  
  await context.addCookies([
    {
      name: '__session',
      value: userToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false
    }
  ]);
}

/**
 * Helper function to validate page metadata
 */
async function validatePageMetadata(page: Page, expectedPageType: string, additionalData?: Record<string, string>) {
  // Check page metadata container (should be present but hidden)
  const metadataContainer = page.locator('div[data-page-type]').first();
  await expect(metadataContainer).toBeAttached(); // Check it exists in DOM
  await expect(metadataContainer).toHaveAttribute('data-page-type', expectedPageType);
  await expect(metadataContainer).toHaveAttribute('data-portal-version', '1.0.0');
  await expect(metadataContainer).toHaveAttribute('data-timestamp', /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
  await expect(metadataContainer).toHaveClass(/hidden/);
  await expect(metadataContainer).toHaveAttribute('aria-hidden', 'true');

  // Check additional metadata if provided
  if (additionalData) {
    for (const [key, value] of Object.entries(additionalData)) {
      await expect(metadataContainer).toHaveAttribute(key, value);
    }
  }
}

/**
 * Helper function to ensure evidence directory exists
 */
function ensureEvidenceDir() {
  const fs = require('fs');
  const path = require('path');
  const evidenceDir = path.join(process.cwd(), 'evidences', 'task_005_implement_e2e_html_validation_tests', 'attempt_1');
  
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  
  return evidenceDir;
}

test.describe('HTML Structure Validation - Login Page', () => {
  test.beforeEach(async ({ context }) => {
    // Set up viewport for portrait orientation
    await context.addInitScript(() => {
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: {
          angle: 0,
          type: 'portrait-primary'
        }
      });
    });
    
    ensureEvidenceDir();
  });

  test('Positive Scenario 1: Login page HTML structure validation (unauthenticated)', async ({ page }) => {
    console.log('🧪 Testing: Login page HTML structure for unauthenticated access');
    
    // Navigate to login page
    await page.goto('/login');
    
    // Validate page metadata
    await validatePageMetadata(page, 'login');
    
    // Check semantic HTML structure
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Login to MySchool');
    
    // Check form structure with data attributes
    const loginForm = page.locator('form[data-form-type="login"]');
    await expect(loginForm).toBeVisible();
    
    // Check form fields with data attributes
    const emailField = page.locator('input[name="email"][data-field="email"]');
    await expect(emailField).toBeVisible();
    await expect(emailField).toHaveAttribute('type', 'email');
    
    const passwordField = page.locator('input[name="password"][data-field="password"]');
    await expect(passwordField).toBeVisible();
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // Check submit button
    const submitButton = page.locator('button[data-action="login-submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveAttribute('type', 'submit');
    
    // Check semantic HTML structure (main element is present by default)
    await expect(page.locator('main')).toBeVisible();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_005_implement_e2e_html_validation_tests/attempt_1/login_page_html_structure.png',
      fullPage: true 
    });
    
    console.log('✅ Login page HTML structure validation completed');
  });

  test('Positive Scenario 2: Login page with redirect parameter HTML validation', async ({ page }) => {
    console.log('🧪 Testing: Login page HTML structure with redirect parameter');
    
    // Navigate to login page with redirect parameter
    const redirectUrl = '/admin/dashboard';
    await page.goto(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    
    // Validate page metadata (should still be login page type)
    await validatePageMetadata(page, 'login');
    
    // Verify form is still present and functional
    await expect(page.locator('form[data-form-type="login"]')).toBeVisible();
    await expect(page.locator('input[data-field="email"]')).toBeVisible();
    await expect(page.locator('input[data-field="password"]')).toBeVisible();
    await expect(page.locator('button[data-action="login-submit"]')).toBeVisible();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_005_implement_e2e_html_validation_tests/attempt_1/login_page_redirect_html_structure.png',
      fullPage: true 
    });
    
    console.log('✅ Login page with redirect parameter HTML validation completed');
  });
});

test.describe('HTML Structure Validation - Notices List Page', () => {
  test.beforeEach(async ({ context }) => {
    // Set up viewport for portrait orientation
    await context.addInitScript(() => {
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: {
          angle: 0,
          type: 'portrait-primary'
        }
      });
    });
    
    ensureEvidenceDir();
  });

  test('Positive Scenario 1: Notices list page HTML structure (authenticated user)', async ({ page, context }) => {
    console.log('🧪 Testing: Notices list page HTML structure for authenticated user');
    
    // Log in as regular user
    await loginAsUser(context);
    
    // Navigate to notices list page
    await page.goto(`/${TEST_SCHOOL_ID}/notices`);
    
    // Validate page metadata
    await validatePageMetadata(page, 'notice-list', {
      'data-school-id': TEST_SCHOOL_ID
    });
    
    // Check semantic HTML structure
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toContainText('School Notices');
    
    // Check navigation links
    await expect(page.locator('a[href$="/profile"]')).toBeVisible();
    await expect(page.locator('form[action="/api/auth/logout"]')).toBeVisible();
    
    // Check notice items structure (if notices exist)
    const noticeItems = page.locator('article.notice-item');
    const noticeCount = await noticeItems.count();
    
    if (noticeCount > 0) {
      // Validate first notice item structure
      const firstNotice = noticeItems.first();
      await expect(firstNotice).toHaveAttribute('data-notice-id');
      await expect(firstNotice).toHaveAttribute('data-school-id');
      
      // Check notice title
      const noticeTitle = firstNotice.locator('h2[data-notice-title]');
      await expect(noticeTitle).toBeVisible();
      
      // Check notice summary
      const noticeSummary = firstNotice.locator('p[data-notice-summary]');
      await expect(noticeSummary).toBeVisible();
      await expect(noticeSummary).toHaveClass(/notice-summary/);
      
      // Check publication date
      const noticeDate = firstNotice.locator('span[data-notice-publication-date]');
      await expect(noticeDate).toBeVisible();
      await expect(noticeDate).toHaveClass(/notice-date/);
      await expect(noticeDate).toHaveAttribute('data-notice-publication-date', /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
      
      // Check detail link
      const detailLink = firstNotice.locator('a[data-notice-detail-link]');
      await expect(detailLink).toBeVisible();
      await expect(detailLink).toHaveAttribute('href', new RegExp(`/${TEST_SCHOOL_ID}/notices/[^/]+`));
      
      // Check attachment count if present
      const attachmentCount = firstNotice.locator('span[data-attachment-count]');
      const attachmentCountExists = await attachmentCount.count();
      if (attachmentCountExists > 0) {
        await expect(attachmentCount.first()).toBeVisible();
      }
    } else {
      // Check empty state message
      await expect(page.locator('text=No notices available at this time')).toBeVisible();
    }
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_005_implement_e2e_html_validation_tests/attempt_1/notices_list_html_structure.png',
      fullPage: true 
    });
    
    console.log('✅ Notices list page HTML structure validation completed');
  });

  test('Positive Scenario 2: Notices list page HTML structure (admin user)', async ({ page, context }) => {
    console.log('🧪 Testing: Notices list page HTML structure for admin user');
    
    // Log in as admin
    await loginAsAdmin(context);
    
    // Navigate to notices list page
    await page.goto(`/${TEST_SCHOOL_ID}/notices`);
    
    // Validate page metadata (admin should see same structure)
    await validatePageMetadata(page, 'notice-list', {
      'data-school-id': TEST_SCHOOL_ID
    });
    
    // Verify basic structure is consistent with user view
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toContainText('School Notices');
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_005_implement_e2e_html_validation_tests/attempt_1/notices_list_admin_html_structure.png',
      fullPage: true 
    });
    
    console.log('✅ Admin notices list page HTML structure validation completed');
  });
});

test.describe('HTML Structure Validation - Notice Detail Page', () => {
  test.beforeEach(async ({ context }) => {
    // Set up viewport for portrait orientation
    await context.addInitScript(() => {
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: {
          angle: 0,
          type: 'portrait-primary'
        }
      });
    });
    
    ensureEvidenceDir();
  });

  test('Positive Scenario 1: Notice detail page HTML structure (authenticated user)', async ({ page, context }) => {
    console.log('🧪 Testing: Notice detail page HTML structure for authenticated user');
    
    // Log in as regular user
    await loginAsUser(context);
    
    // First, navigate to notices list to get a valid notice ID
    await page.goto(`/${TEST_SCHOOL_ID}/notices`);
    
    // Try to find a notice and navigate to it
    const noticeItems = page.locator('article.notice-item');
    const noticeCount = await noticeItems.count();
    
    if (noticeCount > 0) {
      // Get the first notice's detail link and navigate
      const detailLink = noticeItems.first().locator('a[data-notice-detail-link]');
      const href = await detailLink.getAttribute('href');
      
      if (href) {
        await page.goto(href);
        
        // Validate page metadata
        const metadataContainer = page.locator('div[data-page-type="notice-detail"]').first();
        await expect(metadataContainer).toBeAttached(); // Check it exists in DOM
        await expect(metadataContainer).toHaveAttribute('data-page-type', 'notice-detail');
        await expect(metadataContainer).toHaveAttribute('data-portal-version', '1.0.0');
        await expect(metadataContainer).toHaveAttribute('data-timestamp', /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
        await expect(metadataContainer).toHaveAttribute('data-notice-id', /[^/]+/);
        await expect(metadataContainer).toHaveAttribute('data-school-id', TEST_SCHOOL_ID);
        await expect(metadataContainer).toHaveClass(/hidden/);
        await expect(metadataContainer).toHaveAttribute('aria-hidden', 'true');
        
        // Check semantic HTML structure
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('main')).toBeVisible();
        
        // Check back navigation
        await expect(page.locator('a[href$="/notices"]')).toBeVisible();
        await expect(page.locator('text=← Back to Notices')).toBeVisible();
        
        // Check notice detail article structure
        const noticeDetail = page.locator('article.notice-detail');
        await expect(noticeDetail).toBeVisible();
        await expect(noticeDetail).toHaveAttribute('data-notice-id');
        
        // Check notice title
        const noticeTitle = noticeDetail.locator('h1[data-notice-title]');
        await expect(noticeTitle).toBeVisible();
        
        // Check publication date
        const noticeDate = noticeDetail.locator('span[data-notice-publication-date]');
        await expect(noticeDate).toBeVisible();
        await expect(noticeDate).toHaveAttribute('data-notice-publication-date', /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
        
        // Check notice body
        const noticeBody = noticeDetail.locator('div[data-notice-body]');
        await expect(noticeBody).toBeVisible();
        await expect(noticeBody).toHaveAttribute('data-content-format', 'html');
        await expect(noticeBody).toHaveClass(/notice-content/);
        
        // Check attachments if present
        const attachmentsList = noticeDetail.locator('ul.attachments-list');
        const attachmentsExist = await attachmentsList.count();
        
        if (attachmentsExist > 0) {
          const attachmentItems = attachmentsList.locator('li.attachment-item');
          const attachmentCount = await attachmentItems.count();
          
          if (attachmentCount > 0) {
            // Validate first attachment structure
            const firstAttachment = attachmentItems.first();
            await expect(firstAttachment).toHaveAttribute('data-attachment-id');
            
            const attachmentLink = firstAttachment.locator('a[data-attachment-download-url]');
            await expect(attachmentLink).toBeVisible();
            await expect(attachmentLink).toHaveAttribute('data-attachment-filename');
            await expect(attachmentLink).toHaveAttribute('data-attachment-filetype');
            await expect(attachmentLink).toHaveAttribute('data-attachment-size');
            await expect(attachmentLink).toHaveAttribute('download');
          }
        }
        
        // Take screenshot for evidence
        await page.screenshot({ 
          path: 'evidences/task_005_implement_e2e_html_validation_tests/attempt_1/notice_detail_html_structure.png',
          fullPage: true 
        });
        
        console.log('✅ Notice detail page HTML structure validation completed');
      } else {
        console.log('⚠️ No notice detail link found, skipping detail page validation');
      }
    } else {
      console.log('⚠️ No notices found, skipping detail page validation');
    }
  });

  test('Positive Scenario 2: Notice detail page with attachments HTML validation', async ({ page, context }) => {
    console.log('🧪 Testing: Notice detail page with attachments HTML structure');
    
    // Log in as regular user
    await loginAsUser(context);
    
    // Navigate to notices list to find a notice with attachments
    await page.goto(`/${TEST_SCHOOL_ID}/notices`);
    
    // Look for notices with attachments
    const noticeItems = page.locator('article.notice-item');
    const noticeCount = await noticeItems.count();
    
    let foundNoticeWithAttachments = false;
    
    for (let i = 0; i < noticeCount; i++) {
      const noticeItem = noticeItems.nth(i);
      const attachmentCount = noticeItem.locator('span[data-attachment-count]');
      const hasAttachments = await attachmentCount.count();
      
      if (hasAttachments > 0) {
        // Navigate to this notice
        const detailLink = noticeItem.locator('a[data-notice-detail-link]');
        const href = await detailLink.getAttribute('href');
        
        if (href) {
          await page.goto(href);
          foundNoticeWithAttachments = true;
          
          // Validate attachments structure
          const attachmentsList = page.locator('ul.attachments-list');
          await expect(attachmentsList).toBeVisible();
          
          const attachmentItems = attachmentsList.locator('li.attachment-item');
          const attachmentCount = await attachmentItems.count();
          expect(attachmentCount).toBeGreaterThan(0);
          
          // Validate each attachment
          for (let j = 0; j < attachmentCount; j++) {
            const attachment = attachmentItems.nth(j);
            
            // Check attachment data attributes
            await expect(attachment).toHaveAttribute('data-attachment-id');
            
            const attachmentLink = attachment.locator('a[data-attachment-download-url]');
            await expect(attachmentLink).toBeVisible();
            
            // Validate attachment link attributes
            const downloadUrl = await attachmentLink.getAttribute('data-attachment-download-url');
            expect(downloadUrl).toContain('/api/attachments/download/');
            expect(downloadUrl).toContain('noticeId=');
            expect(downloadUrl).toContain('schoolId=');
            
            await expect(attachmentLink).toHaveAttribute('data-attachment-filename');
            await expect(attachmentLink).toHaveAttribute('data-attachment-filetype');
            await expect(attachmentLink).toHaveAttribute('data-attachment-size');
            
            // Check file type format
            const fileType = await attachmentLink.getAttribute('data-attachment-filetype');
            expect(fileType).toMatch(/^(application\/|image\/|text\/)/);
            
            // Check download attribute
            await expect(attachmentLink).toHaveAttribute('download');
          }
          
          // Take screenshot for evidence
          await page.screenshot({ 
            path: 'evidences/task_005_implement_e2e_html_validation_tests/attempt_1/notice_detail_attachments_html_structure.png',
            fullPage: true 
          });
          
          break;
        }
      }
    }
    
    if (!foundNoticeWithAttachments) {
      console.log('⚠️ No notices with attachments found, skipping attachments validation');
    } else {
      console.log('✅ Notice detail page with attachments HTML validation completed');
    }
  });
});

test.describe('HTML Structure Validation - Error Scenarios', () => {
  test.beforeEach(async ({ context }) => {
    // Set up viewport for portrait orientation
    await context.addInitScript(() => {
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: {
          angle: 0,
          type: 'portrait-primary'
        }
      });
    });
    
    ensureEvidenceDir();
  });

  test('Negative Scenario 1: Unauthorized access to notices page', async ({ page }) => {
    console.log('🧪 Testing: Unauthorized access redirects to login');
    
    // Try to access notices page without authentication
    await page.goto(`/${TEST_SCHOOL_ID}/notices`);
    
    // Should be redirected to login
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    expect(currentUrl).toContain('?redirect=');
    
    // Validate login page structure is maintained
    await validatePageMetadata(page, 'login');
    await expect(page.locator('form[data-form-type="login"]')).toBeVisible();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_005_implement_e2e_html_validation_tests/attempt_1/unauthorized_redirect_html_structure.png',
      fullPage: true 
    });
    
    console.log('✅ Unauthorized access redirect validation completed');
  });

  test('Negative Scenario 2: Non-existent notice detail page', async ({ page, context }) => {
    console.log('🧪 Testing: Non-existent notice detail page structure');
    
    // Log in as regular user
    await loginAsUser(context);
    
    // Try to access a non-existent notice
    const fakeNoticeId = 'non-existent-notice-123';
    await page.goto(`/${TEST_SCHOOL_ID}/notices/${fakeNoticeId}`);
    
    // Should show notice not found page
    await expect(page.locator('text=Notice not found')).toBeVisible();
    await expect(page.locator('text=The requested notice could not be found')).toBeVisible();
    
    // Check back link is present
    await expect(page.locator('a[href$="/notices"]')).toBeVisible();
    await expect(page.locator('text=← Back to Notices')).toBeVisible();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_005_implement_e2e_html_validation_tests/attempt_1/notice_not_found_html_structure.png',
      fullPage: true 
    });
    
    console.log('✅ Non-existent notice detail page validation completed');
  });
});

test.describe('HTML Structure Validation - Cross-Platform Consistency', () => {
  test.beforeEach(async ({ context }) => {
    // Set up viewport for portrait orientation
    await context.addInitScript(() => {
      Object.defineProperty(screen, 'orientation', {
        writable: true,
        value: {
          angle: 0,
          type: 'portrait-primary'
        }
      });
    });
    
    ensureEvidenceDir();
  });

  test('Positive Scenario 1: Consistent data attributes across pages', async ({ page, context }) => {
    console.log('🧪 Testing: Consistent data attributes across different pages');
    
    // Log in as regular user
    await loginAsUser(context);
    
    // Test login page consistency
    await page.goto('/login');
    const loginMetadata = page.locator('div[data-page-type="login"]');
    await expect(loginMetadata).toHaveAttribute('data-portal-version', '1.0.0');
    await expect(loginMetadata).toHaveAttribute('data-timestamp', /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
    
    // Test notices list consistency
    await page.goto(`/${TEST_SCHOOL_ID}/notices`);
    const noticesMetadata = page.locator('div[data-page-type="notice-list"]');
    await expect(noticesMetadata).toHaveAttribute('data-portal-version', '1.0.0');
    await expect(noticesMetadata).toHaveAttribute('data-timestamp', /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
    
    // Check notice items if they exist
    const noticeItems = page.locator('article.notice-item');
    const noticeCount = await noticeItems.count();
    
    if (noticeCount > 0) {
      const firstNotice = noticeItems.first();
      await expect(firstNotice).toHaveAttribute('data-notice-id');
      await expect(firstNotice).toHaveAttribute('data-school-id');
      
      const noticeTitle = firstNotice.locator('h2[data-notice-title]');
      await expect(noticeTitle).toBeVisible();
      
      const noticeSummary = firstNotice.locator('p[data-notice-summary]');
      await expect(noticeSummary).toBeVisible();
      
      const noticeDate = firstNotice.locator('span[data-notice-publication-date]');
      await expect(noticeDate).toBeVisible();
    }
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'evidences/task_005_implement_e2e_html_validation_tests/attempt_1/cross_platform_consistency.png',
      fullPage: true 
    });
    
    console.log('✅ Cross-platform consistency validation completed');
  });
});