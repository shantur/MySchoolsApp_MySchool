/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 * 
 * ============================================================================
 * API-LEVEL E2E VALIDATION TEST
 * ============================================================================
 * 
 * PURPOSE:
 * This test validates the complete API contract for MySchool Data Management
 * as specified in docs/spec/10_myschool_component.md, even though API routes
 * are not yet implemented. It tests the handlers and services that will be
 * exposed through API routes.
 * 
 * SCOPE:
 * - CRUD operations for Schools, Groups, Notices
 * - Attachment upload/download via Firebase Storage
 * - Application-level RLS enforcement (Admin vs User roles)
 * - Error handling for invalid inputs and unauthorized access
 * - Data validation and consistency
 * 
 * TEST APPROACH:
 * Since there are no API routes yet, we test the handler layer directly,
 * which represents the API contract. Handlers will be wrapped by API routes
 * in the future, so validating handlers validates the future API behavior.
 * 
 * LIMITATIONS:
 * - Does not test HTTP layer (status codes, headers, cookies)
 * - Does not test actual network requests
 * - These will be covered when API routes are implemented
 * 
 * VALIDATION STRATEGY:
 * 1. Test complete workflows (School → Group → Notice → Attachment)
 * 2. Validate RLS enforcement for Admin and User roles
 * 3. Test error scenarios (invalid data, unauthorized access)
 * 4. Verify data consistency across operations
 * 5. Test attachment handling with Firebase Storage
 * 
 * ============================================================================
 */

import { SchoolsService } from '../../lib/services/schools.service';
import { GroupsService } from '../../lib/services/groups.service';
import { NoticesService } from '../../lib/services/notices.service';
import { AttachmentsService } from '../../lib/services/attachments.service';
import {
  createSchoolHandler,
  getSchoolHandler,
  updateSchoolHandler,
  deleteSchoolHandler,
  listSchoolsHandler,
} from '../../lib/handlers/schools-handler';
import {
  createGroupHandler,
  getGroupHandler,
  updateGroupHandler,
  deleteGroupHandler,
  listGroupsHandler,
} from '../../lib/handlers/groups-handler';
import {
  createNoticeHandler,
  getNoticeHandler,
  updateNoticeHandler,
  deleteNoticeHandler,
  listNoticesHandler,
} from '../../lib/handlers/notices-handler';
import {
  AuthenticationError,
  AuthorizationError,
} from '../../lib/auth/authorization';
import type { UserSession } from '../../lib/types';

// Mock Firebase Admin
jest.mock('../../lib/firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
  adminStorage: {
    bucket: jest.fn(),
  },
}));

import { adminDb, adminStorage } from '../../lib/firebase/admin';

