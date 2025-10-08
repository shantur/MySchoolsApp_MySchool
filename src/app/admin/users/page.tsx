/**
 * Admin Users Management Page - MySchool Application
 *
 * Server-rendered page for managing users.
 * HTML structure designed for parsing by Flutter adapter.
 */

import { getUserSession } from '@/lib/auth/session';
import { getAllUsers } from '@/lib/handlers/users-handler';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Manage Users - MySchool Admin',
  description: 'Create and manage user accounts',
};

export default async function AdminUsersPage() {
  // Get user session (middleware already handled authorization)
  const session = await getUserSession();

  // This should never happen if middleware is working correctly,
  // but we'll handle it gracefully for defense-in-depth
  if (!session || session.role !== 'admin') {
    throw new Error('Access denied: Admin access required');
  }

  // Fetch all users
  const users = await getAllUsers();

  return (
    <>
      <div
        data-page-type="admin-users"
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
                  Manage Users
                </h1>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-600">
                  Welcome, {session.email}
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

          {users.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600 text-lg">
                No users found. Create your first user account.
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
                            >
                              Edit
                            </Link>
                            <button
                              className="text-red-600 hover:text-red-900"
                              data-user-action="delete"
                              disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
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
        </main>
      </div>
    </>
  );
}