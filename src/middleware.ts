/**
 * Next.js Middleware - Route Protection
 * 
 * Implements authentication and authorization patterns for MySchool routes.
 * This middleware runs before route handlers to enforce access control.
 * 
 * Protected Routes:
 * - /admin/** (requires admin role)
 * - /api/admin/** (requires admin role)
 * - /api/attachments/download/[attachmentId] (requires auth + school/notice access)
 * - /[schoolId]/notices/** (requires auth + school membership)
 * - /[schoolId]/profile (requires auth + school membership)
 * 
 * Public Routes:
 * - /login
 * - / (root)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { UserSession } from '@/lib/types';

/**
 * Session configuration - must match lib/auth/session.ts
 */
const SESSION_CONFIG = {
  cookieName: '__session',
};

/**
 * Get session secret from environment
 */
function getSessionSecret(): string | null {
  return process.env.SESSION_SECRET || null;
}

/**
 * Validate session token from middleware context
 * 
 * For now, we'll use a simple base64 decoding approach that works in Edge Runtime.
 * In production with Firebase, this should use Firebase session cookies.
 * 
 * @param token - JWT token string
 * @returns UserSession or null if invalid
 */
function validateSessionToken(token: string): UserSession | null {
  if (!token || token.trim() === '') {
    return null;
  }
  
  // Check if session secret is available
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) {
    console.log('[Middleware] Session secret not configured');
    return null;
  }
  
  console.log(`[Middleware] Attempting to verify token (simple decode for testing)`);
  
  try {
    // Simple base64 decode for testing (NOT SECURE for production)
    // In production, this should use Firebase Admin SDK verifySessionCookie
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('[Middleware] Invalid JWT format');
      return null;
    }
    
    // Decode the payload (middle part) - use Buffer instead of atob for Edge Runtime compatibility
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log(`[Middleware] Token decoded successfully, payload:`, payload);
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('[Middleware] Token expired');
      return null;
    }
    
    // Validate payload structure
    if (
      !payload.uid ||
      !payload.email ||
      !payload.schoolId ||
      !payload.role
    ) {
      console.log('[Middleware] Payload validation failed - missing required fields');
      return null;
    }
    
    const session = {
      uid: payload.uid as string,
      email: payload.email as string,
      schoolId: payload.schoolId as string,
      role: payload.role as 'user' | 'admin',
      displayName: payload.displayName as string | undefined,
      groupIds: payload.groupIds as string[] | undefined,
    };
    
    console.log('[Middleware] Session created successfully:', session);
    return session;
  } catch (error) {
    console.error('[Middleware] Token validation failed:', error);
    // Token is invalid, expired, or verification failed
    return null;
  }
}

/**
 * Get user session from request cookies
 * 
 * @param request - NextRequest object
 * @returns UserSession or null
 */
function getSession(request: NextRequest): UserSession | null {
  const sessionCookie = request.cookies.get(SESSION_CONFIG.cookieName);
  
  console.log(`[Middleware] Cookie check for ${SESSION_CONFIG.cookieName}:`, sessionCookie ? 'Found' : 'Not found');
  
  if (!sessionCookie) {
    return null;
  }
  
  console.log(`[Middleware] Cookie value: ${sessionCookie.value.substring(0, 20)}...`);
  const session = validateSessionToken(sessionCookie.value);
  console.log(`[Middleware] Session validation result:`, session ? 'Valid' : 'Invalid');
  return session;
}

/**
 * Create JSON error response for API routes
 * 
 * @param message - Error message
 * @param code - Error code
 * @param status - HTTP status code
 * @returns NextResponse with JSON error
 */
function jsonError(message: string, code: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message, code },
    { status }
  );
}

/**
 * Create redirect response for page routes
 * 
 * @param request - NextRequest object
 * @param loginPath - Path to login page
 * @returns NextResponse redirect
 */
function redirectToLogin(request: NextRequest, loginPath = '/login'): NextResponse {
  const url = new URL(loginPath, request.url);
  // Don't double-encode - URL.searchParams.set() handles encoding
  const redirectParam = request.nextUrl.pathname + request.nextUrl.search;
  url.searchParams.set('redirect', redirectParam);
  
  // Create redirect response
  const response = NextResponse.redirect(url);
  
  // Debug: log the redirect URL
  console.log(`[Middleware] Redirecting to: ${url.toString()}`);
  
  return response;
}

