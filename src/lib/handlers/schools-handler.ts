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
import { AuditService } from '../services/audit.service';

/**
 * Create a new school (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {CreateSchoolInput} data - School data
 * @param {SchoolsService} service - Schools service instance
 * @param {AuditService} auditService - Audit service instance
 * @return {Promise<School>} Created school
 */
export async function createSchoolHandler(
  session: UserSession | null,
  data: CreateSchoolInput,
  service: SchoolsService = new SchoolsService(),
  auditService: AuditService = new AuditService()
): Promise<School> {
  // Only admins can create schools
  requireAdmin(session);

  const school = await service.createSchool(data);

  // Log the creation in audit trail
  await auditService.logSchoolCreation(
    session!,
    school as unknown as Record<string, unknown>
  );

  return school;
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
 * @param {AuditService} auditService - Audit service instance
 * @return {Promise<School>} Updated school
 */
export async function updateSchoolHandler(
  session: UserSession | null,
  schoolId: string,
  data: UpdateSchoolInput,
  service: SchoolsService = new SchoolsService(),
  auditService: AuditService = new AuditService()
): Promise<School> {
  // Only admins can update schools
  requireAdmin(session);

  // Get before state for audit log
  const beforeData = await service.getSchoolById(schoolId);

  const school = await service.updateSchool(schoolId, data);

  // Log the update in audit trail
  if (beforeData) {
    await auditService.logSchoolUpdate(
      session!,
      schoolId,
      beforeData as unknown as Record<string, unknown>,
      school as unknown as Record<string, unknown>
    );
  }

  return school;
}

/**
 * Delete a school (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} schoolId - School ID
 * @param {SchoolsService} service - Schools service instance
 * @param {AuditService} auditService - Audit service instance
 * @return {Promise<void>}
 */
export async function deleteSchoolHandler(
  session: UserSession | null,
  schoolId: string,
  service: SchoolsService = new SchoolsService(),
  auditService: AuditService = new AuditService()
): Promise<void> {
  // Only admins can delete schools
  requireAdmin(session);

  // Get school data before deletion for audit log
  const schoolData = await service.getSchoolById(schoolId);

  await service.deleteSchool(schoolId);

  // Log the deletion in audit trail
  if (schoolData) {
    await auditService.logSchoolDeletion(
      session!,
      schoolData as unknown as Record<string, unknown>
    );
  }
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
