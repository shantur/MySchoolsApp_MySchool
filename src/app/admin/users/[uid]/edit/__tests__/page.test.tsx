/**
 * Tests for Edit User Page component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import EditUserPage from '../page';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

describe('EditUserPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUseParams.mockReturnValue({
      uid: 'test-user-123',
    } as any);
  });

  it('should show loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<EditUserPage />);

    expect(screen.getByText('Loading user data...')).toBeInTheDocument();
  });

  it('should show user not found state', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    render(<EditUserPage />);

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('should load and display user data', async () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      schoolId: 'school-a',
      role: 'user',
      displayName: 'Test User',
      groupIds: ['group1', 'group2'],
    };

    const mockGroups = [
      { groupId: 'group1', name: 'Math Class', schoolId: 'school-a' },
      { groupId: 'group2', name: 'Science Class', schoolId: 'school-a' },
      { groupId: 'group3', name: 'History Class', schoolId: 'school-a' },
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          groups: mockGroups,
        }),
      });

    render(<EditUserPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('school-a')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    const roleSelect = screen.getByLabelText('User role');
    expect(roleSelect).toHaveValue('user');

    // Check group checkboxes are properly checked/unchecked
    await waitFor(() => {
      const mathCheckbox = screen.getByLabelText('Math Class');
      const scienceCheckbox = screen.getByLabelText('Science Class');
      const historyCheckbox = screen.getByLabelText('History Class');
      
      expect(mathCheckbox).toBeChecked();
      expect(scienceCheckbox).toBeChecked();
      expect(historyCheckbox).not.toBeChecked();
    });
  });

  it('should handle form submission successfully', async () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      schoolId: 'school-a',
      role: 'user',
      displayName: 'Test User',
      groupIds: ['group1'],
    };

    const mockGroups = [
      { groupId: 'group1', name: 'Math Class', schoolId: 'school-a' },
      { groupId: 'group2', name: 'Science Class', schoolId: 'school-a' },
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          groups: mockGroups,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { ...mockUser, email: 'updated@example.com' },
        }),
      });

    render(<EditUserPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Update email
    const emailInput = screen.getByDisplayValue('test@example.com');
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });

    // Toggle a group checkbox
    await waitFor(() => {
      const scienceCheckbox = screen.getByLabelText('Science Class');
      fireEvent.click(scienceCheckbox);
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/users');
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/users/test-user-123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'updated@example.com',
        schoolId: 'school-a',
        role: 'user',
        displayName: 'Test User',
        groupIds: ['group1', 'group2'],
      }),
    });
  });

  it('should handle form submission error', async () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      schoolId: 'school-a',
      role: 'user',
      displayName: 'Test User',
      groupIds: [],
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          groups: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Update failed',
        }),
      });

    render(<EditUserPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle group checkbox selection correctly', async () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      schoolId: 'school-a',
      role: 'user',
      displayName: 'Test User',
      groupIds: ['group1'],
    };

    const mockGroups = [
      { groupId: 'group1', name: 'Math Class', schoolId: 'school-a' },
      { groupId: 'group2', name: 'Science Class', schoolId: 'school-a' },
      { groupId: 'group3', name: 'History Class', schoolId: 'school-a' },
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          groups: mockGroups,
        }),
      });

    render(<EditUserPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Check initial state
    await waitFor(() => {
      const mathCheckbox = screen.getByLabelText('Math Class');
      const scienceCheckbox = screen.getByLabelText('Science Class');
      const historyCheckbox = screen.getByLabelText('History Class');
      
      expect(mathCheckbox).toBeChecked();
      expect(scienceCheckbox).not.toBeChecked();
      expect(historyCheckbox).not.toBeChecked();
    });

    // Toggle group selections
    const scienceCheckbox = screen.getByLabelText('Science Class');
    const historyCheckbox = screen.getByLabelText('History Class');
    
    fireEvent.click(scienceCheckbox);
    fireEvent.click(historyCheckbox);

    expect(scienceCheckbox).toBeChecked();
    expect(historyCheckbox).toBeChecked();

    // Uncheck Math Class
    const mathCheckbox = screen.getByLabelText('Math Class');
    fireEvent.click(mathCheckbox);
    expect(mathCheckbox).not.toBeChecked();
  });

  it('should handle cancel button', async () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      schoolId: 'school-a',
      role: 'user',
      displayName: 'Test User',
      groupIds: [],
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          groups: [],
        }),
      });

    render(<EditUserPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByRole('link', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(cancelButton.closest('a')).toHaveAttribute('href', '/admin/users');
  });

  it('should disable form inputs while saving', async () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      schoolId: 'school-a',
      role: 'user',
      displayName: 'Test User',
      groupIds: [],
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          groups: [],
        }),
      })
      .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(<EditUserPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Saving Changes...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeDisabled();
      expect(screen.getByDisplayValue('school-a')).toBeDisabled();
      expect(screen.getByLabelText('User role')).toBeDisabled();
    });
  });
});