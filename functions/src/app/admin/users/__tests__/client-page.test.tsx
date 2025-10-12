/**
 * Tests for Admin Users Client Page component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminUsersClientPage from '../client-page';

// Mock fetch
global.fetch = jest.fn();

describe('AdminUsersClientPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<AdminUsersClientPage />);

    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('should display users when loaded', async () => {
    const mockUsers = [
      {
        uid: 'user-1',
        email: 'user1@example.com',
        schoolId: 'school-a',
        role: 'user',
        displayName: 'User One',
        groupIds: ['group1'],
      },
      {
        uid: 'admin-1',
        email: 'admin@example.com',
        schoolId: 'school-a',
        role: 'admin',
        displayName: 'Admin User',
        groupIds: [],
      },
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: mockUsers,
      }),
    });

    render(<AdminUsersClientPage />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // Check role badges
    expect(screen.getByText('user')).toHaveClass('bg-blue-100', 'text-blue-800');
    expect(screen.getByText('admin')).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  it('should show empty state when no users', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [],
      }),
    });

    render(<AdminUsersClientPage />);

    await waitFor(() => {
      expect(screen.getByText('No users found. Create your first user account.')).toBeInTheDocument();
    });
  });

  it('should show error message when fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    render(<AdminUsersClientPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  it('should show delete confirmation modal', async () => {
    const mockUsers = [
      {
        uid: 'user-1',
        email: 'user1@example.com',
        schoolId: 'school-a',
        role: 'user',
        displayName: 'User One',
        groupIds: [],
      },
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: mockUsers,
      }),
    });

    render(<AdminUsersClientPage />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: 'Delete user' });
    fireEvent.click(deleteButton);

    // Check modal content
    expect(screen.getByText('Confirm Delete User')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete the user "user1@example.com"/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete User' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should delete user successfully', async () => {
    const mockUsers = [
      {
        uid: 'user-1',
        email: 'user1@example.com',
        schoolId: 'school-a',
        role: 'user',
        displayName: 'User One',
        groupIds: [],
      },
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: mockUsers,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'User deleted successfully',
        }),
      });

    render(<AdminUsersClientPage />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: 'Delete user' });
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete User' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/users/user-1', {
        method: 'DELETE',
      });
    });

    // Check that user is removed from the list
    await waitFor(() => {
      expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument();
      expect(screen.getByText('No users found. Create your first user account.')).toBeInTheDocument();
    });
  });

  it('should handle delete error', async () => {
    const mockUsers = [
      {
        uid: 'user-1',
        email: 'user1@example.com',
        schoolId: 'school-a',
        role: 'user',
        displayName: 'User One',
        groupIds: [],
      },
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: mockUsers,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Cannot delete user',
        }),
      });

    render(<AdminUsersClientPage />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: 'Delete user' });
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete User' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Cannot delete user')).toBeInTheDocument();
    });

    // User should still be in the list
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
  });

  it('should disable delete button for last admin', async () => {
    const mockUsers = [
      {
        uid: 'admin-1',
        email: 'admin@example.com',
        schoolId: 'school-a',
        role: 'admin',
        displayName: 'Admin User',
        groupIds: [],
      },
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: mockUsers,
      }),
    });

    render(<AdminUsersClientPage />);

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: 'Delete user' });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute('title', 'Cannot delete the last admin user');
  });

  it('should cancel delete operation', async () => {
    const mockUsers = [
      {
        uid: 'user-1',
        email: 'user1@example.com',
        schoolId: 'school-a',
        role: 'user',
        displayName: 'User One',
        groupIds: [],
      },
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: mockUsers,
      }),
    });

    render(<AdminUsersClientPage />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: 'Delete user' });
    fireEvent.click(deleteButton);

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    // Modal should be closed
    expect(screen.queryByText('Confirm Delete User')).not.toBeInTheDocument();
    // User should still be in the list
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
  });

  it('should show loading state while deleting', async () => {
    const mockUsers = [
      {
        uid: 'user-1',
        email: 'user1@example.com',
        schoolId: 'school-a',
        role: 'user',
        displayName: 'User One',
        groupIds: [],
      },
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: mockUsers,
        }),
      })
      .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(<AdminUsersClientPage />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: 'Delete user' });
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete User' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();
    });
  });
});