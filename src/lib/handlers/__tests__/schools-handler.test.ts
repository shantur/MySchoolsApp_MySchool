/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import {
  createSchoolHandler,
  getSchoolHandler,
  updateSchoolHandler,
  deleteSchoolHandler,
  listSchoolsHandler,
} from '../schools-handler';
import { SchoolsService } from '../../services/schools.service';
import type { UserSession } from '../../types';

jest.mock('../../services/schools.service');

describe('Schools Handler', () => {
  let mockSchoolsService: jest.Mocked<SchoolsService>;
  let adminSession: UserSession;
  let userSession: UserSession;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSchoolsService = new SchoolsService() as any;

    adminSession = {
      uid: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      schoolId: 'school999',
    };

    userSession = {
      uid: 'user123',
      email: 'user@example.com',
      role: 'user',
      schoolId: 'school123',
    };
  });

  describe('createSchoolHandler', () => {
    it('should create school when admin is authenticated', async () => {
      const schoolData = {
        name: 'New School',
        address: '123 Main St',
        contactEmail: 'contact@school.com',
      };

      const createdSchool = {
        schoolId: 'school123',
        ...schoolData,
        createdAt: {} as any,
        updatedAt: {} as any,
      };

      (mockSchoolsService.createSchool as jest.Mock)
        .mockResolvedValue(createdSchool);

      const result = await createSchoolHandler(
        adminSession,
        schoolData,
        mockSchoolsService
      );

      expect(mockSchoolsService.createSchool).toHaveBeenCalledWith(
        schoolData
      );
      expect(result).toEqual(createdSchool);
    });

    it('should throw error when non-admin tries to create', async () => {
      const schoolData = {
        name: 'New School',
      };

      await expect(
        createSchoolHandler(userSession, schoolData, mockSchoolsService)
      ).rejects.toThrow('Admin access required');

      expect(mockSchoolsService.createSchool).not.toHaveBeenCalled();
    });

    it('should throw error when not authenticated', async () => {
      const schoolData = {
        name: 'New School',
      };

      await expect(
        createSchoolHandler(null, schoolData, mockSchoolsService)
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('getSchoolHandler', () => {
    it('should get school when admin is authenticated', async () => {
      const school = {
        schoolId: 'school123',
        name: 'Test School',
        createdAt: {} as any,
        updatedAt: {} as any,
      };

      (mockSchoolsService.getSchoolById as jest.Mock)
        .mockResolvedValue(school);

      const result = await getSchoolHandler(
        adminSession,
        'school123',
        mockSchoolsService
      );

      expect(mockSchoolsService.getSchoolById).toHaveBeenCalledWith(
        'school123'
      );
      expect(result).toEqual(school);
    });

    it('should get school when user accesses their own school', async () => {
      const school = {
        schoolId: 'school123',
        name: 'Test School',
        createdAt: {} as any,
        updatedAt: {} as any,
      };

      (mockSchoolsService.getSchoolById as jest.Mock)
        .mockResolvedValue(school);

      const result = await getSchoolHandler(
        userSession,
        'school123',
        mockSchoolsService
      );

      expect(result).toEqual(school);
    });

    it('should deny user access to other schools', async () => {
      await expect(
        getSchoolHandler(userSession, 'school456', mockSchoolsService)
      ).rejects.toThrow('Access denied');

      expect(mockSchoolsService.getSchoolById).not.toHaveBeenCalled();
    });
  });

  describe('updateSchoolHandler', () => {
    it('should update school when admin is authenticated', async () => {
      const updates = {
        name: 'Updated School Name',
      };

      const updatedSchool = {
        schoolId: 'school123',
        name: 'Updated School Name',
        createdAt: {} as any,
        updatedAt: {} as any,
      };

      (mockSchoolsService.updateSchool as jest.Mock)
        .mockResolvedValue(updatedSchool);

      const result = await updateSchoolHandler(
        adminSession,
        'school123',
        updates,
        mockSchoolsService
      );

      expect(mockSchoolsService.updateSchool).toHaveBeenCalledWith(
        'school123',
        updates
      );
      expect(result).toEqual(updatedSchool);
    });

    it('should throw error when non-admin tries to update', async () => {
      await expect(
        updateSchoolHandler(
          userSession,
          'school123',
          { name: 'New Name' },
          mockSchoolsService
        )
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('deleteSchoolHandler', () => {
    it('should delete school when admin is authenticated', async () => {
      (mockSchoolsService.deleteSchool as jest.Mock)
        .mockResolvedValue(undefined);

      await deleteSchoolHandler(
        adminSession,
        'school123',
        mockSchoolsService
      );

      expect(mockSchoolsService.deleteSchool).toHaveBeenCalledWith(
        'school123'
      );
    });

    it('should throw error when non-admin tries to delete', async () => {
      await expect(
        deleteSchoolHandler(userSession, 'school123', mockSchoolsService)
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('listSchoolsHandler', () => {
    it('should list all schools when admin is authenticated', async () => {
      const schools = [
        {
          schoolId: 'school1',
          name: 'School 1',
          createdAt: {} as any,
          updatedAt: {} as any,
        },
        {
          schoolId: 'school2',
          name: 'School 2',
          createdAt: {} as any,
          updatedAt: {} as any,
        },
      ];

      (mockSchoolsService.listSchools as jest.Mock)
        .mockResolvedValue(schools);

      const result = await listSchoolsHandler(
        adminSession,
        mockSchoolsService
      );

      expect(mockSchoolsService.listSchools).toHaveBeenCalled();
      expect(result).toEqual(schools);
    });

    it('should list only user school when user is authenticated', async () => {
      const userSchool = {
        schoolId: 'school123',
        name: 'User School',
        createdAt: {} as any,
        updatedAt: {} as any,
      };

      (mockSchoolsService.getSchoolById as jest.Mock)
        .mockResolvedValue(userSchool);

      const result = await listSchoolsHandler(
        userSession,
        mockSchoolsService
      );

      expect(mockSchoolsService.getSchoolById).toHaveBeenCalledWith(
        'school123'
      );
      expect(result).toEqual([userSchool]);
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        listSchoolsHandler(null, mockSchoolsService)
      ).rejects.toThrow('Authentication required');
    });
  });
});
