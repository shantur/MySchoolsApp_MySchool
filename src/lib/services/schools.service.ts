/**
 * Schools Service (Supabase)
 * 
 * Provides CRUD operations for managing schools using Supabase PostgreSQL.
 * Implements business logic and data validation for school entities.
 * Migrated from Firebase Firestore to Supabase for Phase 4.
 */

import { createServerClient } from '../supabase/server';
import type { School } from '../types';
import {
  validateSchoolInput,
  sanitizeSchoolInput,
  ValidationError,
} from '../validation/school-validation';

// Export ValidationError for use by consumers
export { ValidationError };

/**
 * Input type for creating a new school
 */
export interface CreateSchoolInput {
  schoolId?: string; // Optional custom school ID
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Input type for updating an existing school
 */
export interface UpdateSchoolInput {
  name?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Database row type (snake_case from PostgreSQL)
 */
interface SchoolRow {
  id: string;
  name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Schools Service class for managing school entities with Supabase
 */
export class SchoolsServiceSupabase {
  private readonly table = 'schools';

  /**
   * Helper to get Supabase client
   * 
   * @return {ReturnType<typeof createServerClient>} Supabase client
   */
  private getClient() {
    return createServerClient();
  }

  /**
   * Convert database row to School type (snake_case → camelCase)
   * 
   * @param {SchoolRow} row - Database row
   * @return {School} Typed School object
   */
  private rowToSchool(row: SchoolRow): School {
    return {
      schoolId: row.id,
      name: row.name,
      ...(row.address && { address: row.address }),
      ...(row.contact_email && { contactEmail: row.contact_email }),
      ...(row.contact_phone && { contactPhone: row.contact_phone }),
      createdAt: new Date(row.created_at) as any,
      updatedAt: new Date(row.updated_at) as any,
    };
  }

