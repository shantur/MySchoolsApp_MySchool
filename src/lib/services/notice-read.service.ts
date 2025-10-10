/**
 * Notice Read Tracking Service
 * 
 * Manages read/unread status of notices for users using a separate
 * noticeReads collection for scalability and efficient queries.
 */

import { getAdminDb } from '../firebase/admin-lazy';
import type { NoticeRead } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Mark a notice as read by a user
 * 
 * @param userId - User ID who read the notice
 * @param noticeId - Notice ID that was read
 * @param schoolId - School ID for query scoping
 * @param groupId - Group ID for query scoping
 * @returns Promise<void>
 */
export async function markNoticeAsRead(
  userId: string,
  noticeId: string,
  schoolId: string,
  groupId: string
): Promise<void> {
  const db = getAdminDb();
  
  if (!db) {
    throw new Error('Database not initialized');
  }

  // Document ID format: {userId}_{noticeId} for easy lookup
  const readDocId = `${userId}_${noticeId}`;
  
  const noticeReadData: Omit<NoticeRead, 'readAt'> & { readAt: FirebaseFirestore.FieldValue } = {
    userId,
    noticeId,
    schoolId,
    groupId,
    readAt: FieldValue.serverTimestamp(),
  };

  await db.collection('noticeReads').doc(readDocId).set(noticeReadData, { merge: true });
}

/**
 * Check if a user has read a specific notice
 * 
 * @param userId - User ID
 * @param noticeId - Notice ID
 * @returns Promise<boolean> - true if read, false if unread
 */
export async function hasUserReadNotice(
  userId: string,
  noticeId: string
): Promise<boolean> {
  const db = getAdminDb();
  
  if (!db) {
    throw new Error('Database not initialized');
  }

  const readDocId = `${userId}_${noticeId}`;
  const doc = await db.collection('noticeReads').doc(readDocId).get();
  
  return doc.exists;
}

/**
 * Get all notices a user has read
 * 
 * @param userId - User ID
 * @param schoolId - Optional school ID filter
 * @returns Promise<string[]> - Array of notice IDs
 */
export async function getUserReadNotices(
  userId: string,
  schoolId?: string
): Promise<string[]> {
  const db = getAdminDb();
  
  if (!db) {
    throw new Error('Database not initialized');
  }

  let query = db.collection('noticeReads').where('userId', '==', userId);
  
  if (schoolId) {
    query = query.where('schoolId', '==', schoolId);
  }

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => doc.data().noticeId);
}

/**
 * Get read status for multiple notices for a user
 * Returns a map of noticeId -> boolean (true if read)
 * 
 * @param userId - User ID
 * @param noticeIds - Array of notice IDs to check
 * @returns Promise<Record<string, boolean>>
 */
export async function getBulkReadStatus(
  userId: string,
  noticeIds: string[]
): Promise<Record<string, boolean>> {
  const db = getAdminDb();
  
  if (!db) {
    throw new Error('Database not initialized');
  }

  if (noticeIds.length === 0) {
    return {};
  }

  // Firestore 'in' query limit is 10, so we need to batch
  const batchSize = 10;
  const results: Record<string, boolean> = {};
  
  // Initialize all as unread
  noticeIds.forEach(noticeId => {
    results[noticeId] = false;
  });

  // Process in batches
  for (let i = 0; i < noticeIds.length; i += batchSize) {
    const batch = noticeIds.slice(i, i + batchSize);
    const docIds = batch.map(noticeId => `${userId}_${noticeId}`);
    
    // Query by document IDs
    const docs = await Promise.all(
      docIds.map(docId => db.collection('noticeReads').doc(docId).get())
    );
    
    docs.forEach((doc, index) => {
      if (doc.exists) {
        results[batch[index]] = true;
      }
    });
  }

  return results;
}

/**
 * Delete read tracking for a notice (e.g., when notice is deleted)
 * 
 * @param noticeId - Notice ID
 * @returns Promise<number> - Number of reads deleted
 */
export async function deleteNoticeReads(noticeId: string): Promise<number> {
  const db = getAdminDb();
  
  if (!db) {
    throw new Error('Database not initialized');
  }

  const snapshot = await db
    .collection('noticeReads')
    .where('noticeId', '==', noticeId)
    .get();

  if (snapshot.empty) {
    return 0;
  }

  // Delete in batches
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  
  return snapshot.size;
}
