/**
 * Notices Handler (Supabase)
 * 
 * Business logic for handling notice-related operations with Supabase backend.
 * Implements application-level RLS (Row-Level Security).
 * Migrated from Firebase to Supabase for Phase 4.
 */

import { NoticesServiceSupabase } from '../services/notices.service.supabase';
import type { 
  CreateNoticeInput,
  UpdateNoticeInput,
} from '../services/notices.service.supabase';
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
 * @param {NoticesServiceSupabase} service - Notices service instance
 * @return {Promise<{success: boolean, notice?: Notice, error?: {message: string, code: string}}>} Result object
 */
export async function createNoticeHandler(
  session: UserSession | null,
  data: CreateNoticeInput,
  service: NoticesServiceSupabase = new NoticesServiceSupabase()
): Promise<{success: boolean, notice?: Notice, error?: {message: string, code: string}}> {
  try {
    requireAdmin(session);
    
    // Add sender information from session
    const noticeData: CreateNoticeInput = {
      ...data,
      senderName: session?.displayName || session?.email || 'Unknown',
    };
    
    const notice = await service.createNotice(noticeData);
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
 * @param {NoticesServiceSupabase} service - Notices service instance
 * @return {Promise<Notice | null>} Notice if found and authorized
 */
export async function getNoticeHandler(
  session: UserSession | null,
  noticeId: string,
  schoolId: string,
  service: NoticesServiceSupabase = new NoticesServiceSupabase()
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
 * @param {UpdateNoticeInput} updates - Fields to update
 * @param {NoticesServiceSupabase} service - Notices service instance
 * @return {Promise<{success: boolean, notice?: Notice, error?: {message: string, code: string}}>} Result object
 */
export async function updateNoticeHandler(
  session: UserSession | null,
  noticeId: string,
  updates: UpdateNoticeInput,
  service: NoticesServiceSupabase = new NoticesServiceSupabase()
): Promise<{success: boolean, notice?: Notice, error?: {message: string, code: string}}> {
  try {
    requireAdmin(session);
    
    const notice = await service.updateNotice(noticeId, updates);
    return { success: true, notice };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'update_failed',
      },
    };
  }
}

/**
 * Delete a notice (Admin only)
 *
 * @param {UserSession | null} session - Current user session
 * @param {string} noticeId - Notice ID
 * @param {NoticesServiceSupabase} service - Notices service instance
 * @return {Promise<{success: boolean, error?: {message: string, code: string}}>} Result object
 */
export async function deleteNoticeHandler(
  session: UserSession | null,
  noticeId: string,
  service: NoticesServiceSupabase = new NoticesServiceSupabase()
): Promise<{success: boolean, error?: {message: string, code: string}}> {
  try {
    requireAdmin(session);
    
    await service.deleteNotice(noticeId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'deletion_failed',
      },
    };
  }
}

/**
 * List notices for a specific school
 *
 * @param {UserSession | null} session - Current user session
 * @param {string} schoolId - School ID
 * @param {string} status - Optional status filter
 * @param {NoticesServiceSupabase} service - Notices service instance
 * @return {Promise<Notice[]>} Array of notices
 */
export async function listNoticesBySchoolHandler(
  session: UserSession | null,
  schoolId: string,
  status?: 'draft' | 'published' | 'archived',
  service: NoticesServiceSupabase = new NoticesServiceSupabase()
): Promise<Notice[]> {
  requireAuth(session);
  checkSchoolAccess(session, schoolId);
  
  return await service.listNoticesBySchool(schoolId, status);
}

/**
 * List notices for a specific group
 *
 * @param {UserSession | null} session - Current user session
 * @param {string} groupId - Group ID
 * @param {string} schoolId - School ID
 * @param {string} status - Optional status filter
 * @param {NoticesServiceSupabase} service - Notices service instance
 * @return {Promise<Notice[]>} Array of notices
 */
export async function listNoticesByGroupHandler(
  session: UserSession | null,
  groupId: string,
  schoolId: string,
  status?: 'draft' | 'published' | 'archived',
  service: NoticesServiceSupabase = new NoticesServiceSupabase()
): Promise<Notice[]> {
  requireAuth(session);
  checkSchoolAccess(session, schoolId);
  
  return await service.listNoticesByGroup(groupId, status);
}

// Convenience export with alternative naming for UI components
export const getNoticesBySchool = listNoticesBySchoolHandler;
