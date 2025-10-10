/**
 * Firebase Storage Service
 * 
 * Handles file upload, download, and deletion operations in Firebase Storage.
 * Provides methods for managing notice attachments with proper authentication.
 */

import { randomUUID } from 'crypto';
import { getAdminStorage } from '../firebase/admin-lazy';
import type { Attachment } from '../types';

/**
 * Upload a file to Firebase Storage
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
  const storage = getAdminStorage();
  
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  // Get the bucket explicitly with name
  // For emulator, we need to specify the bucket name
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'myschools-app-dev.appspot.com';
  const bucket = storage.bucket(bucketName);
  
  // Create a safe file path: attachments/{schoolId}/{noticeId}/{timestamp}_{fileName}
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `attachments/${schoolId}/${noticeId}/${timestamp}_${safeFileName}`;
  
  // Convert base64 to buffer
  const fileBuffer = Buffer.from(file, 'base64');
  
  // Create file reference
  const fileRef = bucket.file(filePath);
  
  // Generate download token for emulator (Firebase Storage Emulator doesn't auto-generate tokens)
  const downloadToken = randomUUID();
  
  // Upload file with metadata
  await fileRef.save(fileBuffer, {
    metadata: {
      contentType: fileType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken, // Required for emulator downloads
        schoolId,
        noticeId,
        originalFileName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    },
  });
  
  // For emulator, return local URL with download token
  // For production, generate signed URL with long expiration
  const useEmulators = process.env.USE_FIREBASE_EMULATORS === 'true';
  
  if (useEmulators) {
    // Emulator: Get metadata to retrieve download token
    const [metadata] = await fileRef.getMetadata();
    const downloadToken = metadata.metadata?.firebaseStorageDownloadTokens;
    
    // Return direct download URL with token (bypasses auth requirement)
    const projectId = 'myschools-app-dev';
    const encodedPath = encodeURIComponent(filePath);
    
    // Use configurable host for emulator URLs
    // Default to 10.0.2.2 for Android emulators (can override with NEXT_PUBLIC_STORAGE_EMULATOR_HOST)
    // Note: FIREBASE_STORAGE_EMULATOR_HOST is used by Firebase SDK internally, so we use a different var
    const emulatorHost = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST || '10.0.2.2:9199';
    
    if (downloadToken) {
      return `http://${emulatorHost}/v0/b/${projectId}.appspot.com/o/${encodedPath}?alt=media&token=${downloadToken}`;
    } else {
      // Fallback without token (will require auth)
      return `http://${emulatorHost}/v0/b/${projectId}.appspot.com/o/${encodedPath}?alt=media`;
    }
  } else {
    // Production: Generate signed URL with 1-year expiration
    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    });
    return signedUrl;
  }
}

/**
 * Delete a file from Firebase Storage
 * 
 * @param downloadURL - The download URL of the file to delete
 * @returns True if deletion was successful
 */
export async function deleteFile(downloadURL: string): Promise<boolean> {
  if (!downloadURL || downloadURL === '') {
    return true; // Nothing to delete
  }

  const storage = getAdminStorage();
  
  if (!storage) {
    console.warn('Firebase Storage not initialized, skipping file deletion');
    return false;
  }

  try {
    // Extract file path from URL
    // Emulator URL format: http://127.0.0.1:9199/v0/b/{bucket}/o/{encodedPath}?alt=media (web)
    //                   or: http://10.0.2.2:9199/v0/b/{bucket}/o/{encodedPath}?alt=media (Android emulator)
    // Production URL format: Various signed URL formats
    
    let filePath: string | null = null;
    
    if (downloadURL.includes('127.0.0.1:9199') || downloadURL.includes('10.0.2.2:9199')) {
      // Emulator URL
      const match = downloadURL.match(/\/o\/([^?]+)/);
      if (match) {
        filePath = decodeURIComponent(match[1]);
      }
    } else {
      // Production signed URL - extract from URL path
      const match = downloadURL.match(/\/o\/([^?]+)/);
      if (match) {
        filePath = decodeURIComponent(match[1]);
      }
    }
    
    if (!filePath) {
      console.warn('Could not extract file path from URL:', downloadURL);
      return false;
    }
    
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'myschools-app-dev.appspot.com';
    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(filePath);
    
    await fileRef.delete();
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
  const storage = getAdminStorage();
  
  if (!storage) {
    console.warn('Firebase Storage not initialized, skipping file deletion');
    return 0;
  }

  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'myschools-app-dev.appspot.com';
    const bucket = storage.bucket(bucketName);
    const prefix = `attachments/${schoolId}/${noticeId}/`;
    
    // List all files with this prefix
    const [files] = await bucket.getFiles({ prefix });
    
    // Delete all files
    await Promise.all(files.map(file => file.delete()));
    
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
