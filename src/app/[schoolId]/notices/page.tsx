/**
 * Notices List Page - MySchool Application
 * 
 * Server-rendered page displaying all notices for a school.
 * HTML structure designed for parsing by Flutter adapter.
 */

import { getUserSession } from '@/lib/auth/session';
import { getNoticesBySchool } from '@/lib/handlers/notices-handler';
import { getBulkReadStatus } from '@/lib/services/notice-read.service';
import Link from 'next/link';
import NoticeListItem from './NoticeListItem';

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
  
  // Fetch read status for all notices
  const noticeIds = notices.map(n => n.noticeId);
  const readStatus = await getBulkReadStatus(session.uid, noticeIds);
  
  // Calculate unread count
  const unreadCount = Object.values(readStatus).filter(isRead => !isRead).length;
  
  // Serialize notices for client component (convert Timestamps to strings)
  const serializedNotices = notices.map(notice => ({
    noticeId: notice.noticeId,
    schoolId: notice.schoolId,
    groupId: notice.groupId,
    title: notice.title,
    body: notice.body,
    status: notice.status,
    publicationDate: notice.publicationDate.toDate().toISOString(),
    senderName: notice.senderName,
    attachments: notice.attachments,
  }));
  
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
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  School Notices
                </h1>
                {unreadCount > 0 && (
                  <span
                    className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold leading-none text-white bg-blue-500 rounded-full"
                    data-unread-count={unreadCount}
                    aria-label={`${unreadCount} unread notices`}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
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
              {serializedNotices.map((notice) => (
                <NoticeListItem
                  key={notice.noticeId}
                  notice={notice}
                  schoolId={schoolId}
                  isUnread={!readStatus[notice.noticeId]}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
