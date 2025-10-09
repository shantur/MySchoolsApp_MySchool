/**
 * Schools Service
 * 
 * Provides CRUD operations for managing schools in Firestore.
 * Implements business logic and data validation for school entities.
 */

import { getAdminDb } from '../firebase/admin-lazy';
import type { School } from '../types';
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
    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('School name is required');
    }

    // Validate custom school ID if provided
    if (input.schoolId) {
      const trimmedId = input.schoolId.trim();
      
      // Validate format (alphanumeric, hyphens, 3-50 chars)
      const idRegex = /^[a-zA-Z0-9-]{3,50}$/;
      if (!idRegex.test(trimmedId)) {
        throw new Error(
          'School ID must be 3-50 characters, alphanumeric with hyphens allowed'
        );
      }

      // Check uniqueness
      const db = getDb();
      const existingDoc = await db
        .collection(this.collection)
        .doc(trimmedId)
        .get();
      
      if (existingDoc.exists) {
        throw new Error('School ID already exists');
      }
    }

    const now = Timestamp.now();
    const schoolData = {
      name: input.name.trim(),
      ...(input.address && { address: input.address.trim() }),
      ...(input.contactEmail && { 
        contactEmail: input.contactEmail.trim() 
      }),
      ...(input.contactPhone && { 
        contactPhone: input.contactPhone.trim() 
      }),
      createdAt: now,
      updatedAt: now,
    };

    const db = getDb();
    
    // Use custom ID if provided, otherwise auto-generate
    let docRef;
    let schoolId: string;
    
    if (input.schoolId) {
      schoolId = input.schoolId.trim();
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
      throw new Error('School not found');
    }

    // Prepare update data
    const updateData: Partial<School> & { updatedAt: import('firebase-admin/firestore').Timestamp } = {
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
      .doc(schoolId)
      .set(updateData, { merge: true });

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
      throw new Error('School not found');
    }

    const db = getDb();
    await db.collection(this.collection).doc(schoolId).delete();
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
