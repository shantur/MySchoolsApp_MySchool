/**
 * Attachments Service (Supabase)
 * 
 * Handles file uploads/downloads with Supabase Storage.
 * Manages attachment metadata for notices.
 * Migrated from Firebase Storage to Supabase for Phase 4.
 */

import { createServerClient } from '../supabase/server';
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
 * Attachments Service class for file management with Supabase
 */
export class AttachmentsServiceSupabase {
  /**
   * Upload an attachment to Supabase Storage
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

    // Upload file to Supabase Storage
    const supabase = createServerClient();
    const { error } = await supabase.storage
      .from('attachments')
      .upload(filePath, input.buffer, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload attachment: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    // Create download URL (internal API endpoint for compatibility)
    const downloadURL = 
      `/api/attachments/download/${attachmentId}?` +
      `noticeId=${input.noticeId}&schoolId=${input.schoolId}`;

    return {
      id: attachmentId,
      fileName: input.fileName,
      fileType: input.mimeType,
      downloadURL: publicUrlData.publicUrl, // Use Supabase public URL
      size: input.buffer.length,
    };
  }

  /**
   * Get a download URL for an attachment
   * 
   * @param {string} attachmentId - The attachment ID
   * @param {string} schoolId - The school ID
   * @param {string} noticeId - The notice ID
   * @return {Promise<string>} Download URL
   */
  async getAttachmentDownloadUrl(
    attachmentId: string,
    schoolId: string,
    noticeId: string
  ): Promise<string> {
    const filePath = 
      `attachments/${schoolId}/${noticeId}/${attachmentId}`;

    const supabase = createServerClient();

    // For public buckets, use getPublicUrl
    // For private buckets, use createSignedUrl
    const { data: publicUrlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
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

    const supabase = createServerClient();
    const { error } = await supabase.storage
      .from('attachments')
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete attachment: ${error.message}`);
    }
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

// Compatibility export for Firebase-to-Supabase migration
export const AttachmentsService = AttachmentsServiceSupabase;
