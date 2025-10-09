/**
 * Admin User by ID API Route
 * 
 * Handles individual user management by admins
 * GET /api/admin/users/[id] - Get user (admin only)
 * PUT /api/admin/users/[id] - Update user (admin only)
 * DELETE /api/admin/users/[id] - Delete user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import {
  getUserById,
  updateUserHandler,
  deleteUserHandler,
} from '@/lib/handlers/users-handler';

/**
 * GET /api/admin/users/[id]
 * 
 * Gets a user by ID (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - User ID
 * @return {Promise<NextResponse>} JSON response with user data or error
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
          error: 'User ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle user retrieval
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting user:', error);
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
 * PUT /api/admin/users/[id]
 * 
 * Updates a user by ID (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - User ID
 * @return {Promise<NextResponse>} JSON response with updated user data or error
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
          error: 'User ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, schoolId, role, displayName, groupIds } = body;

    if (!email || !schoolId || !role) {
      return NextResponse.json(
        {
          error: 'Email, school ID, and role are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle user update
    const user = await updateUserHandler(id, {
      email,
      schoolId,
      role,
      displayName,
      groupIds,
    });

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
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
 * DELETE /api/admin/users/[id]
 * 
 * Deletes a user by ID (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - User ID
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
          error: 'User ID is required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (id === session.uid) {
      return NextResponse.json(
        {
          error: 'Cannot delete your own account',
          code: 'CANNOT_DELETE_SELF',
        },
        { status: 400 }
      );
    }

    // Handle user deletion
    await deleteUserHandler(id);

    return NextResponse.json(
      {
        success: true,
        message: 'User deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}