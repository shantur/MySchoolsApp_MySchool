/**
 * Logout API Route
 * 
 * Handles user logout by clearing the session cookie
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server';
import { handleLogout } from '@/lib/auth/logout-handler';
import { SESSION_CONFIG } from '@/lib/auth/session';

/**
 * POST /api/auth/logout
 * 
 * Logs out a user by clearing the session cookie
 * 
 * @return {Promise<NextResponse>} JSON response
 */
export async function POST(): Promise<NextResponse> {
  // Handle logout
  handleLogout();

  // Create response with redirect to login page
  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    { status: 302 }
  );

  // Clear session cookie by setting Max-Age=0
  const cookieValue = [
    `${SESSION_CONFIG.cookieName}=`,
    'Max-Age=0',
    `Path=${SESSION_CONFIG.path}`,
    `SameSite=${SESSION_CONFIG.sameSite}`,
    'HttpOnly',
    SESSION_CONFIG.secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  response.headers.set('Set-Cookie', cookieValue);

  return response;
}
