/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 * 
 * Integration tests for complete data management workflow.
 * Tests Schools, Groups, Notices, and Attachments with RLS.
 */

import { SchoolsService as _SchoolsService } from '../../lib/services/schools.service';
import { GroupsService as _GroupsService } from '../../lib/services/groups.service';
import { NoticesService as _NoticesService } from '../../lib/services/notices.service';
import { AttachmentsService } from '../../lib/services/attachments.service';
import {
  createSchoolHandler,
  listSchoolsHandler,
} from '../../lib/handlers/schools-handler';
import {
  createGroupHandler,
  listGroupsHandler,
} from '../../lib/handlers/groups-handler';
import {
  createNoticeHandler,
  listNoticesHandler,
} from '../../lib/handlers/notices-handler';
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

describe('Data Management Integration Tests', () => {
  let adminSession: UserSession;
  let userSession: UserSession;

  beforeEach(() => {
    jest.clearAllMocks();

    adminSession = {
      uid: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      schoolId: 'adminSchool',
    };

    userSession = {
      uid: 'user123',
      email: 'user@example.com',
      role: 'user',
      schoolId: 'school123',
      groupIds: ['group1'],
    };

    // Setup mock implementations
    setupMocks();
  });

  function setupMocks() {
    const mockSchools = new Map();
    const mockGroups = new Map();
    const mockNotices = new Map();

    // Mock Firestore collection
    (adminDb.collection as jest.Mock).mockImplementation(
      (collectionName: string) => {
        const mockAdd = jest.fn(async (data: any) => {
          const id = `${collectionName}_${Date.now()}`;
          if (collectionName === 'schools') mockSchools.set(id, data);
          if (collectionName === 'groups') mockGroups.set(id, data);
          if (collectionName === 'notices') mockNotices.set(id, data);
          return { id };
        });

        const mockGet = jest.fn(async () => {
          let docs: any[] = [];
          if (collectionName === 'schools') {
            docs = Array.from(mockSchools.entries()).map(([id, data]) => ({
              id,
              data: () => data,
            }));
          }
          if (collectionName === 'groups') {
            docs = Array.from(mockGroups.entries()).map(([id, data]) => ({
              id,
              data: () => data,
            }));
          }
          if (collectionName === 'notices') {
            docs = Array.from(mockNotices.entries()).map(([id, data]) => ({
              id,
              data: () => data,
            }));
          }
          return { docs };
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
          set: jest.fn(),
          delete: jest.fn(),
        }));

        const mockWhere = jest.fn(() => ({
          orderBy: jest.fn(() => ({
            get: mockGet,
          })),
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              get: mockGet,
            })),
          })),
        }));

        const mockOrderBy = jest.fn(() => ({
          get: mockGet,
        }));

        return {
          add: mockAdd,
          doc: mockDoc,
          where: mockWhere,
          orderBy: mockOrderBy,
          get: mockGet,
        };
      }
    );
  }

  describe('Complete Workflow: School → Group → Notice', () => {
    it('should handle complete data management flow', async () => {
      // 1. Admin creates a school
      const school = await createSchoolHandler(
        adminSession,
        {
          name: 'Test High School',
          address: '123 Education St',
          contactEmail: 'contact@testschool.com',
        }
      );

      expect(school.name).toBe('Test High School');
      expect(school.schoolId).toBeDefined();

      // 2. Admin creates groups for the school
      const group1 = await createGroupHandler(
        adminSession,
        {
          schoolId: school.schoolId,
          name: 'Grade 10A',
          description: 'Tenth grade class A',
        }
      );

      expect(group1.name).toBe('Grade 10A');
      expect(group1.schoolId).toBe(school.schoolId);

      // 3. Admin creates a notice
      const noticeResult = await createNoticeHandler(
        adminSession,
        {
          schoolId: school.schoolId,
          title: 'Important Announcement',
          body: 'School will be closed tomorrow for maintenance.',
          status: 'published',
        }
      );

      expect(noticeResult.success).toBe(true);
      expect(noticeResult.notice).toBeDefined();
      const notice = noticeResult.notice!;
      expect(notice.title).toBe('Important Announcement');
      expect(notice.schoolId).toBe(school.schoolId);
      expect(notice.status).toBe('published');

      // 4. Verify admin can list all data
      const allSchools = await listSchoolsHandler(adminSession);
      expect(allSchools.length).toBeGreaterThan(0);

      const allGroups = await listGroupsHandler(
        adminSession,
        school.schoolId
      );
      expect(allGroups.length).toBeGreaterThan(0);

      const allNotices = await listNoticesHandler(
        adminSession,
        school.schoolId
      );
      expect(allNotices.length).toBeGreaterThan(0);
    });
  });

  describe('Row-Level Security (RLS) Enforcement', () => {
    it('should enforce RLS for regular users', async () => {
      // User can only see their own school
      const userSchools = await listSchoolsHandler(userSession);
      expect(userSchools.length).toBeLessThanOrEqual(1);

      // User trying to access another school should fail
      await expect(
        listNoticesHandler(userSession, 'otherSchool')
      ).rejects.toThrow('Access denied');
    });

    it('should allow admin to access all schools', async () => {
      await expect(
        listNoticesHandler(adminSession, 'anySchool')
      ).resolves.toBeDefined();
    });
  });

  describe('Attachment Management', () => {
    it('should handle file upload and metadata', async () => {
      const attachmentService = new AttachmentsService();

      // Mock storage bucket
      const mockSave = jest.fn();
      const mockFile = jest.fn(() => ({
        save: mockSave,
        getSignedUrl: jest.fn(async () => ['https://signed-url.com']),
      }));
      const mockBucket = jest.fn(() => ({
        file: mockFile,
      }));
      (adminStorage.bucket as jest.Mock) = mockBucket;

      const attachment = await attachmentService.uploadAttachment({
        buffer: Buffer.from('test file content'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        schoolId: 'school123',
        noticeId: 'notice123',
      });

      expect(attachment.fileName).toBe('test.pdf');
      expect(attachment.fileType).toBe('application/pdf');
      expect(attachment.downloadURL).toContain('/api/attachments/download/');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should validate file types', () => {
      const attachmentService = new AttachmentsService();

      // Should accept PDF
      expect(() =>
        attachmentService.validateFileType('application/pdf')
      ).not.toThrow();

      // Should reject unsupported types
      expect(() =>
        attachmentService.validateFileType('application/zip')
      ).toThrow('Unsupported file type');
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields for schools', async () => {
      await expect(
        createSchoolHandler(adminSession, { name: '' })
      ).rejects.toThrow('School name is required');
    });

    it('should validate required fields for groups', async () => {
      await expect(
        createGroupHandler(adminSession, {
          schoolId: '',
          name: 'Test Group',
        })
      ).rejects.toThrow('School ID is required');
    });

    it('should validate required fields for notices', async () => {
      const result = await createNoticeHandler(adminSession, {
        schoolId: 'school123',
        title: '',
        body: 'Test body',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Notice title is required');
      expect(result.error?.code).toBe('creation_failed');
    });
  });
});
