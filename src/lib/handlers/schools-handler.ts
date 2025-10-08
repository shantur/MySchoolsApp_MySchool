/**
 * Schools Handler
 * 
 * Business logic for handling school-related operations.
 * Implements application-level RLS (Row-Level Security).
 */

import { SchoolsService } from '../services/schools.service';
import type { 
  CreateSchoolInput,
  UpdateSchoolInput,
} from '../services/schools.service';
import type { School, UserSession } from '../types';
import {
  requireAdmin,
  requireAuth,
  checkSchoolAccess,
} from '../auth/authorization';

/**
 * Create a new school (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {CreateSchoolInput} data - School data
 * @param {SchoolsService} service - Schools service instance
 * @return {Promise<School>} Created school
 */
export async function createSchoolHandler(
  session: UserSession | null,
  data: CreateSchoolInput,
  service: SchoolsService = new SchoolsService()
): Promise<School> {
  // Only admins can create schools
  requireAdmin(session);

  return service.createSchool(data);
}

/**
 * Get a school by ID
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} schoolId - School ID
 * @param {SchoolsService} service - Schools service instance
 * @return {Promise<School | null>} School if found and authorized
 */
export async function getSchoolHandler(
  session: UserSession | null,
  schoolId: string,
  service: SchoolsService = new SchoolsService()
): Promise<School | null> {
  // Check authentication and school access
  requireAuth(session);
  checkSchoolAccess(session, schoolId);

  return service.getSchoolById(schoolId);
}

/**
 * Update a school (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} schoolId - School ID
 * @param {UpdateSchoolInput} data - Update data
 * @param {SchoolsService} service - Schools service instance
 * @return {Promise<School>} Updated school
 */
export async function updateSchoolHandler(
  session: UserSession | null,
  schoolId: string,
  data: UpdateSchoolInput,
  service: SchoolsService = new SchoolsService()
): Promise<School> {
  // Only admins can update schools
  requireAdmin(session);

  return service.updateSchool(schoolId, data);
}

/**
 * Delete a school (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} schoolId - School ID
 * @param {SchoolsService} service - Schools service instance
 * @return {Promise<void>}
 */
export async function deleteSchoolHandler(
  session: UserSession | null,
  schoolId: string,
  service: SchoolsService = new SchoolsService()
): Promise<void> {
  // Only admins can delete schools
  requireAdmin(session);

  return service.deleteSchool(schoolId);
}

/**
 * List schools
 * 
 * Admins see all schools. Users see only their assigned school.
 * 
 * @param {UserSession | null} session - Current user session
 * @param {SchoolsService} service - Schools service instance
 * @return {Promise<School[]>} List of schools
 */
export async function listSchoolsHandler(
  session: UserSession | null,
  service: SchoolsService = new SchoolsService()
): Promise<School[]> {
  requireAuth(session);

  // Admins can see all schools
  if (session!.role === 'admin') {
    return service.listSchools();
  }

  // Regular users can only see their own school
  const school = await service.getSchoolById(session!.schoolId);
  return school ? [school] : [];
}

/**
 * Get all schools (alias for listSchoolsHandler for backward compatibility)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {SchoolsService} service - Schools service instance
 * @return {Promise<School[]>} List of schools
 */
export async function getAllSchools(
  session: UserSession | null,
  service: SchoolsService = new SchoolsService()
): Promise<School[]> {
  return listSchoolsHandler(session, service);
}
