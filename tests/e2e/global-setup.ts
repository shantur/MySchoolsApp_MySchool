import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * 
 * This setup runs once before all tests and can be used to:
 * - Start required services
 * - Set up test data
 * - Configure global test state
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  // Note: SESSION_SECRET should be set via .env.local or environment variables
  console.log('🔧 Ensure SESSION_SECRET is set for middleware testing');
  
  // Create test users for E2E testing
  console.log('👥 Creating test users...');
  await createTestUsers();
  
  console.log('✅ E2E test environment ready');
}

/**
 * Create test users for E2E testing
 */
async function createTestUsers() {
  // Since we're using mock authentication, we don't need to create users
  // The mock service will handle the test users automatically
  console.log('ℹ️ Using mock authentication - no need to create test users');
}

export default globalSetup;