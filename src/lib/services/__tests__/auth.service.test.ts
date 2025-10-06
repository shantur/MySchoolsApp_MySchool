/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Authentication Service Tests
 * 
 * Tests for Firebase Auth integration and user authentication
 */

import { 
  authenticateUser, 
  createUserAccount, 
  setUserRole 
} from '../auth.service';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// Mock Firebase Admin SDK
jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
  },
  adminDb: {
    collection: jest.fn(),
  },
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should authenticate a valid user and return session data', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
        customClaims: { role: 'user' },
      };

      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'user-123',
          email: 'test@example.com',
          schoolId: 'school-abc',
          role: 'user',
          displayName: 'Test User',
        }),
      };

      (adminAuth.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockUserDoc),
        }),
      });

      const session = await authenticateUser('test@example.com', 'password');

      expect(session).toBeDefined();
      expect(session?.uid).toBe('user-123');
      expect(session?.email).toBe('test@example.com');
      expect(session?.schoolId).toBe('school-abc');
      expect(session?.role).toBe('user');
    });

    it('should authenticate an admin user', async () => {
      const mockAdmin = {
        uid: 'admin-123',
        email: 'admin@example.com',
        customClaims: { role: 'admin' },
      };

      const mockAdminDoc = {
        exists: true,
        data: () => ({
          uid: 'admin-123',
          email: 'admin@example.com',
          schoolId: 'school-admin',
          role: 'admin',
          displayName: 'Admin User',
        }),
      };

      (adminAuth.getUserByEmail as jest.Mock).mockResolvedValue(mockAdmin);
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockAdminDoc),
        }),
      });

      const session = await authenticateUser(
        'admin@example.com', 
        'password'
      );

      expect(session).toBeDefined();
      expect(session?.role).toBe('admin');
    });

    it('should return null for non-existent user', async () => {
      (adminAuth.getUserByEmail as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      const session = await authenticateUser(
        'nonexistent@example.com', 
        'password'
      );

      expect(session).toBeNull();
    });

    it('should return null if user document does not exist', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
        customClaims: { role: 'user' },
      };

      const mockUserDoc = {
        exists: false,
        data: () => null,
      };

      (adminAuth.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockUserDoc),
        }),
      });

      const session = await authenticateUser('test@example.com', 'password');

      expect(session).toBeNull();
    });
  });

  describe('createUserAccount', () => {
    it('should create a new user account with role', async () => {
      const mockUserRecord = {
        uid: 'new-user-123',
        email: 'newuser@example.com',
      };

      const mockDocRef = {
        set: jest.fn().mockResolvedValue(undefined),
      };

      (adminAuth.createUser as jest.Mock).mockResolvedValue(mockUserRecord);
      (adminAuth.setCustomUserClaims as jest.Mock).mockResolvedValue(
        undefined
      );
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      const result = await createUserAccount({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        schoolId: 'school-abc',
        role: 'user',
        displayName: 'New User',
      });

      expect(result).toBeDefined();
      expect(result.uid).toBe('new-user-123');
      expect(result.email).toBe('newuser@example.com');

      expect(adminAuth.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        displayName: 'New User',
      });

      expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith(
        'new-user-123',
        { role: 'user' }
      );

      expect(mockDocRef.set).toHaveBeenCalled();
    });

    it('should create an admin account', async () => {
      const mockAdminRecord = {
        uid: 'new-admin-123',
        email: 'newadmin@example.com',
      };

      const mockDocRef = {
        set: jest.fn().mockResolvedValue(undefined),
      };

      (adminAuth.createUser as jest.Mock).mockResolvedValue(mockAdminRecord);
      (adminAuth.setCustomUserClaims as jest.Mock).mockResolvedValue(
        undefined
      );
      (adminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      const result = await createUserAccount({
        email: 'newadmin@example.com',
        password: 'AdminPass123!',
        schoolId: 'school-admin',
        role: 'admin',
        displayName: 'New Admin',
      });

      expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith(
        'new-admin-123',
        { role: 'admin' }
      );
    });

    it('should throw error if user creation fails', async () => {
      (adminAuth.createUser as jest.Mock).mockRejectedValue(
        new Error('Email already exists')
      );

      await expect(
        createUserAccount({
          email: 'existing@example.com',
          password: 'password',
          schoolId: 'school-abc',
          role: 'user',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('setUserRole', () => {
    it('should set custom claims for a user', async () => {
      (adminAuth.setCustomUserClaims as jest.Mock).mockResolvedValue(
        undefined
      );

      await setUserRole('user-123', 'admin');

      expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith(
        'user-123',
        { role: 'admin' }
      );
    });
  });
});
