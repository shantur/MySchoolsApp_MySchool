/**
 * Groups Handler
 * 
 * Business logic for handling group-related operations.
 * Implements application-level RLS (Row-Level Security).
 */

import { GroupsService } from '../services/groups.service';
import type { 
  CreateGroupInput,
  UpdateGroupInput,
} from '../services/groups.service';
import type { Group, UserSession } from '../types';
import {
  requireAdmin,
  requireAuth,
  checkSchoolAccess,
  checkGroupAccess,
} from '../auth/authorization';

/**
 * Create a new group (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {CreateGroupInput} data - Group data
 * @param {GroupsService} service - Groups service instance
 * @return {Promise<Group>} Created group
 */
export async function createGroupHandler(
  session: UserSession | null,
  data: CreateGroupInput,
  service: GroupsService = new GroupsService()
): Promise<Group> {
  requireAdmin(session);
  return service.createGroup(data);
}

/**
 * Get a group by ID
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} groupId - Group ID
 * @param {string} schoolId - School ID
 * @param {GroupsService} service - Groups service instance
 * @return {Promise<Group | null>} Group if found and authorized
 */
export async function getGroupHandler(
  session: UserSession | null,
  groupId: string,
  schoolId: string,
  service: GroupsService = new GroupsService()
): Promise<Group | null> {
  requireAuth(session);
  
  // For regular users, check group access
  if (session!.role !== 'admin') {
    checkGroupAccess(session, schoolId, groupId);
  }
  
  return service.getGroupById(groupId);
}

/**
 * Update a group (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} groupId - Group ID
 * @param {UpdateGroupInput} data - Update data
 * @param {GroupsService} service - Groups service instance
 * @return {Promise<Group>} Updated group
 */
export async function updateGroupHandler(
  session: UserSession | null,
  groupId: string,
  data: UpdateGroupInput,
  service: GroupsService = new GroupsService()
): Promise<Group> {
  requireAdmin(session);
  return service.updateGroup(groupId, data);
}

/**
 * Delete a group (Admin only)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {string} groupId - Group ID
 * @param {GroupsService} service - Groups service instance
 * @return {Promise<void>}
 */
export async function deleteGroupHandler(
  session: UserSession | null,
  groupId: string,
  service: GroupsService = new GroupsService()
): Promise<void> {
  requireAdmin(session);
  return service.deleteGroup(groupId);
}

/**
 * List groups for a school
 *
 * @param {UserSession | null} session - Current user session
 * @param {string} schoolId - School ID
 * @param {GroupsService} service - Groups service instance
 * @return {Promise<Group[]>} List of groups
 */
export async function listGroupsHandler(
  session: UserSession | null,
  schoolId: string,
  service: GroupsService = new GroupsService()
): Promise<Group[]> {
  requireAuth(session);
  checkSchoolAccess(session, schoolId);

  const allGroups = await service.listGroupsBySchool(schoolId);

  // Admins see all groups
  if (session!.role === 'admin') {
    return allGroups;
  }

  // Regular users only see groups they belong to
  if (!session!.groupIds || session!.groupIds.length === 0) {
    return [];
  }

  return allGroups.filter(
    group => session!.groupIds!.includes(group.groupId)
  );
}

/**
 * Get all groups for a school (used for profile display)
 *
 * @param {string} schoolId - School ID
 * @param {GroupsService} service - Groups service instance
 * @return {Promise<Group[]>} List of all groups for the school
 */
export async function getGroupsBySchool(
  schoolId: string,
  service: GroupsService = new GroupsService()
): Promise<Group[]> {
  return service.listGroupsBySchool(schoolId);
}

/**
 * Get all groups (alias for listGroupsHandler with session's school)
 * 
 * @param {UserSession | null} session - Current user session
 * @param {GroupsService} service - Groups service instance
 * @return {Promise<Group[]>} List of groups
 */
export async function getAllGroups(
  session: UserSession | null,
  service: GroupsService = new GroupsService()
): Promise<Group[]> {
  requireAuth(session);
  return listGroupsHandler(session, session!.schoolId, service);
}
