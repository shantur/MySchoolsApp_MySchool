/**
 * Create Group Page - MySchool Admin
 *
 * Client-side form for creating new groups.
 * HTML structure designed for parsing by Flutter adapter.
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateGroupPage() {
  const [formData, setFormData] = useState({
    groupId: '',
    name: '',
    schoolId: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.groupId.trim() || !formData.name.trim() || !formData.schoolId.trim()) {
      setError('Group ID, name, and school ID are required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: formData.groupId,
          name: formData.name,
          schoolId: formData.schoolId,
          description: formData.description || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create group');
        setIsLoading(false);
        return;
      }

      // Redirect to groups list
      router.push('/admin/groups');
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

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
            Create New Group
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow">
          <form
            onSubmit={handleSubmit}
            data-form-type="create-group"
            aria-label="Create group form"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="groupId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Group ID *
                </label>
                <input
                  id="groupId"
                  name="groupId"
                  type="text"
                  required
                  value={formData.groupId}
                  onChange={handleInputChange}
                  data-field="group-id"
                  aria-label="Group ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="grade-5a"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier for the group (lowercase, no spaces)
                </p>
              </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Grade 5A"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="schoolId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                School ID *
              </label>
              <input
                id="schoolId"
                name="schoolId"
                type="text"
                required
                value={formData.schoolId}
                onChange={handleInputChange}
                data-field="school-id"
                aria-label="School ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="school-a"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                The school this group belongs to
              </p>
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
                disabled={isLoading}
              />
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
                data-action="create-group-submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Creating Group...' : 'Create Group'}
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