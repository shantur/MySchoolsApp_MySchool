/**
 * Authorization Utilities
 * 
 * Implements application-level Row-Level Security (RLS) for MySchool.
 * Provides functions to check user permissions and access control.
 */

import type { UserSession } from '../types';

/**
 * Error thrown when user lacks required permissions
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Error thrown when authentication is required
 */
export class AuthenticationError extends Error {
  constructor(
    message: string = 'Authentication required',
    public readonly code: string = 'UNAUTHORIZED'
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Require admin role for access
 * 
 * @param {UserSession | null} session - Current user session
 * @throws {AuthenticationError} If not authenticated
 * @throws {AuthorizationError} If not admin
 */
export function requireAdmin(session: UserSession | null): void {
  if (!session) {
    throw new AuthenticationError();
  }

  if (session.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }
}

/**
 * Require any authenticated user
 * 
 * @param {UserSession | null} session - Current user session
 * @throws {AuthenticationError} If not authenticated
 */
export function requireAuth(session: UserSession | null): void {
  if (!session) {
    throw new AuthenticationError();
  }
}

/**
 * Check if user has access to a specific school
 * 
 * Admins can access all schools.
 * Regular users can only access their assigned school.
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} schoolId - The school ID to check access for
 * @throws {AuthenticationError} If not authenticated
 * @throws {AuthorizationError} If access denied
 */
export function checkSchoolAccess(
  session: UserSession | null,
  schoolId: string
): void {
  if (!session) {
    throw new AuthenticationError();
  }

  // Admins can access all schools
  if (session.role === 'admin') {
    return;
  }

  // Regular users can only access their own school
  if (session.schoolId !== schoolId) {
    throw new AuthorizationError('Access denied');
  }
}

/**
 * Check if user has access to a specific group
 * 
 * Admins can access all groups in any school.
 * Regular users can only access groups they belong to.
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} schoolId - The school ID
 * @param {string} groupId - The group ID to check access for
 * @throws {AuthenticationError} If not authenticated
 * @throws {AuthorizationError} If access denied
 */
export function checkGroupAccess(
  session: UserSession | null,
  schoolId: string,
  groupId: string
): void {
  if (!session) {
    throw new AuthenticationError();
  }

  // Admins can access all groups
  if (session.role === 'admin') {
    return;
  }

  // Check school access first
  checkSchoolAccess(session, schoolId);

  // Check if user belongs to the group
  if (!session.groupIds || !session.groupIds.includes(groupId)) {
    throw new AuthorizationError('Access denied to this group');
  }
}
