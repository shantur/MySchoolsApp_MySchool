/**
 * Mock Authentication Service for E2E Testing
 * 
 * This service provides mock authentication for E2E tests when Firebase
 * is not configured. It should only be used in development/testing.
 */

import { UserSession } from '@/lib/types';

// Test users configuration
const TEST_USERS = {
  'admin@test.com': {
    uid: 'admin-123',
    email: 'admin@test.com',
    schoolId: 'test-school-123',
    role: 'admin' as const,
    displayName: 'Test Admin User',
    groupIds: [],
  },
  'user@test.com': {
    uid: 'user-123',
    email: 'user@test.com',
    schoolId: 'test-school-123',
    role: 'user' as const,
    displayName: 'Test Regular User',
    groupIds: ['K7FhWlZce393ECZf0BIV', '4nZq6vrcWoV0ZiEbrfus'], // Grade 10A and Grade 10B
  },
};

/**
 * Mock authenticate user function for E2E testing
 * 
 * @param {string} email - User email
 * @param {string} password - User password (ignored in mock)
 * @return {Promise<UserSession | null>} User session data or null
 */
export async function authenticateUserMock(
  email: string,
  _password: string
): Promise<UserSession | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const user = TEST_USERS[email as keyof typeof TEST_USERS];
  
  if (!user) {
    return null;
  }
  
  return user;
}

/**
 * Check if we should use mock authentication
 */
export function shouldUseMockAuth(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    !process.env.FIREBASE_ADMIN_KEY_PATH &&
    !process.env.FIREBASE_ADMIN_KEY_BASE64
  );
}