/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import { AuditService } from '../audit.service';
import type { UserSession } from '../../types';

// Mock Firebase Admin
jest.mock('../../firebase/admin-lazy', () => ({
  getAdminDb: jest.fn(() => ({
    collection: jest.fn(),
  })),
}));

import { getAdminDb } from '../../firebase/admin-lazy';

describe('AuditService', () => {
  let auditService: AuditService;
  let mockCollection: any;
  let mockAdd: any;
  let mockQuery: any;
  let mockGet: any;
  let adminSession: UserSession;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAdd = jest.fn();
    mockGet = jest.fn();
    mockQuery = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: mockGet,
    };

    mockCollection = jest.fn(() => ({
      add: mockAdd,
      where: mockQuery.where,
      orderBy: mockQuery.orderBy,
      limit: mockQuery.limit,
      get: mockGet,
    }));

    (getAdminDb as jest.Mock).mockReturnValue({
      collection: mockCollection,
    });

    auditService = new AuditService();

    adminSession = {
      uid: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      schoolId: 'school999',
    };
  });

  describe('logSchoolCreation', () => {
    it('should log school creation with all details', async () => {
      const schoolData = {
        schoolId: 'school123',
        name: 'Test School',
        address: '123 Main St',
        contactEmail: 'admin@school.com',
      };

      mockAdd.mockResolvedValue({ id: 'audit123' });

      await auditService.logSchoolCreation(adminSession, schoolData);

      expect(mockCollection).toHaveBeenCalledWith('audit_logs');
      expect(mockAdd).toHaveBeenCalled();

      const logEntry = mockAdd.mock.calls[0][0];
      expect(logEntry.action).toBe('SCHOOL_CREATED');
      expect(logEntry.entityType).toBe('school');
      expect(logEntry.entityId).toBe('school123');
      expect(logEntry.userId).toBe('admin123');
      expect(logEntry.userEmail).toBe('admin@example.com');
      expect(logEntry.changes).toEqual(schoolData);
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should handle missing optional user data', async () => {
      const sessionWithoutEmail = {
        uid: 'admin123',
        role: 'admin' as const,
        schoolId: 'school999',
      };

      const schoolData = {
        schoolId: 'school123',
        name: 'Test School',
      };

      mockAdd.mockResolvedValue({ id: 'audit123' });

      await auditService.logSchoolCreation(
        sessionWithoutEmail as any,
        schoolData
      );

      const logEntry = mockAdd.mock.calls[0][0];
      expect(logEntry.userEmail).toBeUndefined();
    });
  });

  describe('logSchoolUpdate', () => {
    it('should log school update with before and after data', async () => {
      const schoolId = 'school123';
      const beforeData = {
        name: 'Old School Name',
        address: '123 Old St',
      };
      const afterData = {
        name: 'New School Name',
        address: '456 New Ave',
      };

      mockAdd.mockResolvedValue({ id: 'audit124' });

      await auditService.logSchoolUpdate(
        adminSession,
        schoolId,
        beforeData,
        afterData
      );

      expect(mockAdd).toHaveBeenCalled();

      const logEntry = mockAdd.mock.calls[0][0];
      expect(logEntry.action).toBe('SCHOOL_UPDATED');
      expect(logEntry.entityId).toBe('school123');
      expect(logEntry.changes).toEqual({
        before: beforeData,
        after: afterData,
      });
    });

    it('should only log changed fields', async () => {
      const schoolId = 'school123';
      const beforeData = {
        name: 'School Name',
        address: '123 St',
        contactEmail: 'old@school.com',
      };
      const afterData = {
        name: 'School Name',
        address: '123 St',
        contactEmail: 'new@school.com',
      };

      mockAdd.mockResolvedValue({ id: 'audit125' });

      await auditService.logSchoolUpdate(
        adminSession,
        schoolId,
        beforeData,
        afterData
      );

      const logEntry = mockAdd.mock.calls[0][0];
      expect(logEntry.changes.before.contactEmail).toBe('old@school.com');
      expect(logEntry.changes.after.contactEmail).toBe('new@school.com');
    });
  });

  describe('logSchoolDeletion', () => {
    it('should log school deletion with school data', async () => {
      const schoolData = {
        schoolId: 'school123',
        name: 'Deleted School',
        address: '123 Main St',
      };

      mockAdd.mockResolvedValue({ id: 'audit126' });

      await auditService.logSchoolDeletion(adminSession, schoolData);

      expect(mockAdd).toHaveBeenCalled();

      const logEntry = mockAdd.mock.calls[0][0];
      expect(logEntry.action).toBe('SCHOOL_DELETED');
      expect(logEntry.entityId).toBe('school123');
      expect(logEntry.changes).toEqual(schoolData);
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs for a specific entity', async () => {
      const mockLogs = [
        {
          id: 'log1',
          data: () => ({
            action: 'SCHOOL_CREATED',
            entityId: 'school123',
            timestamp: { toDate: () => new Date() },
          }),
        },
        {
          id: 'log2',
          data: () => ({
            action: 'SCHOOL_UPDATED',
            entityId: 'school123',
            timestamp: { toDate: () => new Date() },
          }),
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockLogs,
      });

      const result = await auditService.getAuditLogs('school', 'school123');

      expect(mockQuery.where).toHaveBeenCalledWith('entityType', '==', 'school');
      expect(mockQuery.where).toHaveBeenCalledWith('entityId', '==', 'school123');
      expect(mockQuery.orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(result).toHaveLength(2);
    });

    it('should limit number of results', async () => {
      mockGet.mockResolvedValue({ docs: [] });

      await auditService.getAuditLogs('school', 'school123', 50);

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });

    it('should use default limit of 100', async () => {
      mockGet.mockResolvedValue({ docs: [] });

      await auditService.getAuditLogs('school', 'school123');

      expect(mockQuery.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('getUserAuditLogs', () => {
    it('should retrieve audit logs for a specific user', async () => {
      const mockLogs = [
        {
          id: 'log1',
          data: () => ({
            userId: 'admin123',
            action: 'SCHOOL_CREATED',
            timestamp: { toDate: () => new Date() },
          }),
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockLogs,
      });

      const result = await auditService.getUserAuditLogs('admin123');

      expect(mockQuery.where).toHaveBeenCalledWith('userId', '==', 'admin123');
      expect(mockQuery.orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(result).toHaveLength(1);
    });
  });
});
