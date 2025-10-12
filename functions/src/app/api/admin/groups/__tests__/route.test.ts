/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

// Import API route specific setup

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getUserSession } from '@/lib/auth/session';
import {
  createGroupHandler,
  listGroupsHandler,
} from '@/lib/handlers/groups-handler';

jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/groups-handler');

describe('Admin Groups API Route', () => {
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
      url: 'http://localhost:3000/api/admin/groups?schoolId=school123',
    } as any;

    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/admin/groups', () => {
    it('should return groups list for admin', async () => {
      const mockGroups = [
        {
          groupId: 'group1',
          name: 'Group 1',
          description: 'Description 1',
          schoolId: 'school123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          groupId: 'group2',
          name: 'Group 2',
          description: 'Description 2',
          schoolId: 'school123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (listGroupsHandler as jest.Mock).mockResolvedValue(mockGroups);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.groups).toEqual(
        mockGroups.map(group => ({
          ...group,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
        }))
      );
      expect(listGroupsHandler).toHaveBeenCalledWith(mockSession, 'school123');
    });

    it('should return 400 when schoolId is missing', async () => {
      mockRequest.url = 'http://localhost:3000/api/admin/groups';

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('School ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
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
      (listGroupsHandler as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /api/admin/groups', () => {
    it('should create group for admin', async () => {
      const groupData = {
        name: 'New Group',
        description: 'Group description',
        schoolId: 'school123',
      };

      const createdGroup = {
        groupId: 'group123',
        ...groupData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(groupData);
      (createGroupHandler as jest.Mock).mockResolvedValue(createdGroup);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.group).toEqual({
        ...createdGroup,
        createdAt: createdGroup.createdAt.toISOString(),
        updatedAt: createdGroup.updatedAt.toISOString(),
      });
      expect(createGroupHandler).toHaveBeenCalledWith(mockSession, groupData);
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        name: 'New Group',
        // missing schoolId
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidData);

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name and schoolId are required');
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
      const groupData = {
        name: 'New Group',
        schoolId: 'school123',
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(groupData);
      (createGroupHandler as jest.Mock).mockRejectedValue(
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