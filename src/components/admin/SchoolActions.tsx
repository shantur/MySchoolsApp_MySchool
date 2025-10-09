/**
 * School Actions Component - Client Component for interactive elements
 * 
 * This component handles interactive actions for school management,
 * such as delete operations that require event handlers.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SchoolActionsProps {
  schoolId: string;
  schoolName: string;
  onDelete?: (schoolId: string) => void;
}

export default function SchoolActions({ schoolId, schoolName, onDelete }: SchoolActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${schoolName}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/admin/schools/${schoolId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete school');
        }

        // Call the onDelete callback if provided
        if (onDelete) {
          onDelete(schoolId);
        }

        // Refresh the page to show updated list
        router.refresh();
      } catch (error) {
        console.error('Error deleting school:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete school');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <button
        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
        data-school-action="delete"
        onClick={handleDelete}
        disabled={isDeleting}
        type="button"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}