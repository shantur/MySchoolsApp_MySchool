/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import { AttachmentsService } from '../attachments.service';

// Mock Firebase Admin
jest.mock('../../firebase/admin', () => ({
  adminStorage: {
    bucket: jest.fn(),
  },
}));

import { adminStorage } from '../../firebase/admin';

describe('AttachmentsService', () => {
  let attachmentsService: AttachmentsService;
  let mockBucket: any;
  let mockFile: any;
  let mockSave: any;
  let mockGetSignedUrl: any;
  let mockDelete: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSave = jest.fn();
    mockGetSignedUrl = jest.fn();
    mockDelete = jest.fn();

    mockFile = jest.fn(() => ({
      save: mockSave,
      getSignedUrl: mockGetSignedUrl,
      delete: mockDelete,
    }));

    mockBucket = jest.fn(() => ({
      file: mockFile,
    }));

    (adminStorage.bucket as jest.Mock) = mockBucket;

    attachmentsService = new AttachmentsService();
  });

  describe('uploadAttachment', () => {
    it('should upload a file and return metadata', async () => {
      const fileData = {
        buffer: Buffer.from('test file content'),
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        schoolId: 'school123',
        noticeId: 'notice123',
      };

      mockSave.mockResolvedValue(undefined);

      const result = await attachmentsService.uploadAttachment(fileData);

      expect(mockBucket).toHaveBeenCalled();
      expect(mockFile).toHaveBeenCalledWith(
        expect.stringContaining('attachments/school123/notice123/')
      );
      expect(mockSave).toHaveBeenCalledWith(fileData.buffer, {
        metadata: {
          contentType: fileData.mimeType,
        },
      });

      expect(result.fileName).toBe('document.pdf');
      expect(result.fileType).toBe('application/pdf');
      expect(result.size).toBe(fileData.buffer.length);
      expect(result.downloadURL).toContain('/api/attachments/download/');
    });

    it('should generate unique filenames for duplicate names', async () => {
      const fileData = {
        buffer: Buffer.from('test'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        schoolId: 'school123',
        noticeId: 'notice123',
      };

      mockSave.mockResolvedValue(undefined);

      const result1 = await attachmentsService.uploadAttachment(fileData);
      const result2 = await attachmentsService.uploadAttachment(fileData);

      expect(result1.downloadURL).not.toBe(result2.downloadURL);
    });

    it('should throw error if buffer is empty', async () => {
      const fileData = {
        buffer: Buffer.from(''),
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        schoolId: 'school123',
        noticeId: 'notice123',
      };

      await expect(
        attachmentsService.uploadAttachment(fileData)
      ).rejects.toThrow('File buffer cannot be empty');
    });

    it('should throw error if fileName is empty', async () => {
      const fileData = {
        buffer: Buffer.from('test'),
        fileName: '',
        mimeType: 'application/pdf',
        schoolId: 'school123',
        noticeId: 'notice123',
      };

      await expect(
        attachmentsService.uploadAttachment(fileData)
      ).rejects.toThrow('File name is required');
    });
  });

  describe('getAttachmentDownloadUrl', () => {
    it('should generate a signed download URL', async () => {
      const attachmentId = 'attach123';
      const schoolId = 'school123';
      const noticeId = 'notice123';

      const mockSignedUrl = 'https://storage.example.com/signed-url';

      mockGetSignedUrl.mockResolvedValue([mockSignedUrl]);

      const result = await attachmentsService.getAttachmentDownloadUrl(
        attachmentId,
        schoolId,
        noticeId
      );

      expect(mockBucket).toHaveBeenCalled();
      expect(mockFile).toHaveBeenCalledWith(
        expect.stringContaining(
          `attachments/${schoolId}/${noticeId}/${attachmentId}`
        )
      );
      expect(mockGetSignedUrl).toHaveBeenCalledWith({
        action: 'read',
        expires: expect.any(Number),
      });
      expect(result).toBe(mockSignedUrl);
    });
  });

  describe('deleteAttachment', () => {
    it('should delete a file from storage', async () => {
      const attachmentId = 'attach123';
      const schoolId = 'school123';
      const noticeId = 'notice123';

      mockDelete.mockResolvedValue([]);

      await attachmentsService.deleteAttachment(
        attachmentId,
        schoolId,
        noticeId
      );

      expect(mockBucket).toHaveBeenCalled();
      expect(mockFile).toHaveBeenCalledWith(
        expect.stringContaining(
          `attachments/${schoolId}/${noticeId}/${attachmentId}`
        )
      );
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('validateFileType', () => {
    it('should accept PDF files', () => {
      expect(() =>
        attachmentsService.validateFileType('application/pdf')
      ).not.toThrow();
    });

    it('should accept image files', () => {
      expect(() =>
        attachmentsService.validateFileType('image/jpeg')
      ).not.toThrow();

      expect(() =>
        attachmentsService.validateFileType('image/png')
      ).not.toThrow();

      expect(() =>
        attachmentsService.validateFileType('image/gif')
      ).not.toThrow();
    });

    it('should reject unsupported file types', () => {
      expect(() =>
        attachmentsService.validateFileType('application/zip')
      ).toThrow('Unsupported file type');

      expect(() =>
        attachmentsService.validateFileType('text/plain')
      ).toThrow('Unsupported file type');
    });
  });
});
