/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Session Management Tests
 * 
 * Tests for JWT-based session creation and validation
 */

import { createSession, validateSession } from '../session';
import { UserSession } from '@/lib/types';

describe('Session Management', () => {
  const mockUserSession: UserSession = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    schoolId: 'school-abc',
    role: 'user',
    displayName: 'Test User',
  };

  const mockAdminSession: UserSession = {
    uid: 'admin-uid-123',
    email: 'admin@example.com',
    schoolId: 'school-admin',
    role: 'admin',
    displayName: 'Admin User',
  };

  beforeEach(() => {
    // Set SESSION_SECRET for tests
    process.env.SESSION_SECRET = 'test-secret-key-for-testing-purposes';
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  describe('createSession', () => {
    it('should create a valid session token for a user', () => {
      const token = createSession(mockUserSession);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should create a valid session token for an admin', () => {
      const token = createSession(mockAdminSession);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should create different tokens for different users', () => {
      const token1 = createSession(mockUserSession);
      const token2 = createSession(mockAdminSession);
      
      expect(token1).not.toBe(token2);
    });

    it('should throw error if SESSION_SECRET is not set', () => {
      delete process.env.SESSION_SECRET;
      
      expect(() => createSession(mockUserSession)).toThrow(
        'SESSION_SECRET environment variable is not set'
      );
    });
  });

  describe('validateSession', () => {
    it('should validate a valid session token', () => {
      const token = createSession(mockUserSession);
      const session = validateSession(token);
      
      expect(session).toBeDefined();
      expect(session?.uid).toBe(mockUserSession.uid);
      expect(session?.email).toBe(mockUserSession.email);
      expect(session?.schoolId).toBe(mockUserSession.schoolId);
      expect(session?.role).toBe(mockUserSession.role);
      expect(session?.displayName).toBe(mockUserSession.displayName);
    });

    it('should validate an admin session token', () => {
      const token = createSession(mockAdminSession);
      const session = validateSession(token);
      
      expect(session).toBeDefined();
      expect(session?.role).toBe('admin');
    });

    it('should return null for invalid token', () => {
      const session = validateSession('invalid-token-string');
      
      expect(session).toBeNull();
    });

    it('should return null for empty token', () => {
      const session = validateSession('');
      
      expect(session).toBeNull();
    });

    it('should return null for malformed token', () => {
      const session = validateSession('not.a.valid.jwt.token');
      
      expect(session).toBeNull();
    });

    it('should throw error if SESSION_SECRET is not set', () => {
      const token = createSession(mockUserSession);
      delete process.env.SESSION_SECRET;
      
      expect(() => validateSession(token)).toThrow(
        'SESSION_SECRET environment variable is not set'
      );
    });

    it('should reject token signed with different secret', () => {
      const token = createSession(mockUserSession);
      
      // Change the secret
      process.env.SESSION_SECRET = 'different-secret';
      
      const session = validateSession(token);
      expect(session).toBeNull();
    });
  });
});
