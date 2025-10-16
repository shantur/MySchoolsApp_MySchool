/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Audit Service (Supabase) Test Suite
 */

import { AuditServiceSupabase, AuditAction } from '../audit.service';
import type { UserSession } from '../../types';
import { createServerClient } from '../../supabase/server';

jest.mock('../../supabase/server', () => ({
  createServerClient: jest.fn(),
}));

const mockSession: UserSession = {
  uid: 'user-123',
  email: 'test@example.com',
  schoolId: 'school-456',
  role: 'admin',
};

describe('AuditServiceSupabase', () => {
  let service: AuditServiceSupabase;
  let mockSupabaseClient: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSingle = jest.fn();
    mockLimit = jest.fn();
    mockOrder = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockReturnThis();
    mockInsert = jest.fn();
    mockSelect = jest.fn().mockReturnThis();
    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
    });

    const mockInsertSelectChain = {
      single: mockSingle,
    };
    
    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue(mockInsertSelectChain),
    });

    mockEq.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
    });

    mockOrder.mockReturnValue({
      limit: mockLimit,
    });

    mockSupabaseClient = {
      from: mockFrom,
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    service = new AuditServiceSupabase();
  });

  describe('logSchoolCreation', () => {
    it('should log school creation successfully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 'audit-1' },
        error: null,
      });

      const auditId = await service.logSchoolCreation(mockSession, {
        schoolId: 'school-new',
        name: 'New School',
      });

      expect(auditId).toBe('audit-1');
      expect(mockFrom).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('logSchoolUpdate', () => {
    it('should log school update successfully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 'audit-2' },
        error: null,
      });

      const auditId = await service.logSchoolUpdate(
        mockSession,
        'school-1',
        { name: 'Old Name' },
        { name: 'New Name' }
      );

      expect(auditId).toBe('audit-2');
    });
  });

  describe('logSchoolDeletion', () => {
    it('should log school deletion successfully', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 'audit-3' },
        error: null,
      });

      const auditId = await service.logSchoolDeletion(mockSession, {
        schoolId: 'school-1',
        name: 'Deleted School',
      });

      expect(auditId).toBe('audit-3');
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs for an entity', async () => {
      const mockAuditData = {
        id: 'audit-1',
        action: AuditAction.SCHOOL_CREATED,
        entity_type: 'school',
        entity_id: 'school-1',
        user_id: 'user-123',
        user_email: 'test@example.com',
        timestamp: new Date().toISOString(),
        changes: { name: 'Test School' },
      };

      mockLimit.mockResolvedValueOnce({
        data: [mockAuditData],
        error: null,
      });

      const logs = await service.getAuditLogs('school', 'school-1', 100);

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe(AuditAction.SCHOOL_CREATED);
      expect(mockEq).toHaveBeenCalledWith('entity_type', 'school');
      expect(mockEq).toHaveBeenCalledWith('entity_id', 'school-1');
    });

    it('should throw error if query fails', async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.getAuditLogs('school', 'school-1'))
        .rejects.toThrow('Failed to get audit logs');
    });
  });

  describe('getUserAuditLogs', () => {
    it('should retrieve audit logs for a user', async () => {
      const mockAuditData = {
        id: 'audit-1',
        action: AuditAction.SCHOOL_UPDATED,
        entity_type: 'school',
        entity_id: 'school-1',
        user_id: 'user-123',
        timestamp: new Date().toISOString(),
        changes: {},
      };

      mockLimit.mockResolvedValueOnce({
        data: [mockAuditData],
        error: null,
      });

      const logs = await service.getUserAuditLogs('user-123', 50);

      expect(logs).toHaveLength(1);
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('should throw error if query fails', async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.getUserAuditLogs('user-123'))
        .rejects.toThrow('Failed to get user audit logs');
    });
  });
});
