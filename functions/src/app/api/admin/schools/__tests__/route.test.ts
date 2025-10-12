/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getUserSession } from '@/lib/auth/session';
import {
  createSchoolHandler,
  listSchoolsHandler,
} from '@/lib/handlers/schools-handler';

jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/schools-handler');

describe('Admin Schools API Route', () => {
  let mockRequest: NextRequest;
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSession = {
      uid: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      schoolId: 'school999',
    };

    mockRequest = {
      json: jest.fn(),
      url: 'http://localhost:3000/api/admin/schools',
    } as any;

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/admin/schools', () => {
    it('should return schools list for admin', async () => {
      const mockSchools = [
        {
          schoolId: 'school1',
          name: 'School 1',
          address: 'Address 1',
          contactEmail: 'contact1@school.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          schoolId: 'school2',
          name: 'School 2',
          address: 'Address 2',
          contactEmail: 'contact2@school.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (listSchoolsHandler as jest.Mock).mockResolvedValue(mockSchools);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.schools).toEqual(
        mockSchools.map(school => ({
          ...school,
          createdAt: school.createdAt.toISOString(),
          updatedAt: school.updatedAt.toISOString(),
        }))
      );
      expect(listSchoolsHandler).toHaveBeenCalledWith(mockSession);
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 when not admin', async () => {
      (getUserSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        role: 'user',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should return 500 on server error', async () => {
      (listSchoolsHandler as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /api/admin/schools', () => {
    it('should create school for admin', async () => {
      const schoolData = {
        name: 'New School',
        address: '123 Main St',
        contactEmail: 'contact@school.com',
        contactPhone: '123-456-7890',
      };

      const createdSchool = {
        schoolId: 'school123',
        ...schoolData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(schoolData);
      (createSchoolHandler as jest.Mock).mockResolvedValue(createdSchool);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.school).toEqual({
        ...createdSchool,
        createdAt: createdSchool.createdAt.toISOString(),
        updatedAt: createdSchool.updatedAt.toISOString(),
      });
      expect(createSchoolHandler).toHaveBeenCalledWith(mockSession, schoolData);
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        name: 'New School',
        // missing address and contactEmail
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, address, and contactEmail are required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 when not admin', async () => {
      (getUserSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        role: 'user',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should return 500 on server error', async () => {
      const schoolData = {
        name: 'New School',
        address: '123 Main St',
        contactEmail: 'contact@school.com',
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(schoolData);
      (createSchoolHandler as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});