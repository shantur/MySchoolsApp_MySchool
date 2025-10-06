/**
 * Groups Service
 * 
 * Provides CRUD operations for managing groups/classes in Firestore.
 * Implements business logic and data validation for group entities.
 */

import { adminDb } from '../firebase/admin';
import type { Group } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

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
 * Groups Service class for managing group entities
 */
export class GroupsService {
  private readonly collection = 'groups';

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

    const now = Timestamp.now();
    const groupData = {
      schoolId: input.schoolId.trim(),
      name: input.name.trim(),
      ...(input.description && { description: input.description.trim() }),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection(this.collection).add(groupData);

    return {
      groupId: docRef.id,
      ...groupData,
    };
  }

  /**
   * Get a group by ID
   * 
   * @param {string} groupId - The group ID
   * @return {Promise<Group | null>} Group if found, null otherwise
   */
  async getGroupById(groupId: string): Promise<Group | null> {
    const doc = await adminDb.collection(this.collection).doc(groupId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      groupId: doc.id,
      ...data,
    } as Group;
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
      .doc(groupId)
      .set(updateData, { merge: true });

    return this.getGroupById(groupId) as Promise<Group>;
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

    await adminDb.collection(this.collection).doc(groupId).delete();
  }

  /**
   * List all groups for a specific school
   * 
   * @param {string} schoolId - The school ID
   * @return {Promise<Group[]>} Array of groups for the school
   */
  async listGroupsBySchool(schoolId: string): Promise<Group[]> {
    const snapshot = await adminDb
      .collection(this.collection)
      .where('schoolId', '==', schoolId)
      .orderBy('name', 'asc')
      .get();

    return snapshot.docs.map((doc: any) => ({
      groupId: doc.id,
      ...doc.data(),
    })) as Group[];
  }
}
