/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Create User Handler Logic Tests
 */

import { handleCreateUser } from '../create-user-handler';
import { createUserAccount } from '@/lib/services/auth.service';

// Mock dependencies
jest.mock('@/lib/services/auth.service');

describe('Create User Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user account successfully', async () => {
    const mockUser = {
      uid: 'new-user-123',
      email: 'newuser@example.com',
      schoolId: 'school-abc',
      role: 'user' as const,
      displayName: 'New User',
      groupIds: ['group-1'],
      createdAt: {} as any,
      updatedAt: {} as any,
    };

    (createUserAccount as jest.Mock).mockResolvedValue(mockUser);

    const result = await handleCreateUser({
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      schoolId: 'school-abc',
      role: 'user',
      displayName: 'New User',
      groupIds: ['group-1'],
    });

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeUndefined();
  });

  it('should return error for missing email', async () => {
    const result = await handleCreateUser({
      email: '',
      password: 'SecurePass123!',
      schoolId: 'school-abc',
      role: 'user',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('missing_required_fields');
  });

  it('should return error for missing password', async () => {
    const result = await handleCreateUser({
      email: 'newuser@example.com',
      password: '',
      schoolId: 'school-abc',
      role: 'user',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('missing_required_fields');
  });

  it('should return error for missing schoolId', async () => {
    const result = await handleCreateUser({
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      schoolId: '',
      role: 'user',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('missing_required_fields');
  });

  it('should return error for invalid password (too short)', async () => {
    const result = await handleCreateUser({
      email: 'newuser@example.com',
      password: 'Short1!',
      schoolId: 'school-abc',
      role: 'user',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('invalid_password');
  });

  it('should return error for invalid password (no uppercase)', async () => {
    const result = await handleCreateUser({
      email: 'newuser@example.com',
      password: 'lowercase123!',
      schoolId: 'school-abc',
      role: 'user',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('invalid_password');
  });

  it('should return error for invalid password (no lowercase)', async () => {
    const result = await handleCreateUser({
      email: 'newuser@example.com',
      password: 'UPPERCASE123!',
      schoolId: 'school-abc',
      role: 'user',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('invalid_password');
  });

  it('should return error for invalid password (no number)', async () => {
    const result = await handleCreateUser({
      email: 'newuser@example.com',
      password: 'NoNumber!',
      schoolId: 'school-abc',
      role: 'user',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('invalid_password');
  });

  it('should return error for invalid password (no special char)', async () => {
    const result = await handleCreateUser({
      email: 'newuser@example.com',
      password: 'NoSpecial123',
      schoolId: 'school-abc',
      role: 'user',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('invalid_password');
  });

  it('should return error when user creation fails', async () => {
    (createUserAccount as jest.Mock).mockRejectedValue(
      new Error('Email already exists')
    );

    const result = await handleCreateUser({
      email: 'existing@example.com',
      password: 'SecurePass123!',
      schoolId: 'school-abc',
      role: 'user',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('internal_error');
  });
});
