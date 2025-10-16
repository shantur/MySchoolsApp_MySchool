/**
 * Authentication Service (Supabase)
 * 
 * Handles user authentication, account creation, and role management
 * using Supabase Auth.
 * 
 * Replaces Firebase Auth implementation (auth.service.ts)
 */

import { UserSession, User } from '@/lib/types';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Parameters for creating a new user account
 */
export interface CreateUserParams {
  email: string;
  password: string;
  schoolId: string;
  role: 'user' | 'admin';
  displayName?: string;
  groupIds?: string[];
}

/**
 * Authenticate a user with email and password using Supabase Auth
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @return {Promise<UserSession | null>} User session data or null
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<UserSession | null> {
  try {
    // Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseServer.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      console.error('Supabase Auth error:', authError);
      return null;
    }

    const userId = authData.user.id;

    // Fetch user data from users table
    const { data: userData, error: dbError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (dbError || !userData) {
      console.error('User document not found in database:', dbError);
      return null;
    }

    // Map PostgreSQL column names to UserSession format
    return {
      uid: userData.id,
      email: userData.email,
      schoolId: userData.school_id,
      role: userData.role as 'user' | 'admin',
      displayName: userData.display_name,
      groupIds: userData.group_ids || [],
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
}

/**
 * Create a new user account in Supabase Auth and users table
 * 
 * @param {CreateUserParams} params - User creation parameters
 * @return {Promise<User>} Created user data
 * @throws {Error} If user creation fails
 */
export async function createUserAccount(
  params: CreateUserParams
): Promise<User> {
  const { email, password, schoolId, role, displayName, groupIds } = params;

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseServer.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for admin-created users
        user_metadata: {
          display_name: displayName,
        },
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user in Auth');
    }

    const userId = authData.user.id;

    // Create user document in users table
    const now = new Date().toISOString();
    const { data: userData, error: dbError } = await supabaseServer
      .from('users')
      .insert({
        id: userId,
        email,
        school_id: schoolId,
        role,
        display_name: displayName,
        group_ids: groupIds || [],
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (dbError || !userData) {
      // Cleanup: delete auth user if database insert fails
      await supabaseServer.auth.admin.deleteUser(userId);
      throw new Error(dbError?.message || 'Failed to create user in database');
    }

    // Map PostgreSQL column names to User format
    // Note: Supabase returns ISO strings, convert to Date for compatibility
    return {
      uid: userData.id,
      email: userData.email,
      schoolId: userData.school_id,
      role: userData.role as 'user' | 'admin',
      displayName: userData.display_name,
      groupIds: userData.group_ids || [],
      createdAt: new Date(userData.created_at) as any, // PostgreSQL TIMESTAMPTZ → Date
      updatedAt: new Date(userData.updated_at) as any, // PostgreSQL TIMESTAMPTZ → Date
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Set user role by updating the users table
 * 
 * Note: Unlike Firebase custom claims, Supabase uses database-level role storage.
 * 
 * @param {string} uid - User ID
 * @param {'user' | 'admin'} role - User role
 * @return {Promise<void>}
 */
export async function setUserRole(
  uid: string,
  role: 'user' | 'admin'
): Promise<void> {
  const { error } = await supabaseServer
    .from('users')
    .update({ role })
    .eq('id', uid);

  if (error) {
    throw new Error(error.message);
  }
}
