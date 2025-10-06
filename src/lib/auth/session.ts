/**
 * Session Management Module
 * 
 * Handles JWT-based session creation and validation for MySchool
 * authentication. Sessions are stored in HTTP-only cookies with
 * a 24-hour expiration.
 */

import { UserSession } from '@/lib/types';
import jwt from 'jsonwebtoken';

/**
 * Session configuration constants
 */
export const SESSION_CONFIG = {
  cookieName: '__session',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Get the session secret from environment variables
 * 
 * @throws {Error} If SESSION_SECRET is not set
 * @return {string} The secret key
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }
  
  return secret;
}

/**
 * Create a JWT session token from user session data
 * 
 * @param {UserSession} sessionData - User session information
 * @return {string} JWT token string
 * @throws {Error} If SESSION_SECRET is not set
 */
export function createSession(sessionData: UserSession): string {
  const secret = getSessionSecret();
  
  const token = jwt.sign(
    {
      uid: sessionData.uid,
      email: sessionData.email,
      schoolId: sessionData.schoolId,
      role: sessionData.role,
      displayName: sessionData.displayName,
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn: '24h',
    }
  );
  
  return token;
}

/**
 * Validate a JWT session token and extract session data
 * 
 * @param {string} token - JWT token string
 * @return {UserSession | null} Session data or null if invalid
 * @throws {Error} If SESSION_SECRET is not set
 */
export function validateSession(token: string): UserSession | null {
  if (!token || token.trim() === '') {
    return null;
  }
  
  // Get secret first (will throw if not set)
  const secret = getSessionSecret();
  
  try {
    const payload = jwt.verify(token, secret) as any;
    
    // Validate payload structure
    if (
      !payload.uid ||
      !payload.email ||
      !payload.schoolId ||
      !payload.role
    ) {
      return null;
    }
    
    return {
      uid: payload.uid,
      email: payload.email,
      schoolId: payload.schoolId,
      role: payload.role as 'user' | 'admin',
      displayName: payload.displayName,
    };
  } catch (error) {
    // Token is invalid, expired, or verification failed
    return null;
  }
}

/**
 * Cookie configuration for session management
 * 
 * @param {string} domain - Domain for the cookie
 * @return {object} Cookie configuration object
 */
export function getCookieConfig(domain?: string) {
  return {
    name: SESSION_CONFIG.cookieName,
    value: '',
    maxAge: SESSION_CONFIG.maxAge,
    sameSite: SESSION_CONFIG.sameSite,
    path: SESSION_CONFIG.path,
    secure: SESSION_CONFIG.secure,
    httpOnly: true,
    domain: domain || 'localhost',
  };
}

/**
 * Get user session from cookies (for Next.js server components)
 * 
 * @return {Promise<UserSession | null>} User session or null if not found
 */
export async function getUserSession(): Promise<UserSession | null> {
  // In Next.js App Router, we need to use cookies() from next/headers
  const { cookies } = await import('next/headers');
  
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_CONFIG.cookieName);
    
    if (!sessionCookie) {
      return null;
    }
    
    return validateSession(sessionCookie.value);
  } catch {
    return null;
  }
}
