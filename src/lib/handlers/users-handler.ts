/**
 * Users Handler (Supabase)
 *
 * Handles user-related data operations for the MySchool application.
 */

import { User } from '@/lib/types';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Database row type (snake_case from PostgreSQL)
 */
interface UserRow {
  id: string;
  email: string;
  school_id: string;
  role: 'user' | 'admin';
  display_name?: string;
  group_ids?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to User type (snake_case → camelCase)
 * 
 * @param row - Database row
 * @returns User - Typed User object
 */
function rowToUser(row: UserRow): User {
  return {
    uid: row.id,
    email: row.email,
    schoolId: row.school_id,
    role: row.role,
    ...(row.display_name && { displayName: row.display_name }),
    ...(row.group_ids && { groupIds: row.group_ids }),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all users (admin only)
 *
 * @returns Promise<User[]> - Array of all users
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const supabase = createServerClient();
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (users as UserRow[]).map(rowToUser);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}

/**
 * Get a user by ID
 *
 * @param uid - User ID
 * @returns Promise<User | null> - User object or null if not found
 */
export async function getUserById(uid: string): Promise<User | null> {
  try {
    const supabase = createServerClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)  // Database column is 'id', not 'uid'
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return user ? rowToUser(user as UserRow) : null;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
}

/**
 * Update a user
 *
 * @param uid - User ID
 * @param updates - Partial user data to update
 * @returns Promise<User | null> - Updated user or null if failed
 */
export async function updateUserHandler(
  uid: string,
  updates: Partial<User>
): Promise<User | null> {
  try {
    const supabase = createServerClient();
    
    // Map camelCase to snake_case for database
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.schoolId !== undefined) updateData.school_id = updates.schoolId;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.groupIds !== undefined) updateData.group_ids = updates.groupIds;
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', uid)  // Database column is 'id', not 'uid'
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return user ? rowToUser(user as UserRow) : null;
  } catch (error) {
    console.error('Error in updateUserHandler:', error);
    return null;
  }
}

/**
 * Delete a user
 *
 * @param uid - User ID
 * @returns Promise<void>
 */
export async function deleteUserHandler(uid: string): Promise<void> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', uid);  // Database column is 'id', not 'uid'

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteUserHandler:', error);
    throw error;
  }
}