  /**
   * Create a new school
   * 
   * @param {CreateSchoolInput} input - School creation data
   * @return {Promise<School>} Created school with generated ID or custom ID
   */
  async createSchool(input: CreateSchoolInput): Promise<School> {
    // Validate input using comprehensive validation
    validateSchoolInput(input);

    // Sanitize input to prevent XSS and normalize data
    const sanitized = sanitizeSchoolInput(input);

    // Validate custom school ID uniqueness if provided
    if (sanitized.schoolId) {
      const existing = await this.getSchoolById(sanitized.schoolId);
      
      if (existing) {
        throw new ValidationError(
          'School ID already exists',
          'DUPLICATE_ID',
          'schoolId'
        );
      }
    }

    // Prepare school data (camelCase → snake_case)
    const schoolData: Record<string, unknown> = {
      name: sanitized.name,
      ...(sanitized.schoolId && { id: sanitized.schoolId }),
      ...(sanitized.address && { address: sanitized.address }),
      ...(sanitized.contactEmail && { contact_email: sanitized.contactEmail }),
      ...(sanitized.contactPhone && { contact_phone: sanitized.contactPhone }),
    };

    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .insert(schoolData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create school: ${error.message}`);
    }

    return this.rowToSchool(data as SchoolRow);
  }

  /**
   * Get a school by ID
   * 
   * @param {string} schoolId - The school ID
   * @return {Promise<School | null>} School if found, null otherwise
   */
  async getSchoolById(schoolId: string): Promise<School | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', schoolId)
      .single();

    // PGRST116 is Supabase's "not found" error code
    if ((error && error.code === 'PGRST116') || !data) {
      return null;
    }

    if (error) {
      throw new Error(`Failed to get school: ${error.message}`);
    }

    return this.rowToSchool(data as SchoolRow);
  }

  /**
   * Update an existing school
   * 
   * @param {string} schoolId - The school ID
   * @param {UpdateSchoolInput} updates - Fields to update
   * @return {Promise<School>} Updated school
   */
  async updateSchool(
    schoolId: string,
    updates: UpdateSchoolInput
  ): Promise<School> {
    // Check if school exists
    const existing = await this.getSchoolById(schoolId);
    if (!existing) {
      throw new ValidationError(
        'School not found',
        'NOT_FOUND',
        'schoolId'
      );
    }

    // Validate and sanitize update data
    if (Object.keys(updates).length > 0) {
      // Create a temporary object with name for validation if updating
      const validationInput = {
        name: updates.name || existing.name,
        ...updates,
      };
      validateSchoolInput(validationInput);
      
      // Sanitize the actual updates
      const sanitizedInput = {
        name: 'placeholder',
        ...updates,
      };
      const sanitized = sanitizeSchoolInput(sanitizedInput);
      
      // Prepare update data (camelCase → snake_case)
      const updateData: Record<string, unknown> = {};

      if (updates.name !== undefined) {
        updateData.name = sanitized.name;
      }
      if (updates.address !== undefined && sanitized.address !== undefined) {
        updateData.address = sanitized.address;
      }
      if (updates.contactEmail !== undefined && 
          sanitized.contactEmail !== undefined) {
        updateData.contact_email = sanitized.contactEmail;
      }
      if (updates.contactPhone !== undefined && 
          sanitized.contactPhone !== undefined) {
        updateData.contact_phone = sanitized.contactPhone;
      }

      // Supabase handles updated_at automatically via trigger
      const supabase = this.getClient();
      const { error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', schoolId);

      if (error) {
        throw new Error(`Failed to update school: ${error.message}`);
      }
    }

    return this.getSchoolById(schoolId) as Promise<School>;
  }

  /**
   * Delete a school
   * 
   * @param {string} schoolId - The school ID
   * @return {Promise<void>}
   */
  async deleteSchool(schoolId: string): Promise<void> {
    // Check if school exists
    const existing = await this.getSchoolById(schoolId);
    if (!existing) {
      throw new ValidationError(
        'School not found',
        'NOT_FOUND',
        'schoolId'
      );
    }

    // Check for dependent data before deletion
    await this.checkDependencies(schoolId);

    // Delete the school
    const supabase = this.getClient();
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', schoolId);

    if (error) {
      throw new Error(`Failed to delete school: ${error.message}`);
    }
  }

  /**
   * Check for dependent data before school deletion
   * 
   * Prevents deletion if school has associated users, groups, or notices
   * 
   * @param {string} schoolId - The school ID
   * @throws {ValidationError} If dependencies exist
   */
  private async checkDependencies(schoolId: string): Promise<void> {
    const supabase = this.getClient();

    // Check for associated users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('school_id', schoolId)
      .limit(1);

    if (usersError) {
      throw new Error(`Failed to check user dependencies: ${usersError.message}`);
    }

    if (users && users.length > 0) {
      throw new ValidationError(
        'Cannot delete school with existing users. ' +
        'Please remove or reassign all users first.',
        'HAS_DEPENDENCIES',
        'schoolId'
      );
    }

    // Check for associated groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id')
      .eq('school_id', schoolId)
      .limit(1);

    if (groupsError) {
      throw new Error(`Failed to check group dependencies: ${groupsError.message}`);
    }

    if (groups && groups.length > 0) {
      throw new ValidationError(
        'Cannot delete school with existing groups. ' +
        'Please remove all groups first.',
        'HAS_DEPENDENCIES',
        'schoolId'
      );
    }

    // Check for associated notices
    const { data: notices, error: noticesError } = await supabase
      .from('notices')
      .select('id')
      .eq('school_id', schoolId)
      .limit(1);

    if (noticesError) {
      throw new Error(`Failed to check notice dependencies: ${noticesError.message}`);
    }

    if (notices && notices.length > 0) {
      throw new ValidationError(
        'Cannot delete school with existing notices. ' +
        'Please remove all notices first.',
        'HAS_DEPENDENCIES',
        'schoolId'
      );
    }
  }

  /**
   * List all schools
   * 
   * @return {Promise<School[]>} Array of all schools
   */
  async listSchools(): Promise<School[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('name', { ascending: true })
      .limit(1000);

    if (error) {
      throw new Error(`Failed to list schools: ${error.message}`);
    }

    return (data as SchoolRow[]).map(row => this.rowToSchool(row));
  }
}

// Compatibility export for Firebase-to-Supabase migration
export const SchoolsService = SchoolsServiceSupabase;
