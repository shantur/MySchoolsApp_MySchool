/**
 * Create Group Page - MySchool Admin
 *
 * Client-side form for creating new groups.
 * HTML structure designed for parsing by Flutter adapter.
 */

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost, apiGet } from '@/lib/utils/api-client';
import type { School } from '@/lib/types';

export default function CreateGroupPage() {
  const [formData, setFormData] = useState({
    name: '',
    schoolId: '',
    description: '',
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Set page title
  useEffect(() => {
    document.title = 'Create Group | Admin';
  }, []);

  // Fetch schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await apiGet<{ success: boolean; schools: School[] }>('/api/admin/schools');
        if (response.success && response.data?.schools) {
          setSchools(response.data.schools);
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
      } finally {
        setIsLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

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
    
    if (!formData.schoolId.trim()) {
      newErrors.schoolId = 'School ID is required';
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

    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiPost('/api/admin/groups', {
        name: formData.name,
        schoolId: formData.schoolId,
        description: formData.description || undefined,
      });

      if (!response.success) {
        setErrors({ form: response.error || 'Failed to create group' });
        setIsLoading(false);
        return;
      }

      // Redirect to groups list
      router.push('/admin/groups');
    } catch (error) {
      setErrors({ form: 'An error occurred. Please try again.' });
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
                  value={formData.name}
                  onChange={handleInputChange}
                  data-field="group-name"
                  aria-label="Group name"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Grade 5A"
                  disabled={isLoading}
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
                htmlFor="schoolId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                School *
              </label>
              <select
                id="schoolId"
                name="schoolId"
                value={formData.schoolId}
                onChange={handleInputChange}
                data-field="school-id"
                aria-label="School"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.schoolId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading || isLoadingSchools}
                aria-invalid={!!errors.schoolId}
                aria-describedby={errors.schoolId ? 'schoolId-error' : undefined}
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.schoolId} value={school.schoolId}>
                    {school.name} ({school.schoolId})
                  </option>
                ))}
              </select>
              {errors.schoolId && (
                <p id="schoolId-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.schoolId}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Select the school this group belongs to
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