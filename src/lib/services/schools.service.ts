/**
 * Schools Service
 * 
 * Provides CRUD operations for managing schools in Firestore.
 * Implements business logic and data validation for school entities.
 */

import { adminDb } from '../firebase/admin';
import type { School } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Input type for creating a new school
 */
export interface CreateSchoolInput {
  name: string;
  address?: string;
  contactEmail?: string;
}

/**
 * Input type for updating an existing school
 */
export interface UpdateSchoolInput {
  name?: string;
  address?: string;
  contactEmail?: string;
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
   * @return {Promise<School>} Created school with generated ID
   */
  async createSchool(input: CreateSchoolInput): Promise<School> {
    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('School name is required');
    }

    const now = Timestamp.now();
    const schoolData = {
      name: input.name.trim(),
      ...(input.address && { address: input.address.trim() }),
      ...(input.contactEmail && { 
        contactEmail: input.contactEmail.trim() 
      }),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection(this.collection).add(schoolData);

    return {
      schoolId: docRef.id,
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
    const doc = await adminDb
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
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Clean up undefined fields
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    await adminDb
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

    await adminDb.collection(this.collection).doc(schoolId).delete();
  }

  /**
   * List all schools
   * 
   * @return {Promise<School[]>} Array of all schools
   */
  async listSchools(): Promise<School[]> {
    const snapshot = await adminDb
      .collection(this.collection)
      .orderBy('name', 'asc')
      .get();

    return snapshot.docs.map((doc: any) => ({
      schoolId: doc.id,
      ...doc.data(),
    })) as School[];
  }
}
