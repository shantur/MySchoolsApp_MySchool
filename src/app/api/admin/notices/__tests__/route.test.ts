/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

// Import API route specific setup

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getUserSession } from '@/lib/auth/session';
import { 
  createNoticeHandler,
  getAllNotices,
} from '@/lib/handlers/notices-handler';

jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/notices-handler');

describe('Admin Notices API Route', () => {
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
      url: 'http://localhost:3000/api/admin/notices',
    } as any;

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/admin/notices', () => {
    it('should return all notices for admin', async () => {
      const mockNotices = [
        {
          noticeId: 'notice1',
          title: 'Notice 1',
          body: 'Body 1',
          schoolId: 'school123',
          status: 'published',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          noticeId: 'notice2',
          title: 'Notice 2',
          body: 'Body 2',
          schoolId: 'school456',
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (getAllNotices as jest.Mock).mockResolvedValue(mockNotices);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notices).toEqual(
        mockNotices.map(notice => ({
          ...notice,
          createdAt: notice.createdAt.toISOString(),
          updatedAt: notice.updatedAt.toISOString(),
        }))
      );
      expect(getAllNotices).toHaveBeenCalledWith(mockSession);
    });

    it('should return 401 when user is not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('UNAUTHORIZED');
      expect(getAllNotices).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', async () => {
      (getUserSession as jest.Mock).mockResolvedValue({
        uid: 'user123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school123',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
      expect(getAllNotices).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const serviceError = new Error('Service unavailable');
      (getAllNotices as jest.Mock).mockRejectedValue(serviceError);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Service unavailable');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(getAllNotices).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('POST /api/admin/notices', () => {
    beforeEach(() => {
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/admin/notices',
      } as any;
    });

    it('should create notice successfully for admin', async () => {
      const noticeData = {
        title: 'Test Notice',
        body: 'Test body content',
        schoolId: 'school123',
        status: 'published',
      };

      const mockCreatedNotice = {
        noticeId: 'notice123',
        ...noticeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(noticeData);
      (createNoticeHandler as jest.Mock).mockResolvedValue({
        success: true,
        notice: mockCreatedNotice,
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.notice).toEqual({
        ...mockCreatedNotice,
        createdAt: mockCreatedNotice.createdAt.toISOString(),
        updatedAt: mockCreatedNotice.updatedAt.toISOString(),
      });
      expect(createNoticeHandler).toHaveBeenCalledWith(mockSession, noticeData);
    });

    it('should return 401 when user is not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('UNAUTHORIZED');
      expect(createNoticeHandler).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', async () => {
      (getUserSession as jest.Mock).mockResolvedValue({
        uid: 'user123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school123',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
      expect(createNoticeHandler).not.toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        title: 'Test Notice',
        // missing body and schoolId
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, body, and schoolId are required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
      expect(createNoticeHandler).not.toHaveBeenCalled();
    });

    it('should handle handler validation errors', async () => {
      const noticeData = {
        title: 'Test Notice',
        body: 'Test body content',
        schoolId: 'invalid-school-id',
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(noticeData);
      (createNoticeHandler as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          message: 'School not found',
          code: 'school_not_found',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('School not found');
      expect(data.code).toBe('SCHOOL_NOT_FOUND');
      expect(createNoticeHandler).toHaveBeenCalledWith(mockSession, noticeData);
    });

    it('should handle handler creation errors', async () => {
      const noticeData = {
        title: 'Test Notice',
        body: 'Test body content',
        schoolId: 'school123',
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(noticeData);
      (createNoticeHandler as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          message: 'Creation failed',
          code: 'creation_failed',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Creation failed');
      expect(data.code).toBe('CREATION_FAILED');
      expect(createNoticeHandler).toHaveBeenCalledWith(mockSession, noticeData);
    });

    it('should handle unexpected errors gracefully', async () => {
      const unexpectedError = new Error('Unexpected error');
      (mockRequest.json as jest.Mock).mockRejectedValue(unexpectedError);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});