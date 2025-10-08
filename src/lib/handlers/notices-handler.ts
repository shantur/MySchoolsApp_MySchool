/**
 * Notices Handler
 * 
 * Business logic for handling notice-related operations.
 * Implements application-level RLS (Row-Level Security).
 */

import { NoticesService } from '../services/notices.service';
import type { 
  CreateNoticeInput,
  UpdateNoticeInput,
} from '../services/notices.service';
import type { Notice, UserSession } from '../types';
import {
  requireAdmin,
  requireAuth,
  checkSchoolAccess,
} from '../auth/authorization';

/**
 * Create a new notice (Admin only)
 *
 * @param {UserSession | null} session - Current user session
 * @param {CreateNoticeInput} data - Notice data
 * @param {NoticesService} service - Notices service instance
 * @return {Promise<{success: boolean, notice?: Notice, error?: {message: string, code: string}}>} Result object
 */
export async function createNoticeHandler(
  session: UserSession | null,
  data: CreateNoticeInput,
  service: NoticesService = new NoticesService()
): Promise<{success: boolean, notice?: Notice, error?: {message: string, code: string}}> {
  try {
    requireAdmin(session);
    const notice = await service.createNotice(data);
    return { success: true, notice };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'creation_failed',
      },
    };
  }
}

/**
 * Get a notice by ID
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} noticeId - Notice ID
 * @param {string} schoolId - School ID
 * @param {NoticesService} service - Notices service instance
 * @return {Promise<Notice | null>} Notice if found and authorized
 */
export async function getNoticeHandler(
  session: UserSession | null,
  noticeId: string,
  schoolId: string,
  service: NoticesService = new NoticesService()
): Promise<Notice | null> {
  requireAuth(session);
  checkSchoolAccess(session, schoolId);
  
  const notice = await service.getNoticeById(noticeId);
  
  // Verify notice belongs to the requested school
  if (notice && notice.schoolId !== schoolId) {
    return null;
  }
  
  return notice;
}

/**
 * Update a notice (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} noticeId - Notice ID
 * @param {UpdateNoticeInput} data - Update data
 * @param {NoticesService} service - Notices service instance
 * @return {Promise<Notice>} Updated notice
 */
export async function updateNoticeHandler(
  session: UserSession | null,
  noticeId: string,
  data: UpdateNoticeInput,
  service: NoticesService = new NoticesService()
): Promise<Notice> {
  requireAdmin(session);
  return service.updateNotice(noticeId, data);
}

/**
 * Delete a notice (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} noticeId - Notice ID
 * @param {NoticesService} service - Notices service instance
 * @return {Promise<void>}
 */
export async function deleteNoticeHandler(
  session: UserSession | null,
  noticeId: string,
  service: NoticesService = new NoticesService()
): Promise<void> {
  requireAdmin(session);
  return service.deleteNotice(noticeId);
}

/**
 * List notices for a school
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} schoolId - School ID
 * @param {string} status - Optional status filter
 * @param {NoticesService} service - Notices service instance
 * @return {Promise<Notice[]>} List of notices
 */
export async function listNoticesHandler(
  session: UserSession | null,
  schoolId: string,
  status?: 'draft' | 'published' | 'archived',
  service: NoticesService = new NoticesService()
): Promise<Notice[]> {
  requireAuth(session);
  checkSchoolAccess(session, schoolId);

  // Regular users can only see published notices
  const filterStatus = 
    session!.role === 'admin' ? status : 'published';

  return service.listNoticesBySchool(schoolId, filterStatus);
}

// Convenience exports with alternative naming for UI components
export const getNoticesBySchool = listNoticesHandler;
export const getNoticeById = (
  schoolId: string,
  noticeId: string,
  session: UserSession | null
) => getNoticeHandler(session, noticeId, schoolId);

/**
 * Get all notices (Admin only)
 *
 * @param {UserSession | null} session - Current user session
 * @param {NoticesService} service - Notices service instance
 * @return {Promise<Notice[]>} List of all notices
 */
export async function getAllNotices(
  session: UserSession | null,
  service: NoticesService = new NoticesService()
): Promise<Notice[]> {
  requireAdmin(session);
  return service.listAllNotices();
}
