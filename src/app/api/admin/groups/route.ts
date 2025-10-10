/**
 * Admin Groups API Route
 * 
 * Handles group management by admins
 * GET /api/admin/groups - List groups (admin only)
 * POST /api/admin/groups - Create group (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import {
  createGroupHandler,
  listGroupsHandler,
} from '@/lib/handlers/groups-handler';

/**
 * GET /api/admin/groups
 * 
 * Lists all groups (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with groups list or error
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

    if (session.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Admin access required',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Parse query parameters for schoolId (optional for admins)
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    // Handle groups listing
    let groups;
    if (schoolId) {
      // Fetch groups for specific school
      groups = await listGroupsHandler(session, schoolId);
    } else {
      // Fetch all groups from all schools (admin only)
      const { GroupsService } = await import('@/lib/services/groups.service');
      const groupsService = new GroupsService();
      groups = await groupsService.listAllGroups();
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          groups,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing groups:', error);
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
 * POST /api/admin/groups
 * 
 * Creates a new group (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with group data or error
 */
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

    // Parse request body
    const body = await request.json();
    const { name, description, schoolId } = body;

    if (!name || !schoolId) {
      return NextResponse.json(
        {
          error: 'Name and schoolId are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle group creation
    const group = await createGroupHandler(session, {
      name,
      description,
      schoolId,
    });

    return NextResponse.json(
      {
        success: true,
        group,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}