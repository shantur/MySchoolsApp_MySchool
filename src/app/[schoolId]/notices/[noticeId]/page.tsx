/**
 * Notice Detail Page - MySchool Application
 * 
 * Server-rendered page displaying full notice content with attachments.
 * HTML structure designed for parsing by Flutter adapter.
 */

import { getUserSession } from '@/lib/auth/session';
import { getNoticeById } from '@/lib/handlers/notices-handler';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notice Detail - MySchool',
  description: 'View notice details',
};

interface NoticeDetailPageProps {
  params: {
    schoolId: string;
    noticeId: string;
  };
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export default async function NoticeDetailPage({
  params,
}: NoticeDetailPageProps) {
  const { schoolId, noticeId } = params;
  
  // Get user session (middleware already handled authorization)
  const session = await getUserSession();
  
  // This should never happen if middleware is working correctly,
  // but we'll handle it gracefully for defense-in-depth
  if (!session) {
    throw new Error('Access denied: Authentication required');
  }
  
  // Verify user has access to this school
  if (session.schoolId !== schoolId && session.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="mt-2 text-gray-600">
            You do not have access to this school&apos;s notices.
          </p>
        </div>
      </div>
    );
  }
  
  // Fetch notice
  const notice = await getNoticeById(schoolId, noticeId, session);
  
  if (!notice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Notice not found
          </h1>
          <p className="mt-2 text-gray-600">
            The requested notice could not be found.
          </p>
          <Link
            href={`/${schoolId}/notices`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Back to Notices
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div
        data-page-type="notice-detail"
        data-portal-version="1.0.0"
        data-timestamp={new Date().toISOString()}
        data-notice-id={noticeId}
        data-school-id={schoolId}
        className="hidden"
        aria-hidden="true"
      >
        {/* Page metadata for parser */}
      </div>
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link
              href={`/${schoolId}/notices`}
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← Back to Notices
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <article
            className="notice-detail bg-white p-8 rounded-lg shadow"
            data-notice-id={notice.noticeId}
          >
            <h1
              className="text-3xl font-bold text-gray-900 mb-4"
              data-notice-title
            >
              {notice.title}
            </h1>
            
            <div className="text-sm text-gray-500 mb-6">
              <span
                data-notice-publication-date={
                  notice.publicationDate.toDate().toISOString()
                }
              >
                Published on{' '}
                {notice.publicationDate.toDate().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            
            <div
              className="notice-content prose max-w-none mb-8"
              data-notice-body
              data-content-format="html"
              dangerouslySetInnerHTML={{ __html: notice.body }}
            />
            
            {notice.attachments && notice.attachments.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Attachments
                </h2>
                <ul className="attachments-list space-y-2">
                  {notice.attachments.map((attachment) => {
                    return (
                      <li
                        key={attachment.id}
                        className="attachment-item flex items-center gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                        data-attachment-id={attachment.id}
                      >
                        <span className="text-2xl">
                          {attachment.fileType.startsWith('image/')
                            ? '🖼️'
                            : '📄'}
                        </span>
                        <div className="flex-1">
                          <a
                            href={`${attachment.downloadURL}?noticeId=${notice.noticeId}&schoolId=${schoolId}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            data-attachment-download-url={`${attachment.downloadURL}?noticeId=${notice.noticeId}&schoolId=${schoolId}`}
                            data-attachment-filename={attachment.fileName}
                            data-attachment-filetype={attachment.fileType}
                            data-attachment-size={attachment.size?.toString()}
                            download
                          >
                            {attachment.fileName}
                          </a>
                          {attachment.size && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({formatFileSize(attachment.size)})
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </article>
        </main>
      </div>
    </>
  );
}
