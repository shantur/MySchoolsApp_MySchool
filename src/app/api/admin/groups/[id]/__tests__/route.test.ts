/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

// Import API route specific setup

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { getUserSession } from '@/lib/auth/session';
import {
  getGroupHandler,
  updateGroupHandler,
  deleteGroupHandler,
} from '@/lib/handlers/groups-handler';

jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/groups-handler');

describe('Admin Group by ID API Route', () => {
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
      url: 'http://localhost:3000/api/admin/groups/group123?schoolId=school123',
    } as any;

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/admin/groups/[id]', () => {
    it('should return group for admin', async () => {
      const mockGroup = {
        groupId: 'group123',
        name: 'Test Group',
        description: 'Test description',
        schoolId: 'school123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getGroupHandler as jest.Mock).mockResolvedValue(mockGroup);

      const response = await GET(mockRequest, { params: { id: 'group123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.group).toEqual({
        ...mockGroup,
        createdAt: mockGroup.createdAt.toISOString(),
        updatedAt: mockGroup.updatedAt.toISOString(),
      });
      expect(getGroupHandler).toHaveBeenCalledWith(
        mockSession,
        'group123',
        'school123'
      );
    });

    it('should return 404 when group not found', async () => {
      (getGroupHandler as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Group not found');
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return 400 when group ID is missing', async () => {
      const response = await GET(mockRequest, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Group ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 when schoolId is missing', async () => {
      mockRequest.url = 'http://localhost:3000/api/admin/groups/group123';

      const response = await GET(mockRequest, { params: { id: 'group123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('School ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, { params: { id: 'group123' } });
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

      const response = await GET(mockRequest, { params: { id: 'group123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });
  });

  describe('PUT /api/admin/groups/[id]', () => {
    it('should update group for admin', async () => {
      const updateData = {
        name: 'Updated Group',
        description: 'Updated description',
      };

      const updatedGroup = {
        groupId: 'group123',
        ...updateData,
        schoolId: 'school123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(updateData);
      (updateGroupHandler as jest.Mock).mockResolvedValue(updatedGroup);

      const response = await PUT(mockRequest, { params: { id: 'group123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.group).toEqual({
        ...updatedGroup,
        createdAt: updatedGroup.createdAt.toISOString(),
        updatedAt: updatedGroup.updatedAt.toISOString(),
      });
      expect(updateGroupHandler).toHaveBeenCalledWith(
        mockSession,
        'group123',
        updateData
      );
    });

    it('should return 400 when name is missing', async () => {
      const invalidData = {
        description: 'Updated description',
        // missing name
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);

      const response = await PUT(mockRequest, { params: { id: 'group123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await PUT(mockRequest, { params: { id: 'group123' } });
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

      const response = await PUT(mockRequest, { params: { id: 'group123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /api/admin/groups/[id]', () => {
    it('should delete group for admin', async () => {
      (deleteGroupHandler as jest.Mock).mockResolvedValue(undefined);

      const response = await DELETE(mockRequest, { params: { id: 'group123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Group deleted successfully');
      expect(deleteGroupHandler).toHaveBeenCalledWith(mockSession, 'group123');
    });

    it('should return 400 when group ID is missing', async () => {
      const response = await DELETE(mockRequest, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Group ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, { params: { id: 'group123' } });
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

      const response = await DELETE(mockRequest, { params: { id: 'group123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should return 500 on server error', async () => {
      (deleteGroupHandler as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await DELETE(mockRequest, { params: { id: 'group123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});