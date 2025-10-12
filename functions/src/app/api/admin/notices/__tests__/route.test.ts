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
import type { UserSession } from '@/lib/types';

jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/notices-handler');

const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;
const mockCreateNoticeHandler = createNoticeHandler as jest.MockedFunction<typeof createNoticeHandler>;
const mockGetAllNotices = getAllNotices as jest.MockedFunction<typeof getAllNotices>;

describe('Admin Notices API Route', () => {
  let mockRequest: NextRequest;
  let mockSession: UserSession;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSession = {
      uid: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      schoolId: 'school999',
      groupIds: ['group1', 'group2'],
    };

    mockRequest = {
      json: jest.fn(),
      url: 'http://localhost:3000/api/admin/notices',
    } as unknown as NextRequest;

    mockGetUserSession.mockResolvedValue(mockSession);
  });

  describe('GET /api/admin/notices', () => {
    it('should return all notices for admin', async () => {
      const mockNotices = [
        {
          noticeId: 'notice1',
          title: 'Notice 1',
          body: 'Body 1',
          schoolId: 'school123',
          groupId: 'group1',
          status: 'published' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          publicationDate: new Date(),
        },
        {
          noticeId: 'notice2',
          title: 'Notice 2',
          body: 'Body 2',
          schoolId: 'school456',
          groupId: 'group2',
          status: 'draft' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          publicationDate: new Date(),
        },
      ];

      mockGetAllNotices.mockResolvedValue(mockNotices);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notices).toEqual(
        mockNotices.map(notice => ({
          ...notice,
          createdAt: notice.createdAt.toISOString(),
          updatedAt: notice.updatedAt.toISOString(),
          publicationDate: notice.publicationDate.toISOString(),
        }))
      );
      expect(mockGetAllNotices).toHaveBeenCalledWith(mockSession);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('UNAUTHORIZED');
      expect(mockGetAllNotices).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'user123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school123',
        groupIds: ['group1'],
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
      expect(mockGetAllNotices).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const serviceError = new Error('Service unavailable');
      mockGetAllNotices.mockRejectedValue(serviceError);

      // The GET handler doesn't have try-catch, so errors are thrown
      await expect(GET(mockRequest)).rejects.toThrow('Service unavailable');
      expect(mockGetAllNotices).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('POST /api/admin/notices', () => {
    beforeEach(() => {
      mockRequest = {
        json: jest.fn(),
        url: 'http://localhost:3000/api/admin/notices',
      } as unknown as NextRequest;
    });

    it('should create notice successfully for admin', async () => {
      const noticeData = {
        title: 'Test Notice',
        body: 'Test body content',
        groupId: 'group123',
        status: 'published' as const,
      };

      const mockCreatedNotice = {
        noticeId: 'notice123',
        ...noticeData,
        schoolId: 'school123',
        publicationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(noticeData);
      mockCreateNoticeHandler.mockResolvedValue({
        success: true,
        notice: mockCreatedNotice,
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.notice).toEqual({
        ...mockCreatedNotice,
        publicationDate: mockCreatedNotice.publicationDate.toISOString(),
        createdAt: mockCreatedNotice.createdAt.toISOString(),
        updatedAt: mockCreatedNotice.updatedAt.toISOString(),
      });
      expect(mockCreateNoticeHandler).toHaveBeenCalledWith(mockSession, noticeData);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('UNAUTHORIZED');
      expect(mockCreateNoticeHandler).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'user123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school123',
        groupIds: ['group1'],
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
      expect(mockCreateNoticeHandler).not.toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        title: 'Test Notice',
        // missing body and groupId
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, body, and groupId are required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
      expect(mockCreateNoticeHandler).not.toHaveBeenCalled();
    });

    it('should return 400 when groupId is missing', async () => {
      const invalidData = {
        title: 'Test Notice',
        body: 'Test body content',
        // missing groupId
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, body, and groupId are required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
      expect(mockCreateNoticeHandler).not.toHaveBeenCalled();
    });

    it('should handle handler validation errors for non-existent group', async () => {
      const noticeData = {
        title: 'Test Notice',
        body: 'Test body content',
        groupId: 'invalid-group-id',
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(noticeData);
      mockCreateNoticeHandler.mockResolvedValue({
        success: false,
        error: {
          message: 'Group invalid-group-id does not exist',
          code: 'creation_failed',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Group invalid-group-id does not exist');
      expect(data.code).toBe('creation_failed');
      expect(mockCreateNoticeHandler).toHaveBeenCalledWith(mockSession, noticeData);
    });

    it('should handle handler validation errors for group without schoolId', async () => {
      const noticeData = {
        title: 'Test Notice',
        body: 'Test body content',
        groupId: 'group-without-school',
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(noticeData);
      mockCreateNoticeHandler.mockResolvedValue({
        success: false,
        error: {
          message: 'Group group-without-school does not have a valid schoolId',
          code: 'creation_failed',
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Group group-without-school does not have a valid schoolId');
      expect(data.code).toBe('creation_failed');
      expect(mockCreateNoticeHandler).toHaveBeenCalledWith(mockSession, noticeData);
    });

    it('should handle handler creation errors', async () => {
      const noticeData = {
        title: 'Test Notice',
        body: 'Test body content',
        groupId: 'group123',
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(noticeData);
      mockCreateNoticeHandler.mockResolvedValue({
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
      expect(data.code).toBe('creation_failed');
      expect(mockCreateNoticeHandler).toHaveBeenCalledWith(mockSession, noticeData);
    });

    it('should handle unexpected errors gracefully', async () => {
      const unexpectedError = new Error('Unexpected error');
      (mockRequest.json as jest.Mock).mockRejectedValue(unexpectedError);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unexpected error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});