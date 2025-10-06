/**
 * Create User Handler
 * 
 * Business logic for creating new user accounts
 */

import { createUserAccount, CreateUserParams } from '@/lib/services/auth.service';
import { User } from '@/lib/types';

/**
 * Create user result interface
 */
export interface CreateUserResult {
  success: boolean;
  user?: User;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Validate password requirements
 * Minimum 8 characters, at least one uppercase, lowercase, number, and special character
 * 
 * @param {string} password - Password to validate
 * @return {boolean} True if password is valid
 */
function validatePassword(password: string): boolean {
  if (password.length < 8) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

/**
 * Handle user creation
 * 
 * @param {CreateUserParams} params - User creation parameters
 * @return {Promise<CreateUserResult>} Create user result
 */
export async function handleCreateUser(
  params: CreateUserParams
): Promise<CreateUserResult> {
  try {
    const { email, password, schoolId, role, displayName, groupIds } = params;

    // Validate required fields
    if (!email || !password || !schoolId || !role) {
      return {
        success: false,
        error: {
          message: 'Email, password, schoolId, and role are required',
          code: 'missing_required_fields',
        },
      };
    }

    // Validate password
    if (!validatePassword(password)) {
      return {
        success: false,
        error: {
          message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
          code: 'invalid_password',
        },
      };
    }

    // Create user account
    const user = await createUserAccount({
      email,
      password,
      schoolId,
      role,
      displayName,
      groupIds,
    });

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      error: {
        message: 'Failed to create user account',
        code: 'internal_error',
      },
    };
  }
}
