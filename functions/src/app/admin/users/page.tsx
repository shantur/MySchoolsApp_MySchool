/**
 * Admin Users Management Page - MySchool Application
 *
 * Server-rendered page wrapper for managing users.
 * HTML structure designed for parsing by Flutter adapter.
 */

import { getUserSession } from '@/lib/auth/session';
import AdminUsersClientPage from './client-page';
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

        <AdminUsersClientPage />
      </div>
    </>
  );
}