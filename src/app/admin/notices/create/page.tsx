/**
 * Create Notice Page - MySchool Admin
 *
 * Client-side rich text editor with live HTML preview panel for creating notices.
 * HTML structure designed for parsing by Flutter adapter.
 */

'use client';

import { useState, FormEvent, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/ui/forms/RichTextEditor';
import AttachmentUpload from '@/components/ui/forms/AttachmentUpload';
import { apiGet } from '@/lib/utils/api-client';
import type { Group } from '@/lib/types';

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

export default function CreateNoticePage() {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    groupId: '',
    status: 'draft',
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempNoticeId] = useState(() => `temp-${Date.now()}`); // Temporary ID for uploads
  const router = useRouter();

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await apiGet<{ success: boolean; data: { groups: Group[] } }>('/api/admin/groups');
        if (response.success && response.data?.data?.groups) {
          setGroups(response.data.data.groups);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoadingGroups(false);
      }
    };
    fetchGroups();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Get selected group details
  const selectedGroup = useMemo(() => {
    return groups.find(g => g.groupId === formData.groupId);
  }, [groups, formData.groupId]);

  // Generate preview HTML with data attributes
  const previewHtml = useMemo(() => {
    if (!formData.title && !formData.body) return '';

    const noticeId = 'preview-notice';
    const timestamp = new Date().toISOString();

    return `
      <div data-page-type="notice-detail" data-portal-version="1.0.0" data-timestamp="${timestamp}" data-notice-id="${noticeId}" data-group-id="${formData.groupId}" data-school-id="${selectedGroup?.schoolId || ''}" class="hidden" aria-hidden="true"></div>

      <article class="notice-detail" data-notice-id="${noticeId}">
        <h1 data-notice-title>${formData.title || 'Notice Title'}</h1>
        <div class="notice-content" data-notice-body data-content-format="html">
          ${formData.body ? formData.body.replace(/\n/g, '<br>') : '<p>Notice content will appear here...</p>'}
        </div>
      </article>
    `;
  }, [formData.title, formData.body, formData.groupId, selectedGroup]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.body.trim() || !formData.groupId.trim()) {
      setError('Title, body, and group are required');
      return;
    }

    setIsLoading(true);

    try {
      // Check if any attachments are still uploading
      const uploading = attachments.some(att => att.uploading);
      if (uploading) {
        setError('Please wait for all attachments to finish uploading');
        setIsLoading(false);
        return;
      }

      // Check if any attachments have errors
      const hasErrors = attachments.some(att => att.uploadError);
      if (hasErrors) {
        setError('Some attachments failed to upload. Please remove them and try again.');
        setIsLoading(false);
        return;
      }

      // Only include attachments that have successfully uploaded (have downloadURL)
      const uploadedAttachments = attachments
        .filter(att => att.downloadURL)
        .map(att => ({
          id: att.id,
          fileName: att.fileName,
          fileType: att.fileType,
          size: att.size,
          downloadURL: att.downloadURL!,
        }));

      const response = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          groupId: formData.groupId,
          status: formData.status,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create notice');
        setIsLoading(false);
        return;
      }

      // Redirect to notices list
      router.push('/admin/notices');
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/admin/notices"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Notices
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Notice
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <form
          onSubmit={handleSubmit}
          data-form-type="create-notice"
          aria-label="Create notice form"
          className="space-y-6"
        >
          {/* Form Fields */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Notice Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  data-field="notice-title"
                  aria-label="Notice title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notice title"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="groupId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Target Group *
                </label>
                <select
                  id="groupId"
                  name="groupId"
                  required
                  value={formData.groupId}
                  onChange={handleInputChange}
                  data-field="group-id"
                  aria-label="Target Group"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading || isLoadingGroups}
                >
                  <option value="">Select a group</option>
                  {groups.map((group) => (
                    <option key={group.groupId} value={group.groupId}>
                      {group.name} ({group.schoolId})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select which group will receive this notice
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                data-field="notice-status"
                aria-label="Notice status"
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="mb-6">
              <label
                htmlFor="body"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notice Content *
              </label>
              <RichTextEditor
                value={formData.body}
                onChange={(value) => setFormData(prev => ({ ...prev, body: value }))}
                placeholder="Enter notice content..."
                disabled={isLoading}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use the toolbar to format your content. The preview panel shows how this will be rendered.
              </p>
            </div>

            {/* Attachments Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              {formData.groupId && selectedGroup ? (
                <AttachmentUpload
                  attachments={attachments}
                  onChange={setAttachments}
                  disabled={isLoading}
                  maxFiles={5}
                  maxSize={10 * 1024 * 1024} // 10MB
                  schoolId={selectedGroup.schoolId}
                  noticeId={tempNoticeId}
                />
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50">
                  <p className="text-sm text-gray-500">
                    Please select a target group first to enable attachments.
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Upload PDF files and images to accompany your notice. Files will be uploaded immediately.
              </p>
            </div>

          </div>

          {/* Live HTML Preview Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Live HTML Preview Panel
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This preview shows how the MySchools App Flutter adapter will {'"'}see{'"'} this notice.
              The HTML structure includes all necessary data-* attributes for parsing.
            </p>

            <div className="border rounded-lg p-4 bg-gray-50">
              {/* Live Rendered Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Live Rendered Preview:
                </h4>
                <div className="bg-white p-4 rounded border">
                  {previewHtml ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                      className="prose max-w-none"
                    />
                  ) : (
                    <p className="text-gray-400 text-sm">Preview will appear here as you type...</p>
                  )}
                </div>
              </div>

              {/* Data Attributes Inspection */}
              {previewHtml && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Data Attributes Inspection:
                  </h4>
                  <div className="bg-white p-3 rounded border">
                    <div className="space-y-1 text-xs font-mono">
                      <div><span className="text-purple-600">data-page-type:</span> <span className="text-blue-600">{'"'}notice-detail{'"'}</span></div>
                      <div><span className="text-purple-600">data-portal-version:</span> <span className="text-blue-600">{'"'}1.0.0{'"'}</span></div>
                      <div><span className="text-purple-600">data-notice-id:</span> <span className="text-blue-600">{'"'}preview-notice{'"'}</span></div>
                      <div><span className="text-purple-600">data-group-id:</span> <span className="text-blue-600">{'"'}{formData.groupId || '(not set)'}{'"'}</span></div>
                      <div><span className="text-purple-600">data-school-id:</span> <span className="text-blue-600">{'"'}{selectedGroup?.schoolId || '(not set)'}{'"'}</span></div>
                      <div><span className="text-purple-600">data-notice-title:</span> <span className="text-blue-600">{'"'}{formData.title || '(not set)'}{'"'}</span></div>
                      <div><span className="text-purple-600">data-notice-body:</span> <span className="text-green-600">(content present)</span></div>
                      <div><span className="text-purple-600">data-content-format:</span> <span className="text-blue-600">{'"'}html{'"'}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw HTML Source */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Raw HTML Source:
                </h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto whitespace-pre-wrap font-mono">
                  {previewHtml || 'HTML source will appear here as you type...'}
                </pre>
              </div>

              <div className="text-xs text-gray-500">
                <p>
                  <strong>Note:</strong> The live preview shows the rendered DOM that the Flutter adapter will parse.
                  Use the data attributes inspection to verify all required attributes are present.
                </p>
              </div>
            </div>
          </div>

          <div
            data-error-container
            className="min-h-[24px]"
          >
            {error && (
              <div
                data-error-message
                className="text-red-600 text-sm"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              data-action="create-notice-submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Creating Notice...' : 'Create Notice'}
            </button>
            <Link
              href="/admin/notices"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}