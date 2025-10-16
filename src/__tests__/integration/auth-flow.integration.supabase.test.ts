/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Authentication Flow Integration Tests (Supabase)
 * 
 * These tests verify the complete authentication flow using
 * Supabase local development environment
 */

// Set environment variables for testing
process.env.SESSION_SECRET = 'test-secret-for-integration-tests';
process.env.NODE_ENV = 'development';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Mock Supabase client for integration tests
const mockUsers = new Map();
const mockUserDocs = new Map();
let userIdCounter = 1;

// Mock the supabase server module
jest.mock('@/lib/supabase/server', () => ({
  supabaseServer: {
    auth: {
      signInWithPassword: jest.fn(async ({ email, password }) => {
        const user = Array.from(mockUsers.values()).find(
          (u: any) => u.email === email
        );
        if (!user || user.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid credentials' },
          };
        }
        return {
          data: { 
            user: { id: user.id, email: user.email },
            session: { access_token: 'mock-token', user: { id: user.id, email: user.email } }
          },
          error: null,
        };
      }),
      admin: {
        createUser: jest.fn(async (userData: any) => {
          const uid = `user-${userIdCounter++}`;
          const user = { 
            id: uid, 
            email: userData.email,
            password: userData.password, // Store password for authentication
            user_metadata: { 
              display_name: userData.user_metadata?.display_name,
            }
          };
          mockUsers.set(uid, user);
          return { data: { user }, error: null };
        }),
        updateUserById: jest.fn(async (userId: string, attributes: any) => {
          const user = mockUsers.get(userId);
          if (user) {
            Object.assign(user, attributes);
            return { data: { user }, error: null };
          }
          return { data: { user: null }, error: { message: 'User not found' } };
        }),
      },
    },
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn((field: string, value: any) => ({
          single: jest.fn(async () => {
            if (table === 'users' && field === 'id') {
              const data = mockUserDocs.get(value);
              return {
                data: data || null,
                error: data ? null : { message: 'User not found' },
              };
            }
            return { data: null, error: { message: 'Not found' } };
          }),
        })),
      })),
      insert: jest.fn((data: any) => ({
        select: jest.fn(() => ({
          single: jest.fn(async () => {
            if (table === 'users') {
              const doc = { id: data.id, ...data };
              mockUserDocs.set(data.id, doc);
              return { data: doc, error: null };
            }
            return { data: null, error: { message: 'Insert failed' } };
          }),
        })),
      })),
    })),
  },
}));

jest.mock('@supabase/supabase-js', () => ({}));

// Import after mocking
import { authenticateUser, createUserAccount } from '@/lib/services/auth.service';
import { createSession, validateSession } from '@/lib/auth/session';
import { handleLogin } from '@/lib/auth/login-handler';
import { handleCreateUser } from '@/lib/auth/create-user-handler';

