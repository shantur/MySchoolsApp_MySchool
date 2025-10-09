/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Authentication Service Tests
 * 
 * Tests for Firebase Auth REST API integration and user authentication with password verification
 */

import { 
  authenticateUser, 
  createUserAccount, 
  setUserRole 
} from '../auth.service';

// Mock Firebase Admin SDK
jest.mock('@/lib/firebase/admin-lazy', () => ({
  getAdminAuth: jest.fn(),
  getAdminDb: jest.fn(),
}));

// Import after mocking
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-lazy';

// Mock global fetch
global.fetch = jest.fn();

describe('Authentication Service', () => {
  let mockAdminAuth: any;
  let mockAdminDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock admin auth
    mockAdminAuth = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      setCustomUserClaims: jest.fn(),
    };
    
    // Setup mock admin db
    mockAdminDb = {
      collection: jest.fn(),
    };
    
    (getAdminAuth as jest.Mock).mockReturnValue(mockAdminAuth);
    (getAdminDb as jest.Mock).mockReturnValue(mockAdminDb);
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
    
    // Set default environment variables
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.USE_FIREBASE_EMULATORS = 'true';
  });

  describe('authenticateUser - Password Verification', () => {
    it('should authenticate a valid user with correct password and return session data', async () => {
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'user-123',
          email: 'test@example.com',
          schoolId: 'school-abc',
          role: 'user',
          displayName: 'Test User',
          groupIds: [],
        }),
      };

      // Mock successful Firebase Auth REST API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          localId: 'user-123',
          email: 'test@example.com',
          idToken: 'mock-id-token',
          refreshToken: 'mock-refresh-token',
        }),
      });

      (mockAdminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockUserDoc),
        }),
      });

      const session = await authenticateUser('test@example.com', 'correctPassword');

      expect(session).toBeDefined();
      expect(session?.uid).toBe('user-123');
      expect(session?.email).toBe('test@example.com');
      expect(session?.schoolId).toBe('school-abc');
      expect(session?.role).toBe('user');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'correctPassword',
            returnSecureToken: true,
          }),
        })
      );
    });

    it('should authenticate an admin user with correct password', async () => {
      const mockAdminDoc = {
        exists: true,
        data: () => ({
          uid: 'admin-123',
          email: 'admin@example.com',
          schoolId: 'school-admin',
          role: 'admin',
          displayName: 'Admin User',
          groupIds: [],
        }),
      };

      // Mock successful Firebase Auth REST API response for admin
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          localId: 'admin-123',
          email: 'admin@example.com',
          idToken: 'mock-admin-token',
          refreshToken: 'mock-admin-refresh',
        }),
      });

      (mockAdminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockAdminDoc),
        }),
      });

      const session = await authenticateUser('admin@example.com', 'adminPassword');

      expect(session).toBeDefined();
      expect(session?.role).toBe('admin');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'admin@example.com',
            password: 'adminPassword',
            returnSecureToken: true,
          }),
        })
      );
    });

    it('should return null for incorrect password', async () => {
      // Mock Firebase Auth REST API error response for wrong password
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 400,
            message: 'INVALID_PASSWORD',
            errors: [
              {
                message: 'INVALID_PASSWORD',
                domain: 'global',
                reason: 'invalid',
              },
            ],
          },
        }),
      });

      const session = await authenticateUser('test@example.com', 'wrongPassword');

      expect(session).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongPassword',
            returnSecureToken: true,
          }),
        })
      );
    });

    it('should return null for empty password', async () => {
      // Mock Firebase Auth REST API error response for empty password
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 400,
            message: 'MISSING_PASSWORD',
            errors: [
              {
                message: 'MISSING_PASSWORD',
                domain: 'global',
                reason: 'invalid',
              },
            ],
          },
        }),
      });

      const session = await authenticateUser('test@example.com', '');

      expect(session).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: '',
            returnSecureToken: true,
          }),
        })
      );
    });

    it('should return null for non-existent user', async () => {
      // Mock Firebase Auth REST API error response for user not found
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 400,
            message: 'EMAIL_NOT_FOUND',
            errors: [
              {
                message: 'EMAIL_NOT_FOUND',
                domain: 'global',
                reason: 'invalid',
              },
            ],
          },
        }),
      });

      const session = await authenticateUser('nonexistent@example.com', 'password');

      expect(session).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: 'password',
            returnSecureToken: true,
          }),
        })
      );
    });

    it('should return null if user document does not exist in Firestore', async () => {
      const mockUserDoc = {
        exists: false,
        data: () => null,
      };

      // Mock successful Firebase Auth REST API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          localId: 'user-123',
          email: 'test@example.com',
          idToken: 'mock-id-token',
          refreshToken: 'mock-refresh-token',
        }),
      });

      (mockAdminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockUserDoc),
        }),
      });

      const session = await authenticateUser('test@example.com', 'password');

      expect(session).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return null if admin DB is not initialized', async () => {
      // Mock successful Firebase Auth REST API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          localId: 'user-123',
          email: 'test@example.com',
          idToken: 'mock-id-token',
          refreshToken: 'mock-refresh-token',
        }),
      });

      // Mock admin DB not initialized
      (getAdminDb as jest.Mock).mockReturnValue(null);

      const session = await authenticateUser('test@example.com', 'password');

      expect(session).toBeNull();
    });

    it('should return null if API key is not configured', async () => {
      // Remove API key
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

      const session = await authenticateUser('test@example.com', 'password');

      expect(session).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should use production endpoint when not using emulators', async () => {
      process.env.USE_FIREBASE_EMULATORS = 'false';
      
      const mockUserDoc = {
        exists: true,
        data: () => ({
          uid: 'user-123',
          email: 'test@example.com',
          schoolId: 'school-abc',
          role: 'user',
          displayName: 'Test User',
          groupIds: [],
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          localId: 'user-123',
          email: 'test@example.com',
          idToken: 'mock-id-token',
          refreshToken: 'mock-refresh-token',
        }),
      });

      (mockAdminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockUserDoc),
        }),
      });

      await authenticateUser('test@example.com', 'password');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test-api-key',
        expect.any(Object)
      );
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

      (mockAdminAuth.createUser as jest.Mock).mockResolvedValue(mockUserRecord);
      (mockAdminAuth.setCustomUserClaims as jest.Mock).mockResolvedValue(
        undefined
      );
      (mockAdminDb.collection as jest.Mock).mockReturnValue({
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

      expect(mockAdminAuth.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        displayName: 'New User',
      });

      expect(mockAdminAuth.setCustomUserClaims).toHaveBeenCalledWith(
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

      (mockAdminAuth.createUser as jest.Mock).mockResolvedValue(mockAdminRecord);
      (mockAdminAuth.setCustomUserClaims as jest.Mock).mockResolvedValue(
        undefined
      );
      (mockAdminDb.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      await createUserAccount({
        email: 'newadmin@example.com',
        password: 'AdminPass123!',
        schoolId: 'school-admin',
        role: 'admin',
        displayName: 'New Admin',
      });

      expect(mockAdminAuth.setCustomUserClaims).toHaveBeenCalledWith(
        'new-admin-123',
        { role: 'admin' }
      );
    });

    it('should throw error if user creation fails', async () => {
      (mockAdminAuth.createUser as jest.Mock).mockRejectedValue(
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
      (mockAdminAuth.setCustomUserClaims as jest.Mock).mockResolvedValue(
        undefined
      );

      await setUserRole('user-123', 'admin');

      expect(mockAdminAuth.setCustomUserClaims).toHaveBeenCalledWith(
        'user-123',
        { role: 'admin' }
      );
    });
  });
});
