/**
 * Admin Dashboard Page - MySchool Application
 * 
 * Server-rendered admin dashboard for managing schools, users, and notices.
 * HTML structure designed for parsing by Flutter adapter.
 */

import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth/session';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Dashboard - MySchool',
  description: 'Manage schools, users, groups, and notices',
};

export default async function AdminDashboardPage() {
  // Get user session
  const session = await getUserSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Verify user is admin
  if (session.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="mt-2 text-gray-600">
            You must be an administrator to access this page.
          </p>
          <Link
            href={`/${session.schoolId}/notices`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            Go to Notices
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div
        data-page-type="admin-dashboard"
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
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Schools Management */}
            <div
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              data-admin-section="schools"
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🏫</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Schools
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Manage school profiles, contact information, and settings.
              </p>
              <Link
                href="/admin/schools"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                data-admin-link="schools"
              >
                Manage Schools
              </Link>
            </div>

            {/* Users Management */}
            <div
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              data-admin-section="users"
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">👥</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Users
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Create and manage user accounts for parents and staff.
              </p>
              <Link
                href="/admin/users"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                data-admin-link="users"
              >
                Manage Users
              </Link>
            </div>

            {/* Groups Management */}
            <div
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              data-admin-section="groups"
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">📚</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Groups
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Organize users into classes, grade levels, and other groups.
              </p>
              <Link
                href="/admin/groups"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                data-admin-link="groups"
              >
                Manage Groups
              </Link>
            </div>

            {/* Notices Management */}
            <div
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              data-admin-section="notices"
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">📢</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Notices
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Create, edit, and publish notices and announcements.
              </p>
              <Link
                href="/admin/notices"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                data-admin-link="notices"
              >
                Manage Notices
              </Link>
            </div>

            {/* Attachments Management */}
            <div
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              data-admin-section="attachments"
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">📎</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Attachments
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Upload and manage PDF files and images for notices.
              </p>
              <Link
                href="/admin/attachments"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                data-admin-link="attachments"
              >
                Manage Attachments
              </Link>
            </div>

            {/* System Info */}
            <div
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              data-admin-section="system"
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">⚙️</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  System
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                View system information and application settings.
              </p>
              <div className="text-sm text-gray-500">
                <p>Portal Version: 1.0.0</p>
                <p>Environment: Development</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Section */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Quick Overview
            </h2>
            <p className="text-gray-600">
              Welcome to the MySchool Admin Dashboard. This testbed application
              allows you to simulate a school portal environment for testing the
              MySchools App integration.
            </p>
            <p className="text-gray-600 mt-4">
              Use the sections above to manage different aspects of the system.
              All data is server-rendered with proper HTML structure and data
              attributes for parsing by the Flutter adapter.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
