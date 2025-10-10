/**
 * Edit Notice Page - MySchool Admin
 *
 * Client-side form for editing existing notices.
 * HTML structure designed for parsing by Flutter adapter.
 */

'use client';

import { useState, FormEvent, useEffect } from 'react';
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
  downloadURL?: string;
  file?: File;
}

interface Notice {
  noticeId: string;
  schoolId: string;
  groupId: string;
  title: string;
  body: string;
  status: 'draft' | 'published' | 'archived';
  attachments?: Attachment[];
}

interface EditNoticePageProps {
  params: { id: string };
}

export default function EditNoticePage({ params }: EditNoticePageProps) {
  const noticeId = params.id;
  
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    schoolId: '',
    groupId: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  // Fetch notice data on mount
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        // First, we need to fetch the notice to get the schoolId
        // Since we don't know the schoolId yet, we'll need to fetch without it
        // This is a limitation of the current API design
        // For now, we'll use a workaround by fetching all notices and finding this one
        const response = await fetch('/api/admin/notices');
        if (!response.ok) {
          throw new Error('Failed to fetch notices');
        }
        
        const data = await response.json();
        const notice = data.notices?.find((n: Notice) => n.noticeId === noticeId);
        
        if (!notice) {
          throw new Error('Notice not found');
        }

        setFormData({
          title: notice.title,
          body: notice.body,
          schoolId: notice.schoolId,
          groupId: notice.groupId || '',
          status: notice.status,
        });
        setAttachments(notice.attachments || []);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notice');
        setIsLoading(false);
      }
    };

    fetchNotice();
  }, [noticeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.body.trim()) {
      setError('Title and body are required');
      return;
    }

    setIsSaving(true);

    try {
      // Prepare attachments for submission
      const attachmentMetadata = attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        size: att.size,
        downloadURL: att.downloadURL || '',
      }));

      const response = await fetch(`/api/admin/notices/${noticeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          status: formData.status,
          groupId: formData.groupId,
          attachments: attachmentMetadata.length > 0 ? attachmentMetadata : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update notice');
        setIsSaving(false);
        return;
      }

      // Redirect to notices list
      router.push('/admin/notices');
    } catch {
      setError('An error occurred. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notice...</p>
        </div>
      </div>
    );
  }

  if (error && isLoading === false && !formData.title) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link
              href="/admin/notices"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Back to Notices
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Notice
            </h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 p-8 rounded-lg shadow text-center">
            <p className="text-red-600 text-lg">
              {error}
            </p>
            <Link
              href="/admin/notices"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              Return to Notices
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
            Edit Notice
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <form
          onSubmit={handleSubmit}
          data-form-type="edit-notice"
          aria-label="Edit notice form"
          className="space-y-6"
        >
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
                  disabled={isSaving}
                />
              </div>

              <div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSaving}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
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
                disabled={isSaving}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use the toolbar to format your content.
              </p>
            </div>

            {/* Attachments Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <AttachmentUpload
                attachments={attachments}
                onChange={setAttachments}
                disabled={isSaving}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload PDF files and images to accompany your notice.
              </p>
            </div>

            <div className="mb-6">
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
                disabled={isSaving || isLoadingGroups}
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.groupId} value={group.groupId}>
                    {group.name} ({group.schoolId})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You can change which group receives this notice
              </p>
            </div>
          </div>

          <div
            data-error-container
            className="min-h-[24px]"
          >
            {error && !isLoading && (
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
              data-action="update-notice-submit"
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/notices"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors inline-block"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
