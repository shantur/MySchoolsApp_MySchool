/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Attachments Service (Supabase) Test Suite
 */

import { AttachmentsServiceSupabase } from '../attachments.service.supabase';
import type { UploadAttachmentInput } from '../attachments.service.supabase';
import { createServerClient } from '../../supabase/server';

jest.mock('../../supabase/server', () => ({
  createServerClient: jest.fn(),
}));

describe('AttachmentsServiceSupabase', () => {
  let service: AttachmentsServiceSupabase;
  let mockSupabaseClient: any;
  let mockStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStorage = {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://supabase.co/storage/test.pdf' },
        }),
        remove: jest.fn().mockResolvedValue({
          error: null,
        }),
      }),
    };

    mockSupabaseClient = {
      storage: mockStorage,
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    service = new AttachmentsServiceSupabase();
  });

  describe('uploadAttachment', () => {
    it('should upload attachment successfully', async () => {
      const input: UploadAttachmentInput = {
        buffer: Buffer.from('test'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        schoolId: 'school-1',
        noticeId: 'notice-1',
      };

      const result = await service.uploadAttachment(input);

      expect(result).toEqual(expect.objectContaining({
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        size: 4,
      }));
      expect(result.id).toBeDefined();
    });

    it('should throw error for empty buffer', async () => {
      const input: UploadAttachmentInput = {
        buffer: Buffer.from(''),
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        schoolId: 'school-1',
        noticeId: 'notice-1',
      };

      await expect(service.uploadAttachment(input))
        .rejects.toThrow('File buffer cannot be empty');
    });

    it('should throw error for empty filename', async () => {
      const input: UploadAttachmentInput = {
        buffer: Buffer.from('test'),
        fileName: '',
        mimeType: 'application/pdf',
        schoolId: 'school-1',
        noticeId: 'notice-1',
      };

      await expect(service.uploadAttachment(input))
        .rejects.toThrow('File name is required');
    });

    it('should throw error for unsupported file type', async () => {
      const input: UploadAttachmentInput = {
        buffer: Buffer.from('test'),
        fileName: 'test.exe',
        mimeType: 'application/x-msdownload',
        schoolId: 'school-1',
        noticeId: 'notice-1',
      };

      await expect(service.uploadAttachment(input))
        .rejects.toThrow('Unsupported file type');
    });
  });

  describe('getAttachmentDownloadUrl', () => {
    it('should return download URL', async () => {
      const url = await service.getAttachmentDownloadUrl(
        'attachment-1',
        'school-1',
        'notice-1'
      );

      expect(url).toBe('https://supabase.co/storage/test.pdf');
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment successfully', async () => {
      await service.deleteAttachment('attachment-1', 'school-1', 'notice-1');

      expect(mockStorage.from).toHaveBeenCalledWith('attachments');
    });

    it('should throw error if delete fails', async () => {
      mockStorage.from = jest.fn().mockReturnValue({
        remove: jest.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        }),
      });

      await expect(
        service.deleteAttachment('attachment-1', 'school-1', 'notice-1')
      ).rejects.toThrow('Failed to delete attachment');
    });
  });

  describe('validateFileType', () => {
    it('should accept PDF files', () => {
      expect(() => service.validateFileType('application/pdf')).not.toThrow();
    });

    it('should accept image files', () => {
      expect(() => service.validateFileType('image/jpeg')).not.toThrow();
      expect(() => service.validateFileType('image/png')).not.toThrow();
    });

    it('should reject unsupported types', () => {
      expect(() => service.validateFileType('application/exe'))
        .toThrow('Unsupported file type');
    });
  });
});
