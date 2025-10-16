/**
 * Attachment Download Handler
 * 
 * Business logic for handling secure attachment downloads.
 * This is tested separately from the API route to avoid Next.js dependencies.
 */

import { getUserSession } from '@/lib/auth/session';
import { requireAuth, checkSchoolAccess } from '@/lib/auth/authorization';
import { AttachmentsService } from '@/lib/services/attachments.service';

/**
 * Input parameters for attachment download
 */
export interface AttachmentDownloadInput {
  attachmentId: string;
  noticeId: string;
  schoolId: string;
}

/**
 * Result of attachment download operation
 */
export interface AttachmentDownloadResult {
  success: boolean;
  signedUrl?: string;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Handle attachment download with proper authorization
 * 
 * @param {AttachmentDownloadInput} input - Download parameters
 * @return {Promise<AttachmentDownloadResult>} Download result
 */
export async function handleAttachmentDownload(
  input: AttachmentDownloadInput
): Promise<AttachmentDownloadResult> {
  try {
    // Validate input
    if (!input.attachmentId || input.attachmentId.trim().length === 0) {
      return {
        success: false,
        error: {
          message: 'Invalid attachment ID',
          code: 'INVALID_ATTACHMENT_ID',
        },
      };
    }

    if (!input.noticeId || !input.schoolId) {
      return {
        success: false,
        error: {
          message: 'Missing required parameters: noticeId and schoolId are required',
          code: 'MISSING_PARAMETERS',
        },
      };
    }

    // Get user session
    const session = await getUserSession();
    
    // Require authentication
    requireAuth(session);

    // Check school access authorization
    checkSchoolAccess(session, input.schoolId);

    // Use Supabase Storage via AttachmentsService
    const attachmentsService = new AttachmentsService();
    
    // Get signed download URL from Supabase Storage
    // The service handles existence check and generates signed URL
    const signedUrl = await attachmentsService.getAttachmentDownloadUrl(
      input.attachmentId,
      input.schoolId,
      input.noticeId
    );
    
    if (!signedUrl) {
      return {
        success: false,
        error: {
          message: 'Attachment not found',
          code: 'ATTACHMENT_NOT_FOUND',
        },
      };
    }

    return {
      success: true,
      signedUrl,
    };

  } catch (error) {
    console.error('Attachment download error:', error);

    // Handle authentication errors
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'UNAUTHORIZED',
        },
      };
    }

    // Handle authorization errors
    if (error instanceof Error && error.name === 'AuthorizationError') {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'FORBIDDEN',
        },
      };
    }

    // Handle other errors
    return {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    };
  }
}