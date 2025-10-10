/**
 * Mark as Read Script
 * 
 * Client-side script that automatically marks a notice as read when
 * the notice detail page loads. This runs once per page load.
 */

'use client';

import { useEffect, useRef } from 'react';

interface MarkAsReadScriptProps {
  noticeId: string;
}

export default function MarkAsReadScript({ noticeId }: MarkAsReadScriptProps) {
  const hasMarkedRef = useRef(false);

  useEffect(() => {
    // Only mark as read once per page load
    if (hasMarkedRef.current) {
      return;
    }

    hasMarkedRef.current = true;

    const markAsRead = async () => {
      try {
        const response = await fetch(`/api/user/notices/${noticeId}/mark-read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('Failed to mark notice as read:', response.statusText);
        }
      } catch (error) {
        console.error('Error marking notice as read:', error);
      }
    };

    markAsRead();
  }, [noticeId]);

  return null; // This component doesn't render anything
}
