/**
 * Notice Actions Component - Client Component for interactive elements
 * 
 * This component handles interactive actions for notice management,
 * such as delete operations that require event handlers.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NoticeActionsProps {
  noticeId: string;
  noticeTitle: string;
  onDelete?: (noticeId: string) => void;
}

export default function NoticeActions({ noticeId, noticeTitle, onDelete }: NoticeActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${noticeTitle}"?`)) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/admin/notices/${noticeId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete notice');
        }

        // Call the onDelete callback if provided
        if (onDelete) {
          onDelete(noticeId);
        }

        // Refresh the page to show updated list
        router.refresh();
      } catch (error) {
        console.error('Error deleting notice:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete notice');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
      data-notice-action="delete"
      onClick={handleDelete}
      disabled={isDeleting}
      type="button"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
