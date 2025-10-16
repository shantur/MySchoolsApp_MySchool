/**
 * Notice Mark as Read API Route
 *
 * POST /api/user/notices/:noticeId/mark-read - Mark a notice as read by the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { markNoticeAsRead } from '@/lib/services/notice-read.service';
import { NoticesService } from '@/lib/services/notices.service';

/**
 * POST /api/user/notices/:noticeId/mark-read
 * 
 * Mark a notice as read by the authenticated user
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {object} params - Route parameters
 * @param {string} params.noticeId - Notice ID to mark as read
 * @return {Promise<NextResponse>} JSON response with success or error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noticeId: string }> }
): Promise<NextResponse> {
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

    const resolvedParams = await params;
    const { noticeId } = resolvedParams;

    if (!noticeId) {
      return NextResponse.json(
        {
          error: 'Notice ID is required',
          code: 'MISSING_NOTICE_ID',
        },
        { status: 400 }
      );
    }

    // Verify notice exists and user has access to it
    const noticesService = new NoticesService();
    const notice = await noticesService.getNoticeById(noticeId);

    if (!notice) {
      return NextResponse.json(
        {
          error: 'Notice not found',
          code: 'NOTICE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if user has access to the notice
    // Regular users: only notices from groups they belong to
    // Admins: all notices
    if (session.role !== 'admin') {
      const userGroupIds = session.groupIds || [];
      if (!userGroupIds.includes(notice.groupId)) {
        return NextResponse.json(
          {
            error: 'Access denied to this notice',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    // Mark notice as read
    await markNoticeAsRead(
      session.uid,
      noticeId,
      notice.schoolId,
      notice.groupId
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Notice marked as read',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking notice as read:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
