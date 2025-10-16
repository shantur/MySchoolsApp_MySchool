/**
 * Notice Read Tracking Service (Supabase)
 * 
 * Manages read/unread status of notices for users using PostgreSQL notice_reads table.
 * Migrated from Firebase Firestore to Supabase for Phase 4.
 */

import { createServerClient } from '../supabase/server';

/**
 * Mark a notice as read by a user
 * 
 * @param userId - User ID who read the notice
 * @param noticeId - Notice ID that was read
 * @param schoolId - School ID for query scoping
 * @param groupId - Group ID for query scoping
 * @returns Promise<void>
 */
export async function markNoticeAsRead(
  userId: string,
  noticeId: string,
  schoolId: string,
  groupId: string
): Promise<void> {
  const supabase = createServerClient();

  // In Supabase, we use upsert with unique constraint on (user_id, notice_id)
  const readData = {
    user_id: userId,
    notice_id: noticeId,
    school_id: schoolId,
    group_id: groupId,
    // read_at will be set by database default (NOW())
  };

  const { error } = await supabase
    .from('notice_reads')
    .upsert(readData, {
      onConflict: 'user_id,notice_id',
    });

  if (error) {
    throw new Error(`Failed to mark notice as read: ${error.message}`);
  }
}

/**
 * Check if a user has read a specific notice
 * 
 * @param userId - User ID
 * @param noticeId - Notice ID
 * @returns Promise<boolean> - true if read, false if unread
 */
export async function hasUserReadNotice(
  userId: string,
  noticeId: string
): Promise<boolean> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('notice_reads')
    .select('id')
    .eq('user_id', userId)
    .eq('notice_id', noticeId)
    .single();

  // PGRST116 means not found
  if (error && error.code === 'PGRST116') {
    return false;
  }

  if (error) {
    throw new Error(`Failed to check read status: ${error.message}`);
  }

  return data !== null;
}

/**
 * Get all notices a user has read
 * 
 * @param userId - User ID
 * @param schoolId - Optional school ID filter
 * @returns Promise<string[]> - Array of notice IDs
 */
export async function getUserReadNotices(
  userId: string,
  schoolId?: string
): Promise<string[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('notice_reads')
    .select('notice_id')
    .eq('user_id', userId);

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data, error } = await query.limit(10000);

  if (error) {
    throw new Error(`Failed to get user read notices: ${error.message}`);
  }

  return (data || []).map((row: { notice_id: string }) => row.notice_id);
}

/**
 * Get read status for multiple notices for a user
 * Returns a map of noticeId -> boolean (true if read)
 * 
 * @param userId - User ID
 * @param noticeIds - Array of notice IDs to check
 * @returns Promise<Record<string, boolean>>
 */
export async function getBulkReadStatus(
  userId: string,
  noticeIds: string[]
): Promise<Record<string, boolean>> {
  if (noticeIds.length === 0) {
    return {};
  }

  const supabase = createServerClient();

  // PostgreSQL doesn't have the same 10-item IN limit as Firestore
  const { data, error } = await supabase
    .from('notice_reads')
    .select('notice_id')
    .eq('user_id', userId)
    .in('notice_id', noticeIds);

  if (error) {
    throw new Error(`Failed to get bulk read status: ${error.message}`);
  }

  // Initialize all as unread
  const results: Record<string, boolean> = {};
  noticeIds.forEach(noticeId => {
    results[noticeId] = false;
  });

  // Mark read notices as true
  (data || []).forEach((row: { notice_id: string }) => {
    results[row.notice_id] = true;
  });

  return results;
}

/**
 * Delete read tracking for a notice (e.g., when notice is deleted)
 * 
 * @param noticeId - Notice ID
 * @returns Promise<number> - Number of reads deleted
 */
export async function deleteNoticeReads(noticeId: string): Promise<number> {
  const supabase = createServerClient();

  // First get count, then delete
  const { data: readsBefore, error: countError } = await supabase
    .from('notice_reads')
    .select('id', { count: 'exact', head: true })
    .eq('notice_id', noticeId);

  if (countError) {
    throw new Error(`Failed to count notice reads: ${countError.message}`);
  }

  const count = readsBefore?.length || 0;

  if (count === 0) {
    return 0;
  }

  // Delete all reads for this notice
  const { error: deleteError } = await supabase
    .from('notice_reads')
    .delete()
    .eq('notice_id', noticeId);

  if (deleteError) {
    throw new Error(`Failed to delete notice reads: ${deleteError.message}`);
  }

  return count;
}
