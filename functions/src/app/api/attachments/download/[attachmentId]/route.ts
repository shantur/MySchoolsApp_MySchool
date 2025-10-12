/**
 * Attachment Download API Route
 * 
 * Handles secure attachment downloads with proper authorization.
 * GET /api/attachments/download/[attachmentId]?noticeId=<noticeId>&schoolId=<schoolId>
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleAttachmentDownload } from '@/lib/handlers/attachment-download-handler';

/**
 * GET /api/attachments/download/[attachmentId]
 * 
 * Downloads an attachment after performing authentication and authorization checks.
 * 
 * @param {NextRequest} request - Next.js request object
 * @param {Object} params - Route parameters containing attachmentId
 * @return {Promise<NextResponse>} Redirect to signed URL or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { attachmentId: string } }
): Promise<NextResponse> {
  // Extract attachment ID from route parameters
  const { attachmentId } = params;

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const noticeId = searchParams.get('noticeId');
  const schoolId = searchParams.get('schoolId');

  // Handle attachment download using the handler
  const result = await handleAttachmentDownload({
    attachmentId,
    noticeId: noticeId || '',
    schoolId: schoolId || '',
  });

  // Return appropriate response based on result
  if (!result.success) {
    const statusCode = result.error?.code === 'UNAUTHORIZED' ? 401 :
                      result.error?.code === 'FORBIDDEN' ? 403 :
                      result.error?.code === 'ATTACHMENT_NOT_FOUND' ? 404 :
                      result.error?.code === 'INVALID_ATTACHMENT_ID' ||
                      result.error?.code === 'MISSING_PARAMETERS' ? 400 : 500;

    return NextResponse.json(
      {
        error: result.error?.message,
        code: result.error?.code,
      },
      { status: statusCode }
    );
  }

  // Redirect to signed URL
  return NextResponse.redirect(result.signedUrl!);
}