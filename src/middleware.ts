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
 * Base64 URL decode helper for JWT
 * Converts base64url to Uint8Array
 */
function base64UrlDecode(base64Url: string): Uint8Array {
  // Convert base64url to base64
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  // Decode base64 to binary string
  const binary = atob(padded);
  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Validate session token using Web Crypto API (Edge Runtime compatible)
 * 
 * This implementation uses Web Crypto API instead of the jsonwebtoken library
 * because middleware runs in Edge Runtime where Node.js libraries are not available.
 * 
 * @param token - JWT token string
 * @returns Promise<UserSession | null> - User session or null if invalid
 */
async function validateSessionToken(token: string): Promise<UserSession | null> {
  if (!token || token.trim() === '') {
    console.log('[Middleware] Empty token provided');
    return null;
  }
  
  // Check if session secret is available
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) {
    console.log('[Middleware] Session secret not configured');
    return null;
  }
  
  console.log(`[Middleware] Attempting to verify JWT token with Web Crypto API`);
  
  try {
    // Split JWT into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('[Middleware] Invalid JWT format - expected 3 parts, got', parts.length);
      return null;
    }
    
    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlDecode(parts[2]);
    
    // Import secret key for HMAC verification
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(sessionSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Verify the signature (cast signature to BufferSource for TypeScript compatibility)
    const valid = await crypto.subtle.verify('HMAC', key, signature as BufferSource, data);
    
    if (!valid) {
      console.log('[Middleware] JWT signature verification failed');
      return null;
    }
    
    console.log('[Middleware] JWT signature verified successfully');
    
    // Decode the payload (middle part)
    const payloadJson = new TextDecoder().decode(base64UrlDecode(parts[1]));
    const payload = JSON.parse(payloadJson);
    console.log(`[Middleware] Token payload decoded:`, payload);
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('[Middleware] Token expired at', new Date(payload.exp * 1000).toISOString());
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
 * @returns Promise<UserSession | null>
 */
async function getSession(request: NextRequest): Promise<UserSession | null> {
  const sessionCookie = request.cookies.get(SESSION_CONFIG.cookieName);
  
  console.log(`[Middleware] Cookie check for ${SESSION_CONFIG.cookieName}:`, sessionCookie ? 'Found' : 'Not found');
  // Only log all cookies if getAll() is available (not available in test mocks)
  if (typeof request.cookies.getAll === 'function') {
    console.log(`[Middleware] All cookies:`, Array.from(request.cookies.getAll()).map(c => c.name));
  }
  
  if (!sessionCookie) {
    console.log('[Middleware] No session cookie found');
    return null;
  }
  
  console.log(`[Middleware] Cookie value (first 20 chars): ${sessionCookie.value.substring(0, 20)}...`);
  const session = await validateSessionToken(sessionCookie.value);
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
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Debug logging
  console.log(`[Middleware] ========================================`);
  console.log(`[Middleware] Processing request to: ${pathname}`);
  console.log(`[Middleware] Method: ${request.method}`);
  console.log(`[Middleware] URL: ${request.url}`);
  
  // Public routes - allow without authentication
  const publicRoutes = ['/', '/login'];
  if (publicRoutes.includes(pathname)) {
    console.log(`[Middleware] Public route allowed: ${pathname}`);
    return NextResponse.next();
  }
  
  // Get user session (now async)
  const session = await getSession(request);
  console.log(`[Middleware] Session retrieved:`, session ? 'Authenticated' : 'Not authenticated');
  if (session) {
    console.log(`[Middleware] Session details: role=${session.role}, uid=${session.uid}`);
  }
  console.log(`[Middleware] Continuing with authorization checks...`);
  
  // Admin routes - require admin role
  console.log(`[Middleware] Checking if ${pathname} matches /admin/**`);
  if (matchesPattern(pathname, '/admin/**')) {
    if (!session) {
      console.log(`[Middleware] No session found, redirecting to login`);
      return redirectToLogin(request);
    }
    
    if (session.role !== 'admin') {
      // User is authenticated but not admin - redirect to login
      console.log(`[Middleware] User role ${session.role} is not admin, redirecting to login`);
      return redirectToLogin(request);
    }
    
    console.log(`[Middleware] Admin access granted for ${pathname}`);
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
  console.log(`[Middleware] No specific protection matched, allowing request to: ${pathname}`);
  console.log(`[Middleware] About to call NextResponse.next()...`);
  const response = NextResponse.next();
  console.log(`[Middleware] NextResponse.next() returned, sending response`);
  return response;
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