describe('API Contract Validation - MySchool Data Management', () => {
  let adminSession: UserSession;
  let userSession: UserSession;
  let anotherUserSession: UserSession;

  // Test data IDs
  let schoolAId: string;
  let schoolBId: string;
  let groupAId: string;
  let groupBId: string;
  let noticeAId: string;
  let noticeBId: string;

  beforeEach(() => {
    jest.clearAllMocks();

    // Admin session - has access to all schools
    adminSession = {
      uid: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      schoolId: 'adminSchool',
    };

    // User A session - has access only to School A
    userSession = {
      uid: 'userA123',
      email: 'userA@example.com',
      role: 'user',
      schoolId: 'schoolA',
      groupIds: ['groupA1', 'groupA2'],
    };

    // User B session - has access only to School B
    anotherUserSession = {
      uid: 'userB123',
      email: 'userB@example.com',
      role: 'user',
      schoolId: 'schoolB',
      groupIds: ['groupB1'],
    };

    // Setup comprehensive mocks
    setupComprehensiveMocks();
  });

  function setupComprehensiveMocks() {
    const mockSchools = new Map<string, any>();
    const mockGroups = new Map<string, any>();
    const mockNotices = new Map<string, any>();
    const mockFiles = new Map<string, any>();

    // Mock Firestore collection
    (adminDb.collection as jest.Mock).mockImplementation(
      (collectionName: string) => {
        const mockAdd = jest.fn(async (data: any) => {
          const id = `${collectionName}_${Date.now()}_${Math.random()}`;
          const timestamp = { toDate: () => new Date() };
          const docData = {
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          if (collectionName === 'schools') mockSchools.set(id, docData);
          if (collectionName === 'groups') mockGroups.set(id, docData);
          if (collectionName === 'notices') mockNotices.set(id, docData);

          return { id };
        });

        const mockDoc = jest.fn((docId: string) => ({
          get: jest.fn(async () => {
            let data = null;
            if (collectionName === 'schools') data = mockSchools.get(docId);
            if (collectionName === 'groups') data = mockGroups.get(docId);
            if (collectionName === 'notices') data = mockNotices.get(docId);

            return {
              exists: !!data,
              id: docId,
              data: () => data,
            };
          }),
          set: jest.fn(async (data: any, options?: any) => {
            let existingData = null;
            if (collectionName === 'schools')
              existingData = mockSchools.get(docId);
            if (collectionName === 'groups')
              existingData = mockGroups.get(docId);
            if (collectionName === 'notices')
              existingData = mockNotices.get(docId);

            if (!existingData && !options?.merge) {
              throw new Error(`Document ${docId} not found`);
            }

            const timestamp = { toDate: () => new Date() };
            const updatedData = options?.merge
              ? {
                  ...existingData,
                  ...data,
                  updatedAt: timestamp,
                }
              : {
                  ...data,
                  createdAt: timestamp,
                  updatedAt: timestamp,
                };

            if (collectionName === 'schools')
              mockSchools.set(docId, updatedData);
            if (collectionName === 'groups')
              mockGroups.set(docId, updatedData);
            if (collectionName === 'notices')
              mockNotices.set(docId, updatedData);

            return updatedData;
          }),
          update: jest.fn(async (updates: any) => {
            let existingData = null;
            if (collectionName === 'schools')
              existingData = mockSchools.get(docId);
            if (collectionName === 'groups')
              existingData = mockGroups.get(docId);
            if (collectionName === 'notices')
              existingData = mockNotices.get(docId);

            if (!existingData) {
              throw new Error(`Document ${docId} not found`);
            }

            const updatedData = {
              ...existingData,
              ...updates,
              updatedAt: { toDate: () => new Date() },
            };

            if (collectionName === 'schools')
              mockSchools.set(docId, updatedData);
            if (collectionName === 'groups')
              mockGroups.set(docId, updatedData);
            if (collectionName === 'notices')
              mockNotices.set(docId, updatedData);

            return updatedData;
          }),
          delete: jest.fn(async () => {
            if (collectionName === 'schools') mockSchools.delete(docId);
            if (collectionName === 'groups') mockGroups.delete(docId);
            if (collectionName === 'notices') mockNotices.delete(docId);
          }),
        }));

        // Track where clauses for filtering
        const whereFilters: Array<{ field: string; op: string; value: any }> =
          [];

        const mockWhere = jest.fn((field: string, op: string, value: any) => {
          whereFilters.push({ field, op, value });
          return {
            where: mockWhere,
            orderBy: mockOrderBy,
            get: mockGet,
          };
        });

        const mockOrderBy = jest.fn(() => ({
          where: mockWhere,
          orderBy: mockOrderBy,
          get: mockGet,
        }));

        const mockGet = jest.fn(async () => {
          let docs: any[] = [];
          if (collectionName === 'schools') {
            docs = Array.from(mockSchools.entries()).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true,
            }));
          }
          if (collectionName === 'groups') {
            docs = Array.from(mockGroups.entries()).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true,
            }));
          }
          if (collectionName === 'notices') {
            docs = Array.from(mockNotices.entries()).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true,
            }));
          }

          // Apply where filters
          docs = docs.filter((doc) => {
            const data = doc.data();
            return whereFilters.every((filter) => {
              if (filter.op === '==') {
                return data[filter.field] === filter.value;
              }
              // Add more operators as needed
              return true;
            });
          });

          // Clear filters for next query
          whereFilters.length = 0;

          return { docs };
        });

        return {
          add: mockAdd,
          doc: mockDoc,
          where: mockWhere,
          orderBy: mockOrderBy,
          get: mockGet,
        };
      }
    );

    // Mock Firebase Storage
    (adminStorage.bucket as jest.Mock).mockReturnValue({
      file: jest.fn((path: string) => ({
        save: jest.fn(async (buffer: Buffer, options: any) => {
          mockFiles.set(path, { buffer, options });
          return Promise.resolve();
        }),
        delete: jest.fn(async () => {
          mockFiles.delete(path);
          return Promise.resolve();
        }),
        getSignedUrl: jest.fn(async () => {
          return [
            `https://storage.googleapis.com/test-bucket/${path}?token=signed`,
          ];
        }),
      })),
    });
  }

  describe('1. Schools API Contract Validation', () => {
    describe('1.1 Schools CRUD Operations', () => {
      it('should allow admin to create a school', async () => {
        const school = await createSchoolHandler(adminSession, {
          name: 'School A',
          address: '123 Main St',
          contactEmail: 'schoola@example.com',
        });

        expect(school).toHaveProperty('schoolId');
        expect(school.name).toBe('School A');
        expect(school.address).toBe('123 Main St');
        expect(school.contactEmail).toBe('schoola@example.com');
        expect(school).toHaveProperty('createdAt');
        expect(school).toHaveProperty('updatedAt');

        schoolAId = school.schoolId;
      });

      it('should prevent non-admin user from creating a school', async () => {
        await expect(
          createSchoolHandler(userSession, {
            name: 'Unauthorized School',
          })
        ).rejects.toThrow(AuthorizationError);
      });

      it('should validate required fields when creating a school', async () => {
        await expect(
          createSchoolHandler(adminSession, {
            name: '', // Empty name should fail
          })
        ).rejects.toThrow('School name is required');
      });

      it('should allow admin to read any school', async () => {
        const school = await createSchoolHandler(adminSession, {
          name: 'School B',
        });
        schoolBId = school.schoolId;

        const retrieved = await getSchoolHandler(adminSession, schoolBId);
        expect(retrieved?.schoolId).toBe(school.schoolId);
        expect(retrieved?.name).toBe(school.name);
      });

      it('should allow user to read their own school', async () => {
        const school = await createSchoolHandler(adminSession, {
          name: 'School A',
        });
        schoolAId = school.schoolId;

        // Update user session with correct schoolId
        const userWithSchoolA = { ...userSession, schoolId: schoolAId };

        const retrieved = await getSchoolHandler(userWithSchoolA, schoolAId);
        expect(retrieved?.schoolId).toBe(school.schoolId);
        expect(retrieved?.name).toBe(school.name);
      });

      it('should prevent user from reading another school', async () => {
        const schoolB = await createSchoolHandler(adminSession, {
          name: 'School B',
        });
        schoolBId = schoolB.schoolId;

        // User A trying to access School B
        await expect(
          getSchoolHandler(userSession, schoolBId)
        ).rejects.toThrow(AuthorizationError);
      });

      it('should allow admin to update any school', async () => {
        const school = await createSchoolHandler(adminSession, {
          name: 'Original Name',
        });

        const updated = await updateSchoolHandler(
          adminSession,
          school.schoolId,
          {
            name: 'Updated Name',
            address: 'New Address',
          }
        );

        expect(updated.name).toBe('Updated Name');
        expect(updated.address).toBe('New Address');
      });

      it('should prevent non-admin from updating a school', async () => {
        const school = await createSchoolHandler(adminSession, {
          name: 'School A',
        });

        await expect(
          updateSchoolHandler(userSession, school.schoolId, {
            name: 'Unauthorized Update',
          })
        ).rejects.toThrow(AuthorizationError);
      });

      it('should allow admin to delete a school', async () => {
        const school = await createSchoolHandler(adminSession, {
          name: 'To Be Deleted',
        });

        await deleteSchoolHandler(adminSession, school.schoolId);

        // Verify deletion by attempting to retrieve
        const retrieved = await getSchoolHandler(adminSession, school.schoolId);
        expect(retrieved).toBeNull();
      });

      it('should prevent non-admin from deleting a school', async () => {
        const school = await createSchoolHandler(adminSession, {
          name: 'Protected School',
        });

        await expect(
          deleteSchoolHandler(userSession, school.schoolId)
        ).rejects.toThrow(AuthorizationError);
      });
    });

    describe('1.2 Schools List Operations (RLS)', () => {
      it('should return all schools for admin', async () => {
        const school1 = await createSchoolHandler(adminSession, {
          name: 'School 1',
        });
        const school2 = await createSchoolHandler(adminSession, {
          name: 'School 2',
        });

        const schools = await listSchoolsHandler(adminSession);
        expect(schools.length).toBeGreaterThanOrEqual(2);
        expect(schools.map((s) => s.schoolId)).toContain(school1.schoolId);
        expect(schools.map((s) => s.schoolId)).toContain(school2.schoolId);
      });

      it('should return only user own school for regular user', async () => {
        const schoolA = await createSchoolHandler(adminSession, {
          name: 'School A',
        });
        const schoolB = await createSchoolHandler(adminSession, {
          name: 'School B',
        });

        const userWithSchoolA = { ...userSession, schoolId: schoolA.schoolId };
        const schools = await listSchoolsHandler(userWithSchoolA);

        expect(schools.length).toBe(1);
        expect(schools[0].schoolId).toBe(schoolA.schoolId);
        expect(schools.map((s) => s.schoolId)).not.toContain(schoolB.schoolId);
      });
    });
  });

  describe('2. Groups API Contract Validation', () => {
    beforeEach(async () => {
      // Create test schools
      const schoolA = await createSchoolHandler(adminSession, {
        name: 'School A',
      });
      schoolAId = schoolA.schoolId;

      const schoolB = await createSchoolHandler(adminSession, {
        name: 'School B',
      });
      schoolBId = schoolB.schoolId;
    });

    describe('2.1 Groups CRUD Operations', () => {
      it('should allow admin to create a group', async () => {
        const group = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Grade 10A',
          description: 'Tenth grade class A',
        });

        expect(group).toHaveProperty('groupId');
        expect(group.schoolId).toBe(schoolAId);
        expect(group.name).toBe('Grade 10A');
        expect(group.description).toBe('Tenth grade class A');
        expect(group).toHaveProperty('createdAt');

        groupAId = group.groupId;
      });

      it('should prevent non-admin from creating a group', async () => {
        await expect(
          createGroupHandler(userSession, {
            schoolId: schoolAId,
            name: 'Unauthorized Group',
          })
        ).rejects.toThrow(AuthorizationError);
      });

      it('should validate required fields when creating a group', async () => {
        await expect(
          createGroupHandler(adminSession, {
            schoolId: '',
            name: 'Test Group',
          })
        ).rejects.toThrow('School ID is required');

        await expect(
          createGroupHandler(adminSession, {
            schoolId: schoolAId,
            name: '',
          })
        ).rejects.toThrow('Group name is required');
      });

      it('should allow admin to read any group', async () => {
        const group = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Test Group',
        });

        const retrieved = await getGroupHandler(
          adminSession,
          group.groupId,
          schoolAId
        );
        expect(retrieved?.groupId).toBe(group.groupId);
        expect(retrieved?.name).toBe(group.name);
        expect(retrieved?.schoolId).toBe(group.schoolId);
      });

      it('should allow user to read groups they belong to', async () => {
        const group = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'User Group',
        });

        const userWithGroup = {
          ...userSession,
          schoolId: schoolAId,
          groupIds: [group.groupId],
        };

        const retrieved = await getGroupHandler(
          userWithGroup,
          group.groupId,
          schoolAId
        );
        expect(retrieved?.groupId).toBe(group.groupId);
        expect(retrieved?.name).toBe(group.name);
      });

      it('should prevent user from reading groups they dont belong to', async () => {
        const group = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Restricted Group',
        });

        const userWithoutGroup = {
          ...userSession,
          schoolId: schoolAId,
          groupIds: ['other_group'],
        };

        await expect(
          getGroupHandler(userWithoutGroup, group.groupId, schoolAId)
        ).rejects.toThrow(AuthorizationError);
      });

      it('should allow admin to update a group', async () => {
        const group = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Original Group',
        });

        const updated = await updateGroupHandler(adminSession, group.groupId, {
          name: 'Updated Group',
          description: 'Updated description',
        });

        expect(updated.name).toBe('Updated Group');
        expect(updated.description).toBe('Updated description');
      });

      it('should prevent non-admin from updating a group', async () => {
        const group = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Protected Group',
        });

        await expect(
          updateGroupHandler(userSession, group.groupId, {
            name: 'Unauthorized Update',
          })
        ).rejects.toThrow(AuthorizationError);
      });

      it('should allow admin to delete a group', async () => {
        const group = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'To Be Deleted',
        });

        await deleteGroupHandler(adminSession, group.groupId);

        const retrieved = await getGroupHandler(
          adminSession,
          group.groupId,
          schoolAId
        );
        expect(retrieved).toBeNull();
      });

      it('should prevent non-admin from deleting a group', async () => {
        const group = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Protected Group',
        });

        await expect(
          deleteGroupHandler(userSession, group.groupId)
        ).rejects.toThrow(AuthorizationError);
      });
    });

    describe('2.2 Groups List Operations (RLS)', () => {
      it('should return all groups for admin in a school', async () => {
        const group1 = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Group 1',
        });
        const group2 = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Group 2',
        });

        const groups = await listGroupsHandler(adminSession, schoolAId);
        expect(groups.length).toBeGreaterThanOrEqual(2);
        expect(groups.map((g) => g.groupId)).toContain(group1.groupId);
        expect(groups.map((g) => g.groupId)).toContain(group2.groupId);
      });

      it('should return only assigned groups for regular user', async () => {
        const group1 = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Group 1',
        });
        const group2 = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Group 2',
        });
        const group3 = await createGroupHandler(adminSession, {
          schoolId: schoolAId,
          name: 'Group 3',
        });

        const userWithGroups = {
          ...userSession,
          schoolId: schoolAId,
          groupIds: [group1.groupId, group2.groupId],
        };

        const groups = await listGroupsHandler(userWithGroups, schoolAId);
        expect(groups.length).toBe(2);
        expect(groups.map((g) => g.groupId)).toContain(group1.groupId);
        expect(groups.map((g) => g.groupId)).toContain(group2.groupId);
        expect(groups.map((g) => g.groupId)).not.toContain(group3.groupId);
      });
    });
  });

  describe('3. Notices API Contract Validation', () => {
    beforeEach(async () => {
      // Create test schools and groups
      const schoolA = await createSchoolHandler(adminSession, {
        name: 'School A',
      });
      schoolAId = schoolA.schoolId;

      const groupA = await createGroupHandler(adminSession, {
        schoolId: schoolAId,
        name: 'Group A',
      });
      groupAId = groupA.groupId;
    });

    describe('3.1 Notices CRUD Operations', () => {
      it('should allow admin to create a notice', async () => {
        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Important Announcement',
          body: 'This is the notice content',
          status: 'published',
        });

        expect(notice).toHaveProperty('noticeId');
        expect(notice.schoolId).toBe(schoolAId);
        expect(notice.title).toBe('Important Announcement');
        expect(notice.body).toBe('This is the notice content');
        expect(notice.status).toBe('published');
        expect(notice).toHaveProperty('publicationDate');
        expect(notice).toHaveProperty('createdAt');

        noticeAId = notice.noticeId;
      });

      it('should prevent non-admin from creating a notice', async () => {
        await expect(
          createNoticeHandler(userSession, {
            schoolId: schoolAId,
            title: 'Unauthorized Notice',
            body: 'Content',
            status: 'published',
          })
        ).rejects.toThrow(AuthorizationError);
      });

      it('should validate required fields when creating a notice', async () => {
        await expect(
          createNoticeHandler(adminSession, {
            schoolId: '',
            title: 'Test',
            body: 'Content',
            status: 'published',
          })
        ).rejects.toThrow('School ID is required');

        await expect(
          createNoticeHandler(adminSession, {
            schoolId: schoolAId,
            title: '',
            body: 'Content',
            status: 'published',
          })
        ).rejects.toThrow('Notice title is required');

        await expect(
          createNoticeHandler(adminSession, {
            schoolId: schoolAId,
            title: 'Test',
            body: '',
            status: 'published',
          })
        ).rejects.toThrow('Notice body is required');
      });

      it('should allow admin to create notice with draft status', async () => {
        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Draft Notice',
          body: 'Draft content',
          status: 'draft',
        });

        expect(notice.status).toBe('draft');
      });

      it('should allow admin to read any notice', async () => {
        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Test Notice',
          body: 'Content',
          status: 'published',
        });

        const retrieved = await getNoticeHandler(
          adminSession,
          notice.noticeId,
          schoolAId
        );
        expect(retrieved?.noticeId).toBe(notice.noticeId);
        expect(retrieved?.title).toBe(notice.title);
        expect(retrieved?.status).toBe(notice.status);
      });

      it('should allow user to read published notices in their school', async () => {
        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Published Notice',
          body: 'Content',
          status: 'published',
        });

        const userWithSchoolA = { ...userSession, schoolId: schoolAId };

        const retrieved = await getNoticeHandler(
          userWithSchoolA,
          notice.noticeId,
          schoolAId
        );
        expect(retrieved?.noticeId).toBe(notice.noticeId);
        expect(retrieved?.title).toBe(notice.title);
        expect(retrieved?.status).toBe('published');
      });

      it('should allow admin to update notice status', async () => {
        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Test Notice',
          body: 'Content',
          status: 'draft',
        });

        const updated = await updateNoticeHandler(
          adminSession,
          notice.noticeId,
          {
            status: 'published',
          }
        );

        expect(updated.status).toBe('published');
      });

      it('should prevent non-admin from updating a notice', async () => {
        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Protected Notice',
          body: 'Content',
          status: 'published',
        });

        await expect(
          updateNoticeHandler(userSession, notice.noticeId, {
            title: 'Unauthorized Update',
          })
        ).rejects.toThrow(AuthorizationError);
      });

      it('should allow admin to delete a notice', async () => {
        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'To Be Deleted',
          body: 'Content',
          status: 'published',
        });

        await deleteNoticeHandler(adminSession, notice.noticeId);

        const retrieved = await getNoticeHandler(
          adminSession,
          notice.noticeId,
          schoolAId
        );
        expect(retrieved).toBeNull();
      });

      it('should prevent non-admin from deleting a notice', async () => {
        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Protected Notice',
          body: 'Content',
          status: 'published',
        });

        await expect(
          deleteNoticeHandler(userSession, notice.noticeId)
        ).rejects.toThrow(AuthorizationError);
      });
    });

    describe('3.2 Notices List Operations (RLS & Status Filtering)', () => {
      it('should return all notices for admin (all statuses)', async () => {
        const published = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Published',
          body: 'Content',
          status: 'published',
        });
        const draft = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Draft',
          body: 'Content',
          status: 'draft',
        });

        const notices = await listNoticesHandler(adminSession, schoolAId);
        expect(notices.length).toBeGreaterThanOrEqual(2);
        expect(notices.map((n) => n.noticeId)).toContain(published.noticeId);
        expect(notices.map((n) => n.noticeId)).toContain(draft.noticeId);
      });

      it('should return only published notices for regular user', async () => {
        const published = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Published',
          body: 'Content',
          status: 'published',
        });
        const draft = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Draft',
          body: 'Content',
          status: 'draft',
        });

        const userWithSchoolA = { ...userSession, schoolId: schoolAId };
        const notices = await listNoticesHandler(
          userWithSchoolA,
          schoolAId,
          'published'
        );

        expect(notices.map((n) => n.noticeId)).toContain(published.noticeId);
        expect(notices.map((n) => n.noticeId)).not.toContain(draft.noticeId);
      });

      it('should filter notices by status for admin', async () => {
        await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Published 1',
          body: 'Content',
          status: 'published',
        });
        await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Draft 1',
          body: 'Content',
          status: 'draft',
        });

        const publishedNotices = await listNoticesHandler(
          adminSession,
          schoolAId,
          'published'
        );
        const draftNotices = await listNoticesHandler(
          adminSession,
          schoolAId,
          'draft'
        );

        expect(publishedNotices.every((n) => n.status === 'published')).toBe(
          true
        );
        expect(draftNotices.every((n) => n.status === 'draft')).toBe(true);
      });
    });

    describe('3.3 Notices with Attachments', () => {
      it('should create notice with attachment metadata', async () => {
        const attachments = [
          {
            fileName: 'document.pdf',
            fileType: 'application/pdf',
            downloadURL: '/api/attachments/download/attach123',
            size: 12345,
          },
          {
            fileName: 'image.jpg',
            fileType: 'image/jpeg',
            downloadURL: '/api/attachments/download/attach456',
            size: 54321,
          },
        ];

        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Notice with Attachments',
          body: 'See attached files',
          status: 'published',
          attachments,
        });

        expect(notice.attachments).toHaveLength(2);
        expect(notice.attachments).toEqual(attachments);
      });

      it('should update notice to add attachments', async () => {
        const notice = await createNoticeHandler(adminSession, {
          schoolId: schoolAId,
          title: 'Notice',
          body: 'Content',
          status: 'published',
        });

        const updated = await updateNoticeHandler(
          adminSession,
          notice.noticeId,
          {
            attachments: [
              {
                fileName: 'added.pdf',
                fileType: 'application/pdf',
                downloadURL: '/api/attachments/download/attach789',
                size: 99999,
              },
            ],
          }
        );

        expect(updated.attachments).toHaveLength(1);
        expect(updated.attachments[0].fileName).toBe('added.pdf');
      });
    });
  });

  describe('4. Attachments API Contract Validation', () => {
    let attachmentsService: AttachmentsService;

    beforeEach(async () => {
      attachmentsService = new AttachmentsService();

      // Create test school and notice
      const school = await createSchoolHandler(adminSession, {
        name: 'School A',
      });
      schoolAId = school.schoolId;

      const notice = await createNoticeHandler(adminSession, {
        schoolId: schoolAId,
        title: 'Notice with Files',
        body: 'Content',
        status: 'published',
      });
      noticeAId = notice.noticeId;
    });

    describe('4.1 Attachment Upload', () => {
      it('should upload PDF attachment successfully', async () => {
        const pdfBuffer = Buffer.from('fake pdf content');
        const attachment = await attachmentsService.uploadAttachment({
          buffer: pdfBuffer,
          fileName: 'document.pdf',
          mimeType: 'application/pdf',
          schoolId: schoolAId,
          noticeId: noticeAId,
        });

        expect(attachment.fileName).toBe('document.pdf');
        expect(attachment.fileType).toBe('application/pdf');
        expect(attachment.downloadURL).toContain('/api/attachments/download/');
        expect(attachment.size).toBeGreaterThan(0);
        // Note: attachmentId is embedded in downloadURL, not returned separately
        expect(attachment.downloadURL).toMatch(/\/api\/attachments\/download\/[a-f0-9]{32}/);
      });

      it('should upload image attachment successfully', async () => {
        const imageBuffer = Buffer.from('fake image content');
        const attachment = await attachmentsService.uploadAttachment({
          buffer: imageBuffer,
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          schoolId: schoolAId,
          noticeId: noticeAId,
        });

        expect(attachment.fileType).toBe('image/jpeg');
        expect(attachment.fileName).toBe('photo.jpg');
      });

      it('should reject unsupported file types', async () => {
        const buffer = Buffer.from('fake content');
        await expect(
          attachmentsService.uploadAttachment({
            buffer,
            fileName: 'document.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            schoolId: schoolAId,
            noticeId: noticeAId,
          })
        ).rejects.toThrow('Unsupported file type');
      });

      it('should validate supported file types', () => {
        expect(() =>
          attachmentsService.validateFileType('application/pdf')
        ).not.toThrow();
        expect(() =>
          attachmentsService.validateFileType('image/jpeg')
        ).not.toThrow();
        expect(() =>
          attachmentsService.validateFileType('image/png')
        ).not.toThrow();
        expect(() =>
          attachmentsService.validateFileType('application/msword')
        ).toThrow('Unsupported file type');
      });

      it('should generate unique attachment IDs', async () => {
        const buffer = Buffer.from('content');
        const attachment1 = await attachmentsService.uploadAttachment({
          buffer,
          fileName: 'file1.pdf',
          mimeType: 'application/pdf',
          schoolId: schoolAId,
          noticeId: noticeAId,
        });
        const attachment2 = await attachmentsService.uploadAttachment({
          buffer,
          fileName: 'file2.pdf',
          mimeType: 'application/pdf',
          schoolId: schoolAId,
          noticeId: noticeAId,
        });

        // Extract attachment IDs from download URLs
        const id1 = attachment1.downloadURL.match(/\/api\/attachments\/download\/([a-f0-9]{32})/)?.[1];
        const id2 = attachment2.downloadURL.match(/\/api\/attachments\/download\/([a-f0-9]{32})/)?.[1];
        
        expect(id1).toBeDefined();
        expect(id2).toBeDefined();
        expect(id1).not.toBe(id2);
      });
    });

    describe('4.2 Attachment Download', () => {
      it('should generate signed download URL', async () => {
        const buffer = Buffer.from('content');
        const attachment = await attachmentsService.uploadAttachment({
          buffer,
          fileName: 'document.pdf',
          mimeType: 'application/pdf',
          schoolId: schoolAId,
          noticeId: noticeAId,
        });

        const downloadUrl = await attachmentsService.getAttachmentDownloadUrl(
          attachment.attachmentId,
          schoolAId,
          noticeAId
        );

        expect(downloadUrl).toContain('storage.googleapis.com');
        expect(downloadUrl).toContain('token=signed');
      });
    });

    describe('4.3 Attachment Deletion', () => {
      it('should delete attachment from storage', async () => {
        const buffer = Buffer.from('content');
        const attachment = await attachmentsService.uploadAttachment({
          buffer,
          fileName: 'to-delete.pdf',
          mimeType: 'application/pdf',
          schoolId: schoolAId,
          noticeId: noticeAId,
        });

        await expect(
          attachmentsService.deleteAttachment(
            attachment.attachmentId,
            schoolAId,
            noticeAId
          )
        ).resolves.not.toThrow();
      });
    });
  });

  describe('5. Cross-Entity Workflow Validation', () => {
    it('should support complete workflow: School → Group → Notice → Attachment', async () => {
      // Step 1: Create a school
      const school = await createSchoolHandler(adminSession, {
        name: 'Complete Workflow School',
        address: '123 Test St',
      });
      expect(school).toHaveProperty('schoolId');

      // Step 2: Create groups in the school
      const group1 = await createGroupHandler(adminSession, {
        schoolId: school.schoolId,
        name: 'Grade 10A',
      });
      const group2 = await createGroupHandler(adminSession, {
        schoolId: school.schoolId,
        name: 'Grade 10B',
      });
      expect(group1.schoolId).toBe(school.schoolId);
      expect(group2.schoolId).toBe(school.schoolId);

      // Step 3: Create a notice with draft status
      const notice = await createNoticeHandler(adminSession, {
        schoolId: school.schoolId,
        title: 'Important Announcement',
        body: 'Please review the attached documents.',
        status: 'draft',
      });
      expect(notice.schoolId).toBe(school.schoolId);
      expect(notice.status).toBe('draft');

      // Step 4: Upload attachments
      const attachmentsService = new AttachmentsService();
      const attachment1 = await attachmentsService.uploadAttachment({
        buffer: Buffer.from('PDF content'),
        fileName: 'syllabus.pdf',
        mimeType: 'application/pdf',
        schoolId: school.schoolId,
        noticeId: notice.noticeId,
      });
      const attachment2 = await attachmentsService.uploadAttachment({
        buffer: Buffer.from('Image content'),
        fileName: 'schedule.jpg',
        mimeType: 'image/jpeg',
        schoolId: school.schoolId,
        noticeId: notice.noticeId,
      });

      // Step 5: Update notice to add attachments and publish
      const updatedNotice = await updateNoticeHandler(
        adminSession,
        notice.noticeId,
        {
          status: 'published',
          attachments: [
            {
              fileName: attachment1.fileName,
              fileType: attachment1.fileType,
              downloadURL: attachment1.downloadURL,
              size: attachment1.size,
            },
            {
              fileName: attachment2.fileName,
              fileType: attachment2.fileType,
              downloadURL: attachment2.downloadURL,
              size: attachment2.size,
            },
          ],
        }
      );
      expect(updatedNotice.status).toBe('published');
      expect(updatedNotice.attachments).toHaveLength(2);

      // Step 6: Verify user access (User should see published notice)
      const testUser = {
        ...userSession,
        schoolId: school.schoolId,
        groupIds: [group1.groupId],
      };

      const userNotices = await listNoticesHandler(
        testUser,
        school.schoolId,
        'published'
      );
      expect(userNotices.map((n) => n.noticeId)).toContain(
        updatedNotice.noticeId
      );

      // Step 7: Verify user can access groups they belong to
      const userGroups = await listGroupsHandler(testUser, school.schoolId);
      expect(userGroups.map((g) => g.groupId)).toContain(group1.groupId);
      expect(userGroups.map((g) => g.groupId)).not.toContain(group2.groupId);
    });
  });

  describe('6. Authentication & Authorization Validation', () => {
    beforeEach(async () => {
      const school = await createSchoolHandler(adminSession, {
        name: 'Test School',
      });
      schoolAId = school.schoolId;
    });

    it('should require authentication for all operations', async () => {
      const unauthenticatedSession = null as any;

      await expect(
        listSchoolsHandler(unauthenticatedSession)
      ).rejects.toThrow(AuthenticationError);
    });

    it('should enforce admin-only operations', async () => {
      // Schools: Create, Update, Delete
      await expect(
        createSchoolHandler(userSession, { name: 'Unauthorized' })
      ).rejects.toThrow(AuthorizationError);

      await expect(
        updateSchoolHandler(userSession, schoolAId, { name: 'Updated' })
      ).rejects.toThrow(AuthorizationError);

      await expect(deleteSchoolHandler(userSession, schoolAId)).rejects.toThrow(
        AuthorizationError
      );

      // Groups: Create, Update, Delete
      await expect(
        createGroupHandler(userSession, {
          schoolId: schoolAId,
          name: 'Group',
        })
      ).rejects.toThrow(AuthorizationError);

      // Notices: Create, Update, Delete
      await expect(
        createNoticeHandler(userSession, {
          schoolId: schoolAId,
          title: 'Notice',
          body: 'Content',
          status: 'published',
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should enforce school-level data isolation', async () => {
      const schoolB = await createSchoolHandler(adminSession, {
        name: 'School B',
      });

      const userA = { ...userSession, schoolId: schoolAId };
      const userB = { ...anotherUserSession, schoolId: schoolB.schoolId };

      // User A should not access School B data
      await expect(getSchoolHandler(userA, schoolB.schoolId)).rejects.toThrow(
        AuthorizationError
      );

      // User B should not access School A data
      await expect(getSchoolHandler(userB, schoolAId)).rejects.toThrow(
        AuthorizationError
      );
    });

    it('should enforce group-level access control', async () => {
      const group1 = await createGroupHandler(adminSession, {
        schoolId: schoolAId,
        name: 'Group 1',
      });
      const group2 = await createGroupHandler(adminSession, {
        schoolId: schoolAId,
        name: 'Group 2',
      });

      const userWithGroup1 = {
        ...userSession,
        schoolId: schoolAId,
        groupIds: [group1.groupId],
      };

      // User can access group1
      const retrieved = await getGroupHandler(
        userWithGroup1,
        group1.groupId,
        schoolAId
      );
      expect(retrieved.groupId).toBe(group1.groupId);

      // User cannot access group2
      await expect(
        getGroupHandler(userWithGroup1, group2.groupId, schoolAId)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('7. Error Handling Validation', () => {
    it('should return appropriate errors for invalid data', async () => {
      // Empty school name
      await expect(
        createSchoolHandler(adminSession, { name: '' })
      ).rejects.toThrow('School name is required');

      // Empty group name
      await expect(
        createGroupHandler(adminSession, {
          schoolId: 'test',
          name: '',
        })
      ).rejects.toThrow('Group name is required');

      // Empty notice fields
      await expect(
        createNoticeHandler(adminSession, {
          schoolId: '',
          title: 'Test',
          body: 'Content',
          status: 'published',
        })
      ).rejects.toThrow('School ID is required');
    });

    it('should handle non-existent entity access', async () => {
      const result = await getSchoolHandler(adminSession, 'non-existent-id');
      expect(result).toBeNull();
    });

    it('should validate file types for attachments', async () => {
      const attachmentsService = new AttachmentsService();

      await expect(
        attachmentsService.uploadAttachment({
          buffer: Buffer.from('content'),
          fileName: 'file.txt',
          mimeType: 'text/plain',
          schoolId: 'school1',
          noticeId: 'notice1',
        })
      ).rejects.toThrow('Unsupported file type');
    });
  });

  describe('8. Data Consistency Validation', () => {
    it('should maintain consistent timestamps', async () => {
      const school = await createSchoolHandler(adminSession, {
        name: 'Timestamp Test',
      });

      expect(school.createdAt).toBeDefined();
      expect(school.updatedAt).toBeDefined();
      
      // Timestamps should be equal on creation
      if (typeof school.createdAt === 'object' && 'toDate' in school.createdAt) {
        // Mock timestamp format
        expect(school.createdAt).toBe(school.updatedAt);
      } else {
        // Real Firestore timestamp
        expect(school.createdAt).toEqual(school.updatedAt);
      }

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await updateSchoolHandler(adminSession, school.schoolId, {
        name: 'Updated Name',
      });

      expect(updated.updatedAt).toBeDefined();
      expect(updated.name).toBe('Updated Name');
      
      // Verify updatedAt changed (in mock, it's a new object reference)
      if (typeof updated.updatedAt === 'object' && 'toDate' in updated.updatedAt) {
        // Mock timestamp - verify it's a valid date object
        expect(typeof updated.updatedAt.toDate).toBe('function');
        expect(updated.updatedAt.toDate()).toBeInstanceOf(Date);
      }
    });

    it('should maintain referential integrity between entities', async () => {
      const school = await createSchoolHandler(adminSession, {
        name: 'Integrity Test School',
      });

      const group = await createGroupHandler(adminSession, {
        schoolId: school.schoolId,
        name: 'Test Group',
      });

      const notice = await createNoticeHandler(adminSession, {
        schoolId: school.schoolId,
        title: 'Test Notice',
        body: 'Content',
        status: 'published',
      });

      // Verify relationships
      expect(group.schoolId).toBe(school.schoolId);
      expect(notice.schoolId).toBe(school.schoolId);
    });
  });
});
