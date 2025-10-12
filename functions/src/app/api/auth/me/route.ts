/**
 * Get Current User Session API Route
 * 
 * Returns the current user's session data
 * GET /api/auth/me
 */

import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';

/**
 * GET /api/auth/me
 * 
 * Returns the current authenticated user's session data
 * 
 * @return {Promise<NextResponse>} JSON response with user session data or error
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
