/**
 * Attachments Service
 * 
 * Handles file uploads/downloads with Firebase Storage.
 * Manages attachment metadata for notices.
 */

import { adminStorage } from '../firebase/admin';
import type { Attachment } from '../types';
import { randomBytes } from 'crypto';

/**
 * Input type for uploading an attachment
 */
export interface UploadAttachmentInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  schoolId: string;
  noticeId: string;
}

/**
 * Allowed MIME types for attachments
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * Attachments Service class for file management
 */
export class AttachmentsService {
  /**
   * Upload an attachment to Firebase Storage
   * 
   * @param {UploadAttachmentInput} input - Upload data
   * @return {Promise<Attachment>} Attachment metadata
   */
  async uploadAttachment(input: UploadAttachmentInput): Promise<Attachment> {
    // Validate inputs
    if (!input.buffer || input.buffer.length === 0) {
      throw new Error('File buffer cannot be empty');
    }

    if (!input.fileName || input.fileName.trim().length === 0) {
      throw new Error('File name is required');
    }

    this.validateFileType(input.mimeType);

    // Generate unique attachment ID
    const attachmentId = randomBytes(16).toString('hex');

    // Construct storage path
    const filePath = 
      `attachments/${input.schoolId}/${input.noticeId}/${attachmentId}`;

    // Upload file to Storage
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);

    await file.save(input.buffer, {
      metadata: {
        contentType: input.mimeType,
      },
    });

    // Create download URL (internal API endpoint)
    const downloadURL = 
      `/api/attachments/download/${attachmentId}?` +
      `noticeId=${input.noticeId}&schoolId=${input.schoolId}`;

    return {
      fileName: input.fileName,
      fileType: input.mimeType,
      downloadURL,
      size: input.buffer.length,
    };
  }

  /**
   * Get a signed download URL for an attachment
   * 
   * @param {string} attachmentId - The attachment ID
   * @param {string} schoolId - The school ID
   * @param {string} noticeId - The notice ID
   * @return {Promise<string>} Signed download URL
   */
  async getAttachmentDownloadUrl(
    attachmentId: string,
    schoolId: string,
    noticeId: string
  ): Promise<string> {
    const filePath = 
      `attachments/${schoolId}/${noticeId}/${attachmentId}`;

    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);

    // Generate signed URL valid for 1 hour
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });

    return url;
  }

  /**
   * Delete an attachment from Storage
   * 
   * @param {string} attachmentId - The attachment ID
   * @param {string} schoolId - The school ID
   * @param {string} noticeId - The notice ID
   * @return {Promise<void>}
   */
  async deleteAttachment(
    attachmentId: string,
    schoolId: string,
    noticeId: string
  ): Promise<void> {
    const filePath = 
      `attachments/${schoolId}/${noticeId}/${attachmentId}`;

    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);

    await file.delete();
  }

  /**
   * Validate file type
   * 
   * @param {string} mimeType - The MIME type to validate
   * @throws {Error} If file type is not allowed
   */
  validateFileType(mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(
        `Unsupported file type: ${mimeType}. ` +
        `Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }
  }
}
