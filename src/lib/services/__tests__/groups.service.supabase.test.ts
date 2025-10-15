/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Groups Service (Supabase) Test Suite
 * 
 * Tests the Supabase-based implementation of GroupsService following TDD principles.
 */

import { GroupsServiceSupabase } from '../groups.service.supabase';
import type { CreateGroupInput, UpdateGroupInput } from '../groups.service.supabase';
import { createServerClient } from '../../supabase/server';

// Mock Supabase server client
jest.mock('../../supabase/server', () => ({
  createServerClient: jest.fn(),
  __resetServerClientInstance: jest.fn(),
}));

const mockGroupData = {
  id: 'group-123',
  school_id: 'school-456',
  name: 'Test Group',
  description: 'Test Description',
  created_at: new Date('2025-10-15T09:00:00Z'),
  updated_at: new Date('2025-10-15T09:00:00Z'),
};

describe('GroupsServiceSupabase', () => {
  let service: GroupsServiceSupabase;
  let mockSupabaseClient: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSingle = jest.fn();
    mockLimit = jest.fn().mockReturnThis();
    mockOrder = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockReturnThis();
    mockDelete = jest.fn().mockReturnThis();
    mockUpdate = jest.fn().mockReturnThis();
    mockInsert = jest.fn().mockReturnThis();
    mockSelect = jest.fn().mockReturnThis();
    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    const mockSelectChain = {
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    };
    mockSelect.mockReturnValue(mockSelectChain);

    mockInsert.mockReturnValue({
      select: mockSelect,
      single: mockSingle,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    });

    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    const mockEqChain = {
      eq: mockEq,
      order: mockOrder,
      select: mockSelect,
      single: mockSingle,
    };
    mockEq.mockReturnValue(mockEqChain);

    mockOrder.mockReturnValue({
      limit: mockLimit,
      eq: mockEq,
    });

    mockSupabaseClient = {
      from: mockFrom,
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    service = new GroupsServiceSupabase();
  });

  describe('createGroup', () => {
    it('should create a group successfully', async () => {
      const input: CreateGroupInput = {
        schoolId: 'school-456',
        name: 'Test Group',
        description: 'Test Description',
      };

      mockSingle.mockResolvedValueOnce({
        data: mockGroupData,
        error: null,
      });

      const result = await service.createGroup(input);

      expect(result).toEqual(expect.objectContaining({
        groupId: 'group-123',
        name: 'Test Group',
        description: 'Test Description',
      }));
      expect(mockFrom).toHaveBeenCalledWith('groups');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should throw error if schoolId is missing', async () => {
      const input: CreateGroupInput = {
        schoolId: '',
        name: 'Test',
      };

      await expect(service.createGroup(input)).rejects.toThrow('School ID is required');
    });

    it('should throw error if name is missing', async () => {
      const input: CreateGroupInput = {
        schoolId: 'school-456',
        name: '',
      };

      await expect(service.createGroup(input)).rejects.toThrow('Group name is required');
    });
  });

  describe('getGroupById', () => {
    it('should return group if found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockGroupData,
        error: null,
      });

      const result = await service.getGroupById('group-123');

      expect(result).toEqual(expect.objectContaining({
        groupId: 'group-123',
        name: 'Test Group',
      }));
    });

    it('should return null if group not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.getGroupById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateGroup', () => {
    it('should update group successfully', async () => {
      const updates: UpdateGroupInput = {
        name: 'Updated Name',
      };

      mockSingle.mockResolvedValueOnce({
        data: mockGroupData,
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { ...mockGroupData, name: 'Updated Name' },
        error: null,
      });

      const result = await service.updateGroup('group-123', updates);

      expect(result.name).toBe('Updated Name');
    });

    it('should throw error if group not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.updateGroup('nonexistent', { name: 'New' }))
        .rejects.toThrow('Group not found');
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      const mockSelectToEqToSingle = {
        single: jest.fn().mockResolvedValueOnce({
          data: mockGroupData,
          error: null,
        }),
      };
      
      const mockSelectToEq = {
        single: mockSelectToEqToSingle.single,
        eq: jest.fn().mockReturnValue(mockSelectToEqToSingle),
      };
      
      mockSelect.mockReturnValueOnce(mockSelectToEq);

      const mockDeleteToEq = {
        eq: jest.fn().mockResolvedValueOnce({
          error: null,
        }),
      };
      mockDelete.mockReturnValueOnce(mockDeleteToEq);

      await service.deleteGroup('group-123');

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error if group not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.deleteGroup('nonexistent'))
        .rejects.toThrow('Group not found');
    });
  });

  describe('listGroupsBySchool', () => {
    it('should list groups for a school', async () => {
      mockOrder.mockReturnValue({
        limit: mockLimit.mockResolvedValueOnce({
          data: [mockGroupData],
          error: null,
        }),
      });

      const result = await service.listGroupsBySchool('school-456');

      expect(result).toHaveLength(1);
      expect(mockEq).toHaveBeenCalledWith('school_id', 'school-456');
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
    });
  });

  describe('listAllGroups', () => {
    it('should return all groups', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [mockGroupData],
        error: null,
      });

      const result = await service.listAllGroups();

      expect(result).toHaveLength(1);
      expect(mockFrom).toHaveBeenCalledWith('groups');
    });
  });
});
