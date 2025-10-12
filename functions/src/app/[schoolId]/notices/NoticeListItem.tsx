/**
 * Notice List Item Component
 * 
 * Client component that displays a single notice in the list with
 * read/unread visual indicators (bold title, blue dot).
 */

'use client';

import Link from 'next/link';

// Serialized notice data (timestamps converted to strings)
interface SerializedNotice {
  noticeId: string;
  schoolId: string;
  groupId: string;
  title: string;
  body: string;
  status: 'draft' | 'published' | 'archived';
  publicationDate: string; // ISO string
  createdAt?: string; // ISO string - when the notice was first created
  senderName?: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    downloadURL: string;
    size?: number;
  }>;
}

interface NoticeListItemProps {
  notice: SerializedNotice;
  schoolId: string;
  isUnread: boolean;
}

export default function NoticeListItem({
  notice,
  schoolId,
  isUnread,
}: NoticeListItemProps) {
  return (
    <article
      className={`notice-item bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow ${
        isUnread ? 'border-l-4 border-blue-500' : ''
      }`}
      data-notice-id={notice.noticeId}
      data-school-id={notice.schoolId}
      data-read-status={isUnread ? 'unread' : 'read'}
      data-created-at={notice.createdAt}
    >
      <div className="flex items-start gap-3">
        {/* Blue dot indicator for unread notices */}
        {isUnread && (
          <span
            className="flex-shrink-0 mt-1"
            aria-label="Unread"
            data-unread-indicator
          >
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
          </span>
        )}
        
        <div className="flex-1">
          <h2
            className={`text-xl text-gray-900 mb-2 ${
              isUnread ? 'font-bold' : 'font-semibold'
            }`}
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
            <div className="flex flex-col gap-1">
              {notice.senderName && (
                <span
                  className="text-gray-600"
                  data-notice-sender-name
                >
                  From: {notice.senderName}
                </span>
              )}
              <span
                className="notice-date text-gray-500"
                data-notice-publication-date={notice.publicationDate}
                data-notice-publication-time={
                  new Date(notice.publicationDate).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                }
              >
                {new Date(notice.publicationDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                at{' '}
                {new Date(notice.publicationDate).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </span>
            </div>
            
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
        </div>
      </div>
    </article>
  );
}
