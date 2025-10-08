/**
 * Notices List Page - MySchool Application
 * 
 * Server-rendered page displaying all notices for a school.
 * HTML structure designed for parsing by Flutter adapter.
 */

import { getUserSession } from '@/lib/auth/session';
import { getNoticesBySchool } from '@/lib/handlers/notices-handler';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notices - MySchool',
  description: 'View school notices and announcements',
};

interface NoticesListPageProps {
  params: {
    schoolId: string;
  };
}

export default async function NoticesListPage({
  params,
}: NoticesListPageProps) {
  const { schoolId } = params;
  
  // Get user session (middleware already handled authorization)
  const session = await getUserSession();
  
  // This should never happen if middleware is working correctly,
  // but we'll handle it gracefully for defense-in-depth
  if (!session) {
    throw new Error('Access denied: Authentication required');
  }
  
  // Verify user has access to this school
  if (session.schoolId !== schoolId && session.role !== 'admin') {
    throw new Error('Access denied: School access required');
  }
  
  // Fetch notices
  const notices = await getNoticesBySchool(session, schoolId);
  
  return (
    <>
      <div
        data-page-type="notice-list"
        data-portal-version="1.0.0"
        data-timestamp={new Date().toISOString()}
        data-school-id={schoolId}
        className="hidden"
        aria-hidden="true"
      >
        {/* Page metadata for parser */}
      </div>
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                School Notices
              </h1>
              <div className="flex gap-4">
                <Link
                  href={`/${schoolId}/profile`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Profile
                </Link>
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

        <main className="max-w-4xl mx-auto px-4 py-8">
          {notices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No notices available at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <article
                  key={notice.noticeId}
                  className="notice-item bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
                  data-notice-id={notice.noticeId}
                  data-school-id={notice.schoolId}
                >
                  <h2
                    className="text-xl font-semibold text-gray-900 mb-2"
                    data-notice-title
                  >
                    {notice.title}
                  </h2>
                  
                  <p
                    className="notice-summary text-gray-700 mb-4 line-clamp-3"
                    data-notice-summary
                  >
                    {notice.body.substring(0, 200)}
                    {notice.body.length > 200 ? '...' : ''}
                  </p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span
                      className="notice-date text-gray-500"
                      data-notice-publication-date={
                        notice.publicationDate.toDate().toISOString()
                      }
                    >
                      {notice.publicationDate.toDate().toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </span>
                    
                    <div className="flex items-center gap-4">
                      {notice.attachments && notice.attachments.length > 0 && (
                        <span
                          className="text-gray-600"
                          data-attachment-count={notice.attachments.length}
                        >
                          📎 {notice.attachments.length} attachment
                          {notice.attachments.length > 1 ? 's' : ''}
                        </span>
                      )}
                      
                      <Link
                        href={`/${schoolId}/notices/${notice.noticeId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        data-notice-detail-link
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
