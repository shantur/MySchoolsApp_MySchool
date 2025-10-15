/**
 * Session Management Tests (Supabase)
 * 
 * Tests for Supabase-based JWT session management
 */

import { createSession, validateSession, getUserSession } from '../session.supabase';

describe('Session Management (Supabase)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.SESSION_SECRET = 'test-secret-key-at-least-32-characters-long';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createSession', () => {
    it('should create JWT token from UserSession', () => {
      const sessionData = {
        uid: 'user-123',
        email: 'test@example.com',
        schoolId: 'school-456',
        role: 'admin' as const,
        displayName: 'Test User',
        groupIds: ['group-1', 'group-2'],
      };

      const token = createSession(sessionData);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should throw error if SESSION_SECRET is not set', () => {
      delete process.env.SESSION_SECRET;

      const sessionData = {
        uid: 'user-123',
        email: 'test@example.com',
        schoolId: 'school-456',
        role: 'admin' as const,
      };

      expect(() => createSession(sessionData)).toThrow(
        'SESSION_SECRET environment variable is not set'
      );
    });
  });

  describe('validateSession', () => {
    it('should validate valid JWT token and return session data', () => {
      const sessionData = {
        uid: 'user-123',
        email: 'test@example.com',
        schoolId: 'school-456',
        role: 'admin' as const,
        displayName: 'Test User',
        groupIds: ['group-1'],
      };

      const token = createSession(sessionData);
      const validated = validateSession(token);

      expect(validated).toEqual(sessionData);
    });

    it('should return null for invalid token', () => {
      const result = validateSession('invalid.token.here');

      expect(result).toBeNull();
    });

    it('should return null for empty token', () => {
      const result = validateSession('');

      expect(result).toBeNull();
    });

    it('should return null for token with missing required fields', async () => {
      // Manually create a token with incomplete payload
      const jwt = await import('jsonwebtoken');
      const incompleteToken = jwt.sign(
        { uid: 'user-123' }, // Missing email, schoolId, role
        process.env.SESSION_SECRET as string
      );

      const result = validateSession(incompleteToken);

      expect(result).toBeNull();
    });

    it('should throw error if SESSION_SECRET is not set', () => {
      delete process.env.SESSION_SECRET;

      expect(() => validateSession('any.token.here')).toThrow(
        'SESSION_SECRET environment variable is not set'
      );
    });
  });

  describe('getUserSession', () => {
    it('should return session from cookies', async () => {
      const sessionData = {
        uid: 'user-123',
        email: 'test@example.com',
        schoolId: 'school-456',
        role: 'user' as const,
      };

      const token = createSession(sessionData);

      // Mock cookies
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: token }),
      };

      jest.doMock('next/headers', () => ({
        cookies: () => mockCookies,
      }));

      const { getUserSession: getUserSessionMocked } = await import('../session.supabase');
      const session = await getUserSessionMocked();

      expect(session).toEqual(sessionData);
    });

    it('should return null if cookie not found', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      };

      jest.doMock('next/headers', () => ({
        cookies: () => mockCookies,
      }));

      const { getUserSession: getUserSessionMocked } = await import('../session.supabase');
      const session = await getUserSessionMocked();

      expect(session).toBeNull();
    });

    it('should return null if cookie contains invalid token', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'invalid.token.here' }),
      };

      jest.doMock('next/headers', () => ({
        cookies: () => mockCookies,
      }));

      const { getUserSession: getUserSessionMocked } = await import('../session.supabase');
      const session = await getUserSessionMocked();

      expect(session).toBeNull();
    });
  });

  describe('SESSION_CONFIG', () => {
    it('should have correct configuration', async () => {
      const { SESSION_CONFIG } = await import('../session.supabase');

      expect(SESSION_CONFIG.cookieName).toBe('__session');
      expect(SESSION_CONFIG.maxAge).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(SESSION_CONFIG.sameSite).toBe('lax');
      expect(SESSION_CONFIG.path).toBe('/');
    });

    it('should set secure flag in production', async () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();

      const { SESSION_CONFIG } = await import('../session.supabase');

      expect(SESSION_CONFIG.secure).toBe(true);
    });

    it('should not set secure flag in development', async () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      const { SESSION_CONFIG } = await import('../session.supabase');

      expect(SESSION_CONFIG.secure).toBe(false);
    });
  });
});
