/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Schools Service (Supabase) Test Suite
 * 
 * Tests the Supabase-based implementation of SchoolsService.
 */

import { SchoolsServiceSupabase, ValidationError } from '../schools.service.supabase';
import type { CreateSchoolInput, UpdateSchoolInput } from '../schools.service.supabase';
import { createServerClient } from '../../supabase/server';

// Mock Supabase server client
jest.mock('../../supabase/server', () => ({
  createServerClient: jest.fn(),
  __resetServerClientInstance: jest.fn(),
}));

const mockSchoolData = {
  id: 'school-123',
  name: 'Test School',
  address: '123 Main St',
  contact_email: 'test@school.com',
  contact_phone: '555-1234',
  created_at: new Date('2025-10-15T09:00:00Z'),
  updated_at: new Date('2025-10-15T09:00:00Z'),
};

describe('SchoolsServiceSupabase', () => {
  let service: SchoolsServiceSupabase;
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

    service = new SchoolsServiceSupabase();
  });

  describe('createSchool', () => {
    it('should create a school successfully', async () => {
      const input: CreateSchoolInput = {
        name: 'Test School',
        address: '123 Main St',
        contactEmail: 'test@school.com',
        contactPhone: '555-1234',
      };

      mockSingle.mockResolvedValueOnce({
        data: mockSchoolData,
        error: null,
      });

      const result = await service.createSchool(input);

      expect(result).toEqual(expect.objectContaining({
        schoolId: 'school-123',
        name: 'Test School',
      }));
    });

    it('should throw ValidationError if name is missing', async () => {
      const input: CreateSchoolInput = {
        name: '',
      };

      await expect(service.createSchool(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email', async () => {
      const input: CreateSchoolInput = {
        name: 'Test School',
        contactEmail: 'invalid-email',
      };

      await expect(service.createSchool(input)).rejects.toThrow(ValidationError);
    });
  });

  describe('getSchoolById', () => {
    it('should return school if found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: mockSchoolData,
        error: null,
      });

      const result = await service.getSchoolById('school-123');

      expect(result).toEqual(expect.objectContaining({
        schoolId: 'school-123',
        name: 'Test School',
      }));
    });

    it('should return null if school not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.getSchoolById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateSchool', () => {
    it('should update school successfully', async () => {
      const updates: UpdateSchoolInput = {
        name: 'Updated Name',
      };

      mockSingle.mockResolvedValueOnce({
        data: mockSchoolData,
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { ...mockSchoolData, name: 'Updated Name' },
        error: null,
      });

      const result = await service.updateSchool('school-123', updates);

      expect(result.name).toBe('Updated Name');
    });

    it('should throw ValidationError if school not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.updateSchool('nonexistent', { name: 'New' }))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteSchool', () => {
    it('should throw ValidationError if school not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.deleteSchool('nonexistent'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if dependencies exist', async () => {
      // Mock getSchoolById with proper chain
      const mockGetByIdChain = {
        single: jest.fn().mockResolvedValueOnce({
          data: mockSchoolData,
          error: null,
        }),
      };
      const mockGetByIdEq = {
        single: mockGetByIdChain.single,
        eq: jest.fn().mockReturnValue(mockGetByIdChain),
      };
      mockSelect.mockReturnValueOnce(mockGetByIdEq);

      // Mock dependency check - users exist
      const mockUsersLimitChain = {
        limit: jest.fn().mockResolvedValueOnce({
          data: [{ id: 'user-1' }],
          error: null,
        }),
      };
      const mockUsersEqChain = {
        eq: jest.fn().mockReturnValue(mockUsersLimitChain),
        limit: mockUsersLimitChain.limit,
      };
      mockSelect.mockReturnValueOnce(mockUsersEqChain);

      await expect(service.deleteSchool('school-123'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('listSchools', () => {
    it('should return all schools ordered by name', async () => {
      mockOrder.mockReturnValue({
        limit: mockLimit.mockResolvedValueOnce({
          data: [mockSchoolData],
          error: null,
        }),
      });

      const result = await service.listSchools();

      expect(result).toHaveLength(1);
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
    });
  });
});
