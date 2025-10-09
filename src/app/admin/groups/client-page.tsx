/**
 * Client-side Groups Management Page - MySchool Application
 *
 * Client-rendered page for managing groups with proper authentication.
 * HTML structure designed for parsing by Flutter adapter.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/utils/api-client';
import type { Group, School } from '@/lib/types';
import GroupActions from '@/components/admin/GroupActions';

export default function AdminGroupsClientPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Set page title
  useEffect(() => {
    document.title = 'Manage Groups | Admin';
  }, []);

  // Function to fetch groups data
  const fetchGroups = async () => {
    try {
      // Fetch groups with schoolId parameter
      const groupsResponse = await apiGet('/api/admin/groups?schoolId=test-school-123');
      
      if (!groupsResponse.success) {
        setError(groupsResponse.error || 'Failed to fetch groups');
        return;
      }

      setGroups(groupsResponse.data?.groups || []);
    } catch (err) {
      setError('An error occurred while fetching data');
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchGroups();

        // For now, we'll use a mock schools map since we don't have a schools endpoint
        const mockSchools: School[] = [
          { schoolId: 'test-school-123', name: 'Test School', address: '123 Test St' }
        ];
        
        setSchools(mockSchools);
        setUserEmail('admin@test.com'); // This would come from session
      } catch (err) {
        setError('An error occurred while fetching data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle group deletion
  const handleGroupDelete = async (deletedGroupId: string) => {
    // Remove the deleted group from the state immediately for better UX
    setGroups(prevGroups => prevGroups.filter(group => group.groupId !== deletedGroupId));
    
    // Then fetch fresh data to ensure consistency
    await fetchGroups();
  };

  // Create a map of school IDs to school names for display
  const schoolMap = new Map(schools.map(school => [school.schoolId, school.name]));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Groups
            </h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Loading groups...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Groups
            </h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-red-600 text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div
        data-page-type="admin-groups"
        data-portal-version="1.0.0"
        data-timestamp={new Date().toISOString()}
        className="hidden"
        aria-hidden="true"
      >
        {/* Page metadata for parser */}
      </div>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <Link
                  href="/admin/dashboard"
                  className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
                >
                  ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  Manage Groups
                </h1>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600">
                  Welcome, {userEmail}
                </span>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  School Groups & Classes
                </h2>
                <p className="text-gray-600 mt-1">
                  Organize students into classes, grade levels, and other groups.
                </p>
              </div>
              <Link
                href="/admin/groups/create"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                data-admin-action="create-group"
              >
                Create New Group
              </Link>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600 text-lg">
                No groups found. Create your first group.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Group ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Group Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        School
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groups.map((group) => (
                      <tr
                        key={group.groupId}
                        className="hover:bg-gray-50"
                        data-group-id={group.groupId}
                        data-group-name={group.name}
                        data-group-school-id={group.schoolId}
                        data-group-description={group.description}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {group.groupId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {group.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {schoolMap.get(group.schoolId) || group.schoolId}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {group.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/groups/${group.groupId}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                              data-group-action="edit"
                            >
                              Edit
                            </Link>
                            <GroupActions
                              groupId={group.groupId}
                              groupName={group.name}
                              onDelete={handleGroupDelete}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}