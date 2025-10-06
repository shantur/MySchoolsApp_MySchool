/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import { GroupsService } from '../groups.service';
import type { Group } from '../../types';

// Mock Firebase Admin
jest.mock('../../firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

import { adminDb } from '../../firebase/admin';

describe('GroupsService', () => {
  let groupsService: GroupsService;
  let mockCollection: any;
  let mockDoc: any;
  let mockGet: any;
  let mockAdd: any;
  let mockSet: any;
  let mockDelete: any;
  let mockWhere: any;
  let mockOrderBy: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGet = jest.fn();
    mockAdd = jest.fn();
    mockSet = jest.fn();
    mockDelete = jest.fn();
    mockWhere = jest.fn();
    mockOrderBy = jest.fn();

    mockDoc = jest.fn(() => ({
      get: mockGet,
      set: mockSet,
      delete: mockDelete,
    }));

    mockCollection = jest.fn(() => ({
      doc: mockDoc,
      add: mockAdd,
      where: mockWhere,
      orderBy: mockOrderBy,
      get: mockGet,
    }));

    (adminDb.collection as jest.Mock) = mockCollection;

    groupsService = new GroupsService();
  });

  describe('createGroup', () => {
    it('should create a new group with required fields', async () => {
      const groupData = {
        schoolId: 'school123',
        name: 'Grade 5A',
        description: 'Fifth grade class A',
      };

      const mockDocRef = { id: 'group123' };
      mockAdd.mockResolvedValue(mockDocRef);

      const result = await groupsService.createGroup(groupData);

      expect(mockCollection).toHaveBeenCalledWith('groups');
      expect(mockAdd).toHaveBeenCalled();

      const addedData = mockAdd.mock.calls[0][0];
      expect(addedData.schoolId).toBe(groupData.schoolId);
      expect(addedData.name).toBe(groupData.name);
      expect(addedData.description).toBe(groupData.description);
      expect(addedData.createdAt).toBeDefined();
      expect(addedData.updatedAt).toBeDefined();

      expect(result.groupId).toBe('group123');
      expect(result.name).toBe(groupData.name);
    });

    it('should create group without optional description', async () => {
      const groupData = {
        schoolId: 'school123',
        name: 'Grade 5A',
      };

      const mockDocRef = { id: 'group456' };
      mockAdd.mockResolvedValue(mockDocRef);

      const result = await groupsService.createGroup(groupData);

      expect(result.groupId).toBe('group456');
      expect(result.description).toBeUndefined();
    });

    it('should throw error if schoolId is missing', async () => {
      const groupData = {
        schoolId: '',
        name: 'Grade 5A',
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
      const mockGroupData = {
        schoolId: 'school123',
        name: 'Grade 5A',
        description: 'Fifth grade class A',
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      const mockSnapshot = {
        exists: true,
        id: 'group123',
        data: () => mockGroupData,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      const result = await groupsService.getGroupById('group123');

      expect(mockCollection).toHaveBeenCalledWith('groups');
      expect(mockDoc).toHaveBeenCalledWith('group123');
      expect(result).toBeDefined();
      expect(result?.groupId).toBe('group123');
      expect(result?.name).toBe('Grade 5A');
    });

    it('should return null for non-existent group', async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      const result = await groupsService.getGroupById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateGroup', () => {
    it('should update group fields', async () => {
      const updates = {
        name: 'Updated Group Name',
        description: 'Updated description',
      };

      const mockSnapshotBefore = {
        exists: true,
        id: 'group123',
        data: () => ({
          schoolId: 'school123',
          name: 'Old Name',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      const mockSnapshotAfter = {
        exists: true,
        id: 'group123',
        data: () => ({
          schoolId: 'school123',
          name: 'Updated Group Name',
          description: 'Updated description',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGet
        .mockResolvedValueOnce(mockSnapshotBefore)
        .mockResolvedValueOnce(mockSnapshotAfter);

      const result = await groupsService.updateGroup('group123', updates);

      expect(mockDoc).toHaveBeenCalledWith('group123');
      expect(mockSet).toHaveBeenCalled();
      expect(result.name).toBe(updates.name);
    });

    it('should throw error for non-existent group', async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      await expect(
        groupsService.updateGroup('nonexistent', { name: 'New Name' })
      ).rejects.toThrow('Group not found');
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      const mockSnapshot = {
        exists: true,
        id: 'group123',
        data: () => ({
          schoolId: 'school123',
          name: 'Grade 5A',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGet.mockResolvedValue(mockSnapshot);
      mockDelete.mockResolvedValue(undefined);

      await groupsService.deleteGroup('group123');

      expect(mockDoc).toHaveBeenCalledWith('group123');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error for non-existent group', async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      await expect(
        groupsService.deleteGroup('nonexistent')
      ).rejects.toThrow('Group not found');
    });
  });

  describe('listGroupsBySchool', () => {
    it('should return groups for a specific school', async () => {
      const mockGroups = [
        {
          id: 'group1',
          data: () => ({
            schoolId: 'school123',
            name: 'Grade 5A',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'group2',
          data: () => ({
            schoolId: 'school123',
            name: 'Grade 5B',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];

      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });

      mockOrderBy.mockReturnValue({
        get: mockGet,
      });

      mockGet.mockResolvedValue({
        docs: mockGroups,
      });

      const result = await groupsService.listGroupsBySchool('school123');

      expect(mockCollection).toHaveBeenCalledWith('groups');
      expect(mockWhere).toHaveBeenCalledWith('schoolId', '==', 'school123');
      expect(mockOrderBy).toHaveBeenCalledWith('name', 'asc');
      expect(result).toHaveLength(2);
      expect(result[0].groupId).toBe('group1');
      expect(result[1].groupId).toBe('group2');
    });

    it('should return empty array when no groups exist', async () => {
      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });

      mockOrderBy.mockReturnValue({
        get: mockGet,
      });

      mockGet.mockResolvedValue({
        docs: [],
      });

      const result = await groupsService.listGroupsBySchool('school123');

      expect(result).toEqual([]);
    });
  });
});
