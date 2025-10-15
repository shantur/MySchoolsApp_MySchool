/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Notices Service (Supabase) Test Suite
 * 
 * Tests the Supabase-based implementation of NoticesService following TDD principles.
 * Covers CRUD operations, validation, and query patterns for notices with PostgreSQL backend.
 */

import { NoticesServiceSupabase } from '../notices.service.supabase';
import type { CreateNoticeInput, UpdateNoticeInput } from '../notices.service.supabase';
import { createServerClient } from '../../supabase/server';

// Mock Supabase server client
jest.mock('../../supabase/server', () => ({
  createServerClient: jest.fn(),
  __resetServerClientInstance: jest.fn(),
}));

// Mock data
const mockNoticeData = {
  id: 'notice-123',
  school_id: 'school-456',
  group_id: 'group-789',
  title: 'Test Notice',
  body: 'This is a test notice body',
  status: 'published' as const,
  publication_date: new Date('2025-10-15T10:00:00Z'),
  attachments: [],
  sender_name: 'John Doe',
  created_at: new Date('2025-10-15T09:00:00Z'),
  updated_at: new Date('2025-10-15T09:00:00Z'),
};

const mockGroupData = {
  id: 'group-789',
  school_id: 'school-456',
  name: 'Test Group',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('NoticesServiceSupabase', () => {
  let service: NoticesServiceSupabase;
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
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock query chain
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

    // Chain methods properly
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

    // Create mock Supabase client
    mockSupabaseClient = {
      from: mockFrom,
    };

    // Mock createServerClient to return our mock client
    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    service = new NoticesServiceSupabase();
  });

  describe('createNotice', () => {
    it('should create a notice successfully', async () => {
      const input: CreateNoticeInput = {
        groupId: 'group-789',
        title: 'Test Notice',
        body: 'This is a test notice body',
        status: 'published',
        attachments: [],
        senderName: 'John Doe',
      };

      // Mock group lookup
      mockSingle.mockResolvedValueOnce({
        data: mockGroupData,
        error: null,
      });

      // Mock notice creation
      mockSingle.mockResolvedValueOnce({
        data: mockNoticeData,
        error: null,
      });

      const result = await service.createNotice(input);

      expect(result).toEqual(expect.objectContaining({
        noticeId: 'notice-123',
        title: 'Test Notice',
        body: 'This is a test notice body',
        status: 'published',
      }));
      expect(mockFrom).toHaveBeenCalledWith('groups');
      expect(mockFrom).toHaveBeenCalledWith('notices');
    });

    it('should throw error if groupId is missing', async () => {
      const input: CreateNoticeInput = {
        groupId: '',
        title: 'Test',
        body: 'Test body',
      };

      await expect(service.createNotice(input)).rejects.toThrow('Group ID is required');
    });

    it('should throw error if title is missing', async () => {
      const input: CreateNoticeInput = {
        groupId: 'group-789',
        title: '',
        body: 'Test body',
      };

      await expect(service.createNotice(input)).rejects.toThrow('Notice title is required');
    });

    it('should throw error if body is missing', async () => {
      const input: CreateNoticeInput = {
        groupId: 'group-789',
        title: 'Test',
        body: '',
      };

      await expect(service.createNotice(input)).rejects.toThrow('Notice body is required');
    });

    it('should throw error if group does not exist', async () => {
      const input: CreateNoticeInput = {
        groupId: 'nonexistent-group',
        title: 'Test',
        body: 'Test body',
      };

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Group not found' },
      });

      await expect(service.createNotice(input)).rejects.toThrow('Group nonexistent-group does not exist');
    });
  });

  describe('getNoticeById', () => {
    it('should return notice if found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockNoticeData,
        error: null,
      });

      const result = await service.getNoticeById('notice-123');

      expect(result).toEqual(expect.objectContaining({
        noticeId: 'notice-123',
        title: 'Test Notice',
      }));
      expect(mockFrom).toHaveBeenCalledWith('notices');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'notice-123');
    });

    it('should return null if notice not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });

      const result = await service.getNoticeById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listAllNotices', () => {
    it('should return all notices ordered by publication date', async () => {
      mockOrder.mockReturnValue({
        limit: mockLimit.mockResolvedValueOnce({
          data: [mockNoticeData],
          error: null,
        }),
      });

      const result = await service.listAllNotices();

      expect(result).toHaveLength(1);
      expect(result[0].noticeId).toBe('notice-123');
      expect(mockFrom).toHaveBeenCalledWith('notices');
      expect(mockOrder).toHaveBeenCalledWith('publication_date', { ascending: false });
    });
  });

  describe('updateNotice', () => {
    it('should update notice successfully', async () => {
      const updates: UpdateNoticeInput = {
        title: 'Updated Title',
        status: 'archived',
      };

      // Mock getNoticeById
      mockSingle.mockResolvedValueOnce({
        data: mockNoticeData,
        error: null,
      });

      // Mock update
      mockSingle.mockResolvedValueOnce({
        data: { ...mockNoticeData, title: 'Updated Title', status: 'archived' },
        error: null,
      });

      const result = await service.updateNotice('notice-123', updates);

      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe('archived');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'notice-123');
    });

    it('should throw error if notice not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.updateNotice('nonexistent', { title: 'New' }))
        .rejects.toThrow('Notice not found');
    });
  });

  describe('deleteNotice', () => {
    it('should delete notice successfully', async () => {
      // Create a mock chain for select -> eq -> single
      const mockSelectToEqToSingle = {
        single: jest.fn().mockResolvedValueOnce({
          data: mockNoticeData,
          error: null,
        }),
      };
      
      const mockSelectToEq = {
        single: mockSelectToEqToSingle.single,
        eq: jest.fn().mockReturnValue(mockSelectToEqToSingle),
      };
      
      mockSelect.mockReturnValueOnce(mockSelectToEq);

      // Mock delete -> eq chain
      const mockDeleteToEq = {
        eq: jest.fn().mockResolvedValueOnce({
          error: null,
        }),
      };
      mockDelete.mockReturnValueOnce(mockDeleteToEq);

      await service.deleteNotice('notice-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteToEq.eq).toHaveBeenCalledWith('id', 'notice-123');
    });

    it('should throw error if notice not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.deleteNotice('nonexistent'))
        .rejects.toThrow('Notice not found');
    });
  });

  describe('listNoticesBySchool', () => {
    it('should list notices for a school', async () => {
      mockOrder.mockReturnValue({
        limit: mockLimit.mockResolvedValueOnce({
          data: [mockNoticeData],
          error: null,
        }),
      });

      const result = await service.listNoticesBySchool('school-456');

      expect(result).toHaveLength(1);
      expect(mockEq).toHaveBeenCalledWith('school_id', 'school-456');
      expect(mockOrder).toHaveBeenCalledWith('publication_date', { ascending: false });
    });

    it('should filter by status if provided', async () => {
      mockOrder.mockReturnValue({
        limit: mockLimit.mockResolvedValueOnce({
          data: [mockNoticeData],
          error: null,
        }),
      });

      await service.listNoticesBySchool('school-456', 'published');

      expect(mockEq).toHaveBeenCalledWith('school_id', 'school-456');
      expect(mockEq).toHaveBeenCalledWith('status', 'published');
    });
  });

  describe('listNoticesByGroup', () => {
    it('should list notices for a group', async () => {
      mockOrder.mockReturnValue({
        limit: mockLimit.mockResolvedValueOnce({
          data: [mockNoticeData],
          error: null,
        }),
      });

      const result = await service.listNoticesByGroup('group-789');

      expect(result).toHaveLength(1);
      expect(mockEq).toHaveBeenCalledWith('group_id', 'group-789');
      expect(mockOrder).toHaveBeenCalledWith('publication_date', { ascending: false });
    });

    it('should filter by status if provided', async () => {
      mockOrder.mockReturnValue({
        limit: mockLimit.mockResolvedValueOnce({
          data: [mockNoticeData],
          error: null,
        }),
      });

      await service.listNoticesByGroup('group-789', 'draft');

      expect(mockEq).toHaveBeenCalledWith('group_id', 'group-789');
      expect(mockEq).toHaveBeenCalledWith('status', 'draft');
    });
  });
});
