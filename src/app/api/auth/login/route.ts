/**
 * Login API Route
 * 
 * Handles user authentication and session creation
 * POST /api/auth/login
 */

console.log('[Login Route] Starting module load');
import { NextRequest, NextResponse } from 'next/server';
console.log('[Login Route] Next.js imports loaded');
import { handleLogin } from '@/lib/auth/login-handler';
console.log('[Login Route] handleLogin imported');
import { SESSION_CONFIG } from '@/lib/auth/session';
console.log('[Login Route] SESSION_CONFIG imported');
console.log('[Login Route] All imports complete');

/**
 * POST /api/auth/login
 * 
 * Authenticates a user and creates a session cookie
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with user data or error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[Login Route] POST function called');
  
  // Parse request body
  const body = await request.json();
  console.log('[Login Route] Request body parsed');
  const { email, password } = body;
  console.log('[Login Route] Credentials extracted, calling handleLogin');

  // Handle login
  const result = await handleLogin(email, password);
  console.log('[Login Route] handleLogin returned:', result.success);

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
