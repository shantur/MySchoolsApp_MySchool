/**
 * Edit User Page - MySchool Admin
 *
 * Client-side form for editing existing users.
 * HTML structure designed for parsing by Flutter adapter.
 */

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Group, School } from '@/lib/types';

export default function EditUserPage() {
  const [formData, setFormData] = useState({
    email: '',
    schoolId: '',
    role: 'user' as 'user' | 'admin',
    displayName: '',
    groupIds: [] as string[],
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/admin/schools');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.schools) {
            setSchools(data.schools);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch schools:', err);
      }
    };

    fetchSchools();
  }, []);

  // Fetch user data and available groups on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch(`/api/admin/users/${uid}`);
        
        if (!userResponse.ok) {
          if (userResponse.status === 404) {
            setUserNotFound(true);
          } else {
            setError('Failed to fetch user data');
          }
          setIsLoading(false);
          return;
        }

        const userData = await userResponse.json();
        if (userData.success && userData.user) {
          const userSchoolId = userData.user.schoolId;
          
          setFormData({
            email: userData.user.email,
            schoolId: userSchoolId,
            role: userData.user.role,
            displayName: userData.user.displayName || '',
            groupIds: userData.user.groupIds || [],
          });

          // Fetch available groups for the user's school
          try {
            const groupsResponse = await fetch(`/api/admin/groups?schoolId=${userSchoolId}`);
            if (groupsResponse.ok) {
              const groupsData = await groupsResponse.json();
              if (groupsData.success && groupsData.data && groupsData.data.groups) {
                setAvailableGroups(groupsData.data.groups);
              }
            }
          } catch (groupsErr) {
            console.warn('Failed to fetch groups:', groupsErr);
            // Continue without groups - this is not a critical error
          }
        }
      } catch {
        setError('An error occurred while fetching user data');
      } finally {
        setIsLoading(false);
      }
    };

    if (uid) {
      fetchData();
    }
  }, [uid]);

  // Fetch groups when school changes
  useEffect(() => {
    const fetchGroups = async () => {
      if (!formData.schoolId) {
        setAvailableGroups([]);
        return;
      }

      try {
        const response = await fetch(`/api/admin/groups?schoolId=${formData.schoolId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.groups) {
            setAvailableGroups(data.data.groups);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch groups:', err);
      }
    };

    // Only fetch if schoolId changed and it's not the initial load
    if (!isLoading && formData.schoolId) {
      fetchGroups();
    }
  }, [formData.schoolId, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset groupIds when school changes
    if (name === 'schoolId') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        groupIds: [], // Clear selected groups when school changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!formData.schoolId.trim()) {
      errors.push('School ID is required');
    }
    
    if (!formData.role) {
      errors.push('Role is required');
    }
    
    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }
    
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          schoolId: formData.schoolId,
          role: formData.role,
          displayName: formData.displayName || undefined,
          groupIds: formData.groupIds.length > 0 ? formData.groupIds : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update user');
        setIsSaving(false);
        return;
      }

      // Redirect to users list
      router.push('/admin/users');
    } catch {
      setError('An error occurred. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Edit User
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (userNotFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Edit User
            </h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-red-600 text-lg mb-4">User not found</p>
            <Link
              href="/admin/users"
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Users
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
            href="/admin/users"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit User
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow">
          <form
            onSubmit={handleSubmit}
            data-form-type="edit-user"
            aria-label="Edit user form"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  data-field="email"
                  aria-label="Email address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Display Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  data-field="display-name"
                  aria-label="Display name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="schoolId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  School *
                </label>
                {schools.length === 0 ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-500">Loading schools...</span>
                  </div>
                ) : (
                  <select
                    id="schoolId"
                    name="schoolId"
                    required
                    value={formData.schoolId}
                    onChange={handleInputChange}
                    data-field="school-id"
                    aria-label="School"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSaving}
                  >
                    <option value="">Select a school</option>
                    {schools.map((school) => (
                      <option key={school.schoolId} value={school.schoolId}>
                        {school.name} ({school.schoolId})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Select the school this user belongs to
                </p>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  data-field="role"
                  aria-label="User role"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSaving}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {formData.schoolId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Memberships
                </label>
                <div
                  data-field="group-memberships"
                  className="space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto"
                >
                  {availableGroups.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No groups available for this school
                    </p>
                  ) : (
                    availableGroups.map((group) => (
                      <div
                        key={group.groupId}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          id={`group-${group.groupId}`}
                          checked={formData.groupIds.includes(group.groupId)}
                          onChange={() => handleGroupToggle(group.groupId)}
                          data-group-id={group.groupId}
                          data-group-name={group.name}
                          disabled={isSaving}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`group-${group.groupId}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {group.name}
                        </label>
                        {group.description && (
                          <span className="text-xs text-gray-500">
                            - {group.description}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select the groups this user should belong to
                </p>
              </div>
            )}

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
                data-action="edit-user-submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <Link
                href="/admin/users"
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