/**
 * Group Actions Component - Client Component for interactive elements
 * 
 * This component handles interactive actions for group management,
 * such as delete operations that require event handlers.
 */

'use client';

import { useState } from 'react';
import { apiDelete } from '@/lib/utils/api-client';

interface GroupActionsProps {
  groupId: string;
  groupName: string;
  onDelete?: (groupId: string) => void;
}

export default function GroupActions({ groupId, groupName, onDelete }: GroupActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${groupName}? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        console.log(`Attempting to delete group: ${groupId}`);
        const response = await apiDelete(`/api/admin/groups/${groupId}`);
        console.log('Delete response:', response);

        if (!response.success) {
          throw new Error(response.error || 'Failed to delete group');
        }

        console.log('Group deleted successfully, calling callback');
        // Call the onDelete callback if provided to refresh the list
        if (onDelete) {
          onDelete(groupId);
        }
        
        console.log('Setting up redirect');
        // Always redirect to ensure fresh data after deletion
        setTimeout(() => {
          console.log('Redirecting to groups page');
          window.location.href = '/admin/groups';
        }, 500);
      } catch (error) {
        console.error('Error deleting group:', error);
        alert(error instanceof Error ? error.message : 'An error occurred while deleting the group');
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