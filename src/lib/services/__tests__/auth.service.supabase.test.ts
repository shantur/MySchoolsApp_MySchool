/**
 * Auth Service Supabase Migration Tests
 * 
 * Tests for authentication service using Supabase Auth
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';
import { authenticateUser, createUserAccount, setUserRole } from '../auth.service';
import { supabaseServer } from '../../supabase/server';

jest.mock('../../supabase/server', () => ({
  supabaseServer: {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
        updateUserById: jest.fn(),
      },
    },
    from: jest.fn(),
  },
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const supabaseServerMock = supabaseServer as any;

describe('Auth Service (Supabase)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateClient.mockReset();
    supabaseServerMock.from.mockReset();
    supabaseServerMock.auth.admin.createUser.mockReset();
    supabaseServerMock.auth.admin.deleteUser.mockReset();
    supabaseServerMock.auth.admin.updateUserById.mockReset();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key';
  });

  describe('authenticateUser', () => {
    it('should authenticate user and return session data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        school_id: 'school-456',
        role: 'admin',
        display_name: 'Test User',
        group_ids: ['group-1', 'group-2'],
      };

      const mockSignInWithPassword = jest.fn().mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      mockedCreateClient.mockReturnValueOnce({
        auth: { signInWithPassword: mockSignInWithPassword },
      } as any);

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockUserData,
        error: null,
      });

      supabaseServerMock.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await authenticateUser('test@example.com', 'password123');

      expect(result).toEqual({
        uid: 'user-123',
        email: 'test@example.com',
        schoolId: 'school-456',
        role: 'admin',
        displayName: 'Test User',
        groupIds: ['group-1', 'group-2'],
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockedCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'anon-test-key',
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: false,
            autoRefreshToken: false,
          }),
        }),
      );

      expect(supabaseServerMock.from).toHaveBeenCalledWith('users');
    });

    it('should return null if authentication fails', async () => {
      const mockSignInWithPassword = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      mockedCreateClient.mockReturnValueOnce({
        auth: { signInWithPassword: mockSignInWithPassword },
      } as any);

      const result = await authenticateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'wrong-password',
      });
    });

    it('should return null if user document not found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSignInWithPassword = jest.fn().mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      mockedCreateClient.mockReturnValueOnce({
        auth: { signInWithPassword: mockSignInWithPassword },
      } as any);

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      supabaseServerMock.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await authenticateUser('test@example.com', 'password123');

      expect(result).toBeNull();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('createUserAccount', () => {
    it('should create user in Supabase Auth and users table', async () => {
      const mockAuthUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
      };

      // Mock user creation in Supabase Auth
      supabaseServerMock.auth.admin.createUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      });

      // Mock insert into users table
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'new-user-123',
          email: 'newuser@example.com',
          school_id: 'school-789',
          role: 'user',
          display_name: 'New User',
          group_ids: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      supabaseServerMock.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await createUserAccount({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        schoolId: 'school-789',
        role: 'user',
        displayName: 'New User',
        groupIds: [],
      });

      expect(result).toBeDefined();
      expect(result.uid).toBe('new-user-123');
      expect(result.email).toBe('newuser@example.com');
      expect(result.schoolId).toBe('school-789');
      expect(result.role).toBe('user');

      expect(supabaseServerMock.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        email_confirm: true,
        password: 'SecurePass123!',
        user_metadata: {
          display_name: 'New User',
        },
      });

      expect(supabaseServerMock.from).toHaveBeenCalledWith('users');
    });

    it('should set user metadata for role', async () => {
      const mockAuthUser = {
        id: 'new-admin-456',
        email: 'admin@example.com',
      };

      supabaseServerMock.auth.admin.createUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      });

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'new-admin-456',
          email: 'admin@example.com',
          school_id: 'school-789',
          role: 'admin',
          display_name: 'Admin User',
          group_ids: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      supabaseServerMock.from.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      await createUserAccount({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        schoolId: 'school-789',
        role: 'admin',
        displayName: 'Admin User',
      });

      expect(supabaseServerMock.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@example.com',
          password: 'AdminPass123!',
        })
      );
    });

    it('should throw error if user creation fails', async () => {
      supabaseServerMock.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      });

      await expect(
        createUserAccount({
          email: 'existing@example.com',
          password: 'password123',
          schoolId: 'school-123',
          role: 'user',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('setUserRole', () => {
    it('should update user role in users table', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      supabaseServerMock.from.mockReturnValue({
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      await setUserRole('user-123', 'admin');

      expect(supabaseServerMock.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalledWith({ role: 'admin' });
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('should throw error if role update fails', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      supabaseServerMock.from.mockReturnValue({
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      await expect(setUserRole('invalid-user', 'admin')).rejects.toThrow(
        'User not found'
      );
    });
  });
});
