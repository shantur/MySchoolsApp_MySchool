/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

// Import API route specific setup

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getUserSession } from '@/lib/auth/session';
import { listNoticesHandler } from '@/lib/handlers/notices-handler';

jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/notices-handler');

describe('User Notices API Route', () => {
  let mockRequest: NextRequest;
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSession = {
      uid: 'user123',
      email: 'user@example.com',
      role: 'user',
      schoolId: 'school123',
    };

    mockRequest = {
      json: jest.fn(),
      url: 'http://localhost:3000/api/notices',
    } as any;

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/notices', () => {
    it('should return notices list for user', async () => {
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
          schoolId: 'school123',
          status: 'published',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (listNoticesHandler as jest.Mock).mockResolvedValue(mockNotices);

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
      expect(listNoticesHandler).toHaveBeenCalledWith(
        mockSession,
        'school123',
        undefined
      );
    });

    it('should return notices list with status filter', async () => {
      mockRequest.url = 'http://localhost:3000/api/notices?status=published';

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
      ];

      (listNoticesHandler as jest.Mock).mockResolvedValue(mockNotices);

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
      expect(listNoticesHandler).toHaveBeenCalledWith(
        mockSession,
        'school123',
        'published'
      );
    });

    it('should return 401 when not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 on server error', async () => {
      (listNoticesHandler as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});