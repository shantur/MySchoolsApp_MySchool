/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

/**
 * Integration Tests for Attachment Download API Route
 * 
 * Tests the complete API route including authentication, authorization,
 * and file download functionality.
 */

// Mock Next.js server modules before importing
jest.mock('next/server', () => ({
  NextRequest: class MockRequest {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  },
  NextResponse: {
    redirect: jest.fn((url) => ({
      status: 302,
      headers: { get: jest.fn((header) => header === 'location' ? url : null) },
    })),
    json: jest.fn((body, options) => ({
      status: options?.status || 200,
      json: async () => body,
    })),
  },
}));

import { GET } from '../[attachmentId]/route';

// Mock dependencies
jest.mock('../../../../../lib/handlers/attachment-download-handler', () => ({
  handleAttachmentDownload: jest.fn(),
}));

import { handleAttachmentDownload } from '../../../../../lib/handlers/attachment-download-handler';

describe('Attachment Download API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/attachments/download/[attachmentId]', () => {
    it('should redirect to signed URL on successful download', async () => {
      const mockSignedUrl = 'https://storage.example.com/signed-url';
      
      (handleAttachmentDownload as jest.Mock).mockResolvedValue({
        success: true,
        signedUrl: mockSignedUrl,
      });

      // Create a mock request object
      const request = {
        url: 'http://localhost:3000/api/attachments/download/attach123?noticeId=notice456&schoolId=school789'
      } as any;

      const response = await GET(request, { params: { attachmentId: 'attach123' } });

      expect(response.status).toBe(302); // Redirect status
      expect(response.headers.get('location')).toBe(mockSignedUrl);
      expect(handleAttachmentDownload).toHaveBeenCalledWith({
        attachmentId: 'attach123',
        noticeId: 'notice456',
        schoolId: 'school789',
      });
    });

    it('should return 401 for unauthorized requests', async () => {
      (handleAttachmentDownload as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      });

      const request = {
        url: 'http://localhost:3000/api/attachments/download/attach123?noticeId=notice456&schoolId=school789'
      } as any;

      const response = await GET(request, { params: { attachmentId: 'attach123' } });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    });

    it('should return 403 for forbidden requests', async () => {
      (handleAttachmentDownload as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          message: 'Access denied',
          code: 'FORBIDDEN',
        },
      });

      const request = {
        url: 'http://localhost:3000/api/attachments/download/attach123?noticeId=notice456&schoolId=school789'
      } as any;

      const response = await GET(request, { params: { attachmentId: 'attach123' } });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        error: 'Access denied',
        code: 'FORBIDDEN',
      });
    });

    it('should return 404 for attachments not found', async () => {
      (handleAttachmentDownload as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          message: 'Attachment not found',
          code: 'ATTACHMENT_NOT_FOUND',
        },
      });

      const request = {
        url: 'http://localhost:3000/api/attachments/download/attach123?noticeId=notice456&schoolId=school789'
      } as any;

      const response = await GET(request, { params: { attachmentId: 'attach123' } });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: 'Attachment not found',
        code: 'ATTACHMENT_NOT_FOUND',
      });
    });

    it('should return 400 for missing parameters', async () => {
      (handleAttachmentDownload as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          message: 'Missing required parameters: noticeId and schoolId are required',
          code: 'MISSING_PARAMETERS',
        },
      });

      const request = {
        url: 'http://localhost:3000/api/attachments/download/attach123'
      } as any;

      const response = await GET(request, { params: { attachmentId: 'attach123' } });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        error: 'Missing required parameters: noticeId and schoolId are required',
        code: 'MISSING_PARAMETERS',
      });
    });

    it('should return 500 for internal server errors', async () => {
      (handleAttachmentDownload as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });

      const request = {
        url: 'http://localhost:3000/api/attachments/download/attach123?noticeId=notice456&schoolId=school789'
      } as any;

      const response = await GET(request, { params: { attachmentId: 'attach123' } });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });

    it('should handle empty query parameters gracefully', async () => {
      (handleAttachmentDownload as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          message: 'Missing required parameters: noticeId and schoolId are required',
          code: 'MISSING_PARAMETERS',
        },
      });

      const request = {
        url: 'http://localhost:3000/api/attachments/download/attach123?noticeId=&schoolId='
      } as any;

      const response = await GET(request, { params: { attachmentId: 'attach123' } });

      expect(response.status).toBe(400);
      expect(handleAttachmentDownload).toHaveBeenCalledWith({
        attachmentId: 'attach123',
        noticeId: '',
        schoolId: '',
      });
    });
  });
});