/**
 * Admin Users API Route
 * 
 * Handles user management by admins
 * GET /api/admin/users - List users (admin only)
 * POST /api/admin/users - Create user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleCreateUser } from '@/lib/auth/create-user-handler';
import { getUserSession } from '@/lib/auth/session';

/**
 * GET /api/admin/users
 * 
 * Lists all users (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with users list or error
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

  // This is a placeholder implementation
  // In a real implementation, this would fetch users from the database
  return NextResponse.json(
    {
      users: [],
      message: 'Users endpoint - admin access required',
    },
    { status: 200 }
  );
}

/**
 * POST /api/admin/users
 * 
 * Creates a new user account (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with user data or error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

  // Parse request body
  const body = await request.json();
  const { email, password, schoolId, role, displayName, groupIds } = body;

  // Handle user creation
  const result = await handleCreateUser({
    email,
    password,
    schoolId,
    role: role || 'user',
    displayName,
    groupIds,
  });

  if (!result.success) {
    const statusCode = result.error?.code === 'missing_required_fields' || 
                       result.error?.code === 'invalid_password' ? 400 : 500;

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
      user: result.user,
    },
    { status: 201 }
  );
}
