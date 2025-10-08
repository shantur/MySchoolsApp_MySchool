/**
 * School Actions Component - Client Component for interactive elements
 * 
 * This component handles interactive actions for school management,
 * such as delete operations that require event handlers.
 */

'use client';

import { useState } from 'react';

interface SchoolActionsProps {
  schoolId: string;
  schoolName: string;
  onDelete?: (schoolId: string) => void;
}

export default function SchoolActions({ schoolId, schoolName, onDelete }: SchoolActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${schoolName}?`)) {
      setIsDeleting(true);
      try {
        // TODO: Implement actual delete functionality
        console.log('Delete school:', schoolId);
        
        // Call the onDelete callback if provided
        if (onDelete) {
          onDelete(schoolId);
        }
      } catch (error) {
        console.error('Error deleting school:', error);
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