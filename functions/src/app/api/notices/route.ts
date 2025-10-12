/**
 * User Notices API Route
 * 
 * Handles notice listing for authenticated users
 * GET /api/notices - List notices for user's school (user view)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { listNoticesHandler } from '@/lib/handlers/notices-handler';

/**
 * GET /api/notices
 * 
 * Lists notices for the user's school (user view)
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with notices list or error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user session
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Parse query parameters for status filter
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | undefined;

    // Handle notices listing for user's school
    const notices = await listNoticesHandler(session, session.schoolId, status);

    return NextResponse.json(
      {
        success: true,
        notices,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing notices:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}