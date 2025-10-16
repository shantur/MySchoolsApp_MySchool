/**
 * Admin Notices Management Page - MySchool Application
 *
 * Server-rendered page for managing notices with rich text editor and live HTML preview.
 * HTML structure designed for parsing by Flutter adapter.
 */

import { getUserSession } from '@/lib/auth/session';
import { getAllNotices } from '@/lib/handlers/notices-handler';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';
import NoticeActions from '@/components/admin/NoticeActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Manage Notices - MySchool Admin',
  description: 'Create and manage school notices',
};

export default async function AdminNoticesPage() {
  // Get user session (middleware already handled authorization)
  const session = await getUserSession();

  // This should never happen if middleware is working correctly,
  // but we'll handle it gracefully for defense-in-depth
  if (!session || session.role !== 'admin') {
    throw new Error('Access denied: Admin access required');
  }

  // Fetch all notices
  const notices = await getAllNotices(session);

  return (
    <>
      <div
        data-page-type="admin-notices"
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
                  Manage Notices
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
                  School Notices
                </h2>
                <p className="text-gray-600 mt-1">
                  Create, edit, and publish notices and announcements.
                </p>
              </div>
              <Link
                href="/admin/notices/create"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                data-admin-action="create-notice"
              >
                Create New Notice
              </Link>
            </div>
          </div>

          {notices.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600 text-lg">
                No notices found. Create your first notice.
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
                        Title
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
                        Sender
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Published
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
                    {notices.map((notice) => (
                      <tr
                        key={notice.noticeId}
                        className="hover:bg-gray-50"
                        data-notice-id={notice.noticeId}
                        data-notice-title={notice.title}
                        data-notice-school-id={notice.schoolId}
                        data-notice-status={notice.status}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {notice.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {notice.body.substring(0, 100)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {notice.schoolId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {notice.senderName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              notice.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : notice.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            data-notice-status-badge
                          >
                            {notice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            {formatDate(notice.publicationDate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(notice.publicationDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/notices/${notice.noticeId}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                              data-notice-action="edit"
                            >
                              Edit
                            </Link>
                            <NoticeActions
                              noticeId={notice.noticeId}
                              noticeTitle={notice.title}
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