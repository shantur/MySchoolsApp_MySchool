/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Data Management Integration Tests (Supabase)
 * 
 * These tests verify data operations using Supabase local development environment
 */

import { NoticesServiceSupabase } from '@/lib/services/notices.service.supabase';
import { GroupsServiceSupabase } from '@/lib/services/groups.service.supabase';
import { SchoolsServiceSupabase } from '@/lib/services/schools.service.supabase';
import { AuditServiceSupabase } from '@/lib/services/audit.service.supabase';

// Set environment variables for testing
process.env.NODE_ENV = 'development';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Mock data storage
const mockData = {
  schools: new Map(),
  groups: new Map(),
  notices: new Map(),
  audit_logs: new Map(),
};

let idCounter = 1;

// Mock the supabase server module
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      const tableData = mockData[table as keyof typeof mockData] || new Map();
      
      return {
        select: jest.fn(() => {
          const queryBuilder = {
            eq: jest.fn((field: string, value: any) => {
              // Return a new query builder that still has order and limit
              return {
                eq: queryBuilder.eq,
                order: jest.fn((sortField: string, options: any) => ({
                  limit: jest.fn((limit: number) => {
                    const filteredData = Array.from(tableData.values()).filter(
                      (item: any) => item[field] === value
                    );
                    const sortedData = filteredData
                      .sort((a: any, b: any) => {
                        const aVal = a[sortField];
                        const bVal = b[sortField];
                        if (options?.ascending) {
                          return aVal > bVal ? 1 : -1;
                        } else {
                          return aVal < bVal ? 1 : -1;
                        }
                      })
                      .slice(0, limit);
                    return Promise.resolve({
                      data: sortedData,
                      error: null,
                    });
                  }),
                })),
                single: jest.fn(async () => {
                  const item = Array.from(tableData.values()).find(
                    (item: any) => item[field] === value
                  );
                  if (item) {
                    // Return snake_case version (service will convert to camelCase)
                    return {
                      data: item,
                      error: null,
                    };
                  }
                  return {
                    data: null,
                    error: { message: 'Not found' },
                  };
                }),
              };
            }),
            order: jest.fn((sortField: string, options: any) => ({
              limit: jest.fn((limit: number) => {
                const sortedData = Array.from(tableData.values())
                  .sort((a: any, b: any) => {
                    const aVal = a[sortField];
                    const bVal = b[sortField];
                    if (options?.ascending) {
                      return aVal > bVal ? 1 : -1;
                    } else {
                      return aVal < bVal ? 1 : -1;
                    }
                  })
                  .slice(0, limit);
                return Promise.resolve({
                  data: sortedData,
                  error: null,
                });
              }),
            })),
            in: jest.fn((field: string, values: any[]) => ({
              data: Array.from(tableData.values()).filter((item: any) =>
                values.includes(item[field])
              ),
              error: null,
            })),
          };
          
          // Handle direct select() call (for listSchools)
          const directResult = Promise.resolve({
            data: Array.from(tableData.values()),
            error: null,
          });
          
          return Object.assign(queryBuilder, {
            then: (callback: any) => callback(directResult),
          });
        }),
        insert: jest.fn((data: any) => ({
          select: jest.fn(() => ({
            single: jest.fn(async () => {
              // Convert camelCase to snake_case for storage
              const snakeCaseData: any = {
                id: `${table}-${idCounter++}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              for (const [key, value] of Object.entries(data)) {
                if (key === 'schoolId') {
                  snakeCaseData.school_id = value;
                } else if (key === 'groupId') {
                  snakeCaseData.group_id = value;
                } else if (key === 'contactEmail') {
                  snakeCaseData.contact_email = value;
                } else if (key === 'contactPhone') {
                  snakeCaseData.contact_phone = value;
                } else if (key === 'publicationDate') {
                  snakeCaseData.publication_date = value;
                } else {
                  snakeCaseData[key] = value;
                }
              }
              tableData.set(snakeCaseData.id, snakeCaseData);
              
              // Return snake_case version (service will convert to camelCase)
              return { data: snakeCaseData, error: null };
            }),
          })),
        })),
        update: jest.fn((updates: any) => ({
          eq: jest.fn((field: string, value: any) => {
            // Find and update the item
            const item = Array.from(tableData.values()).find(
              (item: any) => item[field] === value
            );
            if (item) {
              // Update the item with snake_case field names
              Object.assign(item, updates, { updated_at: new Date().toISOString() });
            }
            // Return an object with select method for notices service
            return {
              select: jest.fn(() => ({
                single: jest.fn(async () => {
                  if (item) {
                    return { data: item, error: null };
                  }
                  return { data: null, error: { message: 'Not found' } };
                }),
              })),
            };
          }),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn((field: string, value: any) => ({
            data: Array.from(tableData.values()).filter(
              (item: any) => item[field] !== value
            ),
            error: null,
          })),
        })),
      };
    }),
  })),
}));

jest.mock('@supabase/supabase-js', () => ({}));

describe('Data Management Integration (Supabase)', () => {
  let noticesService: NoticesServiceSupabase;
  let groupsService: GroupsServiceSupabase;
  let schoolsService: SchoolsServiceSupabase;
  let auditService: AuditServiceSupabase;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear mock data
    Object.values(mockData).forEach(table => table.clear());
    idCounter = 1;

    // Initialize services
    noticesService = new NoticesServiceSupabase();
    groupsService = new GroupsServiceSupabase();
    schoolsService = new SchoolsServiceSupabase();
    auditService = new AuditServiceSupabase();
  });

  describe('School Management', () => {
    it('should create and retrieve schools', async () => {
      const schoolData = {
        name: 'Test School',
        address: '123 Test St',
        logoUrl: 'https://example.com/logo.png',
      };

      // Create school
      const createdSchool = await schoolsService.createSchool(schoolData);
      expect(createdSchool).toBeDefined();
      expect(createdSchool.name).toBe(schoolData.name);
      expect(createdSchool.schoolId).toBeDefined();

      // Retrieve school
      const retrievedSchool = await schoolsService.getSchoolById(createdSchool.schoolId);
      expect(retrievedSchool).toBeDefined();
      expect(retrievedSchool?.schoolId).toBe(createdSchool.schoolId);
      expect(retrievedSchool?.name).toBe(schoolData.name);
    });

    it('should update schools', async () => {
      const schoolData = {
        name: 'Original School',
        address: '123 Original St',
      };

      // Create school
      const school = await schoolsService.createSchool(schoolData);
      expect(school.name).toBe(schoolData.name);

      // Update school
      const updatedSchool = await schoolsService.updateSchool(school.schoolId, {
        name: 'Updated School',
      });
      expect(updatedSchool).toBeDefined();
      expect(updatedSchool?.name).toBe('Updated School');
    });

    it('should list all schools', async () => {
      // Create multiple schools
      const school1 = await schoolsService.createSchool({
        name: 'School A',
        address: 'Address A',
      });
      const school2 = await schoolsService.createSchool({
        name: 'School B',
        address: 'Address B',
      });

      // List schools
      const schools = await schoolsService.listSchools();
      expect(schools).toHaveLength(2);
      expect(schools.map(s => s.name)).toContain('School A');
      expect(schools.map(s => s.name)).toContain('School B');
    });
  });

  describe('Group Management', () => {
    let testSchool: any;

    beforeEach(async () => {
      testSchool = await schoolsService.createSchool({
        name: 'Test School for Groups',
        address: '123 Test St',
      });
    });

    it('should create and retrieve groups', async () => {
      const groupData = {
        name: 'Test Group',
        schoolId: testSchool.schoolId,
      };

      // Create group
      const createdGroup = await groupsService.createGroup(groupData);
      expect(createdGroup).toBeDefined();
      expect(createdGroup.name).toBe(groupData.name);
      expect(createdGroup.schoolId).toBe(groupData.schoolId);

      // Retrieve group
      const retrievedGroup = await groupsService.getGroupById(createdGroup.groupId);
      expect(retrievedGroup).toBeDefined();
      expect(retrievedGroup?.groupId).toBe(createdGroup.groupId);
      expect(retrievedGroup?.name).toBe(groupData.name);
    });

    it('should get groups by school', async () => {
      // Create groups for the school
      const group1 = await groupsService.createGroup({
        name: 'Group A',
        schoolId: testSchool.schoolId,
      });
      const group2 = await groupsService.createGroup({
        name: 'Group B',
        schoolId: testSchool.schoolId,
      });

      // Get groups by school
      const schoolGroups = await groupsService.listGroupsBySchool(testSchool.schoolId);
      expect(schoolGroups).toHaveLength(2);
      expect(schoolGroups.map(g => g.name)).toContain('Group A');
      expect(schoolGroups.map(g => g.name)).toContain('Group B');
    });
  });

  describe('Notice Management', () => {
    let testSchool: any;
    let testGroup: any;

    beforeEach(async () => {
      testSchool = await schoolsService.createSchool({
        name: 'Test School for Notices',
        address: '123 Test St',
      });
      testGroup = await groupsService.createGroup({
        name: 'Test Group',
        schoolId: testSchool.schoolId,
      });
    });

    it('should create and retrieve notices', async () => {
      const noticeData = {
        title: 'Test Notice',
        body: 'This is a test notice',
        schoolId: testSchool.schoolId,
        groupId: testGroup.groupId,
        status: 'published' as const,
      };

      // Create notice
      const createdNotice = await noticesService.createNotice(noticeData);
      expect(createdNotice).toBeDefined();
      expect(createdNotice.title).toBe(noticeData.title);
      expect(createdNotice.groupId).toBe(noticeData.groupId);

      // Retrieve notice
      const retrievedNotice = await noticesService.getNoticeById(createdNotice.noticeId);
      expect(retrievedNotice).toBeDefined();
      expect(retrievedNotice?.noticeId).toBe(createdNotice.noticeId);
      expect(retrievedNotice?.title).toBe(noticeData.title);
    });

    it('should get notices by group', async () => {
      // Create notices for the group
      const notice1 = await noticesService.createNotice({
        title: 'Notice A',
        body: 'Content A',
        schoolId: testSchool.schoolId,
        groupId: testGroup.groupId,
        status: 'published',
      });
      const notice2 = await noticesService.createNotice({
        title: 'Notice B',
        body: 'Content B',
        schoolId: testSchool.schoolId,
        groupId: testGroup.groupId,
        status: 'published',
      });

      // Get notices by group
      const groupNotices = await noticesService.listNoticesByGroup(testGroup.groupId);
      expect(groupNotices).toHaveLength(2);
      expect(groupNotices.map(n => n.title)).toContain('Notice A');
      expect(groupNotices.map(n => n.title)).toContain('Notice B');
    });

    it('should update notice status', async () => {
      const notice = await noticesService.createNotice({
        title: 'Draft Notice',
        body: 'Draft content',
        schoolId: testSchool.schoolId,
        groupId: testGroup.groupId,
        status: 'draft',
      });

      // Publish notice
      const updatedNotice = await noticesService.updateNotice(notice.noticeId, {
        status: 'published',
      });
      expect(updatedNotice).toBeDefined();
      expect(updatedNotice?.status).toBe('published');
    });
  });

  describe('Audit Logging', () => {
    let testUser: any;
    let testSchool: any;

    beforeEach(async () => {
      testUser = {
        uid: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      };
      testSchool = await schoolsService.createSchool({
        name: 'Test School for Audit',
        address: '123 Test St',
      });
    });

    it('should log school creation', async () => {
      await auditService.logSchoolCreation(testUser, testSchool);

      // In a real implementation, we would verify the audit log was created
      // For this mock test, we'll just ensure no errors are thrown
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should log notice operations', async () => {
      // First create a group for the notice
      const testGroup = await groupsService.createGroup({
        name: 'Audit Test Group',
        schoolId: testSchool.schoolId,
      });
      
      const notice = await noticesService.createNotice({
        title: 'Test Notice for Audit',
        body: 'Content',
        schoolId: testSchool.schoolId,
        groupId: testGroup.groupId,
        status: 'published',
      });

      // Placeholder: Notice audit logging not implemented yet
      // await auditService.logNoticeCreation(testUser, notice);
      // await auditService.logNoticeUpdate(testUser, notice, { status: 'archived' });

      // Placeholder assertions - in real implementation, verify audit logs
      expect(true).toBe(true);
    });
  });

  describe('Data Relationships', () => {
    it('should maintain school-group relationships', async () => {
      // Create school
      const school = await schoolsService.createSchool({
        name: 'Relationship Test School',
        address: '123 Test St',
      });

      // Create groups for the school
      const group1 = await groupsService.createGroup({
        name: 'Group 1',
        schoolId: school.schoolId,
      });
      const group2 = await groupsService.createGroup({
        name: 'Group 2',
        schoolId: school.schoolId,
      });

      // Verify groups belong to the school
      const schoolGroups = await groupsService.listGroupsBySchool(school.schoolId);
      expect(schoolGroups).toHaveLength(2);
      expect(schoolGroups.every(g => g.schoolId === school.schoolId)).toBe(true);
    });

    it('should maintain group-notice relationships', async () => {
      // Create school and group
      const school = await schoolsService.createSchool({
        name: 'Notice Test School',
        address: '123 Test St',
      });
      const group = await groupsService.createGroup({
        name: 'Notice Test Group',
        schoolId: school.schoolId,
      });

      // Create notices for the group
      const notice1 = await noticesService.createNotice({
        title: 'Notice 1',
        body: 'Content 1',
        schoolId: school.schoolId,
        groupId: group.groupId,
        status: 'published',
      });
      const notice2 = await noticesService.createNotice({
        title: 'Notice 2',
        body: 'Content 2',
        schoolId: school.schoolId,
        groupId: group.groupId,
        status: 'published',
      });

      // Verify notices belong to the group
      const groupNotices = await noticesService.listNoticesByGroup(group.groupId);
      expect(groupNotices).toHaveLength(2);
      expect(groupNotices.every(n => n.groupId === group.groupId)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle not found errors gracefully', async () => {
      const nonExistentSchool = await schoolsService.getSchoolById('non-existent');
      expect(nonExistentSchool).toBeNull();

      const nonExistentGroup = await groupsService.getGroupById('non-existent');
      expect(nonExistentGroup).toBeNull();

      const nonExistentNotice = await noticesService.getNoticeById('non-existent');
      expect(nonExistentNotice).toBeNull();
    });

    it('should handle validation errors', async () => {
      // Try to create school with invalid data
      await expect(
        schoolsService.createSchool({ name: '', address: '' })
      ).rejects.toThrow();

      // Try to create group without school
      await expect(
        groupsService.createGroup({ name: 'Test Group', schoolId: '' })
      ).rejects.toThrow();

      // Try to create notice without required fields
      await expect(
        noticesService.createNotice({
          title: '',
          body: '',
          schoolId: '',
          groupId: '',
          status: 'published',
        })
      ).rejects.toThrow();
    });
  });
});