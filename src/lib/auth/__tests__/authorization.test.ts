/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import {
  requireAdmin,
  requireAuth,
  checkSchoolAccess,
} from '../authorization';
import type { UserSession } from '../../types';

describe('Authorization Utilities', () => {
  describe('requireAdmin', () => {
    it('should allow admin users', () => {
      const adminSession: UserSession = {
        uid: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        schoolId: 'school123',
      };

      expect(() => requireAdmin(adminSession)).not.toThrow();
    });

    it('should throw error for non-admin users', () => {
      const userSession: UserSession = {
        uid: 'user123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school123',
      };

      expect(() => requireAdmin(userSession)).toThrow(
        'Admin access required'
      );
    });

    it('should throw error for unauthenticated requests', () => {
      expect(() => requireAdmin(null)).toThrow(
        'Authentication required'
      );
    });
  });

  describe('requireAuth', () => {
    it('should allow authenticated users', () => {
      const userSession: UserSession = {
        uid: 'user123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school123',
      };

      expect(() => requireAuth(userSession)).not.toThrow();
    });

    it('should throw error for unauthenticated requests', () => {
      expect(() => requireAuth(null)).toThrow(
        'Authentication required'
      );
    });
  });

  describe('checkSchoolAccess', () => {
    it('should allow admin to access any school', () => {
      const adminSession: UserSession = {
        uid: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        schoolId: 'school999',
      };

      expect(() =>
        checkSchoolAccess(adminSession, 'school123')
      ).not.toThrow();
    });

    it('should allow user to access their own school', () => {
      const userSession: UserSession = {
        uid: 'user123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school123',
      };

      expect(() =>
        checkSchoolAccess(userSession, 'school123')
      ).not.toThrow();
    });

    it('should deny user access to other schools', () => {
      const userSession: UserSession = {
        uid: 'user123',
        email: 'user@example.com',
        role: 'user',
        schoolId: 'school123',
      };

      expect(() =>
        checkSchoolAccess(userSession, 'school456')
      ).toThrow('Access denied');
    });

    it('should throw error for unauthenticated requests', () => {
      expect(() =>
        checkSchoolAccess(null, 'school123')
      ).toThrow('Authentication required');
    });
  });
});