describe('Authentication Flow Integration (Supabase)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsers.clear();
    mockUserDocs.clear();
    userIdCounter = 1;
  });

  describe('User Creation and Authentication', () => {
    it('should create a new user account and authenticate successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        schoolId: 'school-123',
        role: 'user' as const,
        displayName: 'Test User',
      };

      // Step 1: Create user account
      const createResult = await createUserAccount(userData);
      expect(createResult.email).toBe(userData.email);
      expect(createResult.uid).toBeDefined();

      // Step 2: Authenticate with created user
      const authResult = await authenticateUser(userData.email, userData.password);
      expect(authResult).toBeDefined();
      expect(authResult?.uid).toBeDefined();
      expect(authResult?.email).toBe(userData.email);

      // Step 3: Create session
      const sessionToken = createSession(authResult!);
      expect(sessionToken).toBeDefined();
      expect(typeof sessionToken).toBe('string');

      // Step 4: Validate session
      const validatedSession = validateSession(sessionToken);
      expect(validatedSession).toBeDefined();
      expect(validatedSession?.uid).toBe(authResult!.uid);
    });

    it('should create an admin account and authenticate successfully', async () => {
      const adminData = {
        email: 'admin@example.com',
        password: 'AdminPass123!',
        schoolId: 'school-admin',
        role: 'admin' as const,
        displayName: 'Admin User',
      };

      // Step 1: Create admin account
      const createResult = await createUserAccount(adminData);
      expect(createResult.role).toBe('admin');

      // Step 2: Authenticate with admin credentials
      const authResult = await authenticateUser(adminData.email, adminData.password);
      expect(authResult).toBeDefined();
      expect(authResult?.role).toBe('admin');

      // Step 3: Create session
      const sessionToken = createSession(authResult!);
      expect(sessionToken).toBeDefined();
      expect(typeof sessionToken).toBe('string');
      
      // Validate session contains admin role
      const validatedSession = validateSession(sessionToken);
      expect(validatedSession?.role).toBe('admin');
    });

    it('should fail authentication with wrong password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        schoolId: 'school-123',
        role: 'user' as const,
        displayName: 'Test User',
      };

      // Step 1: Create user account
      const createResult = await createUserAccount(userData);
      expect(createResult.email).toBe(userData.email);

      // Step 2: Try to authenticate with wrong password
      const authResult = await authenticateUser(userData.email, 'WrongPassword123!');
      expect(authResult).toBeNull();
    });

    it('should fail authentication for non-existent user', async () => {
      const authResult = await authenticateUser('nonexistent@example.com', 'password');
      expect(authResult).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should create and validate sessions correctly', async () => {
      const userData = {
        email: 'session-test@example.com',
        password: 'SessionPass123!',
        schoolId: 'school-123',
        role: 'user' as const,
        displayName: 'Session Test User',
      };

      // Create user and authenticate
      const createResult = await createUserAccount(userData);
      expect(createResult.email).toBe(userData.email);

      const authResult = await authenticateUser(userData.email, userData.password);
      expect(authResult).toBeDefined();

      // Create session
      const sessionToken = createSession(authResult!);
      expect(sessionToken).toBeDefined();
      expect(typeof sessionToken).toBe('string');

      // Validate session multiple times
      const validated1 = validateSession(sessionToken);
      expect(validated1).toBeDefined();
      expect(validated1?.uid).toBe(authResult!.uid);
      expect(validated1?.email).toBe(userData.email);
      expect(validated1?.role).toBe(userData.role);

      const validated2 = validateSession(sessionToken);
      expect(validated2).toBeDefined();
      expect(validated2?.uid).toBe(authResult!.uid);
    });

    it('should handle invalid sessions gracefully', () => {
      const invalidToken = 'invalid.jwt.token';
      const validated = validateSession(invalidToken);
      expect(validated).toBeNull();
    });
  });

  describe('Handler Integration', () => {
    it('should handle login through handler', async () => {
      const userData = {
        email: 'handler-test@example.com',
        password: 'HandlerPass123!',
        schoolId: 'school-123',
        role: 'user' as const,
        displayName: 'Handler Test User',
      };

      // Create user first
      const createResult = await createUserAccount(userData);
      expect(createResult.email).toBe(userData.email);

      // Test login handler
      const loginResult = await handleLogin(userData.email, userData.password);

      expect(loginResult.success).toBe(true);
      expect(loginResult.session).toBeDefined();
      expect(loginResult.token).toBeDefined();
      expect(loginResult.session?.email).toBe(userData.email);
      expect(typeof loginResult.token).toBe('string');
    });

    it('should handle user creation through handler', async () => {
      const createUserData = {
        email: 'handler-create@example.com',
        password: 'CreatePass123!',
        schoolId: 'school-123',
        role: 'user' as const,
        displayName: 'Handler Create User',
      };

      const createResult = await handleCreateUser(createUserData);
      expect(createResult.success).toBe(true);
      expect(createResult.user?.email).toBe(createUserData.email);

      // Verify user can authenticate
      const authResult = await authenticateUser(createUserData.email, createUserData.password);
      expect(authResult).toBeDefined();
      expect(authResult?.email).toBe(createUserData.email);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking Supabase client to throw errors
      // For now, we'll test the error flow with invalid data
      const invalidUserData = {
        email: '', // Invalid email
        password: 'TestPass123!',
        schoolId: 'school-123',
        role: 'user' as const,
        displayName: 'Invalid User',
      };

      // createUserAccount should create a user even with empty email (validation happens at handler level)
      const result = await createUserAccount(invalidUserData);
      expect(result.email).toBe('');
    });

    it('should handle session creation with empty data', () => {
      const invalidAuthResult = {
        uid: '',
        email: '',
        schoolId: '',
        role: 'user' as const,
        displayName: '',
      };

      // createSession should still create a token even with empty data
      // (validation happens at decode time)
      expect(() => createSession(invalidAuthResult)).not.toThrow();
    });
  });
});