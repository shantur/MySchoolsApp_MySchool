/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Notice Read Service (Supabase) Test Suite
 * 
 * Tests the Supabase-based implementation of notice read tracking.
 */

import {
  markNoticeAsRead,
  hasUserReadNotice,
  getUserReadNotices,
  getBulkReadStatus,
  deleteNoticeReads,
} from '../notice-read.service.supabase';
import { createServerClient } from '../../supabase/server';

// Mock Supabase server client
jest.mock('../../supabase/server', () => ({
  createServerClient: jest.fn(),
}));

describe('Notice Read Service (Supabase)', () => {
  let mockSupabaseClient: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockUpsert: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockIn: jest.Mock;
  let mockLimit: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSingle = jest.fn();
    mockLimit = jest.fn().mockReturnThis();
    mockIn = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockReturnThis();
    mockDelete = jest.fn().mockReturnValue({
      eq: mockEq,
    });
    mockUpsert = jest.fn().mockReturnThis();
    mockSelect = jest.fn().mockReturnThis();
    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
      delete: mockDelete,
    });

    const mockSelectChain = {
      eq: mockEq,
      in: mockIn,
      limit: mockLimit,
      single: mockSingle,
    };
    mockSelect.mockReturnValue(mockSelectChain);

    mockEq.mockReturnValue({
      eq: mockEq,
      in: mockIn,
      limit: mockLimit,
      single: mockSingle,
    });

    mockIn.mockReturnValue({
      limit: mockLimit,
    });

    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    });

    mockSupabaseClient = {
      from: mockFrom,
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('markNoticeAsRead', () => {
    it('should mark notice as read successfully', async () => {
      mockUpsert.mockResolvedValueOnce({
        error: null,
      });

      await markNoticeAsRead('user-1', 'notice-1', 'school-1', 'group-1');

      expect(mockFrom).toHaveBeenCalledWith('notice_reads');
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('should throw error if upsert fails', async () => {
      mockUpsert.mockResolvedValueOnce({
        error: { message: 'Database error' },
      });

      await expect(
        markNoticeAsRead('user-1', 'notice-1', 'school-1', 'group-1')
      ).rejects.toThrow('Failed to mark notice as read');
    });
  });

  describe('hasUserReadNotice', () => {
    it('should return true if user has read notice', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 'read-1' },
        error: null,
      });

      const result = await hasUserReadNotice('user-1', 'notice-1');

      expect(result).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockEq).toHaveBeenCalledWith('notice_id', 'notice-1');
    });

    it('should return false if user has not read notice', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await hasUserReadNotice('user-1', 'notice-1');

      expect(result).toBe(false);
    });

    it('should throw error for non-not-found errors', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      await expect(hasUserReadNotice('user-1', 'notice-1'))
        .rejects.toThrow('Failed to check read status');
    });
  });

  describe('getUserReadNotices', () => {
    it('should return list of read notice IDs', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [
          { notice_id: 'notice-1' },
          { notice_id: 'notice-2' },
        ],
        error: null,
      });

      const result = await getUserReadNotices('user-1');

      expect(result).toEqual(['notice-1', 'notice-2']);
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should filter by school if provided', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [{ notice_id: 'notice-1' }],
        error: null,
      });

      await getUserReadNotices('user-1', 'school-1');

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockEq).toHaveBeenCalledWith('school_id', 'school-1');
    });

    it('should throw error if query fails', async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(getUserReadNotices('user-1'))
        .rejects.toThrow('Failed to get user read notices');
    });
  });

  describe('getBulkReadStatus', () => {
    it('should return empty object for empty input', async () => {
      const result = await getBulkReadStatus('user-1', []);

      expect(result).toEqual({});
    });

    it('should return read status for multiple notices', async () => {
      mockIn.mockResolvedValueOnce({
        data: [
          { notice_id: 'notice-1' },
          { notice_id: 'notice-3' },
        ],
        error: null,
      });

      const result = await getBulkReadStatus('user-1', [
        'notice-1',
        'notice-2',
        'notice-3',
      ]);

      expect(result).toEqual({
        'notice-1': true,
        'notice-2': false,
        'notice-3': true,
      });
      expect(mockIn).toHaveBeenCalledWith('notice_id', [
        'notice-1',
        'notice-2',
        'notice-3',
      ]);
    });

    it('should throw error if query fails', async () => {
      mockIn.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(getBulkReadStatus('user-1', ['notice-1']))
        .rejects.toThrow('Failed to get bulk read status');
    });
  });

  describe('deleteNoticeReads', () => {
    it('should delete all reads for a notice', async () => {
      // Mock count query
      const mockSelectWithCount = {
        eq: jest.fn().mockResolvedValueOnce({
          data: [{ id: '1' }, { id: '2' }],
          error: null,
        }),
      };
      mockSelect.mockReturnValueOnce(mockSelectWithCount);

      // Mock delete operation
      mockEq.mockResolvedValueOnce({
        error: null,
      });

      const count = await deleteNoticeReads('notice-1');

      expect(count).toBe(2);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return 0 if no reads exist', async () => {
      const mockSelectWithCount = {
        eq: jest.fn().mockResolvedValueOnce({
          data: [],
          error: null,
        }),
      };
      mockSelect.mockReturnValueOnce(mockSelectWithCount);

      const count = await deleteNoticeReads('notice-1');

      expect(count).toBe(0);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should throw error if count query fails', async () => {
      const mockSelectWithCount = {
        eq: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      mockSelect.mockReturnValueOnce(mockSelectWithCount);

      await expect(deleteNoticeReads('notice-1'))
        .rejects.toThrow('Failed to count notice reads');
    });

    it('should throw error if delete fails', async () => {
      const mockSelectWithCount = {
        eq: jest.fn().mockResolvedValueOnce({
          data: [{ id: '1' }],
          error: null,
        }),
      };
      mockSelect.mockReturnValueOnce(mockSelectWithCount);

      mockEq.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      await expect(deleteNoticeReads('notice-1'))
        .rejects.toThrow('Failed to delete notice reads');
    });
  });
});
