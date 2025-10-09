/**
 * Admin Schools API Route
 * 
 * Handles school management by admins
 * GET /api/admin/schools - List schools (admin only)
 * POST /api/admin/schools - Create school (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import {
  createSchoolHandler,
  listSchoolsHandler,
} from '@/lib/handlers/schools-handler';

/**
 * GET /api/admin/schools
 * 
 * Lists all schools (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with schools list or error
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
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

    // Handle schools listing
    const schools = await listSchoolsHandler(session);

    return NextResponse.json(
      {
        success: true,
        schools,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing schools:', error);
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
 * POST /api/admin/schools
 * 
 * Creates a new school (admin only)
 * 
 * @param {NextRequest} request - Next.js request object
 * @return {Promise<NextResponse>} JSON response with school data or error
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
    const { schoolId, name, address, contactEmail, contactPhone } = body;

    if (!name || !address || !contactEmail) {
      return NextResponse.json(
        {
          error: 'Name, address, and contactEmail are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Handle school creation
    const school = await createSchoolHandler(session, {
      schoolId, // Pass optional custom school ID
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}