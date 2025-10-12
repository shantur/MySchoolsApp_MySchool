/**
 * Login API Route
 * 
 * Handles user authentication and session creation
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleLogin } from '@/lib/auth/login-handler';
import { SESSION_CONFIG } from '@/lib/auth/session';

/**
 * POST /api/auth/login
 * 
 * Authenticates a user and creates a session cookie
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with user data or error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Parse request body
  const body = await request.json();
  const { email, password } = body;

  // Handle login
  const result = await handleLogin(email, password);

  if (!result.success) {
    const statusCode = result.error?.code === 'missing_credentials' ? 400 : 
                       result.error?.code === 'invalid_credentials' ? 401 : 
                       500;

    return NextResponse.json(
      {
        error: result.error?.message,
        code: result.error?.code,
      },
      { status: statusCode }
    );
  }

  // Create response with user data
  const response = NextResponse.json(
    {
      success: true,
      user: result.session,
    },
    { status: 200 }
  );

  // Set session cookie
  const cookieValue = [
    `${SESSION_CONFIG.cookieName}=${result.token}`,
    `Max-Age=${SESSION_CONFIG.maxAge / 1000}`,
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
