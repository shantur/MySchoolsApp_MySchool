/**
 * Login Handler
 * 
 * Business logic for user login, separated from API route
 * for easier testing
 */

import { authenticateUser } from '@/lib/services/auth.service';
import { createSession } from './session';
import { UserSession } from '@/lib/types';

/**
 * Login result interface
 */
export interface LoginResult {
  success: boolean;
  session?: UserSession;
  token?: string;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Handle user login
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @return {Promise<LoginResult>} Login result
 */
export async function handleLogin(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: {
          message: 'Email and password are required',
          code: 'missing_credentials',
        },
      };
    }

    // Authenticate user using unified Firebase Auth
    const userSession = await authenticateUser(email, password);

    if (!userSession) {
      return {
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'invalid_credentials',
        },
      };
    }

    // Create session token
    const sessionToken = createSession(userSession);

    return {
      success: true,
      session: userSession,
      token: sessionToken,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'internal_error',
      },
    };
  }
}
