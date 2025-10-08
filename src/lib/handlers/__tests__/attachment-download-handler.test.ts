/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import { handleAttachmentDownload } from '../attachment-download-handler';

// Mock dependencies
jest.mock('../../auth/session', () => ({
  getUserSession: jest.fn(),
}));

jest.mock('../../auth/authorization', () => ({
  requireAuth: jest.fn(),
  checkSchoolAccess: jest.fn(),
}));

jest.mock('../../services/attachments.service', () => ({
  AttachmentsService: jest.fn(),
}));

jest.mock('../../firebase/admin-lazy', () => ({
  getAdminStorage: jest.fn(),
}));

import { getUserSession } from '../../auth/session';
import { requireAuth, checkSchoolAccess } from '../../auth/authorization';
import { AttachmentsService } from '../../services/attachments.service';
import { getAdminStorage } from '../../firebase/admin-lazy';

describe('Attachment Download Handler', () => {
  let mockSession: any;
  let mockAttachmentsService: any;
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock session
    mockSession = {
      uid: 'user123',
      email: 'user@example.com',
      schoolId: 'school123',
      role: 'user',
      displayName: 'Test User',
    };

    // Mock Firebase Storage
    mockFile = {
      exists: jest.fn(),
      createReadStream: jest.fn(),
      getSignedUrl: jest.fn(),
    };

    mockBucket = {
      file: jest.fn(() => mockFile),
    };

    mockStorage = {
      bucket: jest.fn(() => mockBucket),
    };

    // Mock AttachmentsService
    mockAttachmentsService = {
      getAttachmentDownloadUrl: jest.fn(),
    };

    (getAdminStorage as jest.Mock).mockReturnValue(mockStorage);
    (AttachmentsService as jest.Mock).mockImplementation(() => mockAttachmentsService);
    (getUserSession as jest.Mock).mockResolvedValue(mockSession);
    
    // Reset authorization mocks to default behavior
    (requireAuth as jest.Mock).mockImplementation(() => {
      // Default: do nothing (user is authenticated)
    });
    (checkSchoolAccess as jest.Mock).mockImplementation(() => {
      // Default: do nothing (user has access)
    });
  });

  describe('handleAttachmentDownload', () => {
    it('should return error for invalid attachment ID', async () => {
      const result = await handleAttachmentDownload({
        attachmentId: '',
        noticeId: 'notice123',
        schoolId: 'school123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ATTACHMENT_ID');
      expect(result.error?.message).toBe('Invalid attachment ID');
    });

    it('should return error for missing noticeId', async () => {
      const result = await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: '',
        schoolId: 'school123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MISSING_PARAMETERS');
      expect(result.error?.message).toContain('noticeId and schoolId are required');
    });

    it('should return error for missing schoolId', async () => {
      const result = await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: 'notice123',
        schoolId: '',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MISSING_PARAMETERS');
      expect(result.error?.message).toContain('noticeId and schoolId are required');
    });

    it('should return unauthorized error if user is not authenticated', async () => {
      (getUserSession as jest.Mock).mockResolvedValue(null);
      (requireAuth as jest.Mock).mockImplementation(() => {
        const error = new Error('Authentication required');
        error.name = 'AuthenticationError';
        throw error;
      });

      const result = await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: 'notice123',
        schoolId: 'school123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
      expect(result.error?.message).toBe('Authentication required');
    });

    it('should return forbidden error if user lacks school access', async () => {
      (checkSchoolAccess as jest.Mock).mockImplementation(() => {
        const error = new Error('Access denied');
        error.name = 'AuthorizationError';
        throw error;
      });

      const result = await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: 'notice123',
        schoolId: 'school123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
      expect(result.error?.message).toBe('Access denied');
    });

    it('should return error if storage is unavailable', async () => {
      (getAdminStorage as jest.Mock).mockReturnValue(null);

      const result = await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: 'notice123',
        schoolId: 'school123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_UNAVAILABLE');
      expect(result.error?.message).toBe('Internal server error');
    });

    it('should return not found error if attachment does not exist', async () => {
      mockFile.exists.mockResolvedValue([false]);

      const result = await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: 'notice123',
        schoolId: 'school123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ATTACHMENT_NOT_FOUND');
      expect(result.error?.message).toBe('Attachment not found');
    });

    it('should return signed URL for valid attachment', async () => {
      const signedUrl = 'https://storage.example.com/signed-url';
      mockFile.exists.mockResolvedValue([true]);
      mockAttachmentsService.getAttachmentDownloadUrl.mockResolvedValue(signedUrl);

      const result = await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: 'notice123',
        schoolId: 'school123',
      });

      expect(result.success).toBe(true);
      expect(result.signedUrl).toBe(signedUrl);
      expect(mockAttachmentsService.getAttachmentDownloadUrl).toHaveBeenCalledWith(
        'attach123',
        'school123',
        'notice123'
      );
    });

    it('should allow admin users to access any school attachments', async () => {
      mockSession.role = 'admin';
      const signedUrl = 'https://storage.example.com/signed-url';
      mockFile.exists.mockResolvedValue([true]);
      mockAttachmentsService.getAttachmentDownloadUrl.mockResolvedValue(signedUrl);

      const result = await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: 'notice123',
        schoolId: 'different-school',
      });

      expect(result.success).toBe(true);
      expect(result.signedUrl).toBe(signedUrl);
      expect(checkSchoolAccess).toHaveBeenCalledWith(mockSession, 'different-school');
    });

    it('should handle unexpected errors gracefully', async () => {
      (getUserSession as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: 'notice123',
        schoolId: 'school123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
      expect(result.error?.message).toBe('Internal server error');
    });

    it('should construct correct file path for storage', async () => {
      const signedUrl = 'https://storage.example.com/signed-url';
      mockFile.exists.mockResolvedValue([true]);
      mockAttachmentsService.getAttachmentDownloadUrl.mockResolvedValue(signedUrl);

      await handleAttachmentDownload({
        attachmentId: 'attach123',
        noticeId: 'notice123',
        schoolId: 'school123',
      });

      expect(mockBucket.file).toHaveBeenCalledWith(
        'attachments/school123/notice123/attach123'
      );
    });
  });
});