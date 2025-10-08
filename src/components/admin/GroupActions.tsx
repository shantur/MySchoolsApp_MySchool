/**
 * Group Actions Component - Client Component for interactive elements
 * 
 * This component handles interactive actions for group management,
 * such as delete operations that require event handlers.
 */

'use client';

import { useState } from 'react';

interface GroupActionsProps {
  groupId: string;
  groupName: string;
  onDelete?: (groupId: string) => void;
}

export default function GroupActions({ groupId, groupName, onDelete }: GroupActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${groupName}?`)) {
      setIsDeleting(true);
      try {
        // TODO: Implement actual delete functionality
        console.log('Delete group:', groupId);
        
        // Call the onDelete callback if provided
        if (onDelete) {
          onDelete(groupId);
        }
      } catch (error) {
        console.error('Error deleting group:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <button
        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
        data-group-action="delete"
        onClick={handleDelete}
        disabled={isDeleting}
        type="button"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}