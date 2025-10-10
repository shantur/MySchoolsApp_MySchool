/**
 * Admin Notices API Route
 *
 * Handles notice management by admins
 * GET /api/admin/notices - List notices (admin only)
 * POST /api/admin/notices - Create notice (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { 
  createNoticeHandler,
  getAllNotices,
} from '@/lib/handlers/notices-handler';

/**
 * GET /api/admin/notices
 * 
 * Lists all notices (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with notices list or error
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
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

  if (session.role !== 'admin') {
    return NextResponse.json(
      {
        error: 'Admin access required',
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  // Handle notices listing
  const notices = await getAllNotices(session);

  return NextResponse.json(
    {
      success: true,
      notices,
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    if (session.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Admin access required',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, body: noticeBody, groupId, status, attachments } = body;

    if (!title || !noticeBody || !groupId) {
      return NextResponse.json(
        {
          error: 'Title, body, and groupId are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle notice creation
    const result = await createNoticeHandler(session, {
      title,
      body: noticeBody,
      groupId,
      status: status as 'draft' | 'published',
      attachments: attachments || undefined,
    });

    if (!result.success) {
      const statusCode = result.error?.code === 'MISSING_REQUIRED_FIELDS' ? 400 : 500;

      return NextResponse.json(
        {
          error: result.error?.message,
          code: result.error?.code,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notice: result.notice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notice:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}