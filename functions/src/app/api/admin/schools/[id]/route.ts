/**
 * Admin School by ID API Route
 * 
 * Handles individual school management by admins
 * GET /api/admin/schools/[id] - Get school (admin only)
 * PUT /api/admin/schools/[id] - Update school (admin only)
 * DELETE /api/admin/schools/[id] - Delete school (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import {
  getSchoolHandler,
  updateSchoolHandler,
  deleteSchoolHandler,
} from '@/lib/handlers/schools-handler';

/**
 * GET /api/admin/schools/[id]
 * 
 * Gets a school by ID (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - School ID
 * @return {Promise<NextResponse>} JSON response with school data or error
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
          error: 'School ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle school retrieval
    const school = await getSchoolHandler(session, id);

    if (!school) {
      return NextResponse.json(
        {
          error: 'School not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        school,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting school:', error);
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
 * PUT /api/admin/schools/[id]
 * 
 * Updates a school by ID (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - School ID
 * @return {Promise<NextResponse>} JSON response with updated school data or error
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
          error: 'School ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, address, contactEmail, contactPhone } = body;

    if (!name || !address || !contactEmail) {
      return NextResponse.json(
        {
          error: 'Name, address, and contactEmail are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle school update
    const school = await updateSchoolHandler(session, id, {
      name,
      address,
      contactEmail,
      contactPhone,
    });

    return NextResponse.json(
      {
        success: true,
        school,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating school:', error);
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
 * DELETE /api/admin/schools/[id]
 * 
 * Deletes a school by ID (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - School ID
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
          error: 'School ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle school deletion
    await deleteSchoolHandler(session, id);

    return NextResponse.json(
      {
        success: true,
        message: 'School deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}