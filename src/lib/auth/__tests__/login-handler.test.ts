/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Login Handler Logic Tests
 */

import { handleLogin } from '../login-handler';
import { authenticateUser } from '@/lib/services/auth.service';
import { createSession } from '@/lib/auth/session';

// Mock dependencies
jest.mock('@/lib/services/auth.service');
jest.mock('@/lib/auth/session');

describe('Login Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SESSION_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it('should return success with session token for valid credentials', async () => {
    const mockSession = {
      uid: 'user-123',
      email: 'test@example.com',
      schoolId: 'school-abc',
      role: 'user' as const,
      displayName: 'Test User',
    };

    (authenticateUser as jest.Mock).mockResolvedValue(mockSession);
    (createSession as jest.Mock).mockReturnValue('mock-jwt-token');

    const result = await handleLogin('test@example.com', 'password123');

    expect(result.success).toBe(true);
    expect(result.session).toEqual(mockSession);
    expect(result.token).toBe('mock-jwt-token');
    expect(result.error).toBeUndefined();
  });

  it('should return error for invalid credentials', async () => {
    (authenticateUser as jest.Mock).mockResolvedValue(null);

    const result = await handleLogin('wrong@example.com', 'wrongpassword');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('invalid_credentials');
    expect(result.session).toBeUndefined();
    expect(result.token).toBeUndefined();
  });

  it('should return error for missing email', async () => {
    const result = await handleLogin('', 'password123');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('missing_credentials');
  });

  it('should return error for missing password', async () => {
    const result = await handleLogin('test@example.com', '');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('missing_credentials');
  });

  it('should return error for authentication service errors', async () => {
    (authenticateUser as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await handleLogin('test@example.com', 'password123');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('internal_error');
  });
});
