/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

// Import API route specific setup

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { getUserSession } from '@/lib/auth/session';
import {
  getSchoolHandler,
  updateSchoolHandler,
  deleteSchoolHandler,
} from '@/lib/handlers/schools-handler';

jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/schools-handler');

describe('Admin School by ID API Route', () => {
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
      url: 'http://localhost:3000/api/admin/schools/school123',
    } as any;

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/admin/schools/[id]', () => {
    it('should return school for admin', async () => {
      const mockSchool = {
        schoolId: 'school123',
        name: 'Test School',
        address: '123 Main St',
        contactEmail: 'contact@school.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getSchoolHandler as jest.Mock).mockResolvedValue(mockSchool);

      const response = await GET(mockRequest, { params: { id: 'school123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.school).toEqual({
        ...mockSchool,
        createdAt: mockSchool.createdAt.toISOString(),
        updatedAt: mockSchool.updatedAt.toISOString(),
      });
      expect(getSchoolHandler).toHaveBeenCalledWith(mockSession, 'school123');
    });

    it('should return 404 when school not found', async () => {
      (getSchoolHandler as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('School not found');
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return 400 when school ID is missing', async () => {
      const response = await GET(mockRequest, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('School ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, { params: { id: 'school123' } });
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

      const response = await GET(mockRequest, { params: { id: 'school123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });
  });

  describe('PUT /api/admin/schools/[id]', () => {
    it('should update school for admin', async () => {
      const updateData = {
        name: 'Updated School',
        address: '456 New St',
        contactEmail: 'updated@school.com',
        contactPhone: '987-654-3210',
      };

      const updatedSchool = {
        schoolId: 'school123',
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(updateData);
      (updateSchoolHandler as jest.Mock).mockResolvedValue(updatedSchool);

      const response = await PUT(mockRequest, { params: { id: 'school123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.school).toEqual({
        ...updatedSchool,
        createdAt: updatedSchool.createdAt.toISOString(),
        updatedAt: updatedSchool.updatedAt.toISOString(),
      });
      expect(updateSchoolHandler).toHaveBeenCalledWith(
        mockSession,
        'school123',
        updateData
      );
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        name: 'Updated School',
        // missing address and contactEmail
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);

      const response = await PUT(mockRequest, { params: { id: 'school123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, address, and contactEmail are required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await PUT(mockRequest, { params: { id: 'school123' } });
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

      const response = await PUT(mockRequest, { params: { id: 'school123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /api/admin/schools/[id]', () => {
    it('should delete school for admin', async () => {
      (deleteSchoolHandler as jest.Mock).mockResolvedValue(undefined);

      const response = await DELETE(mockRequest, { params: { id: 'school123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('School deleted successfully');
      expect(deleteSchoolHandler).toHaveBeenCalledWith(mockSession, 'school123');
    });

    it('should return 400 when school ID is missing', async () => {
      const response = await DELETE(mockRequest, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('School ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, { params: { id: 'school123' } });
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

      const response = await DELETE(mockRequest, { params: { id: 'school123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should return 500 on server error', async () => {
      (deleteSchoolHandler as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await DELETE(mockRequest, { params: { id: 'school123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});