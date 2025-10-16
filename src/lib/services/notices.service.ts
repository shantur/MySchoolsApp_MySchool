/**
 * Notices Service (Supabase)
 * 
 * Provides CRUD operations for managing notices using Supabase PostgreSQL.
 * Implements business logic for notice entities including attachments.
 * Migrated from Firebase Firestore to Supabase for Phase 4.
 */

import { createServerClient } from '../supabase/server';
import type { Notice, Attachment } from '../types';

/**
 * Input type for creating a new notice
 */
export interface CreateNoticeInput {
  groupId: string;  // Primary association - one-to-one with group
  title: string;
  body: string;
  status?: 'draft' | 'published' | 'archived';
  attachments?: Attachment[];
  senderName?: string;  // Display name of notice creator
}

/**
 * Input type for updating an existing notice
 */
export interface UpdateNoticeInput {
  title?: string;
  body?: string;
  status?: 'draft' | 'published' | 'archived';
  groupId?: string;  // Allow changing group assignment
  attachments?: Attachment[];
}

/**
 * Database row type (snake_case from PostgreSQL)
 */
interface NoticeRow {
  id: string;
  school_id: string;
  group_id: string;
  title: string;
  body: string;
  status: 'draft' | 'published' | 'archived';
  publication_date: string | Date;
  attachments: unknown;
  sender_name?: string;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Notices Service class for managing notice entities with Supabase
 */
export class NoticesServiceSupabase {
  private readonly table = 'notices';

  /**
   * Helper to get Supabase client
   * 
   * @return {ReturnType<typeof createServerClient>} Supabase client
   */
  private getClient() {
    return createServerClient();
  }

  /**
   * Convert database row to Notice type (snake_case → camelCase)
   * 
   * @param {NoticeRow} row - Database row
   * @return {Notice} Typed Notice object
   */
  private rowToNotice(row: NoticeRow): Notice {
    return {
      noticeId: row.id,
      schoolId: row.school_id,
      groupId: row.group_id,
      title: row.title,
      body: row.body,
      status: row.status,
      publicationDate: new Date(row.publication_date) as any,
      attachments: (row.attachments as Attachment[]) || [],
      ...(row.sender_name && { senderName: row.sender_name }),
      createdAt: new Date(row.created_at) as any,
      updatedAt: new Date(row.updated_at) as any,
    };
  }

  /**
   * Create a new notice
   * 
   * @param {CreateNoticeInput} input - Notice creation data
   * @return {Promise<Notice>} Created notice with generated ID
   */
  async createNotice(input: CreateNoticeInput): Promise<Notice> {
    // Validate required fields
    if (!input.groupId || input.groupId.trim().length === 0) {
      throw new Error('Group ID is required');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Notice title is required');
    }

    if (!input.body || input.body.trim().length === 0) {
      throw new Error('Notice body is required');
    }

    // Validate that the group exists and get its schoolId
    const supabase = this.getClient();
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('id, school_id')
      .eq('id', input.groupId.trim())
      .single();

    if (groupError || !groupData) {
      throw new Error(`Group ${input.groupId} does not exist`);
    }

    const schoolId = groupData.school_id;
    
    if (!schoolId) {
      throw new Error(`Group ${input.groupId} does not have a valid schoolId`);
    }

    // Prepare notice data (camelCase → snake_case)
    const noticeData = {
      school_id: schoolId,  // Derived from group for context/access control
      group_id: input.groupId.trim(),  // Primary association
      title: input.title.trim(),
      body: input.body.trim(),
      status: input.status || 'draft',
      publication_date: new Date().toISOString(),
      attachments: input.attachments || [],
      ...(input.senderName && { sender_name: input.senderName }),
    };

    // Insert notice
    const { data, error } = await supabase
      .from(this.table)
      .insert(noticeData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notice: ${error.message}`);
    }

    return this.rowToNotice(data as NoticeRow);
  }

  /**
   * List all notices (for admin)
   *
   * @return {Promise<Notice[]>} List of all notices
   */
  async listAllNotices(): Promise<Notice[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('publication_date', { ascending: false })
      .limit(1000);

    if (error) {
      throw new Error(`Failed to list notices: ${error.message}`);
    }

    return (data as NoticeRow[]).map(row => this.rowToNotice(row));
  }

  /**
   * Get a notice by ID
   *
   * @param {string} noticeId - The notice ID
   * @return {Promise<Notice | null>} Notice if found, null otherwise
   */
  async getNoticeById(noticeId: string): Promise<Notice | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', noticeId)
      .single();

    // PGRST116 is Supabase's "not found" error code
    // Also check if data is null (not found scenario)
    if ((error && error.code === 'PGRST116') || !data) {
      return null;
    }

    if (error) {
      throw new Error(`Failed to get notice: ${error.message}`);
    }

    return this.rowToNotice(data as NoticeRow);
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

    // Prepare update data (camelCase → snake_case)
    const updateData: Record<string, unknown> = {};
    
    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    if (updates.body !== undefined) {
      updateData.body = updates.body;
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.groupId !== undefined) {
      updateData.group_id = updates.groupId;
    }
    if (updates.attachments !== undefined) {
      updateData.attachments = updates.attachments;
    }

    // Supabase handles updated_at automatically via trigger
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', noticeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update notice: ${error.message}`);
    }

    return this.rowToNotice(data as NoticeRow);
  }

  /**
   * Delete a notice
   * 
   * Cascade deletes attachments since they are embedded in the notice document.
   * When a notice is deleted from PostgreSQL, all embedded attachments are 
   * automatically removed.
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

    // Delete the notice (attachments are embedded and will be deleted automatically)
    const supabase = this.getClient();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', noticeId);

    if (error) {
      throw new Error(`Failed to delete notice: ${error.message}`);
    }
    
    // Note: Attachments are embedded in the notice row as JSONB, so they are 
    // automatically deleted when the notice is deleted. No separate cleanup required.
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
    const supabase = this.getClient();
    let query = supabase
      .from(this.table)
      .select('*')
      .eq('school_id', schoolId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('publication_date', { ascending: false })
      .limit(1000);

    if (error) {
      throw new Error(`Failed to list notices by school: ${error.message}`);
    }

    return (data as NoticeRow[]).map(row => this.rowToNotice(row));
  }

  /**
   * List notices for a specific group
   * 
   * @param {string} groupId - The group ID
   * @param {string} status - Optional status filter
   * @return {Promise<Notice[]>} Array of notices
   */
  async listNoticesByGroup(
    groupId: string,
    status?: 'draft' | 'published' | 'archived'
  ): Promise<Notice[]> {
    const supabase = this.getClient();
    let query = supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('publication_date', { ascending: false })
      .limit(1000);

    if (error) {
      throw new Error(`Failed to list notices by group: ${error.message}`);
    }

    return (data as NoticeRow[]).map(row => this.rowToNotice(row));
  }
}

// Compatibility export for Firebase-to-Supabase migration
export const NoticesService = NoticesServiceSupabase;
