/**
 * Attachment Upload Component
 *
 * Component for uploading and managing file attachments.
 * Supports drag-and-drop and file selection.
 */

'use client';

import { useState, useRef } from 'react';

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  file?: File;
  downloadURL?: string;
  uploading?: boolean;
  uploadError?: string;
}

interface AttachmentUploadProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  schoolId: string; // Required for upload
  noticeId: string; // Required for upload (use temporary ID for new notices)
}

export default function AttachmentUpload({
  attachments,
  onChange,
  disabled = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  schoolId,
  noticeId,
}: AttachmentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID
  const generateId = () => `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'File type not supported. Please upload JPEG, PNG, GIF, or PDF files.';
    }
    if (file.size > maxSize) {
      return `File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
    }
    if (attachments.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed.`;
    }
    return null;
  };

  // Upload a single file
  const uploadFile = async (file: File, attachmentId: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('schoolId', schoolId);
      formData.append('noticeId', noticeId);

      const response = await fetch('/api/admin/upload-attachment', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return data.downloadURL;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  // Handle file selection
  const handleFiles = async (files: FileList | null) => {
    if (!files || disabled) return;

    const errors: string[] = [];
    const newAttachments: Attachment[] = [];

    // Validate all files first
    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        return;
      }

      const attachment: Attachment = {
        id: generateId(),
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        file,
        uploading: true,
      };

      newAttachments.push(attachment);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newAttachments.length === 0) return;

    // Add attachments with "uploading" status
    const updatedAttachments = [...attachments, ...newAttachments];
    onChange(updatedAttachments);

    // Upload each file
    for (const attachment of newAttachments) {
      try {
        // Set initial progress
        setUploadProgress(prev => ({ ...prev, [attachment.id]: 0 }));

        // Simulate progress (since we can't track real progress with FormData)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[attachment.id] || 0;
            if (current >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [attachment.id]: current + 10 };
          });
        }, 200);

        const downloadURL = await uploadFile(attachment.file!, attachment.id);

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [attachment.id]: 100 }));

        // Update attachment with download URL
        onChange(prevAttachments =>
          prevAttachments.map(att =>
            att.id === attachment.id
              ? { ...att, downloadURL, uploading: false, file: undefined }
              : att
          )
        );

        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[attachment.id];
            return newProgress;
          });
        }, 1000);
      } catch (error) {
        // Update attachment with error
        onChange(prevAttachments =>
          prevAttachments.map(att =>
            att.id === attachment.id
              ? {
                  ...att,
                  uploading: false,
                  uploadError: error instanceof Error ? error.message : 'Upload failed',
                }
              : att
          )
        );

        // Clear progress
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[attachment.id];
          return newProgress;
        });
      }
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    onChange(attachments.filter(att => att.id !== id));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        data-testid="attachment-upload-area"
        data-attachment-upload-area
      >
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <div className="text-lg font-medium text-gray-700">
            {dragActive ? 'Drop files here' : 'Upload Attachments'}
          </div>
          <div className="text-sm text-gray-500">
            Drag and drop files here, or click to select files
          </div>
          <div className="text-xs text-gray-400">
            Supported: JPEG, PNG, GIF, PDF (max {Math.round(maxSize / 1024 / 1024)}MB each, max {maxFiles} files)
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
          data-testid="attachment-file-input"
          data-attachment-file-input
        />
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Attachments ({attachments.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  attachment.uploadError
                    ? 'bg-red-50 border-red-200'
                    : attachment.uploading
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
                data-attachment-id={attachment.id}
                data-attachment-name={attachment.fileName}
                data-attachment-type={attachment.fileType}
                data-attachment-size={attachment.size}
                data-attachment-download-url={attachment.downloadURL || ''}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-2xl">{getFileIcon(attachment.fileType)}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {attachment.fileName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                      {attachment.uploading && (
                        <span className="ml-2 text-blue-600">Uploading...</span>
                      )}
                      {attachment.uploadError && (
                        <span className="ml-2 text-red-600">
                          Error: {attachment.uploadError}
                        </span>
                      )}
                      {attachment.downloadURL && !attachment.uploading && (
                        <span className="ml-2 text-green-600">✓ Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  disabled={disabled || attachment.uploading}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-attachment-action="remove"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
          {Object.entries(uploadProgress).map(([id, progress]) => {
            const attachment = attachments.find(att => att.id === id);
            return (
              <div key={id} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{attachment?.fileName || 'Uploading...'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}