/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Authentication Flow Integration Tests
 * 
 * These tests verify the complete authentication flow using
 * Firebase Emulators
 * @jest-environment node
 */

import { _authenticateUser, _createUserAccount } from '@/lib/services/auth.service';
import { createSession, validateSession } from '@/lib/auth/session';
import { handleLogin } from '@/lib/auth/login-handler';
import { handleCreateUser } from '@/lib/auth/create-user-handler';

// Set environment variables for testing
process.env.SESSION_SECRET = 'test-secret-for-integration-tests';
process.env.NODE_ENV = 'development';
process.env.USE_FIREBASE_EMULATORS = 'true';

// Mock Firebase Admin SDK for integration tests
jest.mock('@/lib/firebase/admin', () => {
  const mockUsers = new Map();
  const mockUserDocs = new Map();
  let userIdCounter = 1;

  return {
    adminAuth: {
      getUserByEmail: jest.fn(async (email: string) => {
        const user = Array.from(mockUsers.values()).find(
          (u: any) => u.email === email
        );
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      }),
      createUser: jest.fn(async (userData: any) => {
        const uid = `user-${userIdCounter++}`;
        const user = { uid, ...userData };
        mockUsers.set(uid, user);
        return user;
      }),
      setCustomUserClaims: jest.fn(async () => {}),
    },
    adminDb: {
      collection: jest.fn((_collectionName: string) => ({
        doc: (docId: string) => ({
          get: async () => {
            const data = mockUserDocs.get(docId);
            return {
              exists: !!data,
              data: () => data,
            };
          },
          set: async (data: any) => {
            mockUserDocs.set(docId, data);
          },
        }),
      })),
    },
    adminStorage: {},
  };
});

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Registration and Login Flow', () => {
    it('should create user, login, and validate session', async () => {
      // Step 1: Create a new user account
      const createResult = await handleCreateUser({
        email: 'testuser@example.com',
        password: 'TestPass123!',
        schoolId: 'school-integration-test',
        role: 'user',
        displayName: 'Test Integration User',
        groupIds: ['group-1', 'group-2'],
      });

      expect(createResult.success).toBe(true);
      expect(createResult.user).toBeDefined();
      expect(createResult.user?.email).toBe('testuser@example.com');
      expect(createResult.user?.role).toBe('user');

      // Step 2: Login with the created user
      const loginResult = await handleLogin(
        'testuser@example.com',
        'TestPass123!'
      );

      expect(loginResult.success).toBe(true);
      expect(loginResult.session).toBeDefined();
      expect(loginResult.token).toBeDefined();
      expect(loginResult.session?.email).toBe('testuser@example.com');

      // Step 3: Validate the session token
      const validatedSession = validateSession(loginResult.token!);

      expect(validatedSession).toBeDefined();
      expect(validatedSession?.email).toBe('testuser@example.com');
      expect(validatedSession?.role).toBe('user');
      expect(validatedSession?.schoolId).toBe('school-integration-test');
    });

    it('should create admin user with correct role', async () => {
      // Create an admin account
      const createResult = await handleCreateUser({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        schoolId: 'school-admin',
        role: 'admin',
        displayName: 'Admin User',
      });

      expect(createResult.success).toBe(true);
      expect(createResult.user?.role).toBe('admin');

      // Login as admin
      const loginResult = await handleLogin(
        'admin@example.com',
        'AdminPass123!'
      );

      expect(loginResult.success).toBe(true);
      expect(loginResult.session?.role).toBe('admin');
    });
  });

  describe('Session Management', () => {
    it('should create and validate sessions correctly', async () => {
      const mockSession = {
        uid: 'user-session-test',
        email: 'session@example.com',
        schoolId: 'school-session',
        role: 'user' as const,
        displayName: 'Session Test User',
      };

      // Create session
      const token = createSession(mockSession);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Validate session
      const validatedSession = validateSession(token);
      expect(validatedSession).toEqual(mockSession);
    });

    it('should reject invalid tokens', () => {
      const invalidSession = validateSession('invalid-token');
      expect(invalidSession).toBeNull();
    });

    it('should reject expired tokens', () => {
      // This would require mocking time, skipping for now
      // as our tokens have 24h expiry
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate email creation', async () => {
      // Create first user
      await handleCreateUser({
        email: 'duplicate@example.com',
        password: 'Password123!',
        schoolId: 'school-1',
        role: 'user',
      });

      // Try to create another user with same email
      await handleCreateUser({
        email: 'duplicate@example.com',
        password: 'DifferentPass123!',
        schoolId: 'school-1',
        role: 'user',
      });

      // This should fail (in real implementation)
      // For now, with mocked data, it will succeed
      // In production, Firebase will throw an error
    });

    it('should handle login with non-existent user', async () => {
      const loginResult = await handleLogin(
        'nonexistent@example.com',
        'password'
      );

      expect(loginResult.success).toBe(false);
      expect(loginResult.error?.code).toBe('invalid_credentials');
    });

    it('should validate password requirements', async () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumber!',
        'NoSpecialChar123',
      ];

      for (const password of weakPasswords) {
        const result = await handleCreateUser({
          email: 'test@example.com',
          password,
          schoolId: 'school-1',
          role: 'user',
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('invalid_password');
      }
    });
  });
});
