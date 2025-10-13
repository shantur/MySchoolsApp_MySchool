/**
 * Edit Group Page - MySchool Admin
 *
 * Client-side form for editing existing groups.
 * HTML structure designed for parsing by Flutter adapter.
 */

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Group } from '@/lib/types';
import { apiGet, apiPut } from '@/lib/utils/api-client';

export default function EditGroupPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [originalGroup, setOriginalGroup] = useState<Group | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [_error, _setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  // Set page title
  useEffect(() => {
    document.title = 'Edit Group | Admin';
  }, [groupId]);

  // Fetch group data on component mount
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await apiGet<{ group: Group }>(`/api/admin/groups/${groupId}`);
        
        if (!response.success) {
          setErrors({ form: response.error || 'Failed to fetch group' });
          setIsLoading(false);
          return;
        }

        const group: Group = response.data!.group;
        
        setOriginalGroup(group);
        setFormData({
          name: group.name,
          description: group.description || '',
        });
      } catch {
        setErrors({ form: 'An error occurred while fetching the group' });
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const response = await apiPut(`/api/admin/groups/${groupId}`, {
        name: formData.name,
        description: formData.description || undefined,
      });

      if (!response.success) {
        setErrors({ form: response.error || 'Failed to update group' });
        setIsSaving(false);
        return;
      }

      // Redirect to groups list
      router.push('/admin/groups');
    } catch {
      setErrors({ form: 'An error occurred. Please try again.' });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Group
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Loading group data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (errors.form && !originalGroup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link
              href="/admin/groups"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Back to Groups
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Group
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-red-600 text-lg">{errors.form}</p>
            <Link
              href="/admin/groups"
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Groups
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/admin/groups"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Groups
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Group
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow">
          {originalGroup && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Group Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Group ID:</span>
                  <span className="ml-2 text-gray-600">{originalGroup.groupId}</span>
                </div>
                <div>
                  <span className="font-medium">School ID:</span>
                  <span className="ml-2 text-gray-600">{originalGroup.schoolId}</span>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            data-form-type="edit-group"
            aria-label="Edit group form"
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Group Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                data-field="group-name"
                aria-label="Group name"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Grade 5A"
                disabled={isSaving}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                data-field="description"
                aria-label="Group description"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the group..."
                disabled={isSaving}
              />
            </div>

            <div
              data-error-container
              className="min-h-[24px]"
            >
              {errors.form && (
                <div
                  data-error-message
                  className="text-red-600 text-sm"
                  role="alert"
                >
                  {errors.form}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                data-action="edit-group-submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <Link
                href="/admin/groups"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}