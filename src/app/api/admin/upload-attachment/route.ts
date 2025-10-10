/**
 * Admin Attachment Upload API Route
 *
 * Handles file uploads for notice attachments
 * POST /api/admin/upload-attachment - Upload a single file (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth/session';
import { uploadFile } from '@/lib/services/storage.service';

/**
 * POST /api/admin/upload-attachment
 * 
 * Upload a single attachment file
 * 
 * @param {NextRequest} request - Next.js request object with FormData
 * @return {Promise<NextResponse>} JSON response with download URL or error
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const schoolId = formData.get('schoolId') as string;
    const noticeId = formData.get('noticeId') as string;

    if (!file) {
      return NextResponse.json(
        {
          error: 'File is required',
          code: 'MISSING_FILE',
        },
        { status: 400 }
      );
    }

    if (!schoolId || !noticeId) {
      return NextResponse.json(
        {
          error: 'schoolId and noticeId are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // Upload file to storage
    const downloadURL = await uploadFile(
      base64Data,
      file.name,
      file.type,
      schoolId,
      noticeId
    );

    return NextResponse.json(
      {
        success: true,
        downloadURL,
        fileName: file.name,
        fileType: file.type,
        size: file.size,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'UPLOAD_FAILED',
      },
      { status: 500 }
    );
  }
}
