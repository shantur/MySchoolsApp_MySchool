/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import { SchoolsService } from '../schools.service';

// Mock Firebase Admin
jest.mock('../../firebase/admin-lazy', () => ({
  getAdminDb: jest.fn(),
}));

import { getAdminDb } from '../../firebase/admin-lazy';

describe('SchoolsService', () => {
  let schoolsService: SchoolsService;
  let mockCollection: any;
  let mockDoc: any;
  let mockGet: any;
  let mockAdd: any;
  let mockSet: any;
  let mockDelete: any;
  let mockWhere: any;
  let mockOrderBy: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock chain
    mockGet = jest.fn();
    mockAdd = jest.fn();
    mockSet = jest.fn();
    mockDelete = jest.fn();
    mockWhere = jest.fn().mockReturnThis();
    mockOrderBy = jest.fn().mockReturnThis();

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
      limit: jest.fn().mockReturnThis(),
      get: mockGet,
    }));

    (getAdminDb as jest.Mock).mockReturnValue({
      collection: mockCollection,
    });

    schoolsService = new SchoolsService();
  });

  describe('createSchool', () => {
    it('should create a new school with generated ID', async () => {
      const schoolData = {
        name: 'Test School',
        address: '123 Main St',
        contactEmail: 'test@school.com',
      };

      const mockDocRef = {
        id: 'school123',
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const result = await schoolsService.createSchool(schoolData);

      expect(mockCollection).toHaveBeenCalledWith('schools');
      expect(mockAdd).toHaveBeenCalled();

      const addedData = mockAdd.mock.calls[0][0];
      expect(addedData.name).toBe(schoolData.name);
      expect(addedData.address).toBe(schoolData.address);
      expect(addedData.contactEmail).toBe(schoolData.contactEmail);
      expect(addedData.createdAt).toBeDefined();
      expect(addedData.updatedAt).toBeDefined();

      expect(result.schoolId).toBe('school123');
      expect(result.name).toBe(schoolData.name);
    });

    it('should create school without optional fields', async () => {
      const schoolData = {
        name: 'Test School',
      };

      const mockDocRef = { id: 'school456' };
      mockAdd.mockResolvedValue(mockDocRef);

      const result = await schoolsService.createSchool(schoolData);

      expect(result.schoolId).toBe('school456');
      expect(result.address).toBeUndefined();
      expect(result.contactEmail).toBeUndefined();
    });

    it('should throw error if name is empty', async () => {
      const schoolData = {
        name: '',
      };

      await expect(
        schoolsService.createSchool(schoolData)
      ).rejects.toThrow('School name is required');
    });
  });

  describe('getSchoolById', () => {
    it('should return school by ID', async () => {
      const mockSchoolData = {
        name: 'Test School',
        address: '123 Main St',
        contactEmail: 'test@school.com',
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      const mockSnapshot = {
        exists: true,
        id: 'school123',
        data: () => mockSchoolData,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      const result = await schoolsService.getSchoolById('school123');

      expect(mockCollection).toHaveBeenCalledWith('schools');
      expect(mockDoc).toHaveBeenCalledWith('school123');
      expect(result).toBeDefined();
      expect(result?.schoolId).toBe('school123');
      expect(result?.name).toBe('Test School');
    });

    it('should return null for non-existent school', async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      const result = await schoolsService.getSchoolById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateSchool', () => {
    it('should update school fields', async () => {
      const updates = {
        name: 'Updated School Name',
        address: '456 New St',
      };

      // Mock get to check existence first time
      const mockSnapshotBefore = {
        exists: true,
        id: 'school123',
        data: () => ({
          name: 'Old Name',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      // Mock get to return updated data second time
      const mockSnapshotAfter = {
        exists: true,
        id: 'school123',
        data: () => ({
          name: 'Updated School Name',
          address: '456 New St',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGet
        .mockResolvedValueOnce(mockSnapshotBefore)
        .mockResolvedValueOnce(mockSnapshotAfter);

      const result = await schoolsService.updateSchool('school123', updates);

      expect(mockDoc).toHaveBeenCalledWith('school123');
      expect(mockSet).toHaveBeenCalled();

      const updatedData = mockSet.mock.calls[0][0];
      expect(updatedData.name).toBe(updates.name);
      expect(updatedData.address).toBe(updates.address);
      expect(updatedData.updatedAt).toBeDefined();

      expect(result.schoolId).toBe('school123');
      expect(result.name).toBe(updates.name);
    });

    it('should throw error for non-existent school', async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      await expect(
        schoolsService.updateSchool('nonexistent', { name: 'New Name' })
      ).rejects.toThrow('School not found');
    });
  });

  describe('deleteSchool', () => {
    it('should delete school successfully', async () => {
      const mockSnapshot = {
        exists: true,
        id: 'school123',
        data: () => ({
          name: 'Test School',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      // Mock school exists check
      mockGet.mockResolvedValueOnce(mockSnapshot);
      
      // Mock dependency checks (users, groups, notices) - all empty
      mockGet
        .mockResolvedValueOnce({ empty: true, docs: [] }) // users check
        .mockResolvedValueOnce({ empty: true, docs: [] }) // groups check
        .mockResolvedValueOnce({ empty: true, docs: [] }); // notices check

      mockDelete.mockResolvedValue(undefined);

      await schoolsService.deleteSchool('school123');

      expect(mockDoc).toHaveBeenCalledWith('school123');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error for non-existent school', async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      await expect(
        schoolsService.deleteSchool('nonexistent')
      ).rejects.toThrow('School not found');
    });

    it('should throw error if school has dependent users', async () => {
      const mockSnapshot = {
        exists: true,
        id: 'school123',
        data: () => ({
          name: 'Test School',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      // Mock school exists check
      mockGet.mockResolvedValueOnce(mockSnapshot);
      
      // Mock users dependency check - has users
      mockGet.mockResolvedValueOnce({ 
        empty: false, 
        docs: [{ id: 'user1' }] 
      });

      await expect(
        schoolsService.deleteSchool('school123')
      ).rejects.toThrow('Cannot delete school with existing users');
    });

    it('should throw error if school has dependent groups', async () => {
      const mockSnapshot = {
        exists: true,
        id: 'school123',
        data: () => ({
          name: 'Test School',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      // Mock school exists check
      mockGet.mockResolvedValueOnce(mockSnapshot);
      
      // Mock dependencies - no users, but has groups
      mockGet
        .mockResolvedValueOnce({ empty: true, docs: [] }) // users check
        .mockResolvedValueOnce({ 
          empty: false, 
          docs: [{ id: 'group1' }] 
        }); // groups check

      await expect(
        schoolsService.deleteSchool('school123')
      ).rejects.toThrow('Cannot delete school with existing groups');
    });

    it('should throw error if school has dependent notices', async () => {
      const mockSnapshot = {
        exists: true,
        id: 'school123',
        data: () => ({
          name: 'Test School',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      // Mock school exists check
      mockGet.mockResolvedValueOnce(mockSnapshot);
      
      // Mock dependencies - no users/groups, but has notices
      mockGet
        .mockResolvedValueOnce({ empty: true, docs: [] }) // users check
        .mockResolvedValueOnce({ empty: true, docs: [] }) // groups check
        .mockResolvedValueOnce({ 
          empty: false, 
          docs: [{ id: 'notice1' }] 
        }); // notices check

      await expect(
        schoolsService.deleteSchool('school123')
      ).rejects.toThrow('Cannot delete school with existing notices');
    });
  });

  describe('listSchools', () => {
    it('should return all schools', async () => {
      const mockSchools = [
        {
          id: 'school1',
          data: () => ({
            name: 'School 1',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'school2',
          data: () => ({
            name: 'School 2',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];

      mockOrderBy.mockReturnValue({
        get: mockGet,
      });

      mockGet.mockResolvedValue({
        docs: mockSchools,
      });

      const result = await schoolsService.listSchools();

      expect(mockCollection).toHaveBeenCalledWith('schools');
      expect(mockOrderBy).toHaveBeenCalledWith('name', 'asc');
      expect(result).toHaveLength(2);
      expect(result[0].schoolId).toBe('school1');
      expect(result[1].schoolId).toBe('school2');
    });

    it('should return empty array when no schools exist', async () => {
      mockOrderBy.mockReturnValue({
        get: mockGet,
      });

      mockGet.mockResolvedValue({
        docs: [],
      });

      const result = await schoolsService.listSchools();

      expect(result).toEqual([]);
    });
  });
});
