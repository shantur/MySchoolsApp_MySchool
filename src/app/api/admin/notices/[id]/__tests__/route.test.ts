/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

// Import API route specific setup

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { getUserSession } from '@/lib/auth/session';
import {
  getNoticeHandler,
  updateNoticeHandler,
  deleteNoticeHandler,
} from '@/lib/handlers/notices-handler';

jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/notices-handler');

describe('Admin Notice by ID API Route', () => {
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
      url: 'http://localhost:3000/api/admin/notices/notice123?schoolId=school123',
    } as any;

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/admin/notices/[id]', () => {
    it('should return notice for admin', async () => {
      const mockNotice = {
        noticeId: 'notice123',
        title: 'Test Notice',
        body: 'Test body',
        schoolId: 'school123',
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (getNoticeHandler as jest.Mock).mockResolvedValue(mockNotice);

      const response = await GET(mockRequest, { params: { id: 'notice123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notice).toEqual({
        ...mockNotice,
        createdAt: mockNotice.createdAt.toISOString(),
        updatedAt: mockNotice.updatedAt.toISOString(),
      });
      expect(getNoticeHandler).toHaveBeenCalledWith(
        mockSession,
        'notice123',
        'school123'
      );
    });

    it('should return 404 when notice not found', async () => {
      (getNoticeHandler as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Notice not found');
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return 400 when notice ID is missing', async () => {
      const response = await GET(mockRequest, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Notice ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 when schoolId is missing', async () => {
      mockRequest.url = 'http://localhost:3000/api/admin/notices/notice123';

      const response = await GET(mockRequest, { params: { id: 'notice123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('School ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest, { params: { id: 'notice123' } });
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

      const response = await GET(mockRequest, { params: { id: 'notice123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });
  });

  describe('PUT /api/admin/notices/[id]', () => {
    it('should update notice for admin', async () => {
      const updateData = {
        title: 'Updated Notice',
        body: 'Updated body',
        status: 'published',
      };

      const updatedNotice = {
        noticeId: 'notice123',
        ...updateData,
        schoolId: 'school123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(updateData);
      (updateNoticeHandler as jest.Mock).mockResolvedValue(updatedNotice);

      const response = await PUT(mockRequest, { params: { id: 'notice123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notice).toEqual({
        ...updatedNotice,
        createdAt: updatedNotice.createdAt.toISOString(),
        updatedAt: updatedNotice.updatedAt.toISOString(),
      });
      expect(updateNoticeHandler).toHaveBeenCalledWith(
        mockSession,
        'notice123',
        updateData
      );
    });

    it('should return 400 when title or body is missing', async () => {
      const invalidData = {
        title: 'Updated Notice',
        // missing body
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);

      const response = await PUT(mockRequest, { params: { id: 'notice123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title and body are required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await PUT(mockRequest, { params: { id: 'notice123' } });
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

      const response = await PUT(mockRequest, { params: { id: 'notice123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /api/admin/notices/[id]', () => {
    it('should delete notice for admin', async () => {
      (deleteNoticeHandler as jest.Mock).mockResolvedValue(undefined);

      const response = await DELETE(mockRequest, { params: { id: 'notice123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Notice deleted successfully');
      expect(deleteNoticeHandler).toHaveBeenCalledWith(mockSession, 'notice123');
    });

    it('should return 400 when notice ID is missing', async () => {
      const response = await DELETE(mockRequest, { params: { id: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Notice ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(mockRequest, { params: { id: 'notice123' } });
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

      const response = await DELETE(mockRequest, { params: { id: 'notice123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should return 500 on server error', async () => {
      (deleteNoticeHandler as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await DELETE(mockRequest, { params: { id: 'notice123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});