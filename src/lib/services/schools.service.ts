/**
 * Schools Service
 * 
 * Provides CRUD operations for managing schools in Firestore.
 * Implements business logic and data validation for school entities.
 */

import { getAdminDb } from '../firebase/admin-lazy';
import type { School } from '../types';
import { Timestamp } from 'firebase-admin/firestore';
import {
  validateSchoolInput,
  sanitizeSchoolInput,
  ValidationError,
} from '../validation/school-validation';

// Helper function to get Firestore instance
const getDb = () => {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Firestore is not available');
  }
  return db;
};

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
 * Schools Service class for managing school entities
 */
export class SchoolsService {
  private readonly collection = 'schools';

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
      const db = getDb();
      const existingDoc = await db
        .collection(this.collection)
        .doc(sanitized.schoolId)
        .get();
      
      if (existingDoc.exists) {
        throw new ValidationError(
          'School ID already exists',
          'DUPLICATE_ID',
          'schoolId'
        );
      }
    }

    const now = Timestamp.now();
    const schoolData = {
      name: sanitized.name,
      ...(sanitized.address && { address: sanitized.address }),
      ...(sanitized.contactEmail && { 
        contactEmail: sanitized.contactEmail 
      }),
      ...(sanitized.contactPhone && { 
        contactPhone: sanitized.contactPhone 
      }),
      createdAt: now,
      updatedAt: now,
    };

    const db = getDb();
    
    // Use custom ID if provided, otherwise auto-generate
    let docRef;
    let schoolId: string;
    
    if (sanitized.schoolId) {
      schoolId = sanitized.schoolId;
      docRef = db.collection(this.collection).doc(schoolId);
      await docRef.set(schoolData);
    } else {
      docRef = await db.collection(this.collection).add(schoolData);
      schoolId = docRef.id;
    }

    return {
      schoolId,
      ...schoolData,
    };
  }

  /**
   * Get a school by ID
   * 
   * @param {string} schoolId - The school ID
   * @return {Promise<School | null>} School if found, null otherwise
   */
  async getSchoolById(schoolId: string): Promise<School | null> {
    const db = getDb();
    const doc = await db
      .collection(this.collection)
      .doc(schoolId)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      schoolId: doc.id,
      ...data,
    } as School;
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
      
      // Prepare update data, excluding placeholder name if not in original updates
      const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      // Add sanitized fields (excluding placeholder name if not in updates)
      if (updates.name !== undefined) {
        updateData.name = sanitized.name;
      }
      if (updates.address !== undefined && sanitized.address !== undefined) {
        updateData.address = sanitized.address;
      }
      if (updates.contactEmail !== undefined && 
          sanitized.contactEmail !== undefined) {
        updateData.contactEmail = sanitized.contactEmail;
      }
      if (updates.contactPhone !== undefined && 
          sanitized.contactPhone !== undefined) {
        updateData.contactPhone = sanitized.contactPhone;
      }

      const db = getDb();
      await db
        .collection(this.collection)
        .doc(schoolId)
        .set(updateData, { merge: true });
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

    const db = getDb();
    
    // Check for dependent data before deletion
    await this.checkDependencies(schoolId);

    // Delete the school
    await db.collection(this.collection).doc(schoolId).delete();
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
    const db = getDb();

    // Check for associated users
    const usersSnapshot = await db
      .collection('users')
      .where('schoolId', '==', schoolId)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      throw new ValidationError(
        'Cannot delete school with existing users. ' +
        'Please remove or reassign all users first.',
        'HAS_DEPENDENCIES',
        'schoolId'
      );
    }

    // Check for associated groups
    const groupsSnapshot = await db
      .collection('groups')
      .where('schoolId', '==', schoolId)
      .limit(1)
      .get();

    if (!groupsSnapshot.empty) {
      throw new ValidationError(
        'Cannot delete school with existing groups. ' +
        'Please remove all groups first.',
        'HAS_DEPENDENCIES',
        'schoolId'
      );
    }

    // Check for associated notices
    const noticesSnapshot = await db
      .collection('notices')
      .where('schoolId', '==', schoolId)
      .limit(1)
      .get();

    if (!noticesSnapshot.empty) {
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
    const db = getDb();
    const snapshot = await db
      .collection(this.collection)
      .orderBy('name', 'asc')
      .get();

    return snapshot.docs.map((doc: import('firebase-admin/firestore').QueryDocumentSnapshot) => ({
      schoolId: doc.id,
      ...doc.data(),
    })) as School[];
  }
}
