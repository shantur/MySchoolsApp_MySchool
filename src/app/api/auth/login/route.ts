// IMMEDIATELY log - this should appear if the file is being parsed at all
if (typeof console !== 'undefined') {
  console.log('🔴🔴🔴 LOGIN ROUTE FILE BEING PARSED 🔴🔴🔴');
}

console.log('===== LOGIN ROUTE MODULE LOAD START =====');

/**
 * Login API Route
 * 
 * Handles user authentication and session creation
 * POST /api/auth/login
 */

console.log('[Login Route] Step 1: Before Next.js imports');
import { NextRequest, NextResponse } from 'next/server';
console.log('[Login Route] Step 2: Next.js imports loaded');

console.log('[Login Route] Step 3: Before handleLogin import');
import { handleLogin } from '@/lib/auth/login-handler';
console.log('[Login Route] Step 4: handleLogin imported');

console.log('[Login Route] Step 5: Before SESSION_CONFIG import');
import { SESSION_CONFIG } from '@/lib/auth/session';
console.log('[Login Route] Step 6: SESSION_CONFIG imported');

console.log('===== LOGIN ROUTE MODULE LOAD COMPLETE =====');

/**
 * POST /api/auth/login
 * 
 * Authenticates a user and creates a session cookie
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with user data or error
 */

// Log BEFORE the function definition
console.log('[Login Route] Defining POST function export...');

export async function POST(request: NextRequest): Promise<NextResponse> {
  // This should be the VERY FIRST thing that executes when the function is called
  const entryLog = '[Login Route] 🚀🚀🚀 POST FUNCTION INVOKED 🚀🚀🚀';
  console.log(entryLog);
  console.log('='.repeat(80));
  console.log('[Login Route] POST function called - ENTRY POINT');
  console.log('[Login Route] Request URL:', request.url);
  console.log('[Login Route] Request method:', request.method);
  console.log('='.repeat(80));
  
  try {
    // Parse request body
    console.log('[Login Route] About to parse request body...');
    const body = await request.json();
    console.log('[Login Route] Request body parsed successfully');
    const { email, password } = body;
    console.log('[Login Route] Credentials extracted, email:', email);
    console.log('[Login Route] About to call handleLogin...');

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
    // Don't set explicit domain - let browser handle it for better compatibility
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

    console.log('[Login Route] Session cookie set:', {
      cookieName: SESSION_CONFIG.cookieName,
      maxAge: SESSION_CONFIG.maxAge / 1000,
      path: SESSION_CONFIG.path,
      sameSite: SESSION_CONFIG.sameSite,
      httpOnly: true,
      secure: SESSION_CONFIG.secure,
    });
    console.log('[Login Route] Response prepared, returning...');
    return response;
    
  } catch (error) {
    console.error('[Login Route] FATAL ERROR in POST handler:', error);
    console.error('[Login Route] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Internal server error during login',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
