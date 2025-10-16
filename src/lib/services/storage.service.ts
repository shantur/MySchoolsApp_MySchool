/**
 * Supabase Storage Service
 * 
 * Handles file upload, download, and deletion operations in Supabase Storage.
 * Provides methods for managing notice attachments with proper authentication.
 * Migrated from Firebase Storage to Supabase for Phase 4.
 */

import { randomUUID } from 'crypto';
import { createServerClient } from '../supabase/server';
import type { Attachment } from '../types';

/**
 * Upload a file to Supabase Storage
 * 
 * @param file - Base64-encoded file data
 * @param fileName - Original file name
 * @param fileType - MIME type of the file
 * @param schoolId - School ID for storage path organization
 * @param noticeId - Notice ID for storage path organization
 * @returns Download URL for the uploaded file
 */
export async function uploadFile(
  file: string, // Base64-encoded file data
  fileName: string,
  fileType: string,
  schoolId: string,
  noticeId: string
): Promise<string> {
  const supabase = createServerClient();

  // Create a safe file path: {schoolId}/{noticeId}/{timestamp}_{fileName}
  // Note: Do not include 'attachments/' prefix since that's the bucket name
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${schoolId}/${noticeId}/${timestamp}_${safeFileName}`;

  // Convert base64 to buffer
  const fileBuffer = Buffer.from(file, 'base64');

  // Upload to Supabase Storage (attachments bucket)
  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(filePath, fileBuffer, {
      contentType: fileType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Create signed URL for private bucket (expires in 1 hour)
  // This provides authenticated access while maintaining security
  const { data: signedUrlData, error: signedError } = await supabase.storage
    .from('attachments')
    .createSignedUrl(filePath, 3600); // 3600 seconds = 1 hour

  if (signedError || !signedUrlData) {
    throw new Error(`Failed to create signed URL: ${signedError?.message}`);
  }

  return signedUrlData.signedUrl;
}

/**
 * Delete a file from Supabase Storage
 * 
 * @param downloadURL - The download URL of the file to delete
 * @returns True if deletion was successful
 */
export async function deleteFile(downloadURL: string): Promise<boolean> {
  if (!downloadURL || downloadURL === '') {
    return true; // Nothing to delete
  }

  const supabase = createServerClient();

  try {
    // Extract file path from URL
    // Supabase URL format: https://{project}.co/storage/v1/object/public/attachments/{path}
    // We need to extract just the path part after 'attachments/'
    const match = downloadURL.match(/\/attachments\/(.+?)(?:\?|$)/);
    
    if (!match || !match[1]) {
      console.warn('Could not extract file path from URL:', downloadURL);
      return false;
    }
    
    const filePath = match[1]; // Get the captured group (path after 'attachments/')

    const { error } = await supabase.storage
      .from('attachments')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Delete all files associated with a notice
 * 
 * @param schoolId - School ID
 * @param noticeId - Notice ID
 * @returns Number of files deleted
 */
export async function deleteNoticeFiles(
  schoolId: string,
  noticeId: string
): Promise<number> {
  const supabase = createServerClient();

  try {
    const prefix = `${schoolId}/${noticeId}/`;

    // List all files with this prefix
    const { data: files, error: listError } = await supabase.storage
      .from('attachments')
      .list(`${schoolId}/${noticeId}`, {
        limit: 1000,
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return 0;
    }

    if (!files || files.length === 0) {
      return 0;
    }

    // Delete all files
    const filePaths = files.map((file: { name: string }) => `${prefix}${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('attachments')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting notice files:', deleteError);
      return 0;
    }

    return files.length;
  } catch (error) {
    console.error('Error deleting notice files:', error);
    return 0;
  }
}

/**
 * Process attachments: upload new files and return updated attachment metadata
 * 
 * @param attachments - Array of attachments with optional file data
 * @param schoolId - School ID
 * @param noticeId - Notice ID
 * @returns Updated attachments with download URLs
 */
export async function processAttachments(
  attachments: (Attachment & { fileData?: string })[],
  schoolId: string,
  noticeId: string
): Promise<Attachment[]> {
  const processedAttachments: Attachment[] = [];

  for (const attachment of attachments) {
    if (attachment.fileData) {
      // New file - upload it
      const downloadURL = await uploadFile(
        attachment.fileData,
        attachment.fileName,
        attachment.fileType,
        schoolId,
        noticeId
      );

      processedAttachments.push({
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        size: attachment.size,
        downloadURL,
      });
    } else if (attachment.downloadURL) {
      // Existing file - keep as is
      processedAttachments.push({
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        size: attachment.size,
        downloadURL: attachment.downloadURL,
      });
    }
  }

  return processedAttachments;
}
