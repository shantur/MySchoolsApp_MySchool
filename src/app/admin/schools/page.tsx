/**
 * Admin Schools Management Page - MySchool Application
 *
 * Server-rendered page for managing schools.
 * HTML structure designed for parsing by Flutter adapter.
 */

import { getUserSession } from '@/lib/auth/session';
import { getAllSchools } from '@/lib/handlers/schools-handler';
import Link from 'next/link';
import SchoolActions from '@/components/admin/SchoolActions';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Manage Schools - MySchool Admin',
  description: 'Create and manage school profiles',
};

export default async function AdminSchoolsPage() {
  // Get user session (middleware already handled authorization)
  const session = await getUserSession();

  // This should never happen if middleware is working correctly,
  // but we'll handle it gracefully for defense-in-depth
  if (!session || session.role !== 'admin') {
    throw new Error('Access denied: Admin access required');
  }

  // Fetch all schools
  const schools = await getAllSchools(session);

  return (
    <>
      <div
        data-page-type="admin-schools"
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
                  Manage Schools
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
                  School Profiles
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage school information, contact details, and settings.
                </p>
              </div>
              <Link
                href="/admin/schools/create"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                data-admin-action="create-school"
              >
                Create New School
              </Link>
            </div>
          </div>

          <ErrorBoundary>
            {schools.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-600 text-lg">
                  No schools found. Create your first school profile.
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
                          School ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          School Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Address
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Contact Email
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Phone
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
                      {schools.map((school) => (
                        <tr
                          key={school.schoolId}
                          className="hover:bg-gray-50"
                          data-school-id={school.schoolId}
                          data-school-name={school.name}
                          data-school-address={school.address}
                          data-school-contact-email={school.contactEmail}
                          data-school-phone={school.phone}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {school.schoolId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {school.name}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {school.address}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {school.contactEmail}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {school.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Link
                                href={`/admin/schools/${school.schoolId}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                                data-school-action="edit"
                              >
                                Edit
                              </Link>
                              <SchoolActions
                                schoolId={school.schoolId}
                                schoolName={school.name}
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
          </ErrorBoundary>
        </main>
      </div>
    </>
  );
}