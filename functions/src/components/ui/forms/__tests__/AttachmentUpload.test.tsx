/**
 * Attachment Upload Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import AttachmentUpload from '../AttachmentUpload';

// Mock File constructor
global.File = class File {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string;

  constructor(_chunks: unknown[], filename: string, options: Record<string, unknown> = {}) {
    this.name = filename;
    this.size = (options.size as number) || 1024;
    this.type = (options.type as string) || 'text/plain';
    this.lastModified = Date.now();
    this.webkitRelativePath = '';
  }

  slice() {
    return new Blob([]);
  }

  stream() {
    return new ReadableStream();
  }

  text() {
    return Promise.resolve('');
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
} as unknown as typeof File;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('AttachmentUpload', () => {
  const mockOnChange = jest.fn();
  const mockAttachments = [];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area', () => {
    render(
      <AttachmentUpload
        attachments={mockAttachments}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Upload Attachments')).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop files here/)).toBeInTheDocument();
    expect(screen.getByText(/Supported: JPEG, PNG, GIF, PDF/)).toBeInTheDocument();
  });

  it('shows attachments list when attachments are provided', () => {
    const attachments = [
      {
        id: '1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        size: 1024,
      },
    ];

    render(
      <AttachmentUpload
        attachments={attachments}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Attachments (1/5)')).toBeInTheDocument();
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });

  it('calls onChange when file is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <AttachmentUpload
        attachments={mockAttachments}
        onChange={mockOnChange}
      />
    );

    const fileInput = screen.getByTestId('attachment-file-input');
    expect(fileInput).toBeInTheDocument();

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    await user.upload(fileInput, file);

    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        size: 1024,
      }),
    ]);
  });

  it('removes attachment when remove button is clicked', async () => {
    const user = userEvent.setup();
    
    const attachments = [
      {
        id: '1',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        size: 1024,
      },
    ];

    render(
      <AttachmentUpload
        attachments={attachments}
        onChange={mockOnChange}
      />
    );

    const removeButton = screen.getByText('Remove');
    await user.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    
    render(
      <AttachmentUpload
        attachments={mockAttachments}
        onChange={mockOnChange}
      />
    );

    const fileInput = screen.getByTestId('attachment-file-input');
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    await user.upload(fileInput, file);

    expect(mockOnChange).not.toHaveBeenCalled();
    // Should show an alert (we can't easily test alert in this setup)
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    
    render(
      <AttachmentUpload
        attachments={mockAttachments}
        onChange={mockOnChange}
        maxSize={100} // Very small size for testing
      />
    );

    const fileInput = screen.getByTestId('attachment-file-input');
    
    const file = new File(['test'], 'large.pdf', { type: 'application/pdf', size: 1024 });
    
    await user.upload(fileInput, file);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('validates maximum number of files', async () => {
    const user = userEvent.setup();
    
    const attachments = [
      { id: '1', fileName: 'file1.pdf', fileType: 'application/pdf', size: 1024 },
      { id: '2', fileName: 'file2.pdf', fileType: 'application/pdf', size: 1024 },
    ];

    render(
      <AttachmentUpload
        attachments={attachments}
        onChange={mockOnChange}
        maxFiles={2}
      />
    );

    const fileInput = screen.getByTestId('attachment-file-input');
    
    const file = new File(['test'], 'file3.pdf', { type: 'application/pdf' });
    
    await user.upload(fileInput, file);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('disables upload when disabled prop is true', () => {
    render(
      <AttachmentUpload
        attachments={mockAttachments}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const uploadArea = screen.getByTestId('attachment-upload-area');
    expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');

    const fileInput = screen.getByTestId('attachment-file-input');
    expect(fileInput).toBeDisabled();
  });

  it('shows correct file icon for images', () => {
    const attachments = [
      {
        id: '1',
        fileName: 'image.jpg',
        fileType: 'image/jpeg',
        size: 1024,
      },
    ];

    render(
      <AttachmentUpload
        attachments={attachments}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('🖼️')).toBeInTheDocument();
  });

  it('shows correct file icon for PDFs', () => {
    const attachments = [
      {
        id: '1',
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        size: 1024,
      },
    ];

    render(
      <AttachmentUpload
        attachments={attachments}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('📄')).toBeInTheDocument();
  });

  it('has proper data attributes for attachments', () => {
    const attachments = [
      {
        id: 'test-id',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        size: 1024,
      },
    ];

    render(
      <AttachmentUpload
        attachments={attachments}
        onChange={mockOnChange}
      />
    );

    const attachmentElement = screen.getByText('test.pdf').closest('[data-attachment-id]');
    expect(attachmentElement).toHaveAttribute('data-attachment-id', 'test-id');
    expect(attachmentElement).toHaveAttribute('data-attachment-name', 'test.pdf');
    expect(attachmentElement).toHaveAttribute('data-attachment-type', 'application/pdf');
    expect(attachmentElement).toHaveAttribute('data-attachment-size', '1024');
  });

  it('handles drag and drop events', () => {
    render(
      <AttachmentUpload
        attachments={mockAttachments}
        onChange={mockOnChange}
      />
    );

    const uploadArea = screen.getByTestId('attachment-upload-area');

    // Test drag enter
    fireEvent.dragEnter(uploadArea);
    expect(uploadArea).toHaveClass('border-blue-500', 'bg-blue-50');

    // Test drag leave
    fireEvent.dragLeave(uploadArea);
    expect(uploadArea).not.toHaveClass('border-blue-500', 'bg-blue-50');
  });
});