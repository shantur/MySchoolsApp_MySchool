/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import { GroupsService } from '../groups.service';
import { getAdminDb, resetAdminInstances } from '../../firebase/admin-lazy';
import * as admin from 'firebase-admin';

describe('GroupsService', () => {
  let groupsService: GroupsService;
  let adminDb: admin.firestore.Firestore;

  beforeAll(async () => {
    // Ensure Firebase is initialized for tests
    adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized. Ensure emulators are running.');
    }
  });

  beforeEach(async () => {
    // Reset instances for test isolation
    resetAdminInstances();
    adminDb = getAdminDb();
    
    if (!adminDb) {
      throw new Error('Firebase Admin not available for test');
    }

    groupsService = new GroupsService();
    
    // Clean up test data before each test
    const testGroups = await adminDb.collection('groups').where('name', '>=', 'TEST_').get();
    const deletePromises = testGroups.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
  });

  afterAll(async () => {
    // Clean up any remaining test data
    const adminDb = getAdminDb();
    if (adminDb) {
      const testGroups = await adminDb.collection('groups').where('name', '>=', 'TEST_').get();
      const deletePromises = testGroups.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
    }
  });

  describe('createGroup', () => {
    it('should create a new group with required fields', async () => {
      const groupData = {
        schoolId: 'school123',
        name: 'TEST_Grade 5A',
        description: 'Fifth grade class A',
      };

      const result = await groupsService.createGroup(groupData);

      expect(result.groupId).toBeDefined();
      expect(result.name).toBe(groupData.name);
      expect(result.schoolId).toBe(groupData.schoolId);
      expect(result.description).toBe(groupData.description);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify the group was actually created in Firestore
      const doc = await adminDb.collection('groups').doc(result.groupId).get();
      expect(doc.exists).toBe(true);
      expect(doc.data()?.name).toBe(groupData.name);
    });

    it('should create group without optional description', async () => {
      const groupData = {
        schoolId: 'school123',
        name: 'TEST_Grade 5B',
      };

      const result = await groupsService.createGroup(groupData);

      expect(result.groupId).toBeDefined();
      expect(result.name).toBe(groupData.name);
      expect(result.description).toBeUndefined();

      // Verify the group was actually created in Firestore
      const doc = await adminDb.collection('groups').doc(result.groupId).get();
      expect(doc.exists).toBe(true);
      expect(doc.data()?.description).toBeUndefined();
    });

    it('should throw error if schoolId is missing', async () => {
      const groupData = {
        schoolId: '',
        name: 'TEST_Grade 5C',
      };

      await expect(
        groupsService.createGroup(groupData)
      ).rejects.toThrow('School ID is required');
    });

    it('should throw error if name is empty', async () => {
      const groupData = {
        schoolId: 'school123',
        name: '',
      };

      await expect(
        groupsService.createGroup(groupData)
      ).rejects.toThrow('Group name is required');
    });
  });

  describe('getGroupById', () => {
    it('should return group by ID', async () => {
      // First create a group to retrieve
      const groupData = {
        schoolId: 'school123',
        name: 'TEST_Grade 5A',
        description: 'Fifth grade class A',
      };

      const createdGroup = await groupsService.createGroup(groupData);

      // Now retrieve the group
      const result = await groupsService.getGroupById(createdGroup.groupId);

      expect(result).toBeDefined();
      expect(result?.groupId).toBe(createdGroup.groupId);
      expect(result?.name).toBe(groupData.name);
      expect(result?.schoolId).toBe(groupData.schoolId);
      expect(result?.description).toBe(groupData.description);
    });

    it('should return null for non-existent group', async () => {
      const result = await groupsService.getGroupById('nonexistent-group-id');

      expect(result).toBeNull();
    });
  });

  describe('updateGroup', () => {
    it('should update group fields', async () => {
      // First create a group to update
      const groupData = {
        schoolId: 'school123',
        name: 'TEST_Grade 5A',
        description: 'Original description',
      };

      const createdGroup = await groupsService.createGroup(groupData);

      // Now update the group
      const updates = {
        name: 'Updated Group Name',
        description: 'Updated description',
      };

      const result = await groupsService.updateGroup(createdGroup.groupId, updates);

      expect(result.groupId).toBe(createdGroup.groupId);
      expect(result.name).toBe(updates.name);
      expect(result.description).toBe(updates.description);

      // Verify the group was actually updated in Firestore
      const doc = await adminDb.collection('groups').doc(createdGroup.groupId).get();
      expect(doc.exists).toBe(true);
      expect(doc.data()?.name).toBe(updates.name);
      expect(doc.data()?.description).toBe(updates.description);
    });

    it('should throw error for non-existent group', async () => {
      await expect(
        groupsService.updateGroup('nonexistent-group-id', { name: 'New Name' })
      ).rejects.toThrow('Group not found');
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      // First create a group to delete
      const groupData = {
        schoolId: 'school123',
        name: 'TEST_Grade 5A',
        description: 'To be deleted',
      };

      const createdGroup = await groupsService.createGroup(groupData);

      // Verify the group exists before deletion
      const docBefore = await adminDb.collection('groups').doc(createdGroup.groupId).get();
      expect(docBefore.exists).toBe(true);

      // Delete the group
      await groupsService.deleteGroup(createdGroup.groupId);

      // Verify the group was actually deleted from Firestore
      const docAfter = await adminDb.collection('groups').doc(createdGroup.groupId).get();
      expect(docAfter.exists).toBe(false);
    });

    it('should throw error for non-existent group', async () => {
      await expect(
        groupsService.deleteGroup('nonexistent-group-id')
      ).rejects.toThrow('Group not found');
    });
  });

  describe('listGroupsBySchool', () => {
    it('should return groups for a specific school', async () => {
      // Create test groups for the school
      const group1Data = {
        schoolId: 'school123',
        name: 'TEST_Grade 5A',
        description: 'First test group',
      };

      const group2Data = {
        schoolId: 'school123',
        name: 'TEST_Grade 5B',
        description: 'Second test group',
      };

      await groupsService.createGroup(group1Data);
      await groupsService.createGroup(group2Data);

      const result = await groupsService.listGroupsBySchool('school123');

      expect(result).toHaveLength(2);
      expect(result.some(g => g.name === 'TEST_Grade 5A')).toBe(true);
      expect(result.some(g => g.name === 'TEST_Grade 5B')).toBe(true);
      expect(result.every(g => g.schoolId === 'school123')).toBe(true);
    });

    it('should return empty array when no groups exist', async () => {
      const result = await groupsService.listGroupsBySchool('nonexistent-school');

      expect(result).toEqual([]);
    });

    it('should return groups in alphabetical order', async () => {
      // Create groups in reverse alphabetical order
      const groupZData = {
        schoolId: 'school123',
        name: 'TEST_Zebra Group',
        description: 'Last alphabetically',
      };

      const groupAData = {
        schoolId: 'school123',
        name: 'TEST_Alpha Group',
        description: 'First alphabetically',
      };

      await groupsService.createGroup(groupZData);
      await groupsService.createGroup(groupAData);

      const result = await groupsService.listGroupsBySchool('school123');

      // Filter for our test groups
      const testGroups = result.filter(g => g.name.startsWith('TEST_'));
      expect(testGroups.length).toBeGreaterThan(0);
      
      // Check that they are in alphabetical order
      const sortedNames = testGroups.map(g => g.name).sort();
      const actualNames = testGroups.map(g => g.name);
      expect(actualNames).toEqual(sortedNames);
    });
  });
});
