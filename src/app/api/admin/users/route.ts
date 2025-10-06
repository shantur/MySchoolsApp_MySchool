/**
 * Admin Users API Route
 * 
 * Handles user creation by admins
 * POST /api/admin/users
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleCreateUser } from '@/lib/auth/create-user-handler';

/**
 * POST /api/admin/users
 * 
 * Creates a new user account (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with user data or error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
