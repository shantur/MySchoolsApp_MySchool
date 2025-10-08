/**
 * Notices Service
 * 
 * Provides CRUD operations for managing notices in Firestore.
 * Implements business logic for notice entities including attachments.
 */

import { getAdminDb } from '../firebase/admin-lazy';
import type { Notice, Attachment } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

// Helper function to get Firestore instance
const getDb = () => {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Firestore is not available');
  }
  return db;
};

/**
 * Input type for creating a new notice
 */
export interface CreateNoticeInput {
  schoolId: string;
  title: string;
  body: string;
  status?: 'draft' | 'published' | 'archived';
  attachments?: Attachment[];
}

/**
 * Input type for updating an existing notice
 */
export interface UpdateNoticeInput {
  title?: string;
  body?: string;
  status?: 'draft' | 'published' | 'archived';
  attachments?: Attachment[];
}

/**
 * Notices Service class for managing notice entities
 */
export class NoticesService {
  private readonly collection = 'notices';

  /**
   * Create a new notice
   * 
   * @param {CreateNoticeInput} input - Notice creation data
   * @return {Promise<Notice>} Created notice with generated ID
   */
  async createNotice(input: CreateNoticeInput): Promise<Notice> {
    // Validate required fields
    if (!input.schoolId || input.schoolId.trim().length === 0) {
      throw new Error('School ID is required');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Notice title is required');
    }

    if (!input.body || input.body.trim().length === 0) {
      throw new Error('Notice body is required');
    }

    const now = Timestamp.now();
    const noticeData = {
      schoolId: input.schoolId.trim(),
      title: input.title.trim(),
      body: input.body.trim(),
      status: input.status || 'draft',
      publicationDate: now,
      ...(input.attachments && { attachments: input.attachments }),
      createdAt: now,
      updatedAt: now,
    };

    const db = getDb();
    const docRef = await db.collection(this.collection).add(noticeData);

    return {
      noticeId: docRef.id,
      ...noticeData,
    };
  }

  /**
   * List all notices (for admin)
   *
   * @return {Promise<Notice[]>} List of all notices
   */
   async listAllNotices(): Promise<Notice[]> {
     const db = getDb();
     const snapshot = await db
       .collection(this.collection)
       .orderBy('publicationDate', 'desc')
       .get();

     return snapshot.docs.map((doc: import('firebase-admin/firestore').QueryDocumentSnapshot) => ({
       noticeId: doc.id,
       ...doc.data(),
     })) as Notice[];
   }

  /**
   * Get a notice by ID
   *
   * @param {string} noticeId - The notice ID
   * @return {Promise<Notice | null>} Notice if found, null otherwise
   */
  async getNoticeById(noticeId: string): Promise<Notice | null> {
    const db = getDb();
    const doc = await db
      .collection(this.collection)
      .doc(noticeId)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      noticeId: doc.id,
      ...data,
    } as Notice;
  }

  /**
   * Update an existing notice
   * 
   * @param {string} noticeId - The notice ID
   * @param {UpdateNoticeInput} updates - Fields to update
   * @return {Promise<Notice>} Updated notice
   */
  async updateNotice(
    noticeId: string,
    updates: UpdateNoticeInput
  ): Promise<Notice> {
    // Check if notice exists
    const existing = await this.getNoticeById(noticeId);
    if (!existing) {
      throw new Error('Notice not found');
    }

    // Prepare update data
    const updateData: Partial<Notice> & { updatedAt: import('firebase-admin/firestore').Timestamp } = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Clean up undefined fields
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    const db = getDb();
    await db
      .collection(this.collection)
      .doc(noticeId)
      .set(updateData, { merge: true });

    return this.getNoticeById(noticeId) as Promise<Notice>;
  }

  /**
   * Delete a notice
   * 
   * @param {string} noticeId - The notice ID
   * @return {Promise<void>}
   */
  async deleteNotice(noticeId: string): Promise<void> {
    // Check if notice exists
    const existing = await this.getNoticeById(noticeId);
    if (!existing) {
      throw new Error('Notice not found');
    }

    const db = getDb();
    await db.collection(this.collection).doc(noticeId).delete();
  }

  /**
   * List notices for a specific school
   * 
   * @param {string} schoolId - The school ID
   * @param {string} status - Optional status filter
   * @return {Promise<Notice[]>} Array of notices
   */
  async listNoticesBySchool(
    schoolId: string,
    status?: 'draft' | 'published' | 'archived'
  ): Promise<Notice[]> {
    const db = getDb();
    let query = db
      .collection(this.collection)
      .where('schoolId', '==', schoolId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query
      .orderBy('publicationDate', 'desc')
      .get();

    return snapshot.docs.map((doc: import('firebase-admin/firestore').QueryDocumentSnapshot) => ({
      noticeId: doc.id,
      ...doc.data(),
    })) as Notice[];
  }
}