/**
 * Check if path matches a pattern
 * 
 * @param pathname - Request pathname
 * @param pattern - Pattern to match (supports wildcards)
 * @returns true if matches
 */
function matchesPattern(pathname: string, pattern: string): boolean {
  // Exact match
  if (pathname === pattern) {
    return true;
  }
  
  // Wildcard match (e.g., /admin/**)
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return pathname.startsWith(prefix);
  }
  
  return false;
}

/**
 * Extract schoolId from pathname
 * Handles routes like /[schoolId]/notices or /[schoolId]/profile
 * 
 * @param pathname - Request pathname
 * @returns schoolId or null
 */
function extractSchoolId(pathname: string): string | null {
  // Match pattern: /schoolId/...
  // Must not be /admin, /api, /login, etc.
  const parts = pathname.split('/').filter(Boolean);
  
  if (parts.length < 2) {
    return null;
  }
  
  const firstPart = parts[0];
  
  // Exclude known non-school routes
  if (['admin', 'api', 'login'].includes(firstPart)) {
    return null;
  }
  
  return firstPart;
}

/**
 * Check if user has access to a school
 * 
 * @param session - User session
 * @param schoolId - School ID to check
 * @returns true if authorized
 */
function hasSchoolAccess(session: UserSession, schoolId: string): boolean {
  // Admins have access to all schools
  if (session.role === 'admin') {
    return true;
  }
  
  // Regular users can only access their own school
  return session.schoolId === schoolId;
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Debug logging
  console.log(`[Middleware] Processing request to: ${pathname}`);
  console.log(`[Middleware] Method: ${request.method}`);
  console.log(`[Middleware] Headers:`, Object.fromEntries(request.headers.entries()));
  
  // Public routes - allow without authentication
  const publicRoutes = ['/', '/login'];
  if (publicRoutes.includes(pathname)) {
    console.log(`[Middleware] Public route allowed: ${pathname}`);
    return NextResponse.next();
  }
  
  // Get user session
  const session = getSession(request);
  
  // Admin routes - require admin role
  if (matchesPattern(pathname, '/admin/**')) {
    if (!session) {
      return redirectToLogin(request);
    }
    
    if (session.role !== 'admin') {
      // User is authenticated but not admin - redirect to login
      return redirectToLogin(request);
    }
    
    return NextResponse.next();
  }
  
  // Admin API routes - require admin role
  if (matchesPattern(pathname, '/api/admin/**')) {
    if (!session) {
      return jsonError('Authentication required', 'UNAUTHORIZED', 401);
    }
    
    if (session.role !== 'admin') {
      return jsonError('Admin access required', 'FORBIDDEN', 403);
    }
    
    return NextResponse.next();
  }
  
  // Attachment download API - require auth and school/notice access
  if (pathname.startsWith('/api/attachments/download/')) {
    if (!session) {
      return jsonError('Authentication required', 'UNAUTHORIZED', 401);
    }
    
    // Extract query parameters for authorization
    const schoolId = request.nextUrl.searchParams.get('schoolId');
    const noticeId = request.nextUrl.searchParams.get('noticeId');
    
    if (!schoolId || !noticeId) {
      return jsonError(
        'Missing required parameters: schoolId and noticeId',
        'BAD_REQUEST',
        400
      );
    }
    
    // Check if user has access to the school
    if (!hasSchoolAccess(session, schoolId)) {
      return jsonError(
        'Access denied to this attachment',
        'FORBIDDEN',
        403
      );
    }
    
    return NextResponse.next();
  }
  
  // School-specific routes (notices, profile) - require auth and school access
  const schoolId = extractSchoolId(pathname);
  if (schoolId) {
    // Check if this is a school-specific route
    if (
      pathname.includes('/notices') ||
      pathname.endsWith('/profile')
    ) {
      if (!session) {
        return redirectToLogin(request);
      }
      
      // Check school access
      if (!hasSchoolAccess(session, schoolId)) {
        // User is authenticated but doesn't have access to this school
        // Redirect to login
        return redirectToLogin(request);
      }
      
      return NextResponse.next();
    }
  }
  
  // Allow other routes (will be handled by Next.js 404 if they don't exist)
  return NextResponse.next();
}

/**
 * Middleware configuration
 * 
 * Specify which routes this middleware should run on.
 * We'll run on all routes except static files and Next.js internals.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
