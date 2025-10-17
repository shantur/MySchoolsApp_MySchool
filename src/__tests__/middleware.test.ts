/**
 * Middleware Unit Tests
 * 
 * Tests route protection patterns and authorization logic
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';
import jwt from 'jsonwebtoken';

// Mock environment variables
const TEST_SESSION_SECRET = 'test-secret-key-for-middleware-testing';

describe('Middleware Route Protection', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = TEST_SESSION_SECRET;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Helper function to create a valid session token
   */
  function createSessionToken(sessionData: {
    uid: string;
    email: string;
    schoolId: string;
    role: 'user' | 'admin';
    displayName?: string;
    groupIds?: string[];
  }): string {
    return jwt.sign(sessionData, TEST_SESSION_SECRET, {
      algorithm: 'HS256',
      expiresIn: '24h',
    });
  }

  /**
   * Helper function to create a NextRequest with session cookie
   */
  function createRequest(
    url: string,
    sessionToken?: string
  ): NextRequest {
    const request = new NextRequest(new URL(url, 'http://localhost:3000'));
    
    if (sessionToken) {
      // Set session cookie
      request.cookies.set('__session', sessionToken);
    }
    
    return request;
  }

  describe('Public Routes', () => {
    it('should allow access to root path without authentication', async () => {
      const request = createRequest('/');
      const response = await middleware(request);
      
      // Should continue to next handler
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307); // Not a redirect
    });

    it('should allow access to login page without authentication', async () => {
      const request = createRequest('/login');
      const response = await middleware(request);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).not.toBe(307);
    });
  });

  describe('Admin Page Routes (/admin/**)', () => {
    it('should redirect unauthenticated users to login', async () => {
      const request = createRequest('/admin/dashboard');
      const response = await middleware(request);
      
      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=');
    });

    it('should allow admin users to access admin pages', async () => {
      const token = createSessionToken({
        uid: 'admin-123',
        email: 'admin@example.com',
        schoolId: 'school-a',
        role: 'admin',
      });
      
      const request = createRequest('/admin/dashboard', token);
      const response = await middleware(request);
      
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should redirect non-admin users to login', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest('/admin/users', token);
      const response = await middleware(request);
      
      // Should redirect to login
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=');
    });

    it('should protect nested admin routes', async () => {
      const request = createRequest('/admin/users/create');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });

  describe('Admin API Routes (/api/admin/**)', () => {
    it('should return 401 JSON error for unauthenticated requests', async () => {
      const request = createRequest('/api/admin/users');
      const response = await middleware(request);
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toEqual({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    });

    it('should return 403 JSON error for non-admin authenticated users', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest('/api/admin/notices', token);
      const response = await middleware(request);
      
      expect(response.status).toBe(403);
      
      const body = await response.json();
      expect(body).toEqual({
        error: 'Admin access required',
        code: 'FORBIDDEN',
      });
    });

    it('should allow admin users to access admin API routes', async () => {
      const token = createSessionToken({
        uid: 'admin-123',
        email: 'admin@example.com',
        schoolId: 'school-a',
        role: 'admin',
      });
      
      const request = createRequest('/api/admin/users', token);
      const response = await middleware(request);
      
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Attachment Download API (/api/attachments/download/[id])', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const request = createRequest('/api/attachments/download/attach123');
      const response = await middleware(request);
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 if schoolId query param is missing', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest(
        '/api/attachments/download/attach123?noticeId=notice456',
        token
      );
      const response = await middleware(request);
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.error).toContain('Missing required parameters');
    });

    it('should return 400 if noticeId query param is missing', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest(
        '/api/attachments/download/attach123?schoolId=school-a',
        token
      );
      const response = await middleware(request);
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.error).toContain('Missing required parameters');
    });

    it('should return 403 if user does not have access to the school', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest(
        '/api/attachments/download/attach123?schoolId=school-b&noticeId=notice456',
        token
      );
      const response = await middleware(request);
      
      expect(response.status).toBe(403);
      
      const body = await response.json();
      expect(body.error).toContain('Access denied');
    });

    it('should allow user to download attachments from their own school', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest(
        '/api/attachments/download/attach123?schoolId=school-a&noticeId=notice456',
        token
      );
      const response = await middleware(request);
      
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(400);
    });

    it('should allow admin to download attachments from any school', async () => {
      const token = createSessionToken({
        uid: 'admin-123',
        email: 'admin@example.com',
        schoolId: 'school-a',
        role: 'admin',
      });
      
      const request = createRequest(
        '/api/attachments/download/attach123?schoolId=school-b&noticeId=notice456',
        token
      );
      const response = await middleware(request);
      
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(400);
    });
  });

  describe('School-Specific Routes (/[schoolId]/notices/**)', () => {
    it('should redirect unauthenticated users to login', async () => {
      const request = createRequest('/school-a/notices');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=');
    });

    it('should allow users to access their own school notices', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest('/school-a/notices', token);
      const response = await middleware(request);
      
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should redirect users accessing other schools to login', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest('/school-b/notices', token);
      const response = await middleware(request);
      
      // Should redirect to login
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=');
    });

    it('should allow admin to access any school notices', async () => {
      const token = createSessionToken({
        uid: 'admin-123',
        email: 'admin@example.com',
        schoolId: 'school-a',
        role: 'admin',
      });
      
      const request = createRequest('/school-b/notices', token);
      const response = await middleware(request);
      
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should protect nested notice routes', async () => {
      const request = createRequest('/school-a/notices/notice-123');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });

  describe('Profile Routes (/[schoolId]/profile)', () => {
    it('should redirect unauthenticated users to login', async () => {
      const request = createRequest('/school-a/profile');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should allow users to access their own school profile', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest('/school-a/profile', token);
      const response = await middleware(request);
      
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should redirect users accessing other school profiles to login', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest('/school-b/profile', token);
      const response = await middleware(request);
      
      // Should redirect to login
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=');
    });

    it('should allow admin to access any school profile', async () => {
      const token = createSessionToken({
        uid: 'admin-123',
        email: 'admin@example.com',
        schoolId: 'school-a',
        role: 'admin',
      });
      
      const request = createRequest('/school-b/profile', token);
      const response = await middleware(request);
      
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Session Validation', () => {
    it('should reject expired tokens', async () => {
      // Create an expired token (expires immediately)
      const expiredToken = jwt.sign(
        {
          uid: 'user-123',
          email: 'user@example.com',
          schoolId: 'school-a',
          role: 'user',
        },
        TEST_SESSION_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: '0s', // Expired immediately
        }
      );
      
      // Wait a bit to ensure expiration
      const request = createRequest('/admin/dashboard', expiredToken);
      const response = await middleware(request);
      
      // Should redirect to login (unauthenticated)
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should reject tokens with invalid signature', async () => {
      const invalidToken = jwt.sign(
        {
          uid: 'user-123',
          email: 'user@example.com',
          schoolId: 'school-a',
          role: 'user',
        },
        'wrong-secret',
        {
          algorithm: 'HS256',
          expiresIn: '24h',
        }
      );
      
      const request = createRequest('/admin/dashboard', invalidToken);
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should reject tokens with missing required fields', async () => {
      const incompleteToken = jwt.sign(
        {
          uid: 'user-123',
          // Missing email, schoolId, role
        },
        TEST_SESSION_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: '24h',
        }
      );
      
      const request = createRequest('/admin/dashboard', incompleteToken);
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });

  describe('Redirect URL Preservation', () => {
    it('should include original URL in redirect query parameter', async () => {
      const request = createRequest('/admin/dashboard');
      const response = await middleware(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('/login?redirect=');
      expect(location).toContain(encodeURIComponent('/admin/dashboard'));
    });

    it('should preserve query parameters in redirect URL', async () => {
      const request = createRequest('/school-a/notices?filter=recent');
      const response = await middleware(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('/login?redirect=');
      expect(location).toContain(encodeURIComponent('/school-a/notices?filter=recent'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing SESSION_SECRET gracefully', async () => {
      delete process.env.SESSION_SECRET;
      
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'admin',
      });
      
      const request = createRequest('/admin/dashboard', token);
      const response = await middleware(request);
      
      // Should redirect to login when secret is missing
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should handle empty session cookie', async () => {
      const request = createRequest('/admin/dashboard', '');
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should not protect non-existent routes', async () => {
      const token = createSessionToken({
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
      });
      
      const request = createRequest('/some-random-route', token);
      const response = await middleware(request);
      
      // Should pass through (Next.js will handle 404)
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });
});
