/**
 * Tests for /api/admin/users/[id] route
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { getUserSession } from '@/lib/auth/session';
import { getUserById, updateUserHandler, deleteUserHandler } from '@/lib/handlers/users-handler';

// Mock the dependencies
jest.mock('@/lib/auth/session');
jest.mock('@/lib/handlers/users-handler');

const mockGetUserSession = getUserSession as jest.MockedFunction<typeof getUserSession>;
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;
const mockUpdateUserHandler = updateUserHandler as jest.MockedFunction<typeof updateUserHandler>;
const mockDeleteUserHandler = deleteUserHandler as jest.MockedFunction<typeof deleteUserHandler>;

describe('/api/admin/users/[id] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/users/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication required');
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 if not admin', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school-a',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users/test-id');
      const response = await GET(request, { params: { id: 'test-id' } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Admin access required');
      expect(data.code).toBe('FORBIDDEN');
    });

    it('should return 400 if user ID is missing', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        schoolId: 'school-a',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users/');
      const response = await GET(request, { params: { id: '' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('User ID is required');
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 404 if user not found', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        schoolId: 'school-a',
      } as any);
      mockGetUserById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/users/nonexistent-id');
      const response = await GET(request, { params: { id: 'nonexistent-id' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
      expect(data.code).toBe('NOT_FOUND');
    });

    it('should return user data if found', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'user@example.com',
        schoolId: 'school-a',
        role: 'user',
        displayName: 'Test User',
        groupIds: ['group1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetUserSession.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        schoolId: 'school-a',
      } as any);
      mockGetUserById.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-123');
      const response = await GET(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUser);
    });
  });

  describe('PUT /api/admin/users/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/users/test-id', {
        method: 'PUT',
        body: JSON.stringify({
          email: 'test@example.com',
          schoolId: 'school-a',
          role: 'user',
        }),
      });
      const response = await PUT(request, { params: { id: 'test-id' } });

      expect(response.status).toBe(401);
    });

    it('should return 403 if not admin', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school-a',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users/test-id', {
        method: 'PUT',
        body: JSON.stringify({
          email: 'test@example.com',
          schoolId: 'school-a',
          role: 'user',
        }),
      });
      const response = await PUT(request, { params: { id: 'test-id' } });

      expect(response.status).toBe(403);
    });

    it('should return 400 if required fields are missing', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        schoolId: 'school-a',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users/test-id', {
        method: 'PUT',
        body: JSON.stringify({
          email: 'test@example.com',
          // missing schoolId and role
        }),
      });
      const response = await PUT(request, { params: { id: 'test-id' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Email, school ID, and role are required');
    });

    it('should update user successfully', async () => {
      const mockUpdatedUser = {
        uid: 'user-123',
        email: 'updated@example.com',
        schoolId: 'school-b',
        role: 'admin',
        displayName: 'Updated User',
        groupIds: ['group1', 'group2'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetUserSession.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        schoolId: 'school-a',
      } as any);
      mockUpdateUserHandler.mockResolvedValue(mockUpdatedUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-123', {
        method: 'PUT',
        body: JSON.stringify({
          email: 'updated@example.com',
          schoolId: 'school-b',
          role: 'admin',
          displayName: 'Updated User',
          groupIds: ['group1', 'group2'],
        }),
      });
      const response = await PUT(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUpdatedUser);
      expect(mockUpdateUserHandler).toHaveBeenCalledWith('user-123', {
        email: 'updated@example.com',
        schoolId: 'school-b',
        role: 'admin',
        displayName: 'Updated User',
        groupIds: ['group1', 'group2'],
      });
    });
  });

  describe('DELETE /api/admin/users/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetUserSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/users/test-id', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'test-id' } });

      expect(response.status).toBe(401);
    });

    it('should return 403 if not admin', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school-a',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users/test-id', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'test-id' } });

      expect(response.status).toBe(403);
    });

    it('should return 400 if trying to delete self', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        schoolId: 'school-a',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/admin/users/admin-123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'admin-123' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Cannot delete your own account');
      expect(data.code).toBe('CANNOT_DELETE_SELF');
    });

    it('should delete user successfully', async () => {
      mockGetUserSession.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        schoolId: 'school-a',
      } as any);
      mockDeleteUserHandler.mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-123', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: 'user-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('User deleted successfully');
      expect(mockDeleteUserHandler).toHaveBeenCalledWith('user-123');
    });
  });
});