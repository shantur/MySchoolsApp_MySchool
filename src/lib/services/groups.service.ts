/**
 * Groups Service (Supabase)
 * 
 * Provides CRUD operations for managing groups/classes using Supabase PostgreSQL.
 * Implements business logic and data validation for group entities.
 * Migrated from Firebase Firestore to Supabase for Phase 4.
 */

import { createServerClient } from '../supabase/server';
import type { Group } from '../types';

/**
 * Input type for creating a new group
 */
export interface CreateGroupInput {
  schoolId: string;
  name: string;
  description?: string;
}

/**
 * Input type for updating an existing group
 */
export interface UpdateGroupInput {
  name?: string;
  description?: string;
}

/**
 * Database row type (snake_case from PostgreSQL)
 */
interface GroupRow {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Groups Service class for managing group entities with Supabase
 */
export class GroupsServiceSupabase {
  private readonly table = 'groups';

  /**
   * Helper to get Supabase client
   * 
   * @return {ReturnType<typeof createServerClient>} Supabase client
   */
  private getClient() {
    return createServerClient();
  }

  /**
   * Convert database row to Group type (snake_case → camelCase)
   * 
   * @param {GroupRow} row - Database row
   * @return {Group} Typed Group object
   */
  private rowToGroup(row: GroupRow): Group {
    return {
      groupId: row.id,
      schoolId: row.school_id,
      name: row.name,
      ...(row.description && { description: row.description }),
      createdAt: new Date(row.created_at) as any,
      updatedAt: new Date(row.updated_at) as any,
    };
  }

  /**
   * Create a new group
   * 
   * @param {CreateGroupInput} input - Group creation data
   * @return {Promise<Group>} Created group with generated ID
   */
  async createGroup(input: CreateGroupInput): Promise<Group> {
    // Validate required fields
    if (!input.schoolId || input.schoolId.trim().length === 0) {
      throw new Error('School ID is required');
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Group name is required');
    }

    // Prepare group data (camelCase → snake_case)
    const groupData = {
      school_id: input.schoolId.trim(),
      name: input.name.trim(),
      ...(input.description && { description: input.description.trim() }),
    };

    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .insert(groupData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }

    return this.rowToGroup(data as GroupRow);
  }

  /**
   * Get a group by ID
   * 
   * @param {string} groupId - The group ID
   * @return {Promise<Group | null>} Group if found, null otherwise
   */
  async getGroupById(groupId: string): Promise<Group | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', groupId)
      .single();

    // PGRST116 is Supabase's "not found" error code
    if ((error && error.code === 'PGRST116') || !data) {
      return null;
    }

    if (error) {
      throw new Error(`Failed to get group: ${error.message}`);
    }

    return this.rowToGroup(data as GroupRow);
  }

  /**
   * Update an existing group
   * 
   * @param {string} groupId - The group ID
   * @param {UpdateGroupInput} updates - Fields to update
   * @return {Promise<Group>} Updated group
   */
  async updateGroup(
    groupId: string,
    updates: UpdateGroupInput
  ): Promise<Group> {
    // Check if group exists
    const existing = await this.getGroupById(groupId);
    if (!existing) {
      throw new Error('Group not found');
    }

    // Prepare update data (camelCase → snake_case)
    const updateData: Record<string, unknown> = {};
    
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    // Supabase handles updated_at automatically via trigger
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update group: ${error.message}`);
    }

    return this.rowToGroup(data as GroupRow);
  }

  /**
   * Delete a group
   * 
   * @param {string} groupId - The group ID
   * @return {Promise<void>}
   */
  async deleteGroup(groupId: string): Promise<void> {
    // Check if group exists
    const existing = await this.getGroupById(groupId);
    if (!existing) {
      throw new Error('Group not found');
    }

    const supabase = this.getClient();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', groupId);

    if (error) {
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  /**
   * List all groups for a specific school
   * 
   * @param {string} schoolId - The school ID
   * @return {Promise<Group[]>} Array of groups for the school
   */
  async listGroupsBySchool(schoolId: string): Promise<Group[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('school_id', schoolId)
      .order('name', { ascending: true })
      .limit(1000);

    if (error) {
      throw new Error(`Failed to list groups by school: ${error.message}`);
    }

    return (data as GroupRow[]).map(row => this.rowToGroup(row));
  }

  /**
   * List all groups across all schools (admin only)
   * 
   * @return {Promise<Group[]>} Array of all groups
   */
  async listAllGroups(): Promise<Group[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .limit(10000);

    if (error) {
      throw new Error(`Failed to list all groups: ${error.message}`);
    }

    // Sort in memory by schoolId and name (same as Firestore implementation)
    const groups = (data as GroupRow[]).map(row => this.rowToGroup(row));
    
    return groups.sort((a, b) => {
      if (a.schoolId !== b.schoolId) {
        return a.schoolId.localeCompare(b.schoolId);
      }
      return a.name.localeCompare(b.name);
    });
  }
}

// Compatibility export for Firebase-to-Supabase migration
export const GroupsService = GroupsServiceSupabase;
