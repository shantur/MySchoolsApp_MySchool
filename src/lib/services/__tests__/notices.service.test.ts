/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import { NoticesService } from '../notices.service';
import type { Notice, Attachment } from '../../types';

// Mock Firebase Admin
jest.mock('../../firebase/admin', () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

import { adminDb } from '../../firebase/admin';

describe('NoticesService', () => {
  let noticesService: NoticesService;
  let mockCollection: any;
  let mockDoc: any;
  let mockGet: any;
  let mockAdd: any;
  let mockSet: any;
  let mockDelete: any;
  let mockWhere: any;
  let mockOrderBy: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGet = jest.fn();
    mockAdd = jest.fn();
    mockSet = jest.fn();
    mockDelete = jest.fn();
    mockWhere = jest.fn();
    mockOrderBy = jest.fn();

    mockDoc = jest.fn(() => ({
      get: mockGet,
      set: mockSet,
      delete: mockDelete,
    }));

    mockCollection = jest.fn(() => ({
      doc: mockDoc,
      add: mockAdd,
      where: mockWhere,
      orderBy: mockOrderBy,
      get: mockGet,
    }));

    (adminDb.collection as jest.Mock) = mockCollection;

    noticesService = new NoticesService();
  });

  describe('createNotice', () => {
    it('should create a new notice with all fields', async () => {
      const noticeData = {
        schoolId: 'school123',
        title: 'Important Announcement',
        body: 'This is the notice body',
        status: 'published' as const,
        attachments: [
          {
            fileName: 'doc.pdf',
            fileType: 'application/pdf',
            downloadURL: '/api/attachments/download/attach123',
            size: 12345,
          },
        ],
      };

      const mockDocRef = { id: 'notice123' };
      mockAdd.mockResolvedValue(mockDocRef);

      const result = await noticesService.createNotice(noticeData);

      expect(mockCollection).toHaveBeenCalledWith('notices');
      expect(mockAdd).toHaveBeenCalled();

      const addedData = mockAdd.mock.calls[0][0];
      expect(addedData.schoolId).toBe(noticeData.schoolId);
      expect(addedData.title).toBe(noticeData.title);
      expect(addedData.body).toBe(noticeData.body);
      expect(addedData.status).toBe(noticeData.status);
      expect(addedData.attachments).toHaveLength(1);
      expect(addedData.publicationDate).toBeDefined();
      expect(addedData.createdAt).toBeDefined();
      expect(addedData.updatedAt).toBeDefined();

      expect(result.noticeId).toBe('notice123');
      expect(result.title).toBe(noticeData.title);
    });

    it('should create notice with draft status by default', async () => {
      const noticeData = {
        schoolId: 'school123',
        title: 'Draft Notice',
        body: 'Draft content',
      };

      const mockDocRef = { id: 'notice456' };
      mockAdd.mockResolvedValue(mockDocRef);

      const result = await noticesService.createNotice(noticeData);

      const addedData = mockAdd.mock.calls[0][0];
      expect(addedData.status).toBe('draft');
      expect(result.status).toBe('draft');
    });

    it('should throw error if schoolId is missing', async () => {
      const noticeData = {
        schoolId: '',
        title: 'Test Notice',
        body: 'Test body',
      };

      await expect(
        noticesService.createNotice(noticeData)
      ).rejects.toThrow('School ID is required');
    });

    it('should throw error if title is empty', async () => {
      const noticeData = {
        schoolId: 'school123',
        title: '',
        body: 'Test body',
      };

      await expect(
        noticesService.createNotice(noticeData)
      ).rejects.toThrow('Notice title is required');
    });

    it('should throw error if body is empty', async () => {
      const noticeData = {
        schoolId: 'school123',
        title: 'Test Title',
        body: '',
      };

      await expect(
        noticesService.createNotice(noticeData)
      ).rejects.toThrow('Notice body is required');
    });
  });

  describe('getNoticeById', () => {
    it('should return notice by ID', async () => {
      const mockNoticeData = {
        schoolId: 'school123',
        title: 'Important Announcement',
        body: 'Notice content',
        status: 'published',
        publicationDate: { toDate: () => new Date() },
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      };

      const mockSnapshot = {
        exists: true,
        id: 'notice123',
        data: () => mockNoticeData,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      const result = await noticesService.getNoticeById('notice123');

      expect(mockCollection).toHaveBeenCalledWith('notices');
      expect(mockDoc).toHaveBeenCalledWith('notice123');
      expect(result).toBeDefined();
      expect(result?.noticeId).toBe('notice123');
      expect(result?.title).toBe('Important Announcement');
    });

    it('should return null for non-existent notice', async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      const result = await noticesService.getNoticeById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateNotice', () => {
    it('should update notice fields', async () => {
      const updates = {
        title: 'Updated Title',
        status: 'archived' as const,
      };

      const mockSnapshotBefore = {
        exists: true,
        id: 'notice123',
        data: () => ({
          schoolId: 'school123',
          title: 'Old Title',
          body: 'Body content',
          status: 'published',
          publicationDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      const mockSnapshotAfter = {
        exists: true,
        id: 'notice123',
        data: () => ({
          schoolId: 'school123',
          title: 'Updated Title',
          body: 'Body content',
          status: 'archived',
          publicationDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGet
        .mockResolvedValueOnce(mockSnapshotBefore)
        .mockResolvedValueOnce(mockSnapshotAfter);

      const result = await noticesService.updateNotice('notice123', updates);

      expect(mockDoc).toHaveBeenCalledWith('notice123');
      expect(mockSet).toHaveBeenCalled();
      expect(result.title).toBe(updates.title);
      expect(result.status).toBe(updates.status);
    });

    it('should throw error for non-existent notice', async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      await expect(
        noticesService.updateNotice('nonexistent', { title: 'New Title' })
      ).rejects.toThrow('Notice not found');
    });
  });

  describe('deleteNotice', () => {
    it('should delete notice successfully', async () => {
      const mockSnapshot = {
        exists: true,
        id: 'notice123',
        data: () => ({
          schoolId: 'school123',
          title: 'Test Notice',
          body: 'Test body',
          status: 'draft',
          publicationDate: { toDate: () => new Date() },
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        }),
      };

      mockGet.mockResolvedValue(mockSnapshot);
      mockDelete.mockResolvedValue(undefined);

      await noticesService.deleteNotice('notice123');

      expect(mockDoc).toHaveBeenCalledWith('notice123');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw error for non-existent notice', async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockGet.mockResolvedValue(mockSnapshot);

      await expect(
        noticesService.deleteNotice('nonexistent')
      ).rejects.toThrow('Notice not found');
    });
  });

  describe('listNoticesBySchool', () => {
    it('should return notices for a specific school', async () => {
      const mockNotices = [
        {
          id: 'notice1',
          data: () => ({
            schoolId: 'school123',
            title: 'Notice 1',
            body: 'Body 1',
            status: 'published',
            publicationDate: { toDate: () => new Date('2025-10-06') },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'notice2',
          data: () => ({
            schoolId: 'school123',
            title: 'Notice 2',
            body: 'Body 2',
            status: 'published',
            publicationDate: { toDate: () => new Date('2025-10-05') },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];

      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });

      mockOrderBy.mockReturnValue({
        get: mockGet,
      });

      mockGet.mockResolvedValue({
        docs: mockNotices,
      });

      const result = 
        await noticesService.listNoticesBySchool('school123');

      expect(mockCollection).toHaveBeenCalledWith('notices');
      expect(mockWhere).toHaveBeenCalledWith('schoolId', '==', 'school123');
      expect(mockOrderBy).toHaveBeenCalledWith(
        'publicationDate',
        'desc'
      );
      expect(result).toHaveLength(2);
      expect(result[0].noticeId).toBe('notice1');
    });

    it('should filter by status when provided', async () => {
      const mockNotices = [
        {
          id: 'notice1',
          data: () => ({
            schoolId: 'school123',
            title: 'Notice 1',
            body: 'Body 1',
            status: 'published',
            publicationDate: { toDate: () => new Date() },
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];

      const mockWhereChain = {
        where: jest.fn().mockReturnValue({
          orderBy: mockOrderBy,
        }),
      };

      mockWhere.mockReturnValue(mockWhereChain);

      mockOrderBy.mockReturnValue({
        get: mockGet,
      });

      mockGet.mockResolvedValue({
        docs: mockNotices,
      });

      const result = await noticesService.listNoticesBySchool(
        'school123',
        'published'
      );

      expect(mockWhere).toHaveBeenCalledWith('schoolId', '==', 'school123');
      expect(mockWhereChain.where).toHaveBeenCalledWith(
        'status',
        '==',
        'published'
      );
      expect(result).toHaveLength(1);
    });
  });
});
