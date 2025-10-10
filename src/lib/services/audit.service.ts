/**
 * Audit Service
 * 
 * Provides comprehensive audit logging for all school management operations.
 * Tracks who did what, when, and what changed for accountability and compliance.
 */

import { getAdminDb } from '../firebase/admin-lazy';
import { Timestamp } from 'firebase-admin/firestore';
import type { UserSession } from '../types';

/**
 * Audit action types
 */
export enum AuditAction {
  SCHOOL_CREATED = 'SCHOOL_CREATED',
  SCHOOL_UPDATED = 'SCHOOL_UPDATED',
  SCHOOL_DELETED = 'SCHOOL_DELETED',
}

/**
 * Audit log entry structure
 */
export interface AuditEntry {
  id?: string;
  action: AuditAction | string;
  entityType: 'school' | 'user' | 'group' | 'notice';
  entityId: string;
  userId: string;
  userEmail?: string;
  timestamp: import('firebase-admin/firestore').Timestamp;
  changes: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Helper function to get Firestore instance
 */
const getDb = () => {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Firestore is not available');
  }
  return db;
};

/**
 * Audit Service class for logging administrative actions
 */
export class AuditService {
  private readonly collection = 'audit_logs';

  /**
   * Log school creation
   * 
   * @param {UserSession} session - User who created the school
   * @param {Record<string, unknown>} schoolData - Created school data
   * @return {Promise<string>} Audit log ID
   */
  async logSchoolCreation(
    session: UserSession,
    schoolData: Record<string, unknown>
  ): Promise<string> {
    return this.createAuditLog({
      action: AuditAction.SCHOOL_CREATED,
      entityType: 'school',
      entityId: schoolData.schoolId as string,
      userId: session.uid,
      userEmail: session.email,
      changes: schoolData,
    });
  }

  /**
   * Log school update
   * 
   * @param {UserSession} session - User who updated the school
   * @param {string} schoolId - School ID
   * @param {Record<string, unknown>} beforeData - Data before update
   * @param {Record<string, unknown>} afterData - Data after update
   * @return {Promise<string>} Audit log ID
   */
  async logSchoolUpdate(
    session: UserSession,
    schoolId: string,
    beforeData: Record<string, unknown>,
    afterData: Record<string, unknown>
  ): Promise<string> {
    return this.createAuditLog({
      action: AuditAction.SCHOOL_UPDATED,
      entityType: 'school',
      entityId: schoolId,
      userId: session.uid,
      userEmail: session.email,
      changes: {
        before: beforeData,
        after: afterData,
      },
    });
  }

  /**
   * Log school deletion
   * 
   * @param {UserSession} session - User who deleted the school
   * @param {Record<string, unknown>} schoolData - Deleted school data
   * @return {Promise<string>} Audit log ID
   */
  async logSchoolDeletion(
    session: UserSession,
    schoolData: Record<string, unknown>
  ): Promise<string> {
    return this.createAuditLog({
      action: AuditAction.SCHOOL_DELETED,
      entityType: 'school',
      entityId: schoolData.schoolId as string,
      userId: session.uid,
      userEmail: session.email,
      changes: schoolData,
    });
  }

  /**
   * Create an audit log entry
   * 
   * @param {Partial<AuditEntry>} entry - Audit entry data
   * @return {Promise<string>} Created audit log ID
   */
  private async createAuditLog(
    entry: Omit<AuditEntry, 'id' | 'timestamp'>
  ): Promise<string> {
    const db = getDb();

    const auditEntry = {
      ...entry,
      timestamp: Timestamp.now(),
    };

    const docRef = await db.collection(this.collection).add(auditEntry);
    return docRef.id;
  }

  /**
   * Get audit logs for a specific entity
   * 
   * @param {string} entityType - Type of entity (school, user, etc.)
   * @param {string} entityId - Entity ID
   * @param {number} limit - Maximum number of logs to retrieve
   * @return {Promise<AuditEntry[]>} Array of audit logs
   */
  async getAuditLogs(
    entityType: 'school' | 'user' | 'group' | 'notice',
    entityId: string,
    limit: number = 100
  ): Promise<AuditEntry[]> {
    const db = getDb();

    const snapshot = await db
      .collection(this.collection)
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc: import('firebase-admin/firestore').QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditEntry[];
  }

  /**
   * Get audit logs for a specific user
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of logs to retrieve
   * @return {Promise<AuditEntry[]>} Array of audit logs
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 100
  ): Promise<AuditEntry[]> {
    const db = getDb();

    const snapshot = await db
      .collection(this.collection)
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc: import('firebase-admin/firestore').QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditEntry[];
  }
}
