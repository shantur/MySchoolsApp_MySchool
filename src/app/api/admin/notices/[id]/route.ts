/**
 * Admin Notice by ID API Route
 * 
 * Handles individual notice management by admins
 * GET /api/admin/notices/[id] - Get notice (admin only)
 * PUT /api/admin/notices/[id] - Update notice (admin only)
 * DELETE /api/admin/notices/[id] - Delete notice (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import {
  getNoticeHandler,
  updateNoticeHandler,
  deleteNoticeHandler,
} from '@/lib/handlers/notices-handler';

/**
 * GET /api/admin/notices/[id]
 * 
 * Gets a notice by ID (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Notice ID
 * @return {Promise<NextResponse>} JSON response with notice data or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    if (session.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Admin access required',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Notice ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Parse query parameters for schoolId
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        {
          error: 'School ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle notice retrieval
    const notice = await getNoticeHandler(session, id, schoolId);

    if (!notice) {
      return NextResponse.json(
        {
          error: 'Notice not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting notice:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/notices/[id]
 * 
 * Updates a notice by ID (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Notice ID
 * @return {Promise<NextResponse>} JSON response with updated notice data or error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    if (session.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Admin access required',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Notice ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, body: noticeBody, status } = body;

    if (!title || !noticeBody) {
      return NextResponse.json(
        {
          error: 'Title and body are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle notice update
    const notice = await updateNoticeHandler(session, id, {
      title,
      body: noticeBody,
      status: status as 'draft' | 'published' | 'archived',
    });

    return NextResponse.json(
      {
        success: true,
        notice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/notices/[id]
 * 
 * Deletes a notice by ID (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Notice ID
 * @return {Promise<NextResponse>} JSON response confirming deletion or error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    if (session.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Admin access required',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Notice ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle notice deletion
    await deleteNoticeHandler(session, id);

    return NextResponse.json(
      {
        success: true,
        message: 'Notice deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting notice:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}