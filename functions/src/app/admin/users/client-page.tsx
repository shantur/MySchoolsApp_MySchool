/**
 * Admin Users Management Page - Client Component
 *
 * Client-side component for managing users with delete functionality.
 * HTML structure designed for parsing by Flutter adapter.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User } from '@/lib/types';

export default function AdminUsersClientPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ uid: string; email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (uid: string, email: string) => {
    setDeleteConfirm({ uid, email });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${deleteConfirm.uid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
        return;
      }

      // Remove user from list
      setUsers(users.filter(u => u.uid !== deleteConfirm.uid));
      setDeleteConfirm(null);
    } catch (err) {
      setError('An error occurred while deleting the user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                User Accounts
              </h2>
              <p className="text-gray-600 mt-1">
                Manage user accounts for parents and staff.
              </p>
            </div>
            <Link
              href="/admin/users/create"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              data-admin-action="create-user"
            >
              Create New User
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {users.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">
              No users found. Create your first user account.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" data-testid="users-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role
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
                      Groups
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
                  {users.map((user) => (
                    <tr
                      key={user.uid}
                      className="hover:bg-gray-50"
                      data-testid="user-row"
                      data-user-id={user.uid}
                      data-user-email={user.email}
                      data-user-role={user.role}
                      data-user-school-id={user.schoolId}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.email}
                        </div>
                        {user.displayName && (
                          <div className="text-sm text-gray-500">
                            {user.displayName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                          data-user-role-badge
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.schoolId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.groupIds && user.groupIds.length > 0
                          ? user.groupIds.join(', ')
                          : 'None'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/users/${user.uid}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                            data-user-action="edit"
                            data-testid="edit-user-button"
                          >
                            Edit
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-900"
                            data-user-action="delete"
                            data-testid="delete-user-button"
                            onClick={() => handleDeleteClick(user.uid, user.email)}
                            disabled={
                              user.role === 'admin' && 
                              users.filter(u => u.role === 'admin').length === 1
                            }
                            title={
                              user.role === 'admin' && 
                              users.filter(u => u.role === 'admin').length === 1
                                ? 'Cannot delete the last admin user'
                                : 'Delete user'
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="delete-modal">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete User
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the user &quot;{deleteConfirm.email}&quot;? 
              This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                data-testid="confirm-delete-button"
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}