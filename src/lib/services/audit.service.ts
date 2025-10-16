/**
 * Audit Service (Supabase)
 * 
 * Provides comprehensive audit logging for all school management operations.
 * Tracks who did what, when, and what changed for accountability and compliance.
 * Migrated from Firebase Firestore to Supabase for Phase 4.
 */

import { createServerClient } from '../supabase/server';
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
  timestamp: Date;
  changes: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Database row type (snake_case from PostgreSQL)
 */
interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_email?: string;
  timestamp: string | Date;
  changes: unknown;
  metadata?: unknown;
}

/**
 * Audit Service class for logging administrative actions with Supabase
 */
export class AuditServiceSupabase {
  private readonly table = 'audit_logs';

  /**
   * Helper to get Supabase client
   * 
   * @return {ReturnType<typeof createServerClient>} Supabase client
   */
  private getClient() {
    return createServerClient();
  }

  /**
   * Convert database row to AuditEntry type (snake_case → camelCase)
   * 
   * @param {AuditLogRow} row - Database row
   * @return {AuditEntry} Typed AuditEntry object
   */
  private rowToAuditEntry(row: AuditLogRow): AuditEntry {
    return {
      id: row.id,
      action: row.action,
      entityType: row.entity_type as 'school' | 'user' | 'group' | 'notice',
      entityId: row.entity_id,
      userId: row.user_id,
      ...(row.user_email && { userEmail: row.user_email }),
      timestamp: new Date(row.timestamp) as any,
      changes: row.changes as Record<string, unknown>,
      ...(row.metadata ? { metadata: row.metadata as Record<string, unknown> } : {}),
    };
  }

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
   * @param {Omit<AuditEntry, 'id' | 'timestamp'>} entry - Audit entry data
   * @return {Promise<string>} Created audit log ID
   */
  private async createAuditLog(
    entry: Omit<AuditEntry, 'id' | 'timestamp'>
  ): Promise<string> {
    const supabase = this.getClient();

    // Prepare audit entry (camelCase → snake_case)
    const auditData = {
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      user_id: entry.userId,
      ...(entry.userEmail && { user_email: entry.userEmail }),
      changes: entry.changes,
      ...(entry.metadata && { metadata: entry.metadata }),
      // timestamp will be set by database default (NOW())
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(auditData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create audit log: ${error.message}`);
    }

    return (data as { id: string }).id;
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
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }

    return (data as AuditLogRow[]).map(row => this.rowToAuditEntry(row));
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
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get user audit logs: ${error.message}`);
    }

    return (data as AuditLogRow[]).map(row => this.rowToAuditEntry(row));
  }
}

// Compatibility export for Firebase-to-Supabase migration
export const AuditService = AuditServiceSupabase;
